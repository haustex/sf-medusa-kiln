# Kiln

An open-source storefront theme for [Medusa](https://medusajs.com) 2.x: Next.js 16 (App Router, server components,
ISR), Tailwind CSS v4 and HeroUI v3. Black on white, one font, a lot of air: the product photos do the talking.

Built by [Haus Kayu](https://hauskayu.com) for its own shop and shared as a template. MIT.
Bahasa Indonesia: [README.id.md](README.id.md).

| Home | Listing | Product | Journal |
| --- | --- | --- | --- |
| ![Home](docs/screenshots/readme/home-desktop.png) | ![Listing](docs/screenshots/readme/store-desktop.png) | ![Product](docs/screenshots/readme/product-desktop.png) | ![Journal](docs/screenshots/readme/blog-desktop.png) |

## What you get

- **Catalogue**: home (promo hero with schedule, category tiles, product rails, journal band), listings for the whole
  store, categories and collections with filters that need no search engine (price, options, metadata attributes,
  maker, rating, stock, sort: all plain URL queries), product page (gallery, buy box, sticky bar on phones,
  accordions, specifications from metadata, reviews, more from the maker), quick view, search.
- **Shopping**: cart drawer and cart page, checkout in three steps (address, delivery, payment), Stripe's Payment
  Element (card, wallets, redirect methods), order confirmation, customer account (orders, addresses, profile,
  reviews), wishlist for guests and customers.
- **Content**: a journal with categories, pagination, table of contents, FAQ blocks, "from the shop" product
  cards, share row, author box, RSS feed and secret previews, through [medusa-blog-seo](https://www.npmjs.com/package/medusa-blog-seo).
- **Markets**: several Medusa regions as markets with their own language, currency and URL prefix. The default
  market can live at `/` (the others at `/id/…`), or every market can keep its prefix like the official starter.
  Product content comes translated from Medusa's Translation Module; the UI strings ship in English and Indonesian.
- **SEO**: metadata and canonical/hreflang on every page, JSON-LD (Organization, WebSite, Product, BreadcrumbList,
  Article, FAQ), sitemap with language alternates and images, robots that welcome AI crawlers, generated share
  images (`/og/…`), product pages as Markdown for agents (`/products/x.md`), a pre-launch switch that keeps the
  whole site noindex until `SITE_LIVE=true`.
- **Speed**: static pages regenerated every minute and purged on demand (`/api/revalidate`, Cloudflare cache
  tags), one self-hosted font file (Inter, 40 KB) with metric fallbacks, explicit image sizes, little client-side
  JavaScript. Lighthouse (mobile, local production build): see [docs/lighthouse.md](docs/lighthouse.md).
- **Optional integrations switch themselves on**: reviews and wishlist
  ([medusa-reviews-wishlist](https://www.npmjs.com/package/medusa-reviews-wishlist)), the journal
  (medusa-blog-seo) and a Meilisearch route are probed once at start; a backend without them gets a storefront
  without hearts, stars or a journal link, and search falls back to Medusa's own.
- **One config file**: `theme.config.ts` holds the brand, logo, social profiles, markets, colours, radii, frosted
  surfaces, font, feature switches, listing filters, product notes, hero slides and contact. Every colour and
  radius becomes a CSS variable, so the whole look changes without touching a component.
  See [docs/customize.md](docs/customize.md).

## Requirements

- Node 22+, pnpm 10.
- A Medusa 2.22+ backend with at least one region, a sales channel and a publishable API key. The demo seed
  (`seed/`) creates all of it for a fictional studio, Tilde Goods, in two markets (USD and IDR).
- Optional: `medusa-reviews-wishlist` ≥ 0.1.2, `medusa-blog-seo` ≥ 0.1.3, Stripe keys, a
  `/store/meilisearch/products` route in the backend (see `src/lib/data/search.ts` for the contract).

## Quick start

```bash
# 1. The backend (any Medusa 2.22+ project). Optional plugins in medusa-config.ts:
#    { resolve: "medusa-blog-seo", options: { storefront_url: "http://localhost:9720" } },
#    { resolve: "medusa-reviews-wishlist", options: { storefront_url: "http://localhost:9720" } },
#    Demo catalogue (two regions, a sales channel + key, categories, 13 products):
cp seed/seed-kiln.ts <backend>/src/scripts/ && mkdir -p <backend>/static/demo && cp seed/images/*.jpg <backend>/static/demo/
cd <backend> && npx medusa exec ./src/scripts/seed-kiln.ts     # prints the publishable key

# 2. The storefront
cp .env.example .env            # backend URL, publishable key, site origin
pnpm install
pnpm dev                        # http://localhost:9720
```

`.env` keys: `NEXT_PUBLIC_MEDUSA_BACKEND_URL` (and `MEDUSA_BACKEND_URL_INTERNAL` when the server reaches Medusa on
another address), `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_BASE_URL`, optional `NEXT_PUBLIC_MEDIA_URL`,
`MEILISEARCH_HOST` / `MEILISEARCH_SEARCH_KEY`, `NEXT_PUBLIC_STRIPE_KEY`, `REVALIDATE_SECRET`, `SITE_LIVE`,
`KILN_FEATURE_*`. Demo articles: `node seed/seed-blog.mjs` once the backend runs with medusa-blog-seo.

Production: `pnpm build` produces a standalone server (`.next/standalone`, `output: "standalone"`); run it with
`node .next/standalone/server.js` behind any reverse proxy or CDN. `SITE_LIVE` and `NEXT_PUBLIC_*` are read at
build time.

## Payments

Checkout lists the payment providers enabled on the region. Stripe renders its Payment Element inside the option
and confirms the PaymentIntent on "Place order"; Medusa's `pp_system_default` ("Pay later", for development) and
any provider that completes with "Place order" alone work as they are. A provider that needs its own screen
(QR code, bank instructions, redirect) gets a component in `src/modules/checkout/components/payment.tsx` next to
the Stripe one. Two such plugins by the same author ship their own storefront parts:
[medusa-payment-doit](https://www.npmjs.com/package/medusa-payment-doit) (QRIS and virtual accounts, Indonesia)
and [medusa-payment-manual-transfer](https://www.npmjs.com/package/medusa-payment-manual-transfer) (bank transfer
with a payment page).

Stripe in the backend (`medusa-config.ts`):

```ts
{
  resolve: "@medusajs/medusa/payment",
  options: {
    providers: [
      {
        resolve: "@medusajs/medusa/payment-stripe",
        id: "stripe",
        options: { apiKey: process.env.STRIPE_API_KEY, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET, capture: true },
      },
    ],
  },
}
```

Enable the provider on the region in Admin → Settings → Regions, put the publishable key in `NEXT_PUBLIC_STRIPE_KEY`
and point a Stripe webhook at `<backend>/hooks/payment/stripe_stripe`.

## Folders

```
theme.config.ts        brand, markets, colours, radii, font, features, listing, hero, contact
src/app/[countryCode]  pages: (main) home, store, categories, collections, products, search, cart, wishlist,
                       blog, account, order, design; (checkout)
src/app/api            cart, health, payment-return, revalidate, reviews, wishlist
src/app/og             generated share images
src/modules/ds         the design system (cards, grids, sections, price, stars, sheet, carousel)
src/modules/*          home, layout, products, store, cart, checkout, account, order, blog, wishlist, brand
src/lib                data (Medusa SDK), i18n, listing filters, seo, util, features.ts
src/styles             globals.css (tokens, type scale, utilities), theme.css (HeroUI mapping), fonts
seed                   demo catalogue, articles and generated images (CC0)
docs                   customize.md, lighthouse.md, plan, mockups, screenshots
```

## Status

Kiln is young. Not in the theme yet: the information pages the demo footer points at (shipping, returns, contact,
privacy, terms, about, makers), `llms.txt`, a product image resizer (images are served by the backend as they
are) and a Google Merchant feed. The journal and the account's review tab need their plugins.

## Development

[CONTRIBUTING.md](CONTRIBUTING.md) describes the local setup, the demo content, the Stripe test setup, how to
test the storefront with the optional integrations switched off, and the checks before a commit
(`pnpm typecheck`, `pnpm lint`).

## Licence

MIT. Fonts, icons and the Medusa starter this theme grew from are credited in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The demo brand Tilde Goods, its makers and its images are
fictional and generated (CC0). The footer credit line ("Theme Kiln by Haus Kayu") is optional:
`brand.credit: false` in `theme.config.ts`.
