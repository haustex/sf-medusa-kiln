# Customizing Kiln

Almost everything a shop changes lives in one file, `theme.config.ts`. It is imported by server and client
components alike, so it must stay free of secrets (those go in `.env`). This page walks through it section by
section, then through the few things that live elsewhere (logo, fonts, UI strings, images, the backend hooks).

Strings marked `Localized` take one value for every language or one per dictionary code:

```ts
tagline: "Objects for the home"                                   // the same everywhere
tagline: { en: "Objects for the home", id: "Benda rumah" }        // per language
```

`tx(value, lang)` (src/lib/i18n/localized.ts) picks the current language, falls back to `en`, then to the first
value given.

## brand

| Key | What it does |
| --- | --- |
| `name` | Shop name: logo text, `<title>` default, JSON-LD Organization, "Written by" fallback in the journal |
| `titleSuffix` | `{page} \| suffix` in every tab title |
| `tagline` | Organization description, share images, author box when a post has no author |
| `footerText` | One line under the logo in the footer |
| `location` | Organization `foundingLocation` |
| `logo` | `type: "text"` sets the name in the site font with a small ink mark; `type: "svg"` draws one path (`svgPath`, `svgViewBox`, fill `currentColor`) |
| `navLinks` | Links after the categories in the header's category row (`/makers`, `/blog`, …); a link into the journal disappears when the blog is off |
| `footerColumns` | Footer columns and their links; the "Shop" column (categories) is automatic |
| `legal` | Optional legal identity for the Organization JSON-LD: `legalName`, `identifier` (`{ propertyID: "NIB", value }`), `telephone`, `address` (schema.org PostalAddress keys), `hours` (`{ opens, closes, days? }`, opens/closes as times with offset, e.g. `"08:00:00+07:00"`) |
| `credit` | `false` hides "Theme Kiln by Haus Kayu" after the copyright line |

Paths in `navLinks` and `footerColumns` are market-relative: `/blog` becomes `/id/blog` in the Indonesian market.

## social

One URL per network (`facebook`, `instagram`, `x`, `pinterest`, `tiktok`, `youtube`). An empty string hides the
icon. The icons appear in the footer and the phone menu, the URLs in the Organization `sameAs` and in the author
box when the shop itself is the writer. Icons: `src/modules/brand/glyphs.tsx` (Iconoir).

## markets

```ts
markets: {
  default: "us",                 // the market without a prefix (or the one "/" redirects to)
  xDefault: "us",                // hreflang x-default
  routing: "default-no-prefix",  // or "always-prefix"
  list: {
    us: { countryCode: "us", locale: "en-US", htmlLang: "en", hreflang: "en-US", currency: "usd", dictionary: "en", label: "United States (USD)" },
    id: { countryCode: "id", locale: "id-ID", htmlLang: "id", hreflang: "id-ID", currency: "idr", dictionary: "id", label: "Indonesia (IDR)" },
  },
},
```

- One entry per Medusa region you sell in; the key and `countryCode` are the region's country code. `currency`
  must match the region. The market switch in the footer lists `label`.
- `locale` is sent to Medusa as `x-medusa-locale` (translated product content from the Translation Module) and
  used by `Intl` for prices and dates. `htmlLang` goes into `<html lang>`, `hreflang` into the alternate links.
- `dictionary` picks the UI strings (see "UI strings" below).
- `routing: "default-no-prefix"`: the default market is served at `/…`, a direct `/us/…` request gets a 308 to
  the unprefixed URL, the other markets keep `/id/…`. `"always-prefix"` keeps every prefix and redirects `/` to
  `/us/`, like the official Medusa starter. No geo-IP redirects in either mode (`src/proxy.ts`).
- `next.config.js` cannot import the TypeScript config: when you change `default`, set
  `NEXT_PUBLIC_DEFAULT_REGION` to the same value for the rewrites it needs (feed, Markdown product pages).
- `suggest: { on: "id", to: "us" }` shows a small dismissible pill at the bottom of every page of market `on`
  pointing to market `to` ("Shopping from the US? → Go to the US store"), in the language of `to`. Still no
  geo-IP: everyone sees it once, closing it is remembered in `localStorage`. Wording: dictionary key
  `marketBanner`. Default `null` (no pill).

## text

