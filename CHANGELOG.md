# Changelog

All notable changes to Kiln. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions
follow [Semantic Versioning](https://semver.org).

## [0.13.0] — 2026-11-21

Header that tucks its second row away, shop.com-like page titles, one type scale.

### Added
- `theme.config.ts` pageHeader `{ align: "center" | "left" }` and `ds/page-header.tsx`: the listing pages (store,
  categories, collections, blog index and categories, search) open with the h1 in the page-title size and the
  category's / collection's / blog category's description as one muted line under it, centred by default. The
  search page's field follows the alignment.
- A fluid type scale with tokens in `src/styles/globals.css` (`--type-h1` … `--type-h4`, `--type-lead`,
  `--type-body`, `--type-xs`): body 16 → 17px (line-height 1.6 for running text), h1 32 → 44 / 700 / -0.03em,
  h2 22 → 28 / 600, h3 18 → 20 / 600, h4 = body / 600, nothing under 13px. `text-xs`, `text-base` and `text-lg`
  follow it, so every page sits on the same scale; new utilities `type-h4`, `type-lead`, `type-caption`.
  `--k-measure` (`max-w-measure`, 40rem ≈ 68 characters) is the reading column of articles and information pages.
- `--space-page-top` (`pt-page-top`, 24px / 32px from lg): the one token for the gap between the header and a
  page's first block (`<Page>`, checkout). Was `stack-md` (16px).

### Changed
- Header: the second row (the category row from md, the search field on phones) slides up behind the top row and
  fades while scrolling down and comes back on scrolling up or near the top, on every width; the row with the logo,
  the search and the icons always stays. Transform + opacity only (CLS 0), 200ms, nothing animates with
  prefers-reduced-motion. Both rows are frost surfaces on a transparent, click-through `<header>`
  (`.header-secondary` in globals.css, `HeaderScroll`).
- Article: the share row (seven brand marks) is replaced by the product page's share button, moved to
  `modules/common/components/share-button` (`surface` "photo" | "page", `align`): the system share sheet on phones,
  a menu with copy link, WhatsApp, Facebook, X, Pinterest (the cover and its alt text) and e-mail elsewhere, the same
  `utm_source=share&utm_medium={channel}` tags. Dictionary `blog.share` is now the label next to it; the menu's
  wording is `product.share`.
- Article text is the body step (16 → 17 / 1.6, was 18 / 1.7), its title, h2 and h3 the site's h1/h2/h3; the
  header column and the text share the reading measure. Information pages use the same measure.
- Listing filters: the currency in the price fields is its own adornment ("Rp | Min", "$ | Max"), in the market's
  notation; option titles are translated like the product page's legends (`Size` → `Ukuran`,
  `src/lib/i18n/option-title.ts`).
- Spacing audit: raw `mt-*` / `gap-*` numbers in the hero slider, value props, blog chips and pagination, the AI
  chat panel, the link-in-bio page, product and post cards replaced by the spacing tokens; the blog category chips
  are the listing's glass chips; `SectionHeader` descriptions and hero copy use `type-body` / `type-lead`;
  `Heading` (common/ui) maps h1/h2/h3 onto `type-h1`/`type-h2`/`type-h3`; the 404 pages use `type-h1`.

### Fixed
- The AI assistant's button no longer jumps up when the market banner comes in (a 0.004 layout shift on every page
  of that market since 0.11.0): on a market with the banner it stays invisible until the banner has decided
  (`k:dock` dispatched before paint) and appears once, in its place. Its "AI" badge is 13px.


No visible breadcrumbs.

### Changed
- `theme.config.ts` breadcrumb `{ visible, schema }` replaces product.breadcrumb and applies to every page: with
  `visible: false` (default) the trail is gone from listings, product, blog, information, makers and tracking pages
  without leaving a gap; the BreadcrumbList structured data stays on the pages that had it (`schema: true`).
- Article: the category is a label above the title linking to the blog category (as on the product page) instead
  of a pill in the meta row.

## [0.11.0] — 2026-11-20

AI assistant (medusa-ai-chat).

