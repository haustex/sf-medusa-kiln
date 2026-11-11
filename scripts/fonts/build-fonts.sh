#!/usr/bin/env bash
# Rebuild the self-hosted font file and the wordmark SVG path.
#   apps/storefront/scripts/fonts/build-fonts.sh
# Needs Docker (runs fontTools in python:3.12-slim). Outputs:
#   src/styles/fonts-files/inter-latin-opsz-wght.woff2  (Inter, Latin, wght 400–700, opsz axis kept)
#   wordmark path data printed to stdout (paste into src/modules/brand/wordmark-paths.ts)
set -euo pipefail
cd "$(dirname "$0")"
WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36"
latin_url() { curl -fsS -A "$UA" "$1" | awk '/\/\* latin \*\//{f=1} f&&/src:/{print;exit}' | grep -o 'https://[^)]*'; }

curl -fsS "$(latin_url 'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900')" -o "$WORK/in.woff2"
curl -fsS "$(latin_url 'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300')" -o "$WORK/josefin300.woff2"
cp wordmark_path.py "$WORK/"

docker run --rm -v "$WORK":/w -w /w python:3.12-slim sh -c '
pip -q install fonttools brotli >/dev/null 2>&1
fonttools varLib.instancer in.woff2 wght=400:700 -o inst.ttf -q
pyftsubset inst.ttf --flavor=woff2 --output-file=out.woff2 \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+20AC,U+2122" \
  --layout-features="kern,liga,calt,tnum,lnum,case,ccmp,locl,mark,mkmk"
python wordmark_path.py 0.36 "// HAUS KAYU" >&2 && echo "WORDMARK_PATH:" && cat wm.path && echo
python wordmark_path.py 0.36 "//" >&2 && echo "SLASH_PATH:" && cat wm.path && echo
'
cp "$WORK/out.woff2" ../../src/styles/fonts-files/inter-latin-opsz-wght.woff2
echo "font: $(wc -c < ../../src/styles/fonts-files/inter-latin-opsz-wght.woff2) bytes" >&2
