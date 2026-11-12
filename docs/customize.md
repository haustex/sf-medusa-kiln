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
features: { reviews: "auto", wishlist: "auto", blog: "auto", search: "auto" },
```

`"auto"` probes one store route per integration when the server starts (`src/lib/features.ts`): a 404 switches
it off, anything else (including a backend that is down) leaves it on. `"on"` / `"off"` force it, and the
environment overrides the file: `KILN_FEATURE_BLOG=off`. What "off" means:

| Feature | Backend | Off |
| --- | --- | --- |
| `reviews` | medusa-reviews-wishlist | No stars on cards or product pages, no reviews block, no "Reviews" tab in the account, `/api/reviews` 404 |
| `wishlist` | medusa-reviews-wishlist | No hearts, no wishlist icon in the header, `/wishlist` and `/api/wishlist` 404 |
| `blog` | medusa-blog-seo | `/blog/…` and the feed 404, journal band and links hidden, sitemap without articles |
| `search` | `/store/meilisearch/products` route | `/search` uses Medusa's own `/store/products?q=` |

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

## blogPath, contact

- `blogPath`: the journal's URL segment (`/blog`). Changing it also means renaming the folder
  `src/app/[countryCode]/(main)/blog` and the edge-cache rules in `next.config.js`.
- `contact: { email, whatsapp }`: Organization `email`, contact links. Nothing here is secret.

## Outside the config file

### UI strings and languages

`src/lib/i18n/dictionaries.ts` holds every string of the storefront chrome in `en` and `id` (product content
comes translated from Medusa). To change a wording, edit it there. To add a language, add a dictionary with the
same shape, add its code to `MarketConfig["dictionary"]` in `theme.config.ts` and reference it from a market.
Server components read strings with `getDictionary(countryCode)`, client components with `useDictionary()`.

### Journal URL segments

Category and preview segments inside the journal are `kategori` and `pratinjau` (folders under
`src/app/[countryCode]/(main)/blog`, `categoryPath` in `src/lib/data/blog.ts`, the cache rules in
`next.config.js`, `PRIVATE` in `src/app/robots.ts`).

### Images

Product and article images are served from the backend's own URLs, or from `NEXT_PUBLIC_MEDIA_URL` when your
File Module uploads to a bucket with a public domain (`medusa-storage-r2` for example). `next/image` optimises
them on the fly; the hosts it may load from are derived from those two variables in `next.config.js`.

### Share images, favicons

`/og/{market}/brand.png`, category and product share images are rendered by `src/app/og/[...path]/route.tsx`
from the brand name and tagline (`src/lib/og/share.ts`). Favicons and the web manifest are the files in
`src/app` (`icon.png`, `apple-icon.png`, `favicon.ico`) and `public/site.webmanifest`; the Organization logo in
JSON-LD is `public/android-chrome-512x512.png`.

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

`src/modules/checkout/components/payment.tsx` lists the region's providers. Stripe (`pp_stripe_*`) renders the
Payment Element; the dev provider and any provider that completes on "Place order" work unchanged. A provider
with its own screen (QR, bank details, redirect) gets a branch there and, if it needs a page after the order, a
route under `src/app/[countryCode]/(main)`.

### Design system

`src/modules/ds` exports the building blocks (Section, SectionHeader, Stack/Page, ProductCard, ProductGrid,
ProductImage, CategoryTile, Carousel, PriceTag, Stars, Badge, Breadcrumb, ButtonLink, Sheet). `/design` shows them
with the current tokens, so a colour or radius change can be checked on one page.
