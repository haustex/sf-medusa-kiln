import "server-only"

import { sdk } from "@lib/config"
import { getMarket, marketPath } from "@lib/util/market"
import { STORE_NAME } from "@lib/util/site"
import { formatPostDate, readingTimeLabel } from "@modules/blog/format"
import type { PostCardData, TocItem } from "@modules/blog/types"

/**
 * Blog data from medusa-blog-seo (/store/blog-seo/…). One language per response, chosen by the market
 * (Indonesia = id, United States = en); article bodies arrive as blocks, so nothing is parsed here.
 * Cached like the catalogue (force-cache) and tagged "blog": the backend calls /api/revalidate on every public
 * change, and the pages themselves re-render every 60 s.
 */
export const BLOG_TAG = "blog"
export const BLOG_PAGE_SIZE = 12
/** Store routes of medusa-blog-seo */
const BASE = "/store/blog-seo"
/** Articles with this tag are the home page's editor's picks */
export const PICKS_TAG = "pilihan"

export type Lang = "id" | "en"
export const blogLang = (countryCode: string): Lang => (getMarket(countryCode).htmlLang === "en" ? "en" : "id")

export type BlogCategory = { id: string; slug: string; name: string; description: string | null }
/** Who wrote it, as the lists carry it (the article adds photo, bio and profiles: {@link BlogAuthor}) */
export type BlogAuthorRef = { id: string; slug: string; name: string; type: "person" | "organization" }
export type BlogAuthor = BlogAuthorRef & {
  /** Photo (File Module URL) */
  avatar: string | null
  /** Profile or home page */
  url: string | null
  /** Other profiles (schema.org sameAs) */
  same_as: string[]
  /** In the page's language */
  job_title: string | null
  bio: string | null
}
export type BlogCard = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: BlogCategory | null
  author: BlogAuthorRef | null
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
  /** position: 1-based count of the photos in this body (its clean-URL name is {slug}-{position}); alt: falls back to the title + number */
  | { type: "image"; src: string; position: number; alt: string; width: number | null; height: number | null; caption: string | null }
  | { type: "product"; id: string }
  | { type: "youtube"; id: string }
  | { type: "faq"; items: { q: string; a_html: string; a: string }[] }
export type BlogArticle = Omit<BlogCard, "author"> & {
  author: BlogAuthor | null
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
/** One public article with every readable locale (medusa-blog-seo `view=index`): sitemap, llms.txt, the image index */
export type BlogIndexRow = {
  id: string
  published_at: string
  updated_at: string
  cover: string | null
  cover_wide: string | null
  author: BlogAuthorRef | null
  /** Every photo in the article bodies, in order of first appearance (names: lib/util/image-name.ts blogImageNames) */
  images: { src: string; alt: string }[]
  /** By locale code: the slug and copy of that language (`translated: false` = the fallback language's) */
  locales: Record<string, { slug: string; title: string; excerpt: string; translated: boolean; category_slug: string | null; category_name: string | null }>
}

/** The index row's copy for a market's language, else the first language it has */
export const indexLocale = (row: BlogIndexRow, countryCode: string) => row.locales[blogLang(countryCode)] ?? Object.values(row.locales)[0]

const cached = { next: { tags: [BLOG_TAG] }, cache: "force-cache" as const }
const isNotFound = (e: unknown) => (e as { status?: number })?.status === 404

export async function listPosts(countryCode: string, opts: { page?: number; category?: string; limit?: number } = {}) {
  const limit = opts.limit ?? BLOG_PAGE_SIZE
  const page = Math.max(opts.page ?? 1, 1)
  try {
    const res = await sdk.client.fetch<{ posts: BlogCard[]; featured: BlogCard | null; category: BlogCategory | null; count: number }>(`${BASE}/posts`, {
      query: { locale: blogLang(countryCode), limit, offset: (page - 1) * limit, ...(opts.category ? { category: opts.category } : {}) },
      ...cached,
    })
    return { ...res, page, totalPages: Math.max(1, Math.ceil(res.count / limit)) }
  } catch (e) {
    if (isNotFound(e)) return null // unknown category
    throw e
  }
}

export type MorePosts = { same_category: boolean; posts: BlogCard[] }

/** The plugin's `more` is a plain list; "same category" when every one shares the article's category */
const moreOf = (post: BlogCard, more: BlogCard[] | MorePosts | undefined): MorePosts =>
  Array.isArray(more) ? { same_category: !!post.category && more.length > 0 && more.every((m) => m.category?.slug === post.category?.slug), posts: more } : (more ?? { same_category: false, posts: [] })

export async function getPost(countryCode: string, slug: string) {
  try {
    const r = await sdk.client.fetch<{ post: BlogArticle; more: BlogCard[] | MorePosts }>(`${BASE}/posts/${encodeURIComponent(slug)}`, {
      query: { locale: blogLang(countryCode) },
      ...cached,
    })
    return { post: r.post, more: moreOf(r.post, r.more) }
  } catch (e) {
    if (isNotFound(e)) return null
    throw e
  }
}

/** Any status, by its secret token (Admin's "Pratinjau"). Never cached. */
export async function getPreview(countryCode: string, token: string) {
  try {
    const r = await sdk.client.fetch<{ post: BlogArticle & { status: string }; more: BlogCard[] | MorePosts }>(`${BASE}/preview/${encodeURIComponent(token)}`, { query: { locale: blogLang(countryCode) }, cache: "no-store" })
    return { post: r.post, more: moreOf(r.post, r.more) }
  } catch (e) {
    if (isNotFound(e)) return null
    throw e
  }
}

/**
 * Home page picks: up to `n` articles tagged {@link PICKS_TAG}, topped up with the newest ones. Empty (never an
 * error) when the plugin is not installed (404), the backend is unreachable or nothing is published.
 */
export async function listJournalPicks(countryCode: string, n = 3): Promise<BlogCard[]> {
  const query = { locale: blogLang(countryCode), featured: "none", limit: n }
  const fetchCards = (extra: Record<string, string>) => sdk.client.fetch<{ posts: BlogCard[] }>(`${BASE}/posts`, { query: { ...query, ...extra }, ...cached }).then((r) => r.posts)
  try {
    const picks = await fetchCards({ tag: PICKS_TAG })
    if (picks.length >= n) return picks.slice(0, n)
    const latest = await fetchCards({})
    const seen = new Set(picks.map((p) => p.id))
    return [...picks, ...latest.filter((p) => !seen.has(p.id))].slice(0, n)
  } catch {
    return []
  }
}

/** Categories that have at least one public article */
export const listBlogCategories = (countryCode: string) =>
  sdk.client
    .fetch<{ categories: BlogCategory[] }>(`${BASE}/categories`, { query: { locale: blogLang(countryCode) }, ...cached })
    .then((r) => r.categories)

/** Every public article in both languages (sitemap, RSS, llms.txt) */
export const listPostIndex = () =>
  sdk.client.fetch<{ posts: BlogIndexRow[] }>(`${BASE}/posts`, { query: { view: "index" }, ...cached }).then((r) => r.posts)

/** The name shown as the author: the post's author, else the shop (theme.config.ts brand.name) */
export const authorName = (post: { author: { name: string } | null }) => post.author?.name || STORE_NAME

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
