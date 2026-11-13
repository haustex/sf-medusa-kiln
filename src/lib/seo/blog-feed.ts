import "server-only"
import { indexLocale, listPostIndex } from "@lib/data/blog"
import { getDictionary } from "@lib/i18n/dictionaries"
import { cleanSlug } from "@lib/util/image-name"
import { imageJpeg, imageRef } from "@lib/util/image-url"
import { getMarket, marketPath } from "@lib/util/market"

import { ORG } from "./organization"

const x = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!)

/**
 * RSS 2.0 feed of the blog for one market: /blog/feed.xml (Indonesian) and /us/blog/feed.xml (English).
 * The 50 newest articles: title, link, date, summary, category and the 1:1 cover.
 */
export async function blogFeed(countryCode: string, origin: string) {
  const market = getMarket(countryCode)
  const t = getDictionary(countryCode).blog
  const posts = (await listPostIndex()).slice(0, 50)
  const home = `${origin}${marketPath(countryCode, "/blog")}`
  const self = `${origin}${marketPath(countryCode, "/blog/feed.xml")}`
  const newest = posts.reduce((max, p) => (p.updated_at > max ? p.updated_at : max), posts[0]?.updated_at ?? new Date(0).toISOString())
  const items = posts.flatMap((p) => {
    // The market's language, else the first language the article has (medusa-blog-seo answers the fallback too)
    const l = indexLocale(p, countryCode)
    if (!l) return []
    const url = `${origin}${marketPath(countryCode, `/blog/${l.slug}`)}`
    const cover = imageRef("blog", cleanSlug(l.slug), p.cover)
    return `<item>
<title>${x(l.title)}</title>
<link>${x(url)}</link>
<guid isPermaLink="true">${x(url)}</guid>
<pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
<dc:creator>${x(p.author?.name || ORG.name)}</dc:creator>
${l.category_name ? `<category>${x(l.category_name)}</category>\n` : ""}<description>${x(l.excerpt)}</description>
${cover ? `<media:content url="${x(imageJpeg(origin, cover, 1080))}" medium="image" type="image/jpeg" />\n` : ""}</item>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>${x(t.feedTitle)}</title>
<link>${x(home)}</link>
<atom:link href="${x(self)}" rel="self" type="application/rss+xml" />
<description>${x(t.metaDescription)}</description>
<language>${market.locale}</language>
<lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>
${items.join("\n")}
</channel>
</rss>
`
}