```ts
text: {
  en: { nav: { search: "Search the shop…" }, marketBanner: { text: "Shopping from the US?" } },
  id: { nav: { search: "Cari di toko…" } },
},
```

Your own wording on top of the dictionaries, per language, only the keys you change (any depth; the type checks
them against `Dictionary`). The dictionaries themselves stay untouched, so a theme update never conflicts with
your copy. `{brand}` and `{location}` placeholders work here too.

## redirects

```ts
redirects: [
  { from: "/account/orders/details/:id", to: "/account/orders/:id" },
  { from: "/produk/:rest*", to: "/products/:rest*" },
],
```

Permanent redirects (308) for addresses from before this theme. Patterns are matched on the path without the
market prefix and answered in the same market (`/us/produk/x` → `/us/products/x`); `:name` matches one segment,
`:name*` everything that follows; the query string is kept. Handled in `src/proxy.ts`, so no page is rendered.

## colors, cardIconColor, radius, frost

```ts
colors: { background: "#ffffff", ink: "#0c0c0c", inkHover: "#2b2b2b", muted: "#6b6b6b", border: "#e5e5e5", control: "#8a8a8a", soft: "#f5f5f5", softHover: "#ebebeb" },
cardIconColor: "light",
radius: { control: "0.5rem", media: "0.75rem", sheet: "1rem" },
frost: { alpha: 0.8, blur: "14px" },
```

The values become CSS variables on `<html>` (`src/app/[countryCode]/layout.tsx`) and `src/styles/theme.css` maps
them onto HeroUI's variables, so buttons, inputs, chips and sheets follow. Roles:

- `ink` text and primary buttons; `inkHover` their hover. `muted` secondary text. `border` decorative hairlines.
  `control` the border of inputs, selects and checkboxes (keep it at 3:1 against the background). `soft` /
  `softHover` chips, secondary buttons, photo placeholders.
- Keep text contrast at 4.5:1 or better: the defaults are 19.6:1 (ink), 5.3:1 (muted), 3.5:1 (control).
- `cardIconColor`: the heart and "+" over a card photo are white with a soft dark shadow (`"light"`) or ink with
  a light one (`"dark"`), whichever reads on your photos.
- `radius.control` buttons, inputs, chips; `radius.media` photos, cards, tiles, hero; `radius.sheet` bottom sheets
  and drawers. Tailwind utilities `rounded-control`, `rounded-media`, `rounded-sheet` use them.
- `frost`: the frosted surfaces (sticky header, mega menu, cart drawer, quick view, filter sheet, sticky
  add-to-cart bar) are white at `alpha` behind a `blur`. Browsers without `backdrop-filter` and visitors with
  `prefers-reduced-transparency` get solid white.

Spacing and the type scale are in `src/styles/globals.css`: `--space-*` tokens (`gap-section`, `gap-stack-md`,
`px-container-x`, …) switch per breakpoint inside the variables, and the `type-*` utilities (`type-display`,
`type-h1`, `type-h2`, `type-h3`, `type-label`, `type-price`, `type-eyebrow`, …) carry size, weight and tracking.
Components use those names, never raw sizes, so a change there reaches every page.

## font

```ts
font: { family: "Inter" },
```

Inter (OFL) ships as one variable file, Latin subset, weights 400–700, with the optical-size axis so large
headings get the display cut (`src/styles/fonts-files`, 40 KB). To use another font:

1. Load it in `src/styles/fonts.ts` with `next/font` (local or Google) and export it as `inter` (or rename the
   import in `src/app/[countryCode]/layout.tsx`).
2. Adjust the metric-matched fallback faces in `src/styles/globals.css` (`InterFallbackRoboto`,
   `InterFallbackArial`: `size-adjust`, `ascent-override`, `descent-override`) so text does not shift when the
   web font arrives. Without matching metrics CLS rises.
3. `scripts/fonts/build-fonts.sh` rebuilds the Inter file (fontTools in Docker) if you want another subset or
   weight range.

## features

```ts
features: { reviews: "auto", wishlist: "auto", blog: "auto", search: "auto", tracking: "auto" },
```

`"auto"` probes one store route per integration when the server starts (`src/lib/features.ts`): a 404 switches
it off, anything else (including a backend that is down) leaves it on. `"on"` / `"off"` force it, and the
environment overrides the file: `KILN_FEATURE_BLOG=off`. What "off" means:

