# Lighthouse

Measured on 12 November 2026 with Lighthouse 13.6 (mobile preset, simulated slow 4G, 4× CPU slowdown), three runs
per page, against a local production build (`pnpm build`, standalone server) of the demo shop. The machine is a
2-vCPU VPS that also runs the Medusa backend and the dev server, so **TBT (and with it the performance score) is
noisy here**: it moved by up to 30 points between runs of the same page. The numbers are medians of three runs.

| Page | Perf | A11y | Best practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home `/` | 87 (best 91) | 100 | 100 | 100 | 2.1 s | 560 ms | 0 |
| Listing `/store` | 86 | 100 | 100 | 100 | 2.1 s | 506 ms | 0 |
| Product | 84 (best 90) | 100 | 100 | 100 | 2.1 s | 608 ms | 0 |
| Journal `/blog` | 88 (best 91) | 100 | 100 | 100 | 2.1 s | 444 ms | 0 |
| Article | 90 (best 92) | 100 | 100 | 100 | 2.1 s | 357 ms | 0 |

Through an HTTP/2 proxy (`scripts/lighthouse/h2-proxy.mjs`): Lighthouse's network model queues requests on six
connections for HTTP/1.1, which is what `next start` speaks, while a real deployment sits behind a CDN on HTTP/2.

Calibration: the same setup gives the live hauskayu.com home page (same stack, same ~180 KB of JavaScript, a
text LCP) a median of 92 here, where PageSpeed Insights reports 95–99. With DevTools throttling instead of the
simulation (`--throttling-method=devtools`, one run) the Kiln home, listing and product pages score 82–85 and
hauskayu.com 84: the same. Expect the same scores for Kiln on PageSpeed Insights once it is deployed behind a CDN;
check them there after launch.

## What the budget looks like

| Resource (home, gzipped) | Size |
| --- | --- |
| React + Next runtime | 116 KB |
| Theme code and libraries (tailwind-variants, lucide icons, next/link, next/image client) | 66 KB |
| CSS (Tailwind v4 + the HeroUI components in use) | 26 KB |
| Inter (one variable file) | 40 KB |
| Hero photo (AVIF, 750 px) | 5 KB |

Product and article photos are served by next/image as AVIF/WebP in responsive widths (the demo's 1600 px JPEGs
become 1–5 KB files); the hero and the LCP photo of every page are preloaded for the viewport that shows them.
CLS is 0 on every page: fixed aspect boxes for all photos, metric-matched font fallbacks, the sticky header never
pushes content.

## Running it

```bash
pnpm build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
PORT=9721 HOSTNAME=127.0.0.1 node .next/standalone/server.js &
# HTTP/2 in front (self-signed certificate, accepted by the runner):
openssl req -x509 -newkey rsa:2048 -nodes -keyout .trash/h2.key -out .trash/h2.crt -days 7 -subj "/CN=127.0.0.1" -addext "subjectAltName=IP:127.0.0.1"
node scripts/lighthouse/h2-proxy.mjs 9722 9721 .trash/h2.key .trash/h2.crt &
scripts/lighthouse/run.sh https://127.0.0.1:9722/ home
scripts/lighthouse/run.sh https://127.0.0.1:9722/products/oak-serving-board product
```

`run.sh` needs Chrome (set `CHROME_PATH` if Lighthouse does not find it) and prints the four category scores plus
CLS, LCP, TBT and FCP per run; the JSON reports land in `.trash/lighthouse`.

## Fixed on the way

- `next/image` was switched off (`unoptimized: true`, inherited from a setup with its own resizer): product, hero,
  category, cover and avatar images are now optimised. Dev backends on localhost are allowed through the
  optimiser's SSRF guard automatically (`next.config.js`).
- The whole i18n dictionary (both languages, ~35 KB gzipped) shipped to the browser twice, pulled in by `fill()`
  and by the 404 page's client component. `fill` has its own module and the 404 content is a server component.
- The legacy Medusa UI Tailwind preset (`@config`) is gone, with the last classes that used it.
- The hero slides had `role="group"` on the `<li>`, which fails axe's `list` rule (home A11y 97 → 100).
- Hero slides 2+ load only once the browser is idle (or on the first swipe/dot), so their photos no longer
  compete with slide 1 and the scripts during load (home median 83 → 87, measured 12 Nov 2026).