### Added
- `theme.config.ts` features.aiChat (`"auto"`): with [medusa-ai-chat](https://www.npmjs.com/package/medusa-ai-chat)
  on the backend, a round glass button bottom right opens the assistant: consent notice before the first message
  (names the model provider, links the privacy page), the Admin's greeting, streamed answers with product cards,
  thumbs up/down, "Chat with our team" (WhatsApp with a server-made summary of the conversation) and the team's
  hours. Hidden when the plugin is missing or switched off in the Admin; over the daily budget only the WhatsApp
  link remains. The button stacks above the market banner and the product page's sticky bar (`data-k-dock`). The
  panel's code loads on the first click, nothing on page load. `modules/ai-chat`, relay `/api/ai-chat/*`
  (publishable key and the visitor's IP forwarded, answer stream piped through), dictionary `aiChat`.
- Information pages as Markdown: `/shipping.md`, `/us/returns.md`, or the page URL with `Accept: text/markdown`
  (`[page]/markdown/route.ts`, rewrites in `next.config.js`): for AI agents and for the assistant's `get_policy`
  tool (`knowledge.pages` in the plugin options).

## [0.10.0] — 2026-11-20

Glass buttons (shop.com-like).

### Added
- `theme.config.ts` buttons: `style` "glass" (default) or "solid", `radius` (pill by default). Secondary/outline
  buttons, chips, the quantity stepper, the sort/filter controls and the new "See all →" pill are translucent
  blurred pills with a hairline (`glass`); the controls over photos (heart, share, card labels, hero buttons)
  `glass-photo` / `glass-dark`. Solid white with an ink line without backdrop-filter, with
  prefers-reduced-transparency, or with `style: "solid"`. `src/styles/globals.css`.

### Changed
- Home sections (categories, featured, journal, carousels): the "See all" text link on the title line is gone; a
  centred "See all →" glass pill sits under the content, whatever the number of items (`ds/section.tsx`;
  `SectionHeader` no longer takes `action`).
- Primary buttons are pills (`buttons.radius`). The header search field is a glass pill; the market banner, the
  share toast, the sticky add-to-cart bar and the product-page heart/share discs use the glass/frost tokens.
  Labels over card photos (`Badge overPhoto`) are glass pills instead of white rectangles. The hero's buttons are
  glass pills (white, dark) on every screen size.

## [0.9.0] — 2026-11-19

Product page: share button, optional breadcrumb.

### Added
- A share button over the product photo, under the wishlist heart (`theme.config.ts` product.share): the system
  share sheet on phones (Web Share API), elsewhere a menu with copy link (toast "link copied"), WhatsApp, Facebook,
  X, Pinterest (main photo + alt text) and e-mail, with `utm_source=share&utm_medium={channel}` on the canonical
  URL. `modules/products/pdp/share.tsx`; texts in dictionary `product.share`; a "mail" mark in `brand/marks.tsx`.
- `theme.config.ts` product.breadcrumb: the visible breadcrumb on the product page can be switched off; the label
  above the title then links to the category (and the maker). The BreadcrumbList structured data stays.

## [0.8.1] — 2026-11-18

### Changed
- Product page: the option legend no longer repeats the selected value at its right ("Size   15×15×8cm"); the
  chips already show it. Colour or image swatches without text, when a theme adds them, should put the value
  after the name instead ("Colour: Natural").

## [0.8.0] — 2026-11-17

Configurable footer.

### Added
- `theme.config.ts` `footer`: `brand` (the logo + tagline, or a QR code under `public/` linked to a page, with a
  heading and a subtitle under it), `shop` (the automatic categories column on/off) and `social` (the profiles as
  a text column under a title instead of icons in the bottom row). Phones: the brand block full width, then the
  columns two by two.
- `social` is now `{ footer, sameAs }`: the networks shown (in the config's order) and the profiles that only go
  into the Organization `sameAs` and one `<link rel="me">` per profile in `<head>`. New networks `threads`,
  `linkedin`, `whatsapp` (`src/lib/social.ts`). `SocialTextLinks` in `modules/brand/social.tsx`.

### Changed
- Links to the brand's profiles carry `rel="me noopener"`; `whatsapp` (a chat line, not a profile) gets plain
  `rel="noopener"` and is left out of the Organization `sameAs`, which now comes from `sameAsUrls()`.
- The footer grid is `grid-cols-2` on phones (was one column, then two from `sm`).

## [0.7.0] — 2026-11-17

Product page revision (desktop and phone, every market).

### Changed
- Layout: gallery and info column 50:50 from `lg` (was 58:42); the info column stays sticky. The first photo is
  requested at 640px on wide screens (`sizes`), not 58vw.
- Wishlist heart: over the top-right corner of the gallery photo (frost disc, translucent white with blur, outline
  heart that fills when saved; new `WishlistHeart` variant `photo`, `Gallery` prop `action`), on desktop and phones.
  Gone from the buy row, which is now the quantity control plus a full-width "Add to cart · price" button. The
  "· price" part is shown whenever the whole label fits on one line in the button (measured; the price is always
  shown above the form and in the phone sticky bar), so EN labels show it from 320px while a long Indonesian label
  with a Rupiah price shows it from about 412px. `BuyBox` lost `heart` and `notes: string[]`; it takes `notes` (rows)
  and `icons` now.
- The three bullet points under the button are an icon list ("shipping & policies"): availability with a package
  icon, the delivery estimate with a truck (moved here from "Shipping & returns"), then `product.notes` from
  theme.config.ts, each `{ icon, text }` (`src/lib/notes.ts` lists the icons; a plain text gets a check). `[label](href)`
  inside a note becomes a link with a dotted underline (market prefix added to relative paths). Icons are plain SVG
  from the server (`ds/icons`), no client islands.
- "Details": a "Finish" row from `metadata.finishing` / `finishing_{lang}` (or `finish`) after "Material"
  (Medusa's `material` field or `metadata.material` / `material_{lang}`); the Indonesian label of the material row is
  "Bahan baku".
- Reviews block rebuilt, full width under gallery and info: average + stars + count with the 5→1 distribution bars,
  a strip of buyers' photos (opens the drawer on "with photos"), the six newest reviews as cards in a horizontal
  rail (stars, title, text clamped to four lines, photo thumbs, avatar initials, name, relative time, verified badge),
  "See all reviews (n)" (a drawer with star / "with photos" filter and newest / highest / lowest sort, pages from
  `/api/reviews`, which now takes `order`, `rating` and `with_images`) and "Write a review" (a sheet that checks the
  visitor's orders through the new `/api/reviews/eligible`: login prompt, nothing to review yet, or the plugin's
  review form per reviewable item). Without reviews: "No reviews yet" with an invitation, no bars. The drawer, the
  write sheet and the form load on first use; the rest is static HTML. `AggregateRating` / `Review` JSON-LD and the
  "{avg} · n reviews" link under the title (now to `#reviews`) remain reviews-only. `reviews-more.tsx` is gone.
- Dictionaries: `product.finish`, `reviews.photosTitle`, `photoFrom`, `railLabel`, `seeAll`, `allTitle`,
  `filter*`, `sortLabel`, `sort`, `noneFiltered`, `empty`, `emptyBody`, `write*`, `toAccount`, `close`.

## [0.6.0] — 2026-11-17

### Added
- Alt texts of product photos from [medusa-image-alt](https://www.npmjs.com/package/medusa-image-alt)
  (`features.imageAlt`, "auto" probes `/store/image-alt` at start). `src/lib/data/image-alt.ts` fetches the texts of
  a page's products in the market's language (image URL → text, cached with the products; the plugin's `revalidate`
  hook posts the handles to `/api/revalidate`). Used in the product gallery (each photo its own text), on product
  cards everywhere (`toProductCard(product, countryCode, rating, alts)`, new `imageAlt` on `ProductCardData`), on
  the cart line and checkout summary thumbnails (`thumbnailAlt` on `CartLineData`, `alts` on `CheckoutSummary`),
  as the Open Graph image's `alt` (`productShareImage(…, alt)`) and in the Product JSON-LD, where a photo with a
  text becomes an `ImageObject` with `caption` (`buildProductStructuredData({ alts })`). Without the plugin
  nothing changes: title on cards and in the share image, "{title} (photo n of m)" in the gallery, decorative
  thumbnails in cart and checkout.

## [0.5.3] — 2026-11-17

### Fixed
- Product page wider than a phone screen: below `lg` the two-column grid had no `minmax(0, …)` column, so the info
  column took the min-content width of the buy row (quantity + "Add to cart · price" + wishlist). The column can
  shrink now. On phones (< sm) the wishlist heart moves to the price line and the "· price" part of the button
  label is hidden (the price is shown above the form), so quantity + button fit from 320px; the selected option
  value in the legend truncates instead of overflowing.
- Description shown twice (first paragraph above the buy box and again in "Details"). The short paragraph above
  is now the product subtitle only; "Details" holds the description plus the specification rows (dimensions,
  material, options, weight, maker, made in). The separate "Specifications" table under the gallery is gone.

### Added
- Option titles translated: `product.optionTitles` in the dictionaries (Size → Ukuran, Color → Warna, …) or
  `option.metadata.title_{lang}`; used in the buy box, the specs, the FAQ and the Markdown view.
- `scripts/e2e/check-overflow.mjs` (`pnpm check:overflow <base>`): Playwright opens home, a category, a product,
  cart, checkout, the information pages, the link page, the blog and an article in every market at 320, 360,
  375, 390 and 412px and fails when `scrollWidth > clientWidth`, listing the elements that stick out.

## [0.5.2] — 2026-11-16

### Added
- Information pages (`content/pages`): front matter `image` + `image_alt` (a photo under the header, nothing when
  unset) and `schema: AboutPage | ContactPage` (JSON-LD of that type plus the Organization). A link with
  `class="button …"` in the markdown renders as a button (no prose underline).

## [0.5.1] — 2026-11-16

### Fixed
- hreflang: an article's alternates name each language's own slug (medusa-blog-seo `alternates`) instead of
  repeating the current slug; a blog category and its pages likewise; a market whose language has no version of
  the page is left out instead of linked to a 404 or a redirect. Pages kept out of the index (filtered or empty
  listings, `noindex` link-in-bio pages) no longer carry hreflang. The home page's alternates are the bare origin,
  like its canonical. `sitemap.xml` uses the same sets, lists every page of `content/pages` (not a fixed list) and
  omits a market's blog listing when it has no articles.

### Added
- `sitemap.paths` in theme.config.ts: routes of the shop's own layer, optionally in some markets only
  (`{ path: "/custom", markets: ["id"] }`), in the sitemap and with matching hreflang.
- `scripts/seo/check-hreflang.mjs`: audits a running store (sitemap + crawl from the home pages): 200, canonical,
  self-reference, reciprocity, x-default, sitemap parity, and that noindex/redirect/404 pages are never alternates.
- `marketUrl(origin, market, path)` and `MarketPaths` in `src/lib/util/market.ts`; `blogMarketPaths` in
  `src/lib/data/blog.ts`.

## [0.5.0] — 2026-11-16

### Added
- The home hero's slides from the Admin with [medusa-hero-banners](https://www.npmjs.com/package/medusa-hero-banners)
  (`features.banners`, `hero.placement`): images with their focal points, texts per language, order and schedule as
  set in Admin → Banners; the plugin's `revalidate` hook (`POST /api/revalidate { hero_banners }`) re-renders the home
  page at once. `hero.slides` in theme.config.ts stays the fallback.
- An optional second, outlined button per slide (`secondary` in `hero.slides`, the plugin's "second button").
- Slides without images: a text panel (ink background, copy centred, white button) instead of a photo; a slide's
  `image` is optional now. When no slide has an image the phone box is square.
- `brand.hideCategories`: top-level categories (handles) left out of the header row, the footer's "Shop" column,
  the home cards, the listing filters and llms.txt; their pages stay reachable.
- `home.promo.image`: an optional 4:3 photo for the promo card.

### Changed
- The text hero (no slides) and the promo card no longer draw an empty grey placeholder where a photo could be: the
  copy takes the space.

## [0.4.1] — 2026-11-15

### Added
- `linkInBio.path` in theme.config.ts: the link-in-bio pages under another segment than `/links` (`"link"` →
  `/link`, `/us/link`, `/link/{handle}`); the `/links…` addresses redirect (308) to the new ones, and canonical,
  hreflang, sitemap, `/l/{key}` and `/api/revalidate` follow. `LINKS_PATH` in next.config.js for the edge-cache rule.

### Fixed
- The share image of a link-in-bio page (`/og/{market}/links/{handle}.png`) stayed in Cloudflare's cache for up to
  seven days after the page changed in the Admin (new avatar, hero or name): it carries the tag `og-links` now and
  `/api/revalidate` purges it with the page.

## [0.4.0] — 2026-11-15

### Added
- Link-in-bio pages (medusa-link-in-bio 0.2): the "hero" profile style — the page's header image full width at the
  top, its aspect ratio reserved (16:9 or 3:2, no layout shift), preloaded as the LCP and served as AVIF/WebP through
  next/image when the host is allowed, cropped around the focal point set in the Admin, fading into the page colour
  over its lower third (CSS mask, so it follows the theme's background); the name and bio rise into its faded edge,
  or, when the page switches `hero_avatar` on, the avatar sits small over the edge above them. Alt texts per language
  and the avatar's focal point from the plugin. The share image `/og/{market}/links/{handle}.png` draws the hero
  behind the name with the same focal point and the same avatar rule.

## [0.3.1] — 2026-11-15

### Fixed
- `/l/{key}` sent an unknown or expired link to the market's `/links` page on the server's own address
  (`http://localhost:8000/links` behind a reverse proxy); it uses the public origin now.

## [0.3.0] — 2026-11-15

### Added
- Link-in-bio pages with [medusa-link-in-bio](https://www.npmjs.com/package/medusa-link-in-bio) (`features.links`,
  `linkInBio.handle`): `/links` (and `/links/{handle}`) in every market, drawn by the storefront in the market's
  language with live prices and stock, no shop chrome and no script except the promo-code copy button; `/l/{key}`
  relays the plugin's counted redirect; share image `/og/{market}/links/{handle}.png`; `/api/revalidate` takes the
  plugin's `link_in_bio` payload; pages without `noindex` in the sitemap; `seed/enable-links.mjs` for the demo backend.
- Products sold by quote (`product.quote`): "Request a quote" where the buy box would be, the lowest price as
  "from", a per-market link or a WhatsApp message; no Product JSON-LD, "price on request" in llms.txt and the
  Markdown product page. Dictionary keys `product.requestQuote`, `requestQuoteNote`, `priceOnRequest`,
  `quoteWhatsapp`.
- `account.links`: extra items in the account navigation, after "Orders".
- `home.promo`: an optional text banner on the home page between the featured products and the value props.
- `brand.legal`: legal name, registration number, address, telephone and contact hours in the Organization schema.
- `NEXT_WORKSPACE_ROOT`: build and trace from a monorepo root when Kiln is one workspace package.
- `/api/revalidate` takes medusa-blog-seo's own `revalidate` payload (`blog_seo`), so the plugin option
  `revalidate: { url, secret }` is enough; the old `{ blog: … }` shape still works.
- `markets.passthrough`: root-level paths served outside the markets (`/ucp`, `/buy`, …); without it the proxy
  rewrote them into the default market and they answered 404.
- The tracking page: another language's address (`/lacak` asked in the US market) redirects to the market's own
  (`/track`), like `/track` itself does in the Indonesian market.

### Changed
- Less JavaScript hydrated with every page: the cart drawer and the phone menu drawer are fetched on the visitor's
  first input and mounted on their first open; a card's quick view is fetched when its "+" is first pressed.
- Icons in server components (header, breadcrumbs, stars, value props, checkout steps, …) are drawn as plain SVG
  (`Icon` in `modules/ds/icons`): lucide-react's components are client components, so each one rendered by a server
  component was shipped and hydrated as its own island (seven on the home page, dozens of stars on a product page).

### Fixed
- Blog category chips no longer list categories without a public article (a chip led to an empty page).
- A link to the page it is on no longer prefetches (Next 16 asked for a per-segment prefetch that answered 404 on
  self-hosted dynamic pages and logged an error in the console, e.g. the product's name in the cart drawer).
- The blog index shows the category chips when its only article is the featured one (they sat in the grid, which was empty).

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

[0.5.0]: https://github.com/haustex/sf-medusa-kiln/releases/tag/v0.5.0
[0.4.1]: https://github.com/haustex/sf-medusa-kiln/releases/tag/v0.4.1
[0.4.0]: https://github.com/haustex/sf-medusa-kiln/releases/tag/v0.4.0
[0.3.1]: https://github.com/haustex/sf-medusa-kiln/releases/tag/v0.3.1
[0.3.0]: https://github.com/haustex/sf-medusa-kiln/releases/tag/v0.3.0
[0.2.0]: https://github.com/haustex/sf-medusa-kiln/releases/tag/v0.2.0
[0.1.0]: https://github.com/haustex/sf-medusa-kiln/releases/tag/v0.1.0
