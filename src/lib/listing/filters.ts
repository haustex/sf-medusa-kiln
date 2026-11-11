import type { HttpTypes } from "@medusajs/types"

import config from "@theme"
import { fill, type Dictionary } from "@lib/i18n/dictionaries"
import { tx } from "@lib/i18n/localized"
import { isVariantInStock } from "@lib/util/inventory"
import { cheapestPrice } from "@lib/util/product-card"
import type { SortOptions } from "@modules/store/components/refinement-list/sort-products"

/**
 * Listing filters without a search engine: the listing fetches up to `config.listing.scan` products once (cached by
 * Next), and this module parses the URL query, applies it in memory, counts the facets and builds the links.
 *
 * Query keys (all optional, all repeatable where it makes sense):
 *   sort=created_at|price_asc|price_desc   page=2
 *   min=20  max=150                         cheapest variant price in the market currency
 *   opt=Size:Large                          product option value (any of the values of one option, all options)
 *   attr=material:Solid oak                 product.metadata key (same logic)
 *   maker=studio-lio                        collection handle
 *   rating=4                                average review rating ≥ n (medusa-reviews-wishlist)
 *   stock=1                                 at least one variant in stock
 */

export const SORTS: SortOptions[] = ["created_at", "price_asc", "price_desc"]
const DEFAULT_SORT: SortOptions = "created_at"

export type ListingQuery = {
  sort: SortOptions
  page: number
  min?: number
  max?: number
  /** option title → selected values */
  opt: Record<string, string[]>
  /** metadata key → selected values */
  attr: Record<string, string[]>
  maker: string[]
  rating?: number
  stock: boolean
}

type SearchParams = Record<string, string | string[] | undefined>
const all = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean)
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const num = (v: string | undefined) => {
  if (v === undefined || v === "") return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}
const pairs = (values: string[]) => {
  const out: Record<string, string[]> = {}
  for (const raw of values) {
    const i = raw.indexOf(":")
    if (i <= 0) continue
    const key = raw.slice(0, i)
    const value = raw.slice(i + 1)
    if (!value) continue
    ;(out[key] ??= []).push(value)
  }
  return out
}

export function parseListingQuery(sp: SearchParams): ListingQuery {
  const sort = one(sp.sort)
  const page = parseInt(one(sp.page) ?? "1", 10)
  const rating = num(one(sp.rating))
  return {
    sort: SORTS.includes(sort as SortOptions) ? (sort as SortOptions) : DEFAULT_SORT,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    opt: pairs(all(sp.opt)),
    attr: pairs(all(sp.attr)),
    maker: Array.from(new Set(all(sp.maker))),
    rating: rating && rating > 0 && rating <= 5 ? rating : undefined,
    stock: one(sp.stock) === "1",
  }
}

/** Number of active filters (not counting sort and page) */
export function activeFilterCount(q: ListingQuery) {
  return (
    (q.min !== undefined || q.max !== undefined ? 1 : 0) +
    Object.values(q.opt).reduce((n, v) => n + v.length, 0) +
    Object.values(q.attr).reduce((n, v) => n + v.length, 0) +
    q.maker.length +
    (q.rating ? 1 : 0) +
    (q.stock ? 1 : 0)
  )
}

/** The query string ("?…" or "") for a listing state; `page` is dropped when it is 1 */
export function listingSearch(q: ListingQuery): string {
  const p = new URLSearchParams()
  if (q.sort !== DEFAULT_SORT) p.set("sort", q.sort)
  if (q.min !== undefined) p.set("min", String(q.min))
  if (q.max !== undefined) p.set("max", String(q.max))
  for (const [k, vs] of Object.entries(q.opt)) for (const v of vs) p.append("opt", `${k}:${v}`)
  for (const [k, vs] of Object.entries(q.attr)) for (const v of vs) p.append("attr", `${k}:${v}`)
  for (const m of q.maker) p.append("maker", m)
  if (q.rating) p.set("rating", String(q.rating))
  if (q.stock) p.set("stock", "1")
  if (q.page > 1) p.set("page", String(q.page))
  const s = p.toString()
  return s ? `?${s}` : ""
}

