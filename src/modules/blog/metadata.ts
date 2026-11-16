import type { Metadata } from "next"

import { authorName, blogLang, blogMarketPaths, categoryPath, listPosts, pagePath, postPath, type BlogArticle, type BlogCategory, type Lang } from "@lib/data/blog"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { brandShareImage, ogBase } from "@lib/og/share"
import { blogShareImage } from "@lib/seo/blog"
import { MARKET_CODES, marketAlternates, marketPath } from "@lib/util/market"
import { getSiteOrigin, STORE_NAME } from "@lib/util/site"

/** RSS feed of the market, announced on every blog page (<link rel="alternate" type="application/rss+xml">) */
const feed = (origin: string, countryCode: string) => ({ "application/rss+xml": `${origin}${marketPath(countryCode, "/blog/feed.xml")}` })

/** Metadata of /blog, a category, and their later pages. Empty listings are kept out of the index. */
export async function listingMetadata(countryCode: string, opts: { category?: string; page?: number } = {}): Promise<Metadata | null> {
  const page = opts.page ?? 1
  const [data, origin] = await Promise.all([listPosts(countryCode, { page, category: opts.category }), getSiteOrigin()])
  if (!data) return null
  const t = getDictionary(countryCode).blog
  const path = pagePath(opts.category ? categoryPath(opts.category) : "/blog", page)
  const url = `${origin}${marketPath(countryCode, path)}`
  const suffix = page > 1 ? ` · ${fill(t.pageTitle, { page })}` : ""
  const title = `${data.category ? `${data.category.name} · ${t.title}` : t.title}${suffix}`
  const description = data.category ? data.category.description || fill(t.categoryMeta, { name: data.category.name }) : t.metaDescription
  const empty = !data.featured && !data.posts.length
  const paths = await listingPaths(countryCode, empty ? null : path, page, data.category)
  return {
    title,
    description,
    alternates: { canonical: url, languages: marketAlternates(origin, paths, { noindex: empty }), types: feed(origin, countryCode) },
    openGraph: { ...ogBase(countryCode), type: "website", title: `${title} | ${STORE_NAME}`, description, url, images: [brandShareImage(origin, countryCode)] },
    ...(empty ? { robots: { index: false, follow: true } } : {}),
  }
}

/**
 * The listing's path per market: this market's own (`null` when empty), and for every other language the category
 * by its slug in that language (medusa-blog-seo `alternates`) and the same page number, only where that page has
 * articles: an empty listing is noindex and must not be an alternate. Markets that share a language share the path.
 */
async function listingPaths(countryCode: string, ownPath: string | null, page: number, category: BlogCategory | null): Promise<Partial<Record<string, string | null>>> {
  const byLang = new Map<Lang, string | null>([[blogLang(countryCode), ownPath]])
  const paths: Partial<Record<string, string | null>> = {}
  for (const code of MARKET_CODES) {
    const lang = blogLang(code)
    if (!byLang.has(lang)) {
      const slug = category ? category.alternates?.[lang] : undefined
      const base = category ? (slug ? categoryPath(slug) : null) : "/blog"
      const other = base ? await listPosts(code, { page, category: slug }).catch(() => null) : null
      byLang.set(lang, other && (other.featured || other.posts.length) ? pagePath(base as string, page) : null)
    }
    paths[code] = byLang.get(lang) ?? null
  }
  return paths
}

export async function articleMetadata(countryCode: string, post: BlogArticle): Promise<Metadata> {
  const origin = await getSiteOrigin()
  const path = `/blog/${post.slug}`
  const url = `${origin}${marketPath(countryCode, path)}`
  const image = blogShareImage(origin, countryCode, post)
  return {
    title: post.seo_title,
    description: post.seo_description,
    authors: [{ name: authorName(post) }],
    // The article's own slug in every language it can be read in (medusa-blog-seo `alternates`), never the same slug
    alternates: { canonical: url, languages: marketAlternates(origin, blogMarketPaths(post.alternates ?? { [blogLang(countryCode)]: post.slug }, postPath)), types: feed(origin, countryCode) },
    openGraph: {
      ...ogBase(countryCode),
      type: "article",
      title: `${post.seo_title} | ${STORE_NAME}`,
      description: post.seo_description,
      url,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      authors: [authorName(post)],
      ...(post.category ? { section: post.category.name } : {}),
      // tags are written once, in Indonesian: only the Indonesian page carries them
      ...(post.tags.length && countryCode !== "us" ? { tags: post.tags } : {}),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: post.seo_title, description: post.seo_description, images: [image.url] },
  }
}
