import { MARKET_CODES, MARKETS, marketAlternates, marketPath, X_DEFAULT_MARKET } from "@lib/util/market"
import { sdk } from "@lib/config"
import { type BlogIndexRow, categoryPath, indexLocale, listPostIndex, postPath } from "@lib/data/blog"
import { feature } from "@lib/features"
import { listRegions } from "@lib/data/regions"
import { getSiteOrigin, listCountryCodes } from "@lib/util/site"
import { SITE_LIVE } from "@lib/util/site-live"
import type { MetadataRoute } from "next"
import { isHiddenProduct } from "@lib/util/hidden-products"
import { productImageName, blogImageNames } from "@lib/util/image-name"
import { imageJpeg, imageRef } from "@lib/util/image-url"

const STATIC_PATHS = ["", "/store", "/makers", "/shipping", "/returns", "/terms", "/privacy", "/contact", "/about"]
const PAGE_SIZE = 200

type Page<T> = { items: T[]; count: number }

async function listAll<T>(fetchPage: (offset: number) => Promise<Page<T>>) {
  const all: T[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { items, count } = await fetchPage(offset)
    all.push(...items)
    if (offset + PAGE_SIZE >= count || !items.length) {
      return all
    }
  }
}

type Entry = {
  handle?: string | null
  updated_at?: string | Date | null
  thumbnail?: string | null
  images?: { url: string; rank?: number | null }[] | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!SITE_LIVE) {
    return []
  }

  const query = { fields: "handle,updated_at", limit: PAGE_SIZE }
  // Products also list their photos (image sitemap)
  const productQuery = { ...query, fields: "handle,updated_at,thumbnail,*images" }

  const [origin, regions, products, categories, collections, posts] = await Promise.all([
    getSiteOrigin(),
    listRegions(),
    listAll<Entry>((offset) =>
      sdk.store.product
        .list({ ...productQuery, offset })
        .then((res) => ({ items: res.products.filter((p) => !isHiddenProduct(p)), count: res.count }))
    ),
    listAll<Entry>((offset) =>
      sdk.store.category
        .list({ ...query, offset })
        .then((res) => ({ items: res.product_categories, count: res.count }))
    ),
    listAll<Entry>((offset) =>
      sdk.store.collection
        .list({ ...query, offset })
        .then((res) => ({ items: res.collections, count: res.count }))
    ),
    // Blog: public articles (same slug in both markets); a failing blog API must not empty the sitemap
    feature("blog").then((on) => (on ? listPostIndex() : [])).catch(() => []),
  ])

  // One entry per market URL, each listing all language versions (hreflang)
  const markets = listCountryCodes(regions)
  const entry = (path: string, lastModified?: Date, images?: string[]) =>
    markets.map((countryCode) => ({
      url: `${origin}${path ? marketPath(countryCode, path) : marketPath(countryCode).replace(/^\/$/, "")}`,
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: marketAlternates(origin, path) },
      ...(images?.length ? { images } : {}),
    }))
  // Clean JPEG URLs of our photos (/img/produk/{handle}-{n}-1280-{hash}.jpg); others are left out
  const productImages = (p: Entry) => {
    const urls = [...(p.images ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)).map((i) => i.url)
    if (!urls.length && p.thumbnail) urls.push(p.thumbnail)
    return urls.flatMap((u) => {
      const ref = imageRef("produk", productImageName(p, u), u)
      return ref ? [imageJpeg(origin, ref)] : []
    })
  }
  const toEntries = (prefix: string, items: Entry[], images?: (item: Entry) => string[]) =>
    items
      .filter((item) => item.handle)
      .flatMap((item) => entry(`/${prefix}/${item.handle}`, item.updated_at ? new Date(item.updated_at) : undefined, images?.(item)))
  const postImages = (p: BlogIndexRow, slug: string) =>
    blogImageNames(slug, p).flatMap(({ name, src }) => {
      const ref = imageRef("blog", name, src)
      return ref ? [imageJpeg(origin, ref)] : []
    })

  // Articles and their categories have a slug per language: one entry per market, each listing every language's URL
  const localized = (pathFor: (countryCode: string) => string | null, lastModified?: Date, images?: (countryCode: string) => string[]) => {
    const languages: Record<string, string> = {}
    for (const code of MARKET_CODES) {
      const path = pathFor(code)
      if (path) languages[MARKETS[code].hreflang] = `${origin}${marketPath(code, path)}`
    }
    const xDefault = pathFor(X_DEFAULT_MARKET)
    if (xDefault) languages["x-default"] = `${origin}${marketPath(X_DEFAULT_MARKET, xDefault)}`
    return markets.flatMap((countryCode) => {
      const path = pathFor(countryCode)
      if (!path) return []
      const imgs = images?.(countryCode)
      return [{ url: `${origin}${marketPath(countryCode, path)}`, ...(lastModified ? { lastModified } : {}), alternates: { languages }, ...(imgs?.length ? { images: imgs } : {}) }]
    })
  }

  // Blog listing + category pages carry the date of their newest article
  const newest = (rows: BlogIndexRow[]) => (rows.length ? new Date(rows.reduce((max, p) => (p.updated_at > max ? p.updated_at : max), rows[0].updated_at)) : undefined)
  // Categories grouped by the slug of the first language (the index has no category id)
  const byCategory = new Map<string, BlogIndexRow[]>()
  for (const p of posts) {
    const key = Object.values(p.locales)[0]?.category_slug
    if (key) byCategory.set(key, [...(byCategory.get(key) ?? []), p])
  }
  const blog = posts.length
    ? [
        ...entry("/blog", newest(posts)),
        ...Array.from(byCategory.values()).flatMap((group) =>
          localized((cc) => {
            const slug = indexLocale(group[0], cc)?.category_slug
            return slug ? categoryPath(slug) : null
          }, newest(group))
        ),
        ...posts.flatMap((p) =>
          localized(
            (cc) => {
              const slug = indexLocale(p, cc)?.slug
              return slug ? postPath(slug) : null
            },
            new Date(p.updated_at),
            (cc) => postImages(p, indexLocale(p, cc)?.slug ?? "")
          )
        ),
      ]
    : []

  return [
    ...STATIC_PATHS.flatMap((path) => entry(path)),
    ...toEntries("products", products, productImages),
    ...toEntries("categories", categories),
    ...toEntries("collections", collections),
    ...toEntries("makers", collections),
    ...blog,
  ]
}