| Feature | Backend | Off |
| --- | --- | --- |
| `reviews` | medusa-reviews-wishlist | No stars on cards or product pages, no reviews block, no "Reviews" tab in the account, `/review/…` pages and `/api/reviews/…` 404 |
| `wishlist` | medusa-reviews-wishlist | No hearts, no wishlist icon in the header, `/wishlist` and `/api/wishlist` 404 |
| `blog` | medusa-blog-seo | `/blog/…` and the feed 404, journal band and links hidden, sitemap without articles |
| `search` | `/store/meilisearch/products` route | `/search` uses Medusa's own `/store/products?q=` |
| `tracking` | medusa-fulfillment-zone-rate | No delivery estimates, `{{rates}}` empty, `/track` (and its language address) and `/api/zone-rate/…` 404, footer link hidden, no shipments on the order page |

## listing

```ts
listing: {
  pageSize: 12,
  scan: 100,
  filters: {
    price: true,
    options: "auto",                      // or ["Size", "Colour"], or []
    attributes: [{ key: "material", label: { en: "Material", id: "Bahan" } }],
    collection: { en: "Maker", id: "Pembuat" },   // or false
    rating: 4,                            // "4 & up"; false hides it (needs reviews)
    stock: true,
  },
},
```

Listings (`/store`, categories, collections) fetch up to `scan` products once (cached by Next) and filter, sort
and count in memory: no search engine needed, and every filter is a plain URL query
(`?min=20&max=150&opt=Size:Large&attr=material:Oak&maker=studio-lio&rating=4&stock=1&sort=price_asc`), so
filtered pages can be linked and cached. `options` turns product options into filters, `attributes` does the same
for `product.metadata` keys, `collection` offers the product's collection (makers, brands, lines). A shop with
more than `scan` products per listing should raise `scan` (the Store API caps one request at 100, the listing
pages through) or move to a search engine.

## product

```ts
product: {
  notes: [
    { en: "Free shipping over $120 · 30-day returns", id: "Gratis ongkir di atas Rp1.500.000 · retur 30 hari" },
    { en: "Custom sizes available on request", id: "Ukuran custom bisa dipesan" },
  ],
},
```

Short promises under the add-to-cart button. `[]` hides the list. Specifications on the product page come from
`product.metadata` (one row per key), the maker from the product's collection.

### Products sold by quote

```ts
product: {
  notes: [...],
  quote: {
    metadata: "made_to_order",
    category: "custom",
    href: { id: "/custom?produk={handle}" },
    fixedSize: { us: "us_fixed_size" },
  },
},
```

A product with `metadata.made_to_order = true` (or `"true"`), or in a category whose handle contains `category`, is
sold by quote: the product page shows "Request a quote" (dictionary `product.requestQuote`, note
`product.requestQuoteNote`) where the buy box would be, with the lowest variant price as "from"; the quick view and
the listing cards keep their price. Structured data carries no Product item (an offer without a price is invalid for
Google); llms.txt and the Markdown product page say `product.priceOnRequest`. `href` per market is where the button
goes (`{handle}` = the product handle; an absolute URL opens in a new tab). A market without an `href` gets a WhatsApp
message to `contact.whatsapp` (`product.quoteWhatsapp`, with `{brand}`, `{title}` and `{url}`), or the contact page
when there is no number. `fixedSize` names, per market, a metadata key that lets that market sell the product normally
(`us_fixed_size: true` on a product that has a fixed US size). `quote: null` (the default) gives every product a cart.

## account

```ts
account: { links: [{ label: { en: "Quotes", id: "Penawaran" }, href: "/account/penawaran" }] },
```

Extra items in the account navigation after "Orders" (and "Reviews" when the reviews plugin is installed). The page
behind each link is yours: add it under `src/app/[countryCode]/(main)/account/`, the account layout wraps it.

## home

```ts
home: {
  promo: {
    eyebrow: { en: "Made to order", id: "Furnitur custom" },
    title: { en: "Tables, chairs and shelves sized for your room", id: "Meja, kursi, dan rak sesuai ukuran ruangan" },
    body: { en: "Send us the measurements; we take it from sketch to finish.", id: "Kirim ukurannya; kami kerjakan dari sketsa sampai finishing." },
    cta: { label: { en: "Request a quote", id: "Minta penawaran" }, href: "/custom" },
    secondary: { label: { en: "See the furniture", id: "Lihat furnitur" }, href: "/categories/furniture" },
  },
},
```

