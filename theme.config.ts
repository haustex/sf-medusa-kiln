/**
 * Kiln theme configuration: everything a shop changes to make the storefront its own.
 * Colours, radii and fonts become CSS variables on <html> (see src/app/[countryCode]/layout.tsx);
 * markets drive routing (src/lib/util/market.ts, src/proxy.ts); the rest is read by the components that need it.
 * Keep this file free of secrets: it is imported by client components too.
 */
/** One string for every language, or one per dictionary code: { en: "Help", id: "Bantuan" } */
export type Localized = string | Record<string, string>

export type HeroSlideConfig = {
  /** Stable id (dots, keys) */
  id: string
  title: Localized
  subtitle?: Localized
  cta: Localized
  /** Market-relative path ("/store") or absolute URL */
  href: string
  /** Desktop (12:5, e.g. 1920×800) and phone (4:5, e.g. 840×1050) images, from /public or any URL */
  image: { desktop: string; mobile: string }
  alt?: Localized
  /** Optional schedule, ISO 8601 (e.g. "2026-12-01" or "2026-12-01T00:00:00+07:00") */
  start?: string
  end?: string
}

import type { Dictionary } from "./src/lib/i18n/dictionaries"

/** Every key optional, at any depth: `text` below overrides only what it names */
export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

export type MarketConfig = {
  /** Medusa region country code (lower case), e.g. "us" */
  countryCode: string
  /** BCP 47 locale sent to Medusa (`x-medusa-locale`) and used for Intl formatting */
  locale: string
  /** <html lang> */
  htmlLang: string
  /** hreflang value in <link rel="alternate"> */
  hreflang: string
  /** Region currency code (lower case) */
  currency: string
  /** Dictionary used for UI texts (src/lib/i18n) */
  dictionary: "en" | "id"
  /** Label in the footer market switch */
  label: string
}

