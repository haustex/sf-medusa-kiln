import { feature } from "@lib/features"
import { blogFeed } from "@lib/seo/blog-feed"
import { isMarketCode } from "@lib/util/market"
import { getRequestOrigin } from "@lib/util/site"
import { SITE_LIVE } from "@lib/util/site-live"

/**
 * RSS of the blog: /us/blog/feed.xml here, /blog/feed.xml through the rewrite in next.config.js (paths with a file
 * extension skip the market proxy). Only with SITE_LIVE=true, like the sitemap. Cached at the edge for an hour
 * and purged by tag when an article is published or changed (api/revalidate).
 */
export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params
  if (!SITE_LIVE || !isMarketCode(countryCode) || !(await feature("blog"))) return new Response("Not found", { status: 404 })
  return new Response(await blogFeed(countryCode.toLowerCase(), getRequestOrigin(request)), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
      "Cloudflare-CDN-Cache-Control": "max-age=3600, stale-while-revalidate=86400",
      "Cache-Tag": "blog,blog-feed",
    },
  })
}
