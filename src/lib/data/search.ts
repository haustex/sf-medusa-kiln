"use server"

import { HttpTypes } from "@medusajs/types"

import { sdk } from "@lib/config"
import { withoutHidden } from "@lib/util/hidden-products"
import { getMarket } from "@lib/util/market"
import { getAuthHeaders } from "./cookies"
import { listProducts } from "./products"
import { getRegion } from "./regions"

type SearchResult = {
  response: { products: HttpTypes.StoreProduct[]; count: number }
  /** Which engine answered: Meilisearch, or Medusa's own `/store/products?q=` */
  engine: "meilisearch" | "native"
}

type Options = {
  countryCode: string
  query: string
  limit: number
  offset?: number
  fields: string
}

/**
 * Store search (docs/keputusan.md "Meilisearch"): the Medusa route `/store/meilisearch/products` searches
 * Meilisearch (typos, ID↔EN synonyms, per-market index via `locale`) and hydrates the hits from Medusa itself, so
 * the prices (`region_id` → IDR/USD) and stock are live and the browser never talks to Meilisearch. Runs on the
 * Next server, uncached (`/search` is dynamic and sends `private, no-store`). If Meilisearch or the route fails
 * for any reason, the visitor gets Medusa's native search instead and only the server log notices.
 */
export const searchProducts = async ({
  countryCode,
  query,
  limit,
  offset = 0,
  fields,
}: Options): Promise<SearchResult> => {
  const q = query.trim()
  if (!q) return { response: { products: [], count: 0 }, engine: "meilisearch" }

  const region = await getRegion(countryCode)
  if (!region) return { response: { products: [], count: 0 }, engine: "meilisearch" }

  try {
    const res = await sdk.client.fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      "/store/meilisearch/products",
      {
        method: "GET",
        query: {
          query: q,
          limit,
          offset,
          region_id: region.id,
          locale: getMarket(region.countries?.[0]?.iso_2).locale,
          fields,
        },
        headers: { ...(await getAuthHeaders()) },
        cache: "no-store",
      }
    )
    const { products, count } = withoutHidden(res.products ?? [], res.count ?? 0)
    return { response: { products, count }, engine: "meilisearch" }
  } catch (err) {
    console.warn(
      `[search] Meilisearch unavailable, native search used (q="${q.slice(0, 40)}"):`,
      err instanceof Error ? err.message : err
    )
    const { response } = await listProducts({
      countryCode,
      pageParam: offset ? Math.floor(offset / limit) + 1 : 1,
      queryParams: { q, limit, fields },
    })
    return { response, engine: "native" }
  }
}
