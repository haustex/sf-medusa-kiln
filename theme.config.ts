/**
 * Kiln theme configuration: everything a shop changes to make the storefront its own.
 * Colours, radii and fonts become CSS variables on <html> (see src/app/[countryCode]/layout.tsx);
 * markets drive routing (src/lib/util/market.ts, src/proxy.ts); the rest is read by the components that need it.
 * Keep this file free of secrets: it is imported by client components too.
 */
/** One string for every language, or one per dictionary code: { en: "Help", id: "Bantuan" } */
export type Localized = string | Record<string, string>

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
          { label: { en: "Track an order", id: "Lacak pesanan" }, href: "/track" },
          { label: { en: "Returns", id: "Pengembalian" }, href: "/returns" },
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
  },

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

  /** Blog URL segment when medusa-blog-seo is installed */
  blogPath: "/blog",

  /** Pages that show the "ships worldwide" line etc. are plain config, not secrets */
  contact: { email: "hello@example.com", whatsapp: "" },
}

export type ThemeConfig = typeof config
export default config
