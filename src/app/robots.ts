import { MARKET_CODES, marketPath } from "@lib/util/market"
import { getSiteOrigin } from "@lib/util/site"
import { SITE_LIVE } from "@lib/util/site-live"
import type { MetadataRoute } from "next"

/** Private or per-visitor pages, in every market (theme.config.ts markets) */
const PRIVATE = ["/cart", "/checkout", "/account", "/order/", "/transfer/", "/verify-account", "/blog/pratinjau/", "/wishlist"]
const DISALLOW = Array.from(new Set([...MARKET_CODES.flatMap((cc) => PRIVATE.map((p) => marketPath(cc, p))), "/api/", "/design"]))

/**
 * Search engines and AI crawlers (training, search and user-triggered
 * fetchers) are welcome everywhere except the private pages above.
 */
const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "Applebot",
  "Bingbot", "CCBot", "meta-externalagent", "Amazonbot", "DuckAssistBot", "MistralAI-User",
]

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!SITE_LIVE) {
    // Pre-launch: keep every crawler out (see lib/util/site-live.ts).
    return { rules: { userAgent: "*", disallow: "/" } }
  }
  const origin = await getSiteOrigin()
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: ["/", "/llms.txt", "/llms-full.txt"], disallow: DISALLOW },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