/** A query without any filter (sort kept) */
export const clearedQuery = (q: ListingQuery): ListingQuery => ({ sort: q.sort, page: 1, opt: {}, attr: {}, maker: [], stock: false })

type Product = HttpTypes.StoreProduct
export type Ratings = Map<string, { average: number; count: number }>

const meta = (p: Product, key: string) => {
  const v = p.metadata?.[key]
  return typeof v === "string" && v.trim() ? v.trim() : undefined
}
const optionValues = (p: Product, title: string) => {
  const set = new Set<string>()
  for (const v of p.variants ?? []) for (const o of v.options ?? []) if (o.option?.title === title && o.value) set.add(o.value)
  if (!set.size) for (const o of p.options ?? []) if (o.title === title) for (const v of o.values ?? []) if (v.value) set.add(v.value)
  return set
}
const inStock = (p: Product) => (p.variants ?? []).some((v) => isVariantInStock(v))

type Group = "price" | "maker" | "rating" | "stock" | `opt:${string}` | `attr:${string}`

/** Products matching every filter of `q` except the group `omit` (used for facet counts) */
export function applyFilters(products: Product[], q: ListingQuery, ratings: Ratings, omit?: Group): Product[] {
  return products.filter((p) => {
    if (omit !== "price" && (q.min !== undefined || q.max !== undefined)) {
      const price = cheapestPrice(p)?.amount
      if (price === undefined) return false
      if (q.min !== undefined && price < q.min) return false
      if (q.max !== undefined && price > q.max) return false
    }
    for (const [title, wanted] of Object.entries(q.opt)) {
      if (omit === `opt:${title}` || !wanted.length) continue
      const have = optionValues(p, title)
      if (!wanted.some((w) => have.has(w))) return false
    }
    for (const [key, wanted] of Object.entries(q.attr)) {
      if (omit === `attr:${key}` || !wanted.length) continue
      const have = meta(p, key)
      if (!have || !wanted.includes(have)) return false
    }
    if (omit !== "maker" && q.maker.length && !(p.collection?.handle && q.maker.includes(p.collection.handle))) return false
    if (omit !== "rating" && q.rating && (ratings.get(p.id)?.average ?? 0) < q.rating) return false
    if (omit !== "stock" && q.stock && !inStock(p)) return false
    return true
  })
}

export function sortListing(products: Product[], sort: SortOptions): Product[] {
  const list = [...products]
  if (sort === "price_asc" || sort === "price_desc") {
    const price = (p: Product) => cheapestPrice(p)?.amount ?? Number.POSITIVE_INFINITY
    list.sort((a, b) => (sort === "price_asc" ? price(a) - price(b) : price(b) - price(a)))
  } else {
    list.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
  }
  return list
}

export type FacetValue = { value: string; label: string; count: number; active: boolean }
export type Facet =
  | { group: `opt:${string}` | `attr:${string}` | "maker"; name: "opt" | "attr" | "maker"; key: string; label: string; values: FacetValue[] }
  | { group: "rating"; name: "rating"; label: string; threshold: number; count: number; active: boolean }
  | { group: "stock"; name: "stock"; label: string; count: number; active: boolean }

/**
 * Facets of a listing: for every value, how many products would match if it were (also) selected, counted against
 * the other groups' filters. Values that never occur in the listing are not listed at all.
 */