const config = {
  brand: {
    name: "Tilde Goods",
    /** Title suffix: "{page} | Tilde Goods" */
    titleSuffix: "Tilde Goods",
    tagline: { en: "Small-batch objects for the home, made by independent makers.", id: "Benda rumah dalam jumlah kecil, dari pembuat independen." } as Localized,
    /** Short line under the logo in the footer; the demo content is fictional */
    footerText: { en: "Every piece ships from the workshop that made it.", id: "Setiap barang dikirim dari bengkel yang membuatnya." } as Localized,
    location: "Jepara, Indonesia",
    /** IANA time zone of the shop: shipping dates and tracking times are shown in it */
    timeZone: "Asia/Jakarta",
    /** Logo: "text" renders the name in the site font with a small mark; "svg" uses `svgPath` (one path, fill currentColor) */
    logo: { type: "text" as "text" | "svg", svgPath: "", svgViewBox: "0 0 100 20" },
    /** Links in the header's category row, after the categories */
    navLinks: [
      { label: { en: "Makers", id: "Pembuat" } as Localized, href: "/makers" },
      { label: { en: "Journal", id: "Jurnal" } as Localized, href: "/blog" },
    ],
    /** Footer columns (the "Shop" column lists categories automatically) */
    footerColumns: [
      {
        title: { en: "Help", id: "Bantuan" },
        links: [
          { label: { en: "Shipping", id: "Pengiriman" }, href: "/shipping" },
          { label: { en: "Returns", id: "Pengembalian" }, href: "/returns" },
          // "/track" is the tracking page (medusa-fulfillment-zone-rate); shown only with the plugin, at the
          // language's own address (dictionary footer.trackPath, e.g. /lacak in Indonesian)
          { label: { en: "Track order", id: "Lacak pesanan" }, href: "/track" },
          { label: { en: "Contact", id: "Kontak" }, href: "/contact" },
        ],
      },
      {
        title: { en: "Studio", id: "Studio" },
        links: [
          { label: { en: "About", id: "Tentang" }, href: "/about" },
          { label: { en: "Makers", id: "Pembuat" }, href: "/makers" },
          { label: { en: "Journal", id: "Jurnal" }, href: "/blog" },
          { label: { en: "Privacy", id: "Privasi" }, href: "/privacy" },
          { label: { en: "Terms", id: "Syarat" }, href: "/terms" },
        ],
      },
    ] as { title: Localized; links: { label: Localized; href: string }[] }[],
    /** "Theme Kiln by Haus Kayu" after the copyright line in the footer. Set to false to hide it. */
    credit: true,
  },

  /** Social profiles: icons in the footer and the phone menu. Leave a URL empty to hide that network. */
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    x: "https://x.com/",
    pinterest: "https://www.pinterest.com/",
    tiktok: "",
    youtube: "",
  },

  markets: {
    /** Market served without a URL prefix (routing "default-no-prefix") or the one `/` redirects to ("always-prefix") */
    default: "us",
    /** Market used for hreflang x-default */
    xDefault: "us",
    /**
     * "default-no-prefix": the default market lives at `/…` and `/us/…` redirects (308) to it; other markets keep
     * their prefix (`/id/…`). "always-prefix": every market has its prefix, like the official Medusa starter, and
     * `/…` redirects to `/us/…`.
     */
    routing: "default-no-prefix" as "default-no-prefix" | "always-prefix",
    list: {
      us: { countryCode: "us", locale: "en-US", htmlLang: "en", hreflang: "en-US", currency: "usd", dictionary: "en", label: "United States (USD)" },
      id: { countryCode: "id", locale: "id-ID", htmlLang: "id", hreflang: "id-ID", currency: "idr", dictionary: "id", label: "Indonesia (IDR)" },
    } satisfies Record<string, MarketConfig>,
    /**
     * A small dismissible pill on market `on` pointing visitors to market `to` ("Shopping from the US? → Go to
     * the US store"), with no geo-IP: everyone sees it once until closed. Wording: dictionary `marketBanner`.
     */
    suggest: null as null | { on: string; to: string },
  },

  /**
   * Your own wording on top of the dictionaries (src/lib/i18n/dictionaries.ts), per language, only the keys you
   * change: text: { en: { nav: { search: "Search the shop…" } }, id: { … } }. Keeps the dictionaries untouched,
   * so a theme update never conflicts with your copy.
   */
  text: {} as Partial<Record<"en" | "id", DeepPartial<Dictionary>>>,

  /**
   * Permanent redirects (308) for addresses from before this theme, matched on the path without the market
   * prefix and answered in the same market: { from: "/account/orders/details/:id", to: "/account/orders/:id" }.
   * `:name` matches one segment, `:rest*` the remainder.
   */
  redirects: [] as { from: string; to: string }[],

  /**
   * Photos. `route: true` serves product and article photos from this storefront at
   * /img/{products|blog}/{name}-{width}-{hash}.{avif|webp|jpg}: named after the product handle or article slug,
   * resized and encoded with sharp on the server, cached on disk (IMG_CACHE_DIR) and immutable at the edge; JSON-LD,
   * the sitemap and the share images use the same files. `false`: next/image on the backend's own URLs.
   * `segments`: the URL segment of each kind (products, blog), for shops that keep addresses from before Kiln.
   */
  images: { route: false as boolean, segments: { product: "products", blog: "blog" } },

  /** Colours: white page, ink text, neutral greys. Contrast on white: ink 19.6:1, muted 5.3:1, control 3.5:1. */
  colors: {
    background: "#ffffff",
    ink: "#0c0c0c",
    inkHover: "#2b2b2b",
    muted: "#6b6b6b",
    border: "#e5e5e5",
    control: "#8a8a8a",
    soft: "#f5f5f5",
    softHover: "#ebebeb",
  },

  /** Heart and "+" over a card photo: "light" = white icons with a soft dark shadow, "dark" = ink icons with a light one */
  cardIconColor: "light" as "light" | "dark",

  radius: {
    /** buttons, inputs, chips */
    control: "0.5rem",
    /** photos, cards, tiles, hero */
    media: "0.75rem",
    /** bottom sheets, drawers */
    sheet: "1rem",
  },

  /** Floating surfaces (header, mega menu, cart drawer, quick view, filter sheet, sticky add-to-cart) */
  frost: {
    /** white alpha behind the blur; text on it is ink only */
    alpha: 0.8,
    blur: "14px",
  },

  /**
   * Font: Inter variable (Latin, 400–700, optical sizes), self-hosted in src/styles/fonts-files. To use another
   * font edit src/styles/fonts.ts (next/font) and the metric fallbacks in src/styles/globals.css.
   */
  font: { family: "Inter" },

  /** Optional integrations: "auto" probes the backend once at start, "on" / "off" force it */
  features: {
    reviews: "auto" as "auto" | "on" | "off",
    wishlist: "auto" as "auto" | "on" | "off",
    blog: "auto" as "auto" | "on" | "off",
    search: "auto" as "auto" | "on" | "off",
    /** medusa-fulfillment-zone-rate: delivery estimates, the tracking page, shipments in the account */
    tracking: "auto" as "auto" | "on" | "off",
  },

  /**
   * Product listings (/store, categories, collections). Filters are computed from the products of the listing
   * (up to `scan` products per listing, fetched once and cached): no search engine needed. Every filter is a plain
   * URL query (?min=20&max=150&opt=Size:Large&attr=material:Oak&maker=studio-lio&rating=4&stock=1&sort=price_asc).
   */
  listing: {
    pageSize: 12,
    /** How many products of a listing are fetched to filter, sort and count; the Store API caps a request at 100 */
    scan: 100,
    filters: {
      price: true,
      /** Product options as filters: "auto" = every option title found, or a list of titles; [] turns them off */
      options: "auto" as "auto" | string[],
      /** product.metadata keys shown as filters (e.g. material, wood, colour), with their labels */
      attributes: [{ key: "material", label: { en: "Material", id: "Bahan" } }] as { key: string; label: Localized }[],
      /** The product's collection as a filter (makers, brands, lines); false hides it */
      collection: { en: "Maker", id: "Pembuat" } as Localized | false,
      /** "4 & up" (needs medusa-reviews-wishlist) */
      rating: 4 as number | false,
      stock: true,
    },
  },

  /** Product page: short promises under the add-to-cart button (shipping, returns, custom work); [] hides the list */
  product: {
    notes: [
      { en: "Free shipping over $120 · 30-day returns", id: "Gratis ongkir di atas Rp1.500.000 · retur 30 hari" },
      { en: "Custom sizes available on request", id: "Ukuran custom bisa dipesan" },
    ] as Localized[],
  },

  /**
   * Home hero: promo banners (Faire-style). Each slide has a desktop and a phone image (fixed ratios 12:5 and 4:5,
   * so nothing shifts while loading), a title, an optional subtitle and one call to action. `start` / `end`
   * (ISO dates, optional) schedule a slide. One slide renders as a static banner; several as a slider with dots,
   * swipe, arrow keys and optional autoplay (ms; false = off; never with prefers-reduced-motion). The components
   * read slides through src/lib/hero.ts, so a Medusa Admin source can replace this list without touching them.
   */
  hero: {
    autoplay: 6000 as number | false,
    slides: [
      {
        id: "new-season",
        title: { en: "Objects for the home, made in small batches", id: "Benda rumah yang dibuat dalam jumlah kecil" },
        subtitle: { en: "Tableware, textiles and lighting from independent makers.", id: "Peralatan makan, tekstil, dan pencahayaan dari pembuat independen." },
        cta: { en: "Shop now", id: "Belanja sekarang" },
        href: "/store",
        image: { desktop: "/hero/new-season-wide.jpg", mobile: "/hero/new-season-tall.jpg" },
        alt: { en: "Stoneware plates and a linen napkin on an oak table", id: "Piring stoneware dan serbet linen di meja kayu ek" },
      },
      {
        id: "makers",
        title: { en: "Meet the makers", id: "Kenali pembuatnya" },
        subtitle: { en: "Four workshops, one promise: every piece ships from the bench that made it.", id: "Empat bengkel, satu janji: setiap barang dikirim dari meja kerja pembuatnya." },
        cta: { en: "Meet the makers", id: "Lihat pembuat" },
        href: "/makers",
        image: { desktop: "/hero/makers-wide.jpg", mobile: "/hero/makers-tall.jpg" },
        alt: { en: "A turned oak lamp base on a workbench", id: "Kaki lampu kayu ek bubut di meja kerja" },
      },
      {
        id: "textiles",
        title: { en: "Linen and lambswool for the colder months", id: "Linen dan wol untuk bulan-bulan dingin" },
        subtitle: { en: "Throws and napkins woven in small runs.", id: "Selimut dan serbet yang ditenun dalam jumlah kecil." },
        cta: { en: "Shop textiles", id: "Belanja tekstil" },
        href: "/categories/textiles",
        image: { desktop: "/hero/textiles-wide.jpg", mobile: "/hero/textiles-tall.jpg" },
        alt: { en: "A folded wool throw", id: "Selimut wol terlipat" },
      },
    ] as HeroSlideConfig[],
  },

  /** Blog URL segment when medusa-blog-seo is installed */
  blogPath: "/blog",

  /** Pages that show the "ships worldwide" line etc. are plain config, not secrets */
  contact: { email: "hello@example.com", whatsapp: "" },
}

export type ThemeConfig = typeof config
export default config