A text banner between the featured products and the value props: eyebrow, title, body and one or two buttons, a
photo slot (placeholder) on the right from `md`. `promo: null` (the default) hides it.

## hero

```ts
hero: {
  autoplay: 6000,          // ms; false = off (never with prefers-reduced-motion)
  slides: [
    {
      id: "new-season",
      title: { en: "…", id: "…" },
      subtitle: { en: "…", id: "…" },     // optional
      cta: { en: "Shop now", id: "Belanja sekarang" },
      href: "/store",                     // market-relative, or an absolute URL
      image: { desktop: "/hero/new-season-wide.jpg", mobile: "/hero/new-season-tall.jpg" },
      alt: { en: "…", id: "…" },
      start: "2026-12-01",                // optional schedule, ISO 8601
      end: "2026-12-24T23:59:59+07:00",
    },
  ],
},
```

Two images per slide with fixed ratios, 12:5 for desktops (e.g. 1920×800) and 4:5 for phones (e.g. 840×1050), so
nothing moves while they load. Put them in `public/hero` or use any URL whose host is allowed in
`next.config.js` (the backend and `NEXT_PUBLIC_MEDIA_URL` are). One slide renders as a static banner, several as a
slider with dots, swipe and arrow keys. The home page is static and re-rendered every 60 s, so a scheduled slide
appears or disappears within a minute. `src/lib/hero.ts` is the one place the components read slides from: a
Medusa Admin source only has to return the same shape there. `node seed/demo-hero.mjs` regenerates the demo
banners.

## blogPath, contact, analytics

- `blogPath`: the journal's URL segment (`/blog`). Changing it also means renaming the folder
  `src/app/[countryCode]/(main)/blog` and the edge-cache rules in `next.config.js`.
- `contact: { email, whatsapp }`: Organization `email`, contact links. Nothing here is secret.
- `analytics: { metricool }`: the hash from your Metricool tracker code switches on its page-view tracker
  (`src/modules/analytics/metricool.tsx`: a 400-byte script loaded in idle time, no cookies, no storage). Only
  when `SITE_LIVE=true`, and never on checkout, account, order, transfer, review-link and tracking pages, whose
  URLs carry ids or tokens. Mention it on your privacy page (`content/pages/*/privacy.md`).

## Outside the config file

### UI strings and languages

`src/lib/i18n/dictionaries.ts` holds every string of the storefront chrome in `en` and `id` (product content
comes translated from Medusa). To change a wording, edit it there. To add a language, add a dictionary with the
same shape, add its code to `MarketConfig["dictionary"]` in `theme.config.ts` and reference it from a market.
Server components read strings with `getDictionary(countryCode)` and hand client components the section they
need as a `labels` prop, so no dictionary ends up in the browser bundle.

### Information pages

Shipping, returns, contact, privacy, terms and about are markdown files in `content/pages/{language}/{slug}.md`
(`src/lib/content/pages.ts`), served at `/{slug}` in every market. The language is the market's dictionary; a page
missing in one language falls back to `en`. The front matter holds `title` and `description`; the text may use
`{{brand}}`, `{{email}}`, `{{whatsapp}}`, `{{location}}` (from `theme.config.ts`), `{{country}}` (the market's
country), `{{year}}` and `{{date}}`. Links that start with `/` get the market prefix. Add a file to add a page;
link it from `brand.footerColumns`. The demo texts are placeholders: replace the policies with your own before
going live. `{{rates}}` in a page puts the shipping plugin's rate card there as tables (see "Shipping and tracking").

### Shipping and tracking

With [medusa-fulfillment-zone-rate](https://www.npmjs.com/package/medusa-fulfillment-zone-rate) in the backend
(calculated shipping by zone and chargeable weight, shipments with tracking numbers) the theme adds, detected
through `features.tracking` ("auto" probes `/store/zone-rate/services`):

- **Checkout**: every zone-rate option shows its delivery estimate ("Delivery 2–7 days") under the name and, once
  picked, the service's notice (duties, for example). An option the plugin refuses (unknown province, a product
  without weight or size) is greyed out with the plugin's own message instead of a price.
- **Product page**: "Delivery after dispatch: Air freight 1–2 weeks or Sea freight 1–2 months" in "Shipping &
  returns", from the services that deliver to the market's country.