export function buildFacets(products: Product[], q: ListingQuery, ratings: Ratings, lang: string, t: Dictionary["listing"]): Facet[] {
  const f = config.listing.filters
  const facets: Facet[] = []
  const count = (group: Group, has: (p: Product) => boolean) => applyFilters(products, q, ratings, group).filter(has).length

  // product options (Size, Colour, …)
  const titles = new Map<string, Set<string>>()
  for (const p of products) for (const o of p.options ?? []) if (o.title && o.title !== "Default") titles.set(o.title, new Set([...Array.from(titles.get(o.title) ?? []), ...Array.from(optionValues(p, o.title))]))
  const wantedTitles = f.options === "auto" ? Array.from(titles.keys()) : f.options.filter((x) => titles.has(x))
  for (const title of wantedTitles) {
    const values = Array.from(titles.get(title) ?? []).sort(naturalCompare).map((value) => ({
      value: `${title}:${value}`,
      label: value,
      count: count(`opt:${title}`, (p) => optionValues(p, title).has(value)),
      active: !!q.opt[title]?.includes(value),
    }))
    if (values.length > 1 || values.some((v) => v.active)) facets.push({ group: `opt:${title}`, name: "opt", key: title, label: title, values })
  }

  // metadata attributes from theme.config.ts
  for (const a of f.attributes) {
    const seen = new Set<string>()
    for (const p of products) {
      const v = meta(p, a.key)
      if (v) seen.add(v)
    }
    const values = Array.from(seen).sort(naturalCompare).map((value) => ({
      value: `${a.key}:${value}`,
      label: value,
      count: count(`attr:${a.key}`, (p) => meta(p, a.key) === value),
      active: !!q.attr[a.key]?.includes(value),
    }))
    if (values.length > 1 || values.some((v) => v.active)) facets.push({ group: `attr:${a.key}`, name: "attr", key: a.key, label: tx(a.label, lang), values })
  }

  // collection (maker / brand / line)
  if (f.collection) {
    const seen = new Map<string, string>()
    for (const p of products) if (p.collection?.handle) seen.set(p.collection.handle, p.collection.title)
    const values = Array.from(seen).sort((a, b) => naturalCompare(a[1], b[1])).map(([handle, title]) => ({
      value: handle,
      label: title,
      count: count("maker", (p) => p.collection?.handle === handle),
      active: q.maker.includes(handle),
    }))
    if (values.length > 1 || values.some((v) => v.active)) facets.push({ group: "maker", name: "maker", key: "maker", label: tx(f.collection, lang), values })
  }

  if (f.rating && ratings.size) {
    const threshold = f.rating
    const n = count("rating", (p) => (ratings.get(p.id)?.average ?? 0) >= threshold)
    if (n || q.rating) facets.push({ group: "rating", name: "rating", label: t.rating, threshold, count: n, active: !!q.rating })
  }

  if (f.stock) {
    const n = count("stock", inStock)
    if (n < products.length || q.stock) facets.push({ group: "stock", name: "stock", label: t.availability, count: n, active: q.stock })
  }

  return facets
}

/** Chips of the active filters, each with the query that removes it */
export function activeChips(q: ListingQuery, facets: Facet[], t: Dictionary["listing"], formatPrice: (n: number) => string): { label: string; query: ListingQuery }[] {
  const chips: { label: string; query: ListingQuery }[] = []
  if (q.min !== undefined || q.max !== undefined) {
    const label = q.min !== undefined && q.max !== undefined ? `${formatPrice(q.min)} – ${formatPrice(q.max)}` : q.min !== undefined ? `≥ ${formatPrice(q.min)}` : `≤ ${formatPrice(q.max!)}`
    chips.push({ label, query: { ...q, page: 1, min: undefined, max: undefined } })
  }
  for (const facet of facets) {
    if (facet.name === "opt" || facet.name === "attr") {
      const selected = (facet.name === "opt" ? q.opt : q.attr)[facet.key] ?? []
      for (const v of selected) {
        const rest = { ...(facet.name === "opt" ? q.opt : q.attr) }
        rest[facet.key] = selected.filter((x) => x !== v)
        if (!rest[facet.key].length) delete rest[facet.key]
        chips.push({ label: v, query: { ...q, page: 1, [facet.name]: rest } })
      }
    } else if (facet.name === "maker") {
      for (const handle of q.maker) {
        const label = facet.values.find((v) => v.value === handle)?.label ?? handle
        chips.push({ label, query: { ...q, page: 1, maker: q.maker.filter((m) => m !== handle) } })
      }
    } else if (facet.name === "rating" && q.rating) {
      chips.push({ label: `${facet.label}: ${fill(t.ratingUp, { n: q.rating })}`, query: { ...q, page: 1, rating: undefined } })
    } else if (facet.name === "stock" && q.stock) {
      chips.push({ label: t.inStock, query: { ...q, page: 1, stock: false } })
    }
  }
  return chips
}

/** "22 cm" < "27 cm" < "Large"; numbers inside strings compare as numbers */
export function naturalCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
}
