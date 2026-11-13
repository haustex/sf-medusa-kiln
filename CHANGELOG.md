# Changelog

All notable changes to Kiln. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions
follow [Semantic Versioning](https://semver.org).

## [Unreleased]

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

### Fixed

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
