import { getPageText } from "@lib/content/pages"

const HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
  Vary: "Accept",
  // Cloudflare ignores Vary: never keep the Markdown at the edge, or a browser asking for the page could get it
  "Cloudflare-CDN-Cache-Control": "no-store",
}

/**
 * An information page as Markdown (placeholders filled, links with the market prefix): `/shipping.md`,
 * `/us/returns.md`, or the page URL with `Accept: text/markdown` (rewrites in next.config.js). Read by AI agents
 * and by medusa-ai-chat's `get_policy` tool (knowledge.pages in the plugin options).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ countryCode: string; page: string }> }) {
  const { countryCode, page: slug } = await params
  const page = await getPageText(countryCode, slug)
  if (!page) return new Response("# Not found\n", { status: 404, headers: HEADERS })
  const head = `# ${page.title}\n\n${page.description ? `${page.description}\n\n` : ""}`
  return new Response(`${head}${page.markdown}\n`, { headers: HEADERS })
}
