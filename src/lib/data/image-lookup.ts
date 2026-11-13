import "server-only"

import { sdk } from "@lib/config"
import { listPostIndex, type BlogIndexRow } from "@lib/data/blog"
import { feature } from "@lib/features"
import { blogImageNames, cleanSlug, imageHash, type ImageKind } from "@lib/util/image-name"
import { staticFile } from "@lib/util/image-url"

/**
 * The index behind the clean image URLs (/img, /og): which file a {kind, name, hash} stands for, and the clean name
 * of a file from an old URL (301s). Built from the store API alone — every published product (handle, thumbnail,
 * images) and, with medusa-blog-seo, the blog index — so it needs nothing on the backend. Rebuilt at most every 30 s,
 * and on a miss when it is older than 3 s, so a photo uploaded a moment ago is found. Draft products and
 * unpublished articles are not in it (the article preview shows its photos through next/image instead).
 */
/** `src`: the file's URL as stored in the database (…/static/<file> or <media host>/<file>) */
export type ImageEntry = { kind: ImageKind; slug: string; name: string; file: string; src: string }

const BACKEND = process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const MEDIA = (process.env.NEXT_PUBLIC_MEDIA_URL || "").replace(/\/+$/, "")

/**
 * Where the server fetches the original photo for /img and /og: files still in the backend's /static over the
 * internal backend URL, files in a bucket from the media host. Only those two origins, never an arbitrary `src`.
 */
export function sourceUrl(entry: Pick<ImageEntry, "file" | "src">): string {
  const file = entry.file.split("/").map(encodeURIComponent).join("/")
  if (MEDIA && entry.src && entry.src.startsWith(`${MEDIA}/`)) return `${MEDIA}/${file}`
  return `${BACKEND}/static/${file}`
}

type ProductRow = { handle?: string | null; thumbnail?: string | null; images?: { url?: string | null; rank?: number | null }[] | null }
type Index = { at: number; byHash: Map<string, ImageEntry[]>; byFile: Map<string, ImageEntry> }

let index: Index | null = null
let building: Promise<Index> | null = null

/** {handle}-{n} for the product's photos by rank, {handle} for a thumbnail that is not one of them */
function productEntries(p: ProductRow): ImageEntry[] {
  if (!p.handle) return []
  const slug = cleanSlug(p.handle)
  const out: ImageEntry[] = []
  const seen = new Set<string>()
  for (const img of [...(p.images ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))) {
    const file = staticFile(img.url)
    if (!file || seen.has(file)) continue
    seen.add(file)
    out.push({ kind: "produk", slug, name: `${slug}-${seen.size}`, file, src: img.url! })
  }
  const thumb = staticFile(p.thumbnail)
  if (thumb && !seen.has(thumb)) out.push({ kind: "produk", slug, name: slug, file: thumb, src: p.thumbnail! })
  return out
}

/** One entry per photo and per language slug of the article (a translated slug is another name for the same file) */
function blogEntries(row: BlogIndexRow): ImageEntry[] {
  const slugs = Array.from(new Set(Object.values(row.locales).map((l) => cleanSlug(l.slug))))
  return slugs.flatMap((slug) =>
    blogImageNames(slug, row).flatMap(({ name, src }) => {
      const file = staticFile(src)
      return file ? [{ kind: "blog" as const, slug, name, file, src }] : []
    })
  )
}

async function listAllProducts(): Promise<ProductRow[]> {
  const out: ProductRow[] = []
  const limit = 100
  for (let offset = 0; offset < 20000; offset += limit) {
    const r = await sdk.client
      .fetch<{ products: ProductRow[]; count: number }>("/store/products", { query: { fields: "handle,thumbnail,images.url,images.rank", limit, offset }, cache: "no-store" })
      .catch(() => null)
    if (!r) break
    out.push(...r.products)
    if (r.products.length < limit || out.length >= r.count) break
  }
  return out
}

async function build(): Promise<Index> {
  const [products, posts] = await Promise.all([listAllProducts(), feature("blog").then((on) => (on ? listPostIndex() : [])).catch(() => [])])
  const byHash = new Map<string, ImageEntry[]>()
  const byFile = new Map<string, ImageEntry>()
  for (const e of [...products.flatMap(productEntries), ...posts.flatMap(blogEntries)]) {
    const h = imageHash(e.file)
    byHash.set(h, [...(byHash.get(h) ?? []), e])
    // a file used by a product and an article: the product name wins for the old URL (first in the list)
    if (!byFile.has(e.file)) byFile.set(e.file, e)
  }
  return { at: Date.now(), byHash, byFile }
}

async function getIndex(maxAge: number): Promise<Index> {
  if (index && Date.now() - index.at < maxAge) return index
  building ??= build().finally(() => (building = null))
  index = await building
  return index
}

async function find(select: (i: Index) => ImageEntry[]): Promise<ImageEntry[]> {
  let found = select(await getIndex(30_000))
  if (!found.length) found = select(await getIndex(3_000))
  return found
}

/**
 * The photo a clean URL points at. `exact`: the name in the URL belongs to the photo's current product or article
 * (its name, or the bare slug used where the position is unknown: cart, orders). Otherwise the product/article was
 * renamed: `entry` holds the current name, for a 301.
 */
export async function resolveImage(kind: ImageKind, name: string, hash: string) {
  const found = await find((i) => (i.byHash.get(hash) ?? []).filter((e) => e.kind === kind))
  const exact = found.find((e) => e.name === name || e.slug === name || name.startsWith(`${e.slug}-`))
  if (exact) return { entry: exact, exact: true }
  return found.length ? { entry: found[0], exact: false } : null
}

/** Where a file from an old URL is used now (product or article), for the 301 of that URL */
export async function locateFile(file: string): Promise<ImageEntry | null> {
  return (await find((i) => (i.byFile.has(file) ? [i.byFile.get(file)!] : [])))[0] ?? null
}
