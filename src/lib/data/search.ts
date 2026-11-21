"use server"

import { HttpTypes } from "@medusajs/types"
import { headers } from "next/headers"

import config from "@theme"

import { sdk } from "@lib/config"
import { feature } from "@lib/features"
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
    if (!(await feature("search"))) throw new Error("Meilisearch route not installed (feature off)")
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

export type SearchRewrite = { terms: string[]; corrected: string | null; no_match: boolean }

const BACKEND = (process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")

/**
 * Smart search (theme.config.ts `searchRewrite`): asks the backend endpoint for catalog keywords for a query. The
 * visitor's address goes along (Cloudflare header, as the AI chat proxy does) so the endpoint can rate-limit per
 * visitor. null when the feature is off, the answer is late or anything fails: the caller keeps the keyword results.
 */
export const rewriteSearch = async ({ countryCode, query }: { countryCode: string; query: string }): Promise<SearchRewrite | null> => {
  const q = query.trim()
  if (!q || !(await feature("searchRewrite"))) return null
  const h = await headers()
  const ip = h.get("cf-connecting-ip") || h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0].trim() || ""
  const params = new URLSearchParams({ q: q.slice(0, 80), lang: getMarket(countryCode).dictionary })
  try {
    const res = await fetch(`${BACKEND}${config.searchRewrite.path}?${params}`, {
      headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "", ...(ip ? { "cf-connecting-ip": ip } : {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(config.searchRewrite.timeoutMs),
    })
    if (!res.ok) return null
    const body = (await res.json()) as Partial<SearchRewrite>
    const terms = Array.isArray(body.terms) ? body.terms.filter((t): t is string => typeof t === "string" && !!t.trim()).slice(0, 6) : []
    return { terms, corrected: typeof body.corrected === "string" ? body.corrected : null, no_match: body.no_match === true }
  } catch {
    return null
  }
}

/**
 * The products of a rewrite: every keyword searched like the query itself (in parallel), merged in keyword order
 * without the products already shown (`exclude`) or repeated, at most `limit`. `terms` = the keywords that added
 * at least one product (for the "Showing results for" line).
 */
export const searchRewriteProducts = async ({ countryCode, terms, exclude, limit, fields }: { countryCode: string; terms: string[]; exclude: Set<string>; limit: number; fields: string }) => {
  const results = await Promise.all(terms.map((term) => searchProducts({ countryCode, query: term, limit, fields }).catch(() => null)))
  const seen = new Set(exclude)
  const products: HttpTypes.StoreProduct[] = []
  const used: string[] = []
  results.forEach((r, i) => {
    for (const p of r?.response.products ?? []) {
      if (products.length >= limit) return
      if (seen.has(p.id)) continue
      seen.add(p.id)
      products.push(p)
      if (used.at(-1) !== terms[i]) used.push(terms[i])
    }
  })
  return { products, terms: used }
}
