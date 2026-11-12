import { llmsFullTxt } from "@lib/llms"
import { getRequestOrigin } from "@lib/util/site"
import { SITE_LIVE } from "@lib/util/site-live"

// Dynamic for the request origin; the data behind it is Next's tagged fetch cache (purged by /api/revalidate)
export const dynamic = "force-dynamic"

/** /llms-full.txt — see src/lib/llms.ts. Empty before launch (SITE_LIVE), like the sitemap. */
export async function GET(request: Request) {
  if (!SITE_LIVE) return new Response("", { status: 404 })
  const body = await llmsFullTxt(getRequestOrigin(request))
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } })
}
