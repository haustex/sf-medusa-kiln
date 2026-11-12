#!/bin/sh
# Lighthouse, mobile, 3 runs, all four categories. Usage: scripts/lighthouse/run.sh <url> <name> [outDir]
# Needs `npx lighthouse` (installed on demand) and Chrome (CHROME_PATH). Self-signed proxy certificates are accepted.
url=$1; name=$2; out=${3:-.trash/lighthouse}
mkdir -p "$out"
for i in 1 2 3; do
  npx --yes lighthouse "$url" --quiet --chrome-flags="--headless=new --no-sandbox --ignore-certificate-errors" --output=json --output-path="$out/$name-$i.json" >/dev/null 2>&1
  node -e '
const r = require(process.argv[1]); const c = r.categories, a = r.audits; const s = (k) => Math.round(c[k].score * 100)
console.log(process.argv[2], "run", process.argv[3] + ":", "perf", s("performance"), "a11y", s("accessibility"), "bp", s("best-practices"), "seo", s("seo"), "| CLS", a["cumulative-layout-shift"].numericValue, "LCP", a["largest-contentful-paint"].displayValue, "TBT", a["total-blocking-time"].displayValue, "FCP", a["first-contentful-paint"].displayValue)
' "$PWD/$out/$name-$i.json" "$name" "$i"
done
