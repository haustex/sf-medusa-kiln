import { NextRequest, NextResponse } from "next/server"

import { linksPath, MAIN_HANDLE } from "@lib/links-path"
import { DEFAULT_MARKET, MARKET_CODES, MARKETS, marketPath } from "@lib/util/market"
import { getRequestOrigin } from "@lib/util/site"

/**
 * GET /l/{key}?l={lang}: the counted link of a link-in-bio item (medusa-link-in-bio). Relays the plugin's own
 * /l/{key} (302 to the stored destination, click counted there) with the headers it reads: user agent (bot filter),
 * DNT / Sec-GPC (not counted), the visitor's IP (rate limit) and the language. The visitor only ever lands on a URL
 * an admin saved; nothing in this request chooses the target. Unknown, expired or failing links go to the market's
 * /links page instead of an error. Root-level (markets.passthrough built in), never cached or indexed.
 */
export const dynamic = "force-dynamic"

const BACKEND = (process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
const KEY = /^[A-Za-z0-9_-]{4,32}$/
const LANG = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/
const FORWARD = ["user-agent", "dnt", "sec-gpc", "accept-language"]
const NO_STORE = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex", "Referrer-Policy": "no-referrer-when-downgrade" }

/** The /links page of the market that speaks `lang` (the default market otherwise) */
const linksPage = (lang: string) => marketPath(MARKET_CODES.find((c) => MARKETS[c].htmlLang === lang) ?? DEFAULT_MARKET, linksPath(MAIN_HANDLE))

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const l = req.nextUrl.searchParams.get("l") ?? ""
  const lang = LANG.test(l) ? l : ""
  // the public origin (NEXT_PUBLIC_BASE_URL or the forwarded host), not req.url: behind a proxy that is the container's own address
  const home = new URL(linksPage(lang), getRequestOrigin(req))
  if (!KEY.test(key)) return NextResponse.redirect(home, { status: 302, headers: NO_STORE })

  const headers = new Headers({ "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "" })
  for (const h of FORWARD) {
    const v = req.headers.get(h)
    if (v) headers.set(h, v)
  }
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim()
  if (ip) headers.set("x-forwarded-for", ip)
  if (lang) headers.set("x-medusa-locale", lang)

  try {
    const res = await fetch(`${BACKEND}/l/${key}${lang ? `?l=${encodeURIComponent(lang)}` : ""}`, { headers, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(8000) })
    const location = res.headers.get("location")
    if ([301, 302, 307, 308].includes(res.status) && location && /^https?:\/\//i.test(location)) {
      return NextResponse.redirect(location, { status: 302, headers: NO_STORE })
    }
    if (res.status === 429) {
      return new NextResponse("Too many requests", { status: 429, headers: { ...NO_STORE, "Retry-After": res.headers.get("retry-after") ?? "60" } })
    }
  } catch {}
  return NextResponse.redirect(home, { status: 302, headers: NO_STORE })
}
