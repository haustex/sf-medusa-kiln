import { marketAlternates, marketPath } from "@lib/util/market"
import { sdk } from "@lib/config"
import { categoryPath, listPostIndex, postPath } from "@lib/data/blog"
import { listRegions } from "@lib/data/regions"
import { getSiteOrigin, listCountryCodes } from "@lib/util/site"
import { SITE_LIVE } from "@lib/util/site-live"
import type { MetadataRoute } from "next"
import { isHiddenProduct } from "@lib/util/hidden-products"
import { productImageName } from "@lib/util/image-name"
import { imageJpeg, imageRef } from "@lib/util/image-url"

const STATIC_PATHS = [
  "",
  "/store",
  "/shipping",
  "/returns",
  "/terms",
  "/privacy",
  "/contact",
]
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
    listPostIndex().catch(() => []),
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
  const postImages = (p: (typeof posts)[number]) =>
    (p.images ?? []).flatMap((i) => {
      const ref = imageRef("blog", i.name, i.src)
      return ref ? [imageJpeg(origin, ref)] : []
    })

  // Blog listing + category pages carry the date of their newest article
  const newest = (rows: typeof posts) => (rows.length ? new Date(rows.reduce((max, p) => (p.updated_at > max ? p.updated_at : max), rows[0].updated_at)) : undefined)
  const blogCategories = Array.from(new Set(posts.flatMap((p) => (p.category ? [p.category.slug] : []))))
  const blog = posts.length
    ? [
        ...entry("/blog", newest(posts)),
        ...blogCategories.flatMap((slug) => entry(categoryPath(slug), newest(posts.filter((p) => p.category?.slug === slug)))),
        ...posts.flatMap((p) => entry(postPath(p.slug), new Date(p.updated_at), postImages(p))),
      ]
    : []

  return [
    ...STATIC_PATHS.flatMap((path) => entry(path)),
    ...toEntries("products", products, productImages),
    ...toEntries("categories", categories),
    ...toEntries("collections", collections),
    ...blog,
  ]
}
