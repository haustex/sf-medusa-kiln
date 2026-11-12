import type { Metadata } from "next"

import { authorName, categoryPath, listPosts, pagePath, type BlogArticle } from "@lib/data/blog"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { brandShareImage, ogBase } from "@lib/og/share"
import { blogShareImage } from "@lib/seo/blog"
import { marketAlternates, marketPath } from "@lib/util/market"
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
  return {
    title,
    description,
    alternates: { canonical: url, languages: marketAlternates(origin, path), types: feed(origin, countryCode) },
    openGraph: { ...ogBase(countryCode), type: "website", title: `${title} | ${STORE_NAME}`, description, url, images: [brandShareImage(origin, countryCode)] },
    ...(empty ? { robots: { index: false, follow: true } } : {}),
  }
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
    alternates: { canonical: url, languages: marketAlternates(origin, path), types: feed(origin, countryCode) },
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
