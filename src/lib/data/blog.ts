import "server-only"

import { sdk } from "@lib/config"
import { getMarket, marketPath } from "@lib/util/market"
import { formatPostDate, readingTimeLabel } from "@modules/blog/format"
import type { PostCardData, TocItem } from "@modules/blog/types"

/**
 * Blog data from the backend's blog module (/store/blog/…). One language per response, chosen by the market
 * (Indonesia = id, United States = en); article bodies arrive as blocks, so nothing is parsed here.
 * Cached like the catalogue (force-cache) and tagged "blog": the backend calls /api/revalidate on every public
 * change, and the pages themselves re-render every 60 s.
 */
export const BLOG_TAG = "blog"
export const BLOG_PAGE_SIZE = 12

export type Lang = "id" | "en"
export const blogLang = (countryCode: string): Lang => (getMarket(countryCode).htmlLang === "en" ? "en" : "id")

export type BlogCategory = { id: string; slug: string; name: string; description: string | null }
export type BlogCard = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: BlogCategory | null
  author: string
  published_at: string
  updated_at: string
  reading_minutes: number
  cover: string | null
  cover_wide: string | null
  cover_alt: string
  featured: boolean
}
export type BlogBlock =
  | { type: "html"; html: string }
  /** name: the photo's name in its clean URL (backend lib/image-names.ts); alt: falls back to the title + number */
  | { type: "image"; src: string; name: string; alt: string; width: number | null; height: number | null; caption: string | null }
  | { type: "product"; id: string }
  | { type: "youtube"; id: string }
  | { type: "faq"; items: { q: string; a_html: string; a: string }[] }
export type BlogArticle = BlogCard & {
  seo_title: string
  seo_description: string
  tags: string[]
  product_ids: string[]
  blocks: BlogBlock[]
  toc: TocItem[]
  faq: { q: string; a: string }[]
  words: number
  text: string
}
export type BlogIndexRow = {
  slug: string
  category: { slug: string; name_id: string; name_en: string } | null
  author: string
  published_at: string
  updated_at: string
  cover: string | null
  cover_wide: string | null
  /** Every photo of the article with its clean-URL name (image sitemap) */
  images: { src: string; name: string }[]
  title_id: string
  title_en: string
  excerpt_id: string
  excerpt_en: string
}

const cached = { next: { tags: [BLOG_TAG] }, cache: "force-cache" as const }
const isNotFound = (e: unknown) => (e as { status?: number })?.status === 404

export async function listPosts(countryCode: string, opts: { page?: number; category?: string; limit?: number } = {}) {
  const limit = opts.limit ?? BLOG_PAGE_SIZE
  const page = Math.max(opts.page ?? 1, 1)
  try {
    const res = await sdk.client.fetch<{ posts: BlogCard[]; featured: BlogCard | null; category: BlogCategory | null; count: number }>("/store/blog/posts", {
      query: { locale: blogLang(countryCode), limit, offset: (page - 1) * limit, ...(opts.category ? { category: opts.category } : {}) },
      ...cached,
    })
    return { ...res, page, totalPages: Math.max(1, Math.ceil(res.count / limit)) }
  } catch (e) {
    if (isNotFound(e)) return null // unknown category
    throw e
  }
}

export async function getPost(countryCode: string, slug: string) {
  try {
    return await sdk.client.fetch<{ post: BlogArticle; more: { same_category: boolean; posts: BlogCard[] } }>(`/store/blog/posts/${encodeURIComponent(slug)}`, {
      query: { locale: blogLang(countryCode) },
      ...cached,
    })
  } catch (e) {
    if (isNotFound(e)) return null
    throw e
  }
}

/** Any status, by its secret token (Admin's "Pratinjau"). Never cached. */
export async function getPreview(countryCode: string, token: string) {
  try {
    return await sdk.client.fetch<{ post: BlogArticle & { status: string }; more: { same_category: boolean; posts: BlogCard[] } }>(
      `/store/blog/preview/${encodeURIComponent(token)}`,
      { query: { locale: blogLang(countryCode) }, cache: "no-store" }
    )
  } catch (e) {
    if (isNotFound(e)) return null
    throw e
  }
}

/** Categories that have at least one public article */
export const listBlogCategories = (countryCode: string) =>
  sdk.client
    .fetch<{ categories: BlogCategory[] }>("/store/blog/categories", { query: { locale: blogLang(countryCode) }, ...cached })
    .then((r) => r.categories)

/** Every public article in both languages (sitemap, RSS, llms.txt) */
export const listPostIndex = () =>
  sdk.client.fetch<{ posts: BlogIndexRow[] }>("/store/blog/posts", { query: { view: "index" }, ...cached }).then((r) => r.posts)

export const postPath = (slug: string) => `/blog/${slug}`
export const categoryPath = (slug: string) => `/blog/kategori/${slug}`
/** Page 1 is the listing itself; later pages are /page/{n} (path, not query: the pages stay static and cacheable) */
export const pagePath = (base: string, page: number) => (page <= 1 ? base : `${base}/page/${page}`)

export function toPostCard(p: BlogCard, countryCode: string, month: "short" | "long" = "short"): PostCardData {
  const lang = blogLang(countryCode)
  return {
    href: marketPath(countryCode, postPath(p.slug)),
    title: p.title,
    excerpt: p.excerpt || null,
    category: p.category?.name ?? null,
    publishedAt: p.published_at,
    dateLabel: formatPostDate(p.published_at, lang, month),
    readingTime: readingTimeLabel(p.reading_minutes, lang),
    cover: p.cover,
    coverWide: p.cover_wide,
  }
}
