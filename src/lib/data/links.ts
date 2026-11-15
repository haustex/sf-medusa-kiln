import "server-only"

import { sdk } from "@lib/config"
import { getRegion } from "@lib/data/regions"
import { getMarket } from "@lib/util/market"
import config from "@theme"

/**
 * Link-in-bio pages from medusa-link-in-bio (/store/link-in-bio/…): one page = avatar, name, bio, social icons
 * and an ordered list of items (links, products with live price and stock, collections, promo codes, articles,
 * WhatsApp, …) in the market's language. The page's handle `linkInBio.handle` (theme.config.ts) is served at
 * /links, any other at /links/{handle}. Cached like the catalogue (force-cache) and tagged "links": the plugin's
 * `revalidate` option calls /api/revalidate on every change, and the pages re-render every 60 s on top.
 *
 * Clicks are counted by the backend: every item points at /l/{key} (src/app/l/[key]/route.ts relays the plugin's
 * 302), never at the destination itself, so no script runs on the page.
 */
export const LINKS_TAG = "links"
export const MAIN_HANDLE = (config as { linkInBio?: { handle?: string } }).linkInBio?.handle?.toLowerCase() || "links"
const BASE = "/store/link-in-bio"
const HANDLE_RE = /^[a-z0-9][a-z0-9-]{0,62}$/

export const isLinksHandle = (h: string): boolean => HANDLE_RE.test(h)
/** Public path of a page in a market-independent form (`/links` for the main handle) */
export const linksPath = (handle: string) => (handle === MAIN_HANDLE ? "/links" : `/links/${handle}`)

export type LinksSocial = { network: string; url: string }
export type LinksTheme = { background: string; text: string; accent: string; radius: "none" | "sm" | "md" | "full"; button: "solid" | "outline" | "soft" }
/** Focal point of an image in percent of width and height */
export type LinksFocus = { x: number; y: number }
export type LinksProduct = { id: string; handle: string; title: string; thumbnail: string | null; price: { amount: number; currency_code: string; original_amount: number | null } | null; in_stock: boolean; stock: number | null }
export type LinksEntity = { id: string; handle: string; title: string; thumbnail: string | null }
export type LinksPost = { id: string; slug: string; title: string; excerpt: string; cover: string | null; published_at: string | null }
export type LinksItem = {
  id: string
  key: string
  type: "link" | "product" | "collection" | "category" | "promo" | "post" | "whatsapp" | "contact" | "header" | "divider"
  label: string
  note: string | null
  image: string | null
  icon: string | null
  style: "normal" | "featured"
  /** The plugin's counted link; Kiln builds its own (/l/{key}?l=…) and only checks this is not null */
  href: string | null
  /** Where the click ends up (for the host shown under external links) */
  url: string | null
  product?: LinksProduct
  collection?: LinksEntity
  category?: LinksEntity
  post?: LinksPost
  promo?: { code: string }
  whatsapp?: { phone: string }
  contact?: { kind: "tel" | "mailto"; value: string }
}
export type LinksPage = {
  id: string
  handle: string
  locale: string
  default_locale: string
  locales: string[]
  title: string
  bio: string | null
  seo_title: string
  seo_description: string | null
  avatar: string | null
  avatar_alt: string | null
  /** "circle": round avatar above the name. "hero": `hero` full width at the top, fading into the background */
  profile_style: "circle" | "hero"
  hero: string | null
  hero_alt: string | null
  /** Space reserved for the hero before it loads (no layout shift) */
  hero_ratio: "16:9" | "3:2"
  focus: { avatar: LinksFocus | null; hero: LinksFocus | null }
  og_image: string | null
  noindex: boolean
  socials: LinksSocial[]
  theme: LinksTheme
  urls: Record<string, string>
  items: LinksItem[]
  updated_at: string
}
export type LinksIndexRow = { id: string; handle: string; locales: string[]; noindex: boolean; updated_at: string }

const isNotFound = (e: unknown) => (e as { status?: number })?.status === 404

/** The published page in the market's language, prices for the market's region; null when there is none */
export async function getLinksPage(countryCode: string, handle: string): Promise<LinksPage | null> {
  if (!isLinksHandle(handle)) return null
  const region = await getRegion(countryCode).catch(() => null)
  const locale = getMarket(countryCode).htmlLang
  try {
    const { page } = await sdk.client.fetch<{ page: LinksPage }>(`${BASE}/pages/${handle}`, {
      query: { locale, ...(region?.id ? { region_id: region.id } : {}) },
      cache: "force-cache",
      next: { tags: [LINKS_TAG, `links-${handle}`] },
    })
    return page
  } catch (e) {
    if (isNotFound(e)) return null
    throw e
  }
}

/** Every published page (sitemap); [] when the plugin is missing or the backend fails */
export async function listLinksPages(): Promise<LinksIndexRow[]> {
  try {
    const { pages } = await sdk.client.fetch<{ pages: LinksIndexRow[] }>(`${BASE}/pages`, { cache: "force-cache", next: { tags: [LINKS_TAG] } })
    return pages
  } catch {
    return []
  }
}

/** The counted link of an item in a market's language: Kiln's own /l route relays the plugin's redirect */
export const itemHref = (item: LinksItem, countryCode: string) => `/l/${item.key}?l=${encodeURIComponent(getMarket(countryCode).htmlLang)}`
