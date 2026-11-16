import config from "@theme"
import { marketAlternates, type MarketPaths, marketUrl } from "@lib/util/market"
import { sdk } from "@lib/config"
import { type BlogIndexRow, blogLang, blogMarketPaths, categoryPath, listPostIndex, postPath } from "@lib/data/blog"
import { listPageSlugs } from "@lib/content/pages"
import { linksPath, listLinksPages } from "@lib/data/links"
import { feature } from "@lib/features"
import { listRegions } from "@lib/data/regions"
import { getSiteOrigin, listCountryCodes } from "@lib/util/site"
import { SITE_LIVE } from "@lib/util/site-live"
import type { MetadataRoute } from "next"
import { isHiddenProduct } from "@lib/util/hidden-products"
import { productImageName, blogImageNames } from "@lib/util/image-name"
import { imageJpeg, imageRef } from "@lib/util/image-url"

const STATIC_PATHS = ["", "/store", "/makers"]
/** Routes of the shop's own layer (theme.config.ts `sitemap.paths`) */
const EXTRA_PATHS: { path: string; markets?: string[] }[] = (config as { sitemap?: { paths?: { path: string; markets?: string[] }[] } }).sitemap?.paths ?? []
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

  const [origin, regions, pages, products, categories, collections, posts, linkPages] = await Promise.all([
    getSiteOrigin(),
    listRegions(),
    listPageSlugs(),
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
    // Link-in-bio pages (medusa-link-in-bio), without the ones marked noindex
    feature("links").then((on) => (on ? listLinksPages() : [])).catch(() => []),
  ])

  // One entry per market URL that exists, each listing every language version (hreflang, the same set as the
  // page's <head>: lib/util/market.ts marketAlternates)
  const markets = listCountryCodes(regions)
  const localized = (paths: MarketPaths, lastModified?: Date, images?: (countryCode: string) => string[] | undefined) => {
    const pathOf = (code: string) => (typeof paths === "string" ? paths : (paths[code] ?? null))
    const languages = marketAlternates(origin, paths)
    return markets.flatMap((countryCode) => {
      const path = pathOf(countryCode)
      if (path === null) return []
      const imgs = images?.(countryCode)
      return [{ url: marketUrl(origin, countryCode, path), ...(lastModified ? { lastModified } : {}), alternates: { languages }, ...(imgs?.length ? { images: imgs } : {}) }]
    })
  }
  const entry = (path: string, lastModified?: Date, images?: string[]) => localized(path, lastModified, () => images)
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

  // Articles and their categories have a slug per language (`locales` of the index row): a market whose language
  // has no readable version is left out, like the page's hreflang
  const slugs = (p: BlogIndexRow) => Object.fromEntries(Object.entries(p.locales).map(([lang, l]) => [lang, l.slug]))
  const categorySlugs = (p: BlogIndexRow) => Object.fromEntries(Object.entries(p.locales).flatMap(([lang, l]) => (l.category_slug ? [[lang, l.category_slug]] : [])))
  const hasPosts = (countryCode: string) => posts.some((p) => p.locales[blogLang(countryCode)])
  const listingPaths = Object.fromEntries(markets.map((countryCode) => [countryCode, hasPosts(countryCode) ? "/blog" : null]))

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
        ...localized(listingPaths, newest(posts)),
        ...Array.from(byCategory.values()).flatMap((group) => localized(blogMarketPaths(categorySlugs(group[0]), categoryPath), newest(group))),
        ...posts.flatMap((p) => localized(blogMarketPaths(slugs(p), postPath), new Date(p.updated_at), (cc) => postImages(p, p.locales[blogLang(cc)]?.slug ?? ""))),
      ]
    : []
  // Routes of the shop's own layer, some in one market only
  const extra = EXTRA_PATHS.flatMap(({ path, markets: only }) => localized(only ? Object.fromEntries(only.map((code) => [code.toLowerCase(), path])) : path))

  return [
    ...STATIC_PATHS.flatMap((path) => entry(path)),
    ...pages.flatMap((slug) => entry(`/${slug}`)),
    ...extra,
    ...linkPages.filter((p) => !p.noindex).flatMap((p) => entry(linksPath(p.handle), new Date(p.updated_at))),
    ...toEntries("products", products, productImages),
    ...toEntries("categories", categories),
    ...toEntries("collections", collections),
    ...toEntries("makers", collections),
    ...blog,
  ]
}
