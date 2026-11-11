import type { BlogArticle, BlogCard } from "@lib/data/blog"
import { brandShareImage, photoShareImage, type ShareImage } from "@lib/og/share"
import { cleanSlug } from "@lib/util/image-name"
import { imageJpeg, imageRef } from "@lib/util/image-url"
import { getMarket, marketPath } from "@lib/util/market"
import { STORE_NAME } from "@lib/util/site"

import { ORG } from "./organization"

/**
 * Share image of an article (og:image, 1200×630; app/og/[...path]/route.tsx):
 *   wide cover  -> /og/{market}/blog/{slug}-lebar-{hash}.jpg   the wide cover, filling the image
 *   1:1 cover   -> /og/{market}/blog/{slug}-{hash}.jpg         the square cover in the centre on white (as products)
 *   no cover    -> the brand image
 */
export function blogShareImage(origin: string, countryCode: string, post: Pick<BlogCard, "slug" | "title" | "cover" | "cover_wide">): ShareImage {
  const name = cleanSlug(post.slug)
  const ref = imageRef("blog", `${name}-lebar`, post.cover_wide) ?? imageRef("blog", name, post.cover)
  return ref ? photoShareImage(origin, countryCode, ref, `${post.title} · ${STORE_NAME}`) : brandShareImage(origin, countryCode)
}

const orgRef = (origin: string) => ({ "@type": "Organization", "@id": `${origin}/#organization`, name: ORG.name, url: origin })

/**
 * BlogPosting. The author is the shop (Organization) unless the article names a person; the publisher is the
 * company behind the shop.
 */
export function blogPosting(origin: string, countryCode: string, post: BlogArticle) {
  const url = `${origin}${marketPath(countryCode, `/blog/${post.slug}`)}`
  // Clean JPEG URLs: the square cover, the wide cover, the share image (1200×630)
  const name = cleanSlug(post.slug)
  const cover = imageRef("blog", name, post.cover)
  const wide = imageRef("blog", `${name}-lebar`, post.cover_wide)
  const images = [cover && imageJpeg(origin, cover), wide && imageJpeg(origin, wide), blogShareImage(origin, countryCode, post).url].filter(Boolean)
  const byShop = !post.author || post.author.trim().toUpperCase() === ORG.name
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: post.title.slice(0, 110),
    description: post.seo_description || post.excerpt,
    image: images,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: byShop ? orgRef(origin) : { "@type": "Person", name: post.author },
    publisher: {
      ...orgRef(origin),
      logo: { "@type": "ImageObject", url: `${origin}/brand/logo.png` },
    },
    inLanguage: getMarket(countryCode).locale,
    ...(post.category ? { articleSection: post.category.name } : {}),
    // Tags are written once, in Indonesian (Admin): only the Indonesian page carries them
    ...(post.tags.length && countryCode !== "us" ? { keywords: post.tags.join(", ") } : {}),
    wordCount: post.words,
    isPartOf: { "@type": "Blog", "@id": `${origin}${marketPath(countryCode, "/blog")}#blog`, name: `${STORE_NAME} Blog`, publisher: orgRef(origin) },
  }
}

/** The listing pages: the articles on the page, in order */
export const blogItemList = (origin: string, countryCode: string, posts: Pick<BlogCard, "slug" | "title">[]) =>
  posts.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: posts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.title,
          url: `${origin}${marketPath(countryCode, `/blog/${p.slug}`)}`,
        })),
      }
    : null