- **Shipping page**: `{{rates}}` in `content/pages/{language}/shipping.md` renders one table per service (zone,
  price per kg in the market's currency, destinations) with the estimate, the notice and how the chargeable weight
  is counted (`src/lib/data/shipping-rates.ts`). The rate card is cached five minutes.
- **Tracking page**: `/track` inside the app, shown at the language's own address from the dictionary
  `footer.trackPath` ("/lacak" in Indonesian; set it per language in `text`). The proxy rewrites that address to
  `/track` and sends `/track` itself to it (308), so each market has one URL. Lookup form, live card (status,
  destination, dates, timeline) updated over Server-Sent Events through `/api/zone-rate/track/…`, with the buyer's
  IP and `ZONE_RATE_PROXY_SECRET` (the plugin's `trustedProxySecret`) so the per-IP limit counts buyers. The
  footer link `/track` in `brand.footerColumns` follows the same path and disappears without the plugin.
- **Account**: the order page lists the order's shipments with the full timeline, notes and proof photos
  (`/api/zone-rate/photos/…`, the customer's session).

Texts come from the plugin (`src/modules/tracking/core`, a verbatim copy of the package's `src/storefront`:
update it from there); the look is `src/modules/tracking/theme.ts`; times use `brand.timeZone`. The province
names of Indonesian addresses come from `src/lib/util/id-provinces.ts`. `seed/enable-shipping.mjs` switches the
provider on for the demo backend (stock location, one calculated option per service, parcel sizes).

The free-shipping nudge (`src/modules/shipping`) is independent of the plugin: a flat option priced 0 above an
`item_total` price rule shows "$12 away from free shipping" with a progress line, as a small card on the catalogue
pages (dismissible for the session) and inline in the cart summary.

### Makers

`/makers` and `/makers/{handle}` are built from Medusa collections (one collection per workshop, brand or line;
the same collection drives the product page's "by …" line and the listing's maker filter). Everything beyond the
title is optional collection metadata (Admin → Products → Collections → Metadata): `location`, `description`
(one or two sentences), `story` (the profile text; markdown), `image` (a wide cover photo, 12:5) and `website`.
A collection without products is not listed. `src/lib/data/makers.ts` is the only place that reads them.

### Journal URL segments

Category and preview segments inside the journal are `kategori` and `pratinjau` (folders under
`src/app/[countryCode]/(main)/blog`, `categoryPath` in `src/lib/data/blog.ts`, the cache rules in
`next.config.js`, `PRIVATE` in `src/app/robots.ts`).

### Images

Product and article photos come from the backend's own URLs, or from `NEXT_PUBLIC_MEDIA_URL` when your File Module
uploads to a bucket with a public domain (`medusa-storage-r2` for example). `next/image` optimises them on the fly;
the hosts it may load from are derived from those two variables in `next.config.js`.

With `images.route: true` in theme.config.ts the storefront serves them itself instead, at
`/img/{products|blog}/{name}-{width}-{hash}.{avif|webp|jpg}` (`src/app/img/[...path]/route.ts`): the name comes
from the product handle (`{handle}-{n}`, n = the photo's position) or the article slug (`{slug}`, `{slug}-lebar`
for the wide cover, `{slug}-{n}` for photos in the text), the hash from the file name (a replaced photo gets a new
URL), and the format is part of the URL, so every CDN caches each one. sharp resizes (320–1600 px) and encodes on
the server and keeps the result on disk (`IMG_CACHE_DIR`, default `/tmp/kiln-img`); responses are immutable for a
year. JSON-LD, the image sitemap and the share images use the same JPEG URLs. Which file a URL stands for comes from
an index built from the store API, published products and, with medusa-blog-seo, the blog index
(`src/lib/data/image-lookup.ts`), so the backend needs nothing extra: a renamed product or article answers 301 to
the new name, and the preview of an unpublished article shows its photos through next/image. `images.segments`
sets the two URL segments (default `products` and `blog`), for shops that keep addresses from before Kiln; the
`/og/{market}/{segment}/…` share images follow them. On serverless hosts mind the function time limit: encoding a
large AVIF takes seconds. Off (the default), nothing links to the route and it answers 404.

### Share images, favicons

`/og/{market}/brand.png`, category and product share images are rendered by `src/app/og/[...path]/route.tsx`
from the brand name and tagline (`src/lib/og/share.ts`). `/brand/wordmark.png` (the logo, black on transparent)
and `/brand/logo.png` (1200×300 on white) are drawn from `brand.logo` for e-mails, invoices, payment plugins and
Organization.logo. Favicons and the web manifest are the files in `src/app` (`icon.png`, `apple-icon.png`,
`favicon.ico`) and `public/site.webmanifest`.

### Kiln inside a monorepo

When the theme is one package of a pnpm/npm workspace (the lockfile sits above it, dependencies are hoisted), set
`NEXT_WORKSPACE_ROOT=../..` (relative to the theme folder) for `next build` and `next dev`: it becomes
`outputFileTracingRoot` and Turbopack's `root`, so the standalone output and the build resolve packages from the
workspace. Unset, the theme folder itself is the root.

### Caching and the backend hooks

Static pages (home, products, info, journal) are regenerated every 60 s. `POST /api/revalidate` with the header
`x-revalidate-secret: $REVALIDATE_SECRET` purges on demand, re-renders the pages and, behind Cloudflare, purges
them by `Cache-Tag`:

```json
{ "handles": ["oak-serving-board"] }            // products (or { "all": true })
{ "blog": { "slugs": ["…"], "categories": ["…"] } }   // articles (or { "blog": { "all": true } })
```

Call it from a Medusa subscriber on `product.updated`, `product.deleted`, `inventory-level.updated` and from
medusa-blog-seo's publish events, or from a deploy script with `{ "all": true }`. Without it the pages still
refresh within a minute at the origin.

### Payment providers

`src/modules/checkout/components/payment.tsx` lists the region's providers (README, "Payments"). Stripe
(`pp_stripe_*`) renders the Payment Element; the dev provider and any provider that completes on "Place order" work
unchanged. Two plugins have their screens built in and switch on when the backend registers them:

- **medusa-payment-manual-transfer** (`pp_manual-transfer_manual-transfer`): "Place order" calls
  `placeManualTransferOrder` (`src/lib/manual-transfer/data.ts`), which completes the cart, fetches the guest upload
  token and redirects to `/transfer/{order}?token=…`. That page (`src/app/[countryCode]/(main)/transfer/[orderId]`)
  renders the plugin's own `TransferView` from `src/modules/manual-transfer/core` (a verbatim copy of the package's
  `src/storefront`, update it from there) styled through `src/modules/manual-transfer/kiln-theme.ts`: change the
  look there, not in `core`. Proof uploads and the invoice go through `src/app/api/manual-transfer/[orderId]/…`, which
  adds the buyer's IP and `MANUAL_TRANSFER_PROXY_SECRET` (the plugin's `trustedProxySecret`). Wording comes from the
  plugin's `labels.ts` (en, id), picked by the market's language. The order page in the account links back to the
  tokenless page (it needs the customer's session); guests keep the link from the order e-mail. Medusa's order
  transfer requests (`/order/{id}/transfer/{token}`) have their accept/decline page next to it.
- **medusa-payment-doit** (`pp_doit_doit`, IDR): `src/modules/checkout/components/doit/` — the method picker (QRIS,
  virtual accounts with the fee for the cart), the "Pay" button (`selectDoitMethod` in `src/lib/data/doit.ts` creates
  the payment session) and the waiting panel (QR / VA number, countdown, polling of `/store/doit/carts/:id/payment`;
  the order is placed when doit.id confirms). `NEXT_PUBLIC_DOIT_REDIRECT_TO_HOSTED=true` sends the buyer to doit.id's
  hosted page instead. Texts: `doit/labels.ts` (en, id). Without credentials in Admin → Settings → doit.id the option
  shows "not available right now" and the buyer picks another method.

A provider with its own screen (QR, bank details, redirect) gets a branch in `payment.tsx` the same way and, if it
needs a page after the order, a route under `src/app/[countryCode]/(main)`. The confirmation page and the account's
order page (`src/modules/order/parts.tsx`, `OrderMeta`) name the method; add yours to `label()` there.

### Design system

`src/modules/ds` exports the building blocks (Section, SectionHeader, Stack/Page, ProductCard, ProductGrid,
ProductImage, CategoryTile, Carousel, PriceTag, Stars, Badge, Breadcrumb, ButtonLink, Sheet). `/design` shows them
with the current tokens, so a colour or radius change can be checked on one page.
