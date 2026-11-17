import "server-only"

import { sdk } from "@lib/config"
import { feature } from "@lib/features"
import { getMarket } from "@lib/util/market"
import { getCacheOptions } from "./cookies"

/**
 * Alt texts of product photos from medusa-image-alt (`features.imageAlt`, probed at start): one map per request,
 * image URL → text in the market's language, written in the Admin or the plugin's own fallback. Without the plugin
 * (or when it answers with an error) the map is empty and every component keeps its built-in text (product title,
 * "photo n of m"). Cached like the products themselves (tag "products"); the plugin's `revalidate` hook posts the
 * product handles to /api/revalidate, which re-renders the pages.
 */
export type AltMap = Record<string, string>

type Answer = { alts?: Record<string, { alt?: string | null }> }

export async function productAlts(countryCode: string, productIds: (string | null | undefined)[]): Promise<AltMap> {
  const ids = Array.from(new Set(productIds.filter((id): id is string => !!id)))
  if (!ids.length || !(await feature("imageAlt"))) return {}
  const locale = getMarket(countryCode).locale
  const next = { ...(await getCacheOptions("products")) }
  const out: AltMap = {}
  for (let i = 0; i < ids.length; i += 100) {
    const res = await sdk.client
      .fetch<Answer>("/store/image-alt", { method: "GET", query: { product_id: ids.slice(i, i + 100).join(","), locale }, next, cache: "force-cache" })
      .catch(() => null)
    for (const [url, a] of Object.entries(res?.alts ?? {})) if (a?.alt) out[url] = a.alt
  }
  return out
}

/** The text for one photo, else the component's own */
export const altFor = (alts: AltMap | undefined, url: string | null | undefined, fallback: string): string => (url && alts?.[url]) || fallback
