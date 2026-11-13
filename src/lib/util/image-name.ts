/**
 * Names in the clean image URLs: same rules as the backend's src/lib/image-names.ts (keep both in step;
 * apps/backend/integration-tests/e2e/image-urls.mjs checks them against each other).
 *   produk  {handle}-{n}   n = position of the photo in the product (by rank, from 1); {handle} when unknown
 *   blog    {slug} (Sampul 1:1) · {slug}-lebar (Sampul lebar) · {slug}-{n} (body images: the name comes with the
 *           block from the backend, which sees both languages)
 * Pure JS (no node:crypto): also used where the code may end up in the browser.
 */
export type ImageKind = "produk" | "blog"
export type ImageRef = { kind: ImageKind; name: string; file: string }

export function imageHash(file: string): string {
  let h = 0x811c9dc5
  const bytes = new TextEncoder().encode(file)
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i]
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, "0").slice(0, 6)
}

export const cleanSlug = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "foto"

type ProductLike = { handle?: string | null; images?: { url?: string | null; rank?: number | null }[] | null }

/** Name of one product photo: {handle}-{n} when the photo is one of the product's images, else {handle} */
export function productImageName(product: ProductLike, url: string | null | undefined): string {
  const slug = cleanSlug(product.handle ?? "")
  if (!url || !product.images?.length) return slug
  const files: string[] = []
  for (const img of [...product.images].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))) {
    if (img.url && !files.includes(img.url)) files.push(img.url)
  }
  const n = files.indexOf(url)
  return n >= 0 ? `${slug}-${n + 1}` : slug
}

/**
 * Names of an article's photos from a blog index row (medusa-blog-seo `view=index`): the square cover {slug}, the
 * wide cover {slug}-lebar, then the body photos {slug}-{n} in order of first appearance; a file used twice is named once.
 */
export function blogImageNames(slug: string, row: { cover?: string | null; cover_wide?: string | null; images?: { src: string }[] | null }): { name: string; src: string }[] {
  const s = cleanSlug(slug)
  const out: { name: string; src: string }[] = []
  const seen = new Set<string>()
  let n = 0
  const add = (src: string | null | undefined, name: () => string) => {
    if (!src || seen.has(src)) return
    seen.add(src)
    out.push({ name: name(), src })
  }
  add(row.cover, () => s)
  add(row.cover_wide, () => `${s}-lebar`)
  for (const i of row.images ?? []) add(i.src, () => `${s}-${++n}`)
  return out
}
