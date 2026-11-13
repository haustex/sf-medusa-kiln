# Changelog

All notable changes to Kiln. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions
follow [Semantic Versioning](https://semver.org).

## [Unreleased]

Nothing yet.

## [0.2.0] — 2026-11-13

### Added

- `markets.suggest` in theme.config.ts: a dismissible pill on one market pointing to another ("Shopping from the
  US? → Go to the US store"), no geo-IP, shown after the fonts load so it never shifts the layout.
- `text` in theme.config.ts: your own wording on top of the dictionaries, per language, only the keys you change.
- `redirects` in theme.config.ts: permanent redirects (308) for pre-theme addresses, matched without the market
  prefix and answered in the same market, with `:name` and `:name*` parameters.
- `images.route` in theme.config.ts: product and article photos served by the storefront at
  `/img/{products|blog}/{name}-{width}-{hash}.{avif|webp|jpg}` (sharp, disk cache, immutable), named after the
  handle or slug; the index behind the URLs is built from the store API, no backend route needed. `images.segments`
  sets the URL segments, also for the `/og` share images.
- `/brand/wordmark.png` and `/brand/logo.png`, drawn from `brand.logo` (e-mails, invoices, Organization.logo).
- Bank transfer at checkout with [medusa-payment-manual-transfer](https://www.npmjs.com/package/medusa-payment-manual-transfer):
  "Place order" opens `/transfer/{order}?token=…` (bank details, payment reference, deadline, pro-forma invoice,
  proof upload) in the plugin's own component restyled with Kiln's tokens; the order page in the account links to
  it; the order-transfer accept/decline page for Medusa's order transfers. Needs `MANUAL_TRANSFER_PROXY_SECRET`.
- QRIS and virtual accounts (Indonesia) at checkout with [medusa-payment-doit](https://www.npmjs.com/package/medusa-payment-doit):
  method picker with fees, QR code / VA number with countdown and status polling, hosted-page option
  (`NEXT_PUBLIC_DOIT_REDIRECT_TO_HOSTED`). Both switch on when the backend registers the provider and need no
  config in the theme; `seed/enable-payments.mjs` enables them on the demo backend.
- Shipping with [medusa-fulfillment-zone-rate](https://www.npmjs.com/package/medusa-fulfillment-zone-rate)
  (`features.tracking`): delivery estimates and service notices on the checkout options, the plugin's refusal
  message in place of a price, "Delivery after dispatch" on the product page, `{{rates}}` rate-card tables on the
  shipping page, the live tracking page at `/track` (per-language address from the dictionary, `/lacak` in
  Indonesian) with lookup form and Server-Sent Events relay, shipments with timeline and photos on the account's
  order page, footer link. Needs `ZONE_RATE_PROXY_SECRET`; `seed/enable-shipping.mjs` for the demo backend.
- Free-shipping nudge in Kiln's own style and words (card on the catalogue pages, inline in the cart) for a
  shipping option priced 0 above an `item_total` rule; the demo seed adds "Free shipping" over $100. Below the
  threshold Medusa lists that option without a price; the delivery step leaves it out instead of showing "–".
- `brand.timeZone` in theme.config.ts (shipping dates, tracking times).
- Review-request magic link page `/review/{token}` (medusa-reviews-wishlist `review_requests.link_url`): the open
  items of the order, one form each, in the market's language; the review form (also in the account) takes up to
  three photos through `/api/reviews/upload`. Opt-out page `/review/unsubscribe/{id}` in the shop's design for the
  e-mail's unsubscribe link (`/api/reviews/unsubscribe`). Both never indexed or cached.
- `analytics.metricool` in theme.config.ts: Metricool's page-view tracker (no cookies), only with `SITE_LIVE=true`
  and never on the per-visitor pages.

### Fixed

- `/products/{handle}.md` and the page URL with `Accept: text/markdown` answered 404: the rewrites in next.config.js
  pointed at a route that did not exist. The Markdown page (title, description, specifications, variants with
  prices and stock, FAQ, delivery estimate, information-page links) is in the market's language; llms.txt mentions it.
- Edge-cache rules (Cache-Tag, Cloudflare TTL) and the no-prefetch list covered the `/us` prefix only; they apply to
  every market prefix now. A Haus Kayu-only order-claim call that nothing used is gone.
- A dot in a per-visitor address (`/review/unsubscribe/revreq_….<signature>`) was taken for a file by the proxy and
  answered 404 on the default market.
- The no-store / noindex / no-referrer headers of the wishlist, review and preview pages applied to `/us/…` only; they
  now cover every market prefix.
- The sitemap and llms.txt read the blog index with fields medusa-blog-seo does not return (`slug`, `title_en`),
  so every article URL was `/blog/undefined`; they now use the per-language slugs and copy, and the sitemap lists
  each language's URL as an alternate of the others.
- Product and article share images (`/og/…/{segment}/…`) looked their photo up on a Haus Kayu-only backend route;
  they use the store API index now.

## [0.1.0] — 2026-11-13

First public release.

### Storefront

- Next.js 16 App Router, server components and ISR; Tailwind CSS v4 + HeroUI v3; one config file
  (`theme.config.ts`) for brand, markets, colours, radii, font, feature switches, listing filters and hero slides.
- Markets: one unprefixed default market plus prefixed ones (`/id/…`), each with its own currency, language and
  dictionary; hreflang alternates on every page.
- Pages: home (hero slider, categories, makers, journal teasers), listing with filters and search, product page
  with gallery, options, notes and reviews, cart, three-step checkout (address, delivery, payment), order
  confirmation, account (profile, addresses, orders, reviews, wishlist), makers list and profile, six markdown
  information pages per language (`content/pages`).
- Payments: Stripe Payment Element (cards, wallets, 3-D Secure) through Medusa's Stripe provider, with the
  system "pay later" provider for development.
- Optional integrations detected at start: `medusa-reviews-wishlist` (reviews, wishlist), `medusa-blog-seo`
  (journal with categories, authors, RSS), a Meilisearch search route; the storefront degrades without them.
- SEO: metadata and canonical per page, `sitemap.xml` with alternates, `robots.txt`, JSON-LD (Organization,
  WebSite, Product, BreadcrumbList, ItemList, Article), `llms.txt` and `llms-full.txt`; `SITE_LIVE=false` keeps a
  deployment out of the index.
- Performance: only the first hero slide is preloaded, the others load when the browser is idle; AVIF/WebP via
  `next/image`; Lighthouse mobile 87–91 for the home page on a 2-vCPU host (see `docs/lighthouse.md`).
- Cache: tagged fetch cache with `/api/revalidate` (secret header) that re-renders pages and purges Cloudflare
  by Cache-Tag when configured.
- `KILN_DEMO_NOTICE=true` shows a one-line demo notice above the header.

### Tooling

- Demo seed (`seed/`): two regions (USD, IDR), six categories, four makers, thirteen products with generated CC0
  images, four journal articles.
- `scripts/e2e/checkout-stripe.mjs`: scripted checkout with the Stripe test cards (success, 3-D Secure,
  decline) or the development provider, against a local or hosted storefront.
- `Dockerfile` for the standalone server; `docs/deploy-vercel.md` for Vercel.

[0.1.0]: https://github.com/haustex/sf-medusa-kiln/releases/tag/v0.1.0
