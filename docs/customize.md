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
| `hideCategories` | Handles of top-level categories left out of the header row, the footer's "Shop" column, the home cards, the listing filters and llms.txt (their own pages stay reachable), e.g. `["furniture-custom"]` for a category sold by quote through a page of your own |
| `footerColumns` | Footer columns and their links (the "Shop" column and the social column are configured under `footer`, see below) |
| `legal` | Optional legal identity for the Organization JSON-LD: `legalName`, `identifier` (`{ propertyID: "NIB", value }`), `telephone`, `address` (schema.org PostalAddress keys), `hours` (`{ opens, closes, days? }`, opens/closes as times with offset, e.g. `"08:00:00+07:00"`) |
| `credit` | `false` hides "Theme Kiln by Haus Kayu" after the copyright line |

Paths in `navLinks` and `footerColumns` are market-relative: `/blog` becomes `/id/blog` in the Indonesian market.

## footer

```ts
footer: {
  brand: {
    qr: null,            // or { src: "/brand/qr-link.svg", href: "/link", alt: { en: "QR to …", id: "QR ke …" }, size: 112 }
    heading: "",         // text under the QR, e.g. "HAUS KAYU"
    subtitle: null,      // Localized line under the heading
  },
  shop: true,            // the automatic "Shop" column (top-level categories + "All products")
  social: null,          // or { title: { en: "Social", id: "Sosial" } }: the profiles as a text column
},
```

- `brand`: the first column. By default the logo with `brand.tagline` + `brand.footerText`. With `qr` the image
  (SVG or PNG under `public/`, `size` px square, linked to `href`, a market-relative path) replaces the logo, with
  `heading` and `subtitle` under it. Keep a QR at 96 px or more so phones can read it.
- The other columns are `brand.footerColumns`, then the social column when `footer.social` is set; without it the
  social icons sit in the bottom row next to the copyright line.
- Phones: the brand block takes the full width, the columns pair up two by two in order (Shop | Help, Studio | …).

## social

```ts
social: {
  footer: { instagram: "https://instagram.com/…", tiktok: "…", pinterest: "…", whatsapp: "https://wa.me/…" },
  sameAs: { facebook: "…", threads: "…", x: "…", linkedin: "…" },
},
```

Keys from `src/lib/social.ts`: `instagram`, `threads`, `facebook`, `tiktok`, `pinterest`, `x`, `linkedin`,
`youtube`, `whatsapp`; an empty URL is ignored.

- `footer`: the networks shown, in this order: in the footer (icons in the bottom row, or a text column with
  `footer.social`), the phone menu and the author box when the shop itself is the writer. Links to profiles carry
  `rel="me noopener"`; `whatsapp` is a chat line (`https://wa.me/…`), so it gets plain `rel="noopener"`.
- `sameAs`: profiles of the brand that are not shown anywhere.
- Both lists, chat lines left out, make the Organization `sameAs` and one `<link rel="me" href>` per profile in
  `<head>` (every page), which is how search engines and the IndieWeb tie the profiles to the site. Icons:
  `src/modules/brand/glyphs.tsx` (Iconoir).

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
- `passthrough: ["/ucp", "/buy"]`: root-level paths the proxy leaves alone — no market prefix, no rewrite, no
  308 — for machine endpoints you add under `src/app/` (an agent/commerce API, deep links). Paths with a dot
  (files, feeds, images) already pass. Default `[]`.
- **hreflang** (`src/lib/util/market.ts` `marketAlternates`, from `SITE_LIVE=true` on): every indexable page lists
  each market's URL under its `hreflang` plus `x-default` = the `xDefault` market's URL, absolute, the same set on
  every version (self-referencing and reciprocal), each equal to that page's canonical; the home page is the bare
  origin. A page a market does not have is left out: an article is listed under the slug of each language it can
  be read in (medusa-blog-seo `alternates`, never the same slug), a blog category by its slug per language, a
  listing page only where it has articles, a route of your own layer only in the markets you name
  (`sitemap.paths`). Pages kept out of the index (filtered listings, empty listings, `noindex` link pages, search,
  account, cart) carry no hreflang and nothing points at them. `sitemap.xml` repeats the same set as
  `xhtml:link`. Audit a running store with `node scripts/seo/check-hreflang.mjs https://your-store.com
  --x-default en-US` (crawls the sitemap and the pages linked from the home pages, checks every pair both ways).

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

## colors, cardIconColor, radius, frost, buttons

```ts
colors: { background: "#ffffff", ink: "#0c0c0c", inkHover: "#2b2b2b", muted: "#6b6b6b", border: "#e5e5e5", control: "#8a8a8a", soft: "#f5f5f5", softHover: "#ebebeb" },
cardIconColor: "light",
radius: { control: "0.5rem", media: "0.75rem", sheet: "1rem" },
frost: { alpha: 0.8, blur: "14px" },
buttons: { style: "glass", radius: "9999px" },
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
- `frost`: the frosted surfaces (sticky header and its search field, mega menu, cart drawer, quick view, filter
  sheet, sticky add-to-cart bar, market banner, toasts) are white at `alpha` behind a `blur`. Browsers without
  `backdrop-filter` and visitors with `prefers-reduced-transparency` get solid white.
- `buttons` (shop.com-like): primary buttons stay solid ink. With `style: "glass"` the secondary/outline buttons,
  the chips (sizes, filters), the quantity stepper, the sort/filter controls and the "See all →" pill under each
  home section are translucent blurred pills with a 1px hairline (`glass`); the controls over photos (heart, share,
  card labels, the hero's first button) a stronger glass (`glass-photo`), the hero's second button a dark one
  (`glass-dark`). `"solid"` keeps the shapes in plain white with an ink line and no `backdrop-filter`; browsers
  without it and `prefers-reduced-transparency` get that look either way. `radius` is the radius of buttons, chips
  and steppers (`rounded-button`; `"9999px"` = pill); inputs keep `radius.control`. Blur is only ever on these small
  controls and the frost surfaces, never on a whole section.

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
features: { reviews: "auto", wishlist: "auto", blog: "auto", search: "auto", tracking: "auto", links: "auto", banners: "auto", imageAlt: "auto", aiChat: "auto" },
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
| `links` | medusa-link-in-bio | `/links` and `/links/{handle}` 404, `/l/{key}` sends visitors to `/links`, footer link to `/links` hidden, sitemap without the pages |
| `banners` | medusa-hero-banners | The home hero shows `hero.slides` from theme.config.ts (or the text hero when that list is empty) instead of the Admin's banners |
| `imageAlt` | medusa-image-alt | Product photos keep the built-in alt texts: the title on cards and in the share image, "{title} (photo n of m)" in the gallery, decorative (`alt=""`) in the cart and the checkout summary, plain URLs in the Product JSON-LD |
| `aiChat` | medusa-ai-chat | No chat button; `/api/ai-chat/*` 404 |

### AI assistant

With [medusa-ai-chat](https://www.npmjs.com/package/medusa-ai-chat) installed (`features.aiChat`, probed at start)
a round glass button bottom right opens the assistant (`src/modules/ai-chat`). The button is server-rendered;
the panel's code is fetched on the first click, so page loads carry nothing of it. The panel shows a consent notice
before the first message (the model provider's name comes from the plugin's config, the link goes to the plugin's
`storefront.privacy_path`, `/privacy` by default), the greeting and name set in the Admin, streamed answers with
product cards (price in the market's currency, link to the product page), thumbs up/down, a "Chat with our team"
link (the plugin's WhatsApp number; once a conversation exists the link carries a summary the server composed) and
the team's hours (`contact.hours` in the plugin options). Hidden when the Admin switch is off; over the plugin's
daily budget only the WhatsApp link remains. The browser talks to `/api/ai-chat/*` only (`app/api/ai-chat`), which
relays the plugin's five Store routes with the publishable key and the visitor's IP.

Point the plugin's `knowledge.pages` at the information pages as Markdown, e.g. `https://your-store.com/returns.md`
and `https://your-store.com/us/returns.md` (see "Information pages"), so the assistant quotes your own policies.
The consent text and every label live in dictionary `aiChat`; the launcher stacks above any element with
`data-k-dock` (market banner, sticky add-to-cart bar) that dispatches a `k:dock` event when it appears or leaves.

### Alt texts of product photos

With [medusa-image-alt](https://www.npmjs.com/package/medusa-image-alt) installed (`features.imageAlt`, probed at
start) every product photo gets the text an admin wrote in Medusa's Admin → Image alt (or on the product page), in
the market's language, or the plugin's own automatic text when the field is empty. `src/lib/data/image-alt.ts`
fetches the map (image URL → text) for the products of a page, cached like the products; the plugin's `revalidate`
option posts to `/api/revalidate` when a text changes. Used by the gallery, the product cards (`toProductCard(…, alts)`),
the cart line and checkout thumbnails, the Open Graph image's `alt` and the Product JSON-LD, where a described photo
becomes an `ImageObject` with `caption`. Configure the plugin with the store's locales (`locales: ["id", "en"]` for
the two demo markets) so each market gets its own text.

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

## breadcrumb

```ts
breadcrumb: { visible: false, schema: true },
```

`visible`: the Home › … › Page trail above the title on every page that has one (store, categories, collections,
product, blog index and categories, articles, information pages, makers, tracking). Off, nothing is rendered (no
leftover gap) and the label above the title links up instead: the category (and the maker) on the product page, the
category in an article. `schema`: the BreadcrumbList structured data on the pages that carry it (listings, product,
blog), kept by default and independent of `visible`.

## product

```ts
product: {
  share: true,
  notes: [
    { icon: "truck", text: { en: "Free shipping over $120 · [30-day returns](/returns)", id: "Gratis ongkir di atas Rp1.500.000 · [retur 30 hari](/returns)" } },
    { icon: "ruler", text: { en: "Custom sizes available [on request](/contact)", id: "Ukuran custom bisa dipesan [lewat kontak](/contact)" } },
  ],
},
```

`share`: the share button over the photo, under the wishlist heart. Phones (touch + Web Share
API) get the system share sheet with the title and URL; elsewhere a menu: copy link (with a "link copied" toast),
WhatsApp, Facebook, X, Pinterest (the main photo and its alt text), e-mail, the filled marks of the article share
row. Every channel shares the canonical URL with `utm_source=share&utm_medium={channel}` (`copy`, `native`,
`whatsapp`, `facebook`, `x`, `pinterest`, `email`). Texts: dictionary `product.share`.

The "shipping & policies" rows under the add-to-cart button, each with a line icon (lucide, drawn on the server).
The first row is always the availability ("In stock · ships from {location}", package icon), then the delivery
estimate when medusa-fulfillment-zone-rate is installed (truck), then these notes. An item is `{ icon, text }` or a
plain text (check icon); the icons are listed in `src/lib/notes.ts` (`check`, `truck`, `package`, `hand`, `ruler`,
`undo`, `shield`, `leaf`, `trees`, `gift`, `clock`, `sparkles`, `badge`, `hammer`). `[label](href)` inside a text
becomes a link with a dotted underline: a market-relative path ("/custom") gets the market prefix, an absolute URL
opens in a new tab. `[]` keeps only the availability row.

### Specifications ("Details")

The "Details" accordion holds the description and a specification list built from the product and its metadata.
Every metadata key may carry a `_{lang}` twin for the other language (`material_en`, `finishing_id`, …); the
market's language wins, then the bare key.

| Row | Source |
| --- | --- |
| Dimensions | `metadata.dimensions`, else `length × width × height` (cm) |
| Material | `metadata.material` / `material_{lang}`, else Medusa's `material` field |
| Finish | `metadata.finishing` / `finishing_{lang}` (or `finish`) |
| Options | Product options with more than one value (titles translated by `product.optionTitles`) |
| Weight | `weight` (g, shown in kg from 1000) |
| Maker | The product's collection |
| Made in | `metadata.origin`, else the collection's `metadata.location`, else `brand.location` |

"Materials & care" shows `metadata.materials` and `metadata.care`; the FAQ comes from `metadata.faq` (JSON
`[{ "q", "a" }]`) plus care and sizes.

### Reviews block

With medusa-reviews-wishlist (`features.reviews`) the product page ends with a full-width reviews block: the average
with the 5→1 distribution, a strip of buyers' photos, the newest reviews as cards in a rail, "See all reviews"
(a drawer with a star / "with photos" filter and a sort, pages from `/api/reviews`) and "Write a review". The page is
static, so the write button checks the visitor on click (`/api/reviews/eligible`): a login prompt, "nothing to review
yet", or one form per order item that may be reviewed (the plugin's rules: verified buyers, after shipping; photos
allowed). Without reviews the block is a short invitation, no empty bars; the "{avg} · n reviews" link under the
title and the `AggregateRating` / `Review` JSON-LD exist only with approved reviews.

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

A text banner between the featured products and the value props: eyebrow, title, body and one or two buttons;
with `image: { src: "/promo.jpg", alt: { en: "…", id: "…" } }` (4:3) a photo on the right from `md`, without it the
copy takes the whole card. `promo: null` (the default) hides it.

## hero

```ts
hero: {
  autoplay: 6000,          // ms; false = off (never with prefers-reduced-motion)
  placement: "home",       // which medusa-hero-banners placement feeds the hero
  slides: [
    {
      id: "new-season",
      title: { en: "…", id: "…" },
      subtitle: { en: "…", id: "…" },     // optional
      cta: { en: "Shop now", id: "Belanja sekarang" },
      href: "/store",                     // market-relative, or an absolute URL
      secondary: { cta: { en: "Custom furniture", id: "Furniture custom" }, href: "/custom" },   // optional outlined button
      image: { desktop: "/hero/new-season-wide.jpg", mobile: "/hero/new-season-tall.jpg" },
      alt: { en: "…", id: "…" },
      start: "2026-12-01",                // optional schedule, ISO 8601
      end: "2026-12-24T23:59:59+07:00",
    },
  ],
},
```

**From the Admin.** With [medusa-hero-banners](https://www.npmjs.com/package/medusa-hero-banners) installed
(`features.banners`, probed at start) the slides are the banners an admin switched on in Medusa's Admin → Banners
(placement `hero.placement`): images uploaded there with a focal point, texts per language, order, schedule. The
list above is then only the fallback. Give the plugin `storefront.url` + `storefront.locales` (for its "leads to"
links) and `revalidate: { url: "https://your-store.com/api/revalidate", secret }`, so a change in the Admin
re-renders the home page at once (the page also re-renders every 60 s). A banner's link is a market-relative path
(`/store`, `/custom`) or an absolute URL; a banner without text in the market's language shows its default
language.

**Images.** Two per slide with fixed ratios, 12:5 for desktops (e.g. 1920×800) and 4:5 for phones (e.g. 840×1050),
so nothing moves while they load. Put them in `public/hero` or use any URL whose host is allowed in
`next.config.js` (the backend and `NEXT_PUBLIC_MEDIA_URL` are; another host is embedded as it is). A slide
**without images is a text panel**: the ink colour as background, the copy centred, the button white; when no slide
has an image the phone box is square instead of 4:5. One slide renders as a static banner, several as a slider with
dots, swipe and arrow keys. No slide at all (no banners, empty list): the text hero from the dictionary
(`home.heroEyebrow`, `heroTitle`, `heroBody`, the two buttons), with no photo slot. `src/lib/hero.ts` is the one
place the components read slides from. `node seed/demo-hero.mjs` regenerates the demo banners.

## linkInBio

```ts
linkInBio: { handle: "links" },
```

The link-in-bio pages of [medusa-link-in-bio](https://www.npmjs.com/package/medusa-link-in-bio) (`features.links`).
The page with this handle is served at `/links` in every market (`/links`, `/us/links`, …), every other page at
`/links/{handle}`; set the plugin's `storefront.main_handle` to the same value and its `storefront.url` and
`storefront.locales` to this storefront so the plugin's own links (QR codes, the Admin's "open page") point here.
The page is drawn by `src/modules/links/template.tsx` in the market's language with the market's prices: profile,
name, bio, social icons, then the items in the admin's order (links, products with price and stock, collections,
categories, promo codes with a copy button, journal articles, WhatsApp, contact, headings, dividers). No shop
header or footer, no script except the copy button (and the one-line preload of the hero): the page is meant to
score 100 on PageSpeed. The page's colours and shape from the plugin ("theme") are applied as CSS variables; Kiln's
font and type scale stay.

Two profile styles, chosen per page in the Admin (plugin 0.2): **circle** — the avatar in a circle above the name
(initials when there is none) — and **hero** — the page's header image full width at the top of the 600 px column
(edge to edge on phones, rounded corners from `sm`), its aspect ratio reserved from the plugin's `hero_ratio`
(16:9 or 3:2) so nothing shifts while it loads, fetched eagerly and preloaded as the LCP, AVIF/WebP via next/image
when its host is in `IMAGE_HOSTS` (the backend, `NEXT_PUBLIC_MEDIA_URL`), cropped around the focal point set in the
Admin (`object-position`), and fading into the page background over its lower third with a CSS mask, so it works on
any theme colour. The name and bio sit right under the hero, rising into its faded edge; when the page's
`hero_avatar` switch is on (Admin: "Show the avatar over the header"), the avatar sits small over the hero's lower
edge above them, with a ring in the page colour. Alt texts come from the plugin per language. The share image
`/og/{market}/links/{handle}.png` follows the style: the hero behind the name, fading to white, the avatar only when
the switch is on, or the avatar/initials in the centre; both crop around the same focal points.

`linkInBio.path` moves the pages to another segment, e.g. `path: "link"` → `/link`, `/us/link`, `/link/{handle}`:
the proxy serves them from the same route, the old `/links…` addresses answer 308 to the new ones, and canonical,
hreflang, sitemap, the `/l/{key}` fallback and `/api/revalidate` follow. Set the same segment in next.config.js
(`LINKS_PATH`, the edge-cache rule) and in the plugin (`storefront.paths: { main: "/link", page: "/link/{handle}" }`,
so its QR codes and page URLs match). The share images keep their own namespace, `/og/{market}/links/{handle}.png`.

Every item points at `/l/{key}?l={lang}` (root level, outside the markets, `src/app/l/[key]/route.ts`): Kiln relays
the plugin's redirect, the plugin counts the click and sends the visitor to the stored destination. Unknown or
expired links land on `/links`. Set the plugin's `revalidate: { url: "https://your-store.com/api/revalidate", secret }`
(same secret as `REVALIDATE_SECRET`) so a change in the Admin re-renders the pages at once; without it they refresh
within 60 s. `noindex` on a page is honoured; pages without it are in the sitemap. Share image:
`/og/{market}/links/{handle}.png` (avatar or initials, name, bio) unless the page has its own.

`seed/enable-links.mjs` creates a demo page on the dev backend.

## sitemap

```ts
sitemap: { paths: [{ path: "/custom", markets: ["id"] }] },
```

`sitemap.xml` lists by itself: the home page, `/store`, `/makers`, every information page in `content/pages`,
products (with their photos), categories, collections, the blog (listing, categories, articles, each language by
its own slug) and the link-in-bio pages, one entry per market URL with the hreflang set above. `paths` adds routes
of your own layer under `src/app/[countryCode]/`; `markets` limits one to the markets that have it (its hreflang
then names only those). Nothing is listed before `SITE_LIVE=true`.

## Checks (scripts/)

- `pnpm check:hreflang <base-url> --x-default id-ID --prefixes us,id`: hreflang/canonical/sitemap audit of a running
  store (details in the markets section above).
- `pnpm check:overflow <base-url> [--widths 320,360,375,390,412] [--prefixes ,us] [--paths /,/about]`: horizontal
  overflow on phones. Playwright (dev dependency) opens home, the first category, the first product, cart and
  checkout (after adding that product), `/about`, `/contact`, `/link`, the blog and its first article in every
  market at every width and fails when the page is wider than the screen, printing the elements that stick out.
  Browser: `pnpm exec playwright install chromium` once, or `CHROME_PATH=/path/to/chrome`.

## Information pages (content/pages)

`content/pages/{language}/{slug}.md` with front matter `title`, `description`, optional `image` + `image_alt` (a
photo under the header, absolute URL or a file in `public/`; nothing is rendered when it is missing) and optional
`schema: AboutPage` / `schema: ContactPage` (JSON-LD of that type, with the Organization from `brand.legal` and
`contact`, when `SITE_LIVE=true`). Raw HTML is allowed: `<a class="button button--lg button--primary" href="/custom">…</a>`
is a call-to-action button; links that start with `/` get the market prefix. Placeholders: see
`src/lib/content/pages.ts`. A page missing in one language falls back to `en`.

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
Every page is also served as Markdown at `/{slug}.md` (and with `Accept: text/markdown`), for AI agents and the
AI assistant's policy tool.

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
{ "blog_seo": { "posts": [{ "slugs": { "en": "…" } }], "all": false } }   // what medusa-blog-seo sends
```

Call it from a Medusa subscriber on `product.updated`, `product.deleted`, `inventory-level.updated`, or from a
deploy script with `{ "all": true }`. For articles, give medusa-blog-seo the route as its `revalidate` option
(`{ url: "https://your-store.com/api/revalidate", secret: process.env.REVALIDATE_SECRET }` in medusa-config.ts):
its batched payload is understood as is, previous slugs included. Without it the pages still refresh within a
minute at the origin.

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
