import { NextRequest, NextResponse } from "next/server"
import { ALWAYS_PREFIX, DEFAULT_MARKET, MARKETS, isMarketCode } from "@lib/util/market"

/**
 * Market routing (theme.config.ts `markets.routing`; no geo-IP redirects):
 *
 * default-no-prefix  `/us/...` (default market) -> 308 without the prefix; `/id/...` served as is;
 *                    anything else -> internal rewrite to `/us/...`.
 * always-prefix      `/...` without a market -> 308 to `/us/...`; every market keeps its prefix.
 *
 * The resolved locale is forwarded in `x-kiln-locale` so Medusa returns translated content (lib/util/get-locale-header).
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname.includes(".")) {
    return NextResponse.next()
  }

  const first = pathname.split("/")[1]?.toLowerCase() ?? ""
  const hasPrefix = first !== "" && isMarketCode(first)

  // Some setups run the proxy again on the internally rewritten URL (it already carries x-kiln-market): never
  // answer that second pass with the redirect below, or `/` would loop.
  if (hasPrefix && request.headers.get("x-kiln-market") === first) {
    return NextResponse.next()
  }

  if (!ALWAYS_PREFIX && first === DEFAULT_MARKET) {
    const rest = pathname.slice(DEFAULT_MARKET.length + 1) || "/"
    return NextResponse.redirect(new URL(`${rest}${search}`, request.url), 308)
  }
  if (ALWAYS_PREFIX && !hasPrefix) {
    return NextResponse.redirect(new URL(`/${DEFAULT_MARKET}${pathname === "/" ? "" : pathname}${search}`, request.url), 308)
  }

  const market = hasPrefix ? first : DEFAULT_MARKET
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-kiln-locale", MARKETS[market].locale)
  requestHeaders.set("x-kiln-market", market)

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  let response: NextResponse
  if (!hasPrefix) {
    // Built from nextUrl (not request.url), so Next serves the rewrite internally whatever host it listens on.
    const target = request.nextUrl.clone()
    target.pathname = `/${DEFAULT_MARKET}${pathname === "/" ? "" : pathname}`
    response = NextResponse.rewrite(target, { request: { headers: requestHeaders } })
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Per-visitor fetch cache id (cart, customer, checkout), only where those are read: a Set-Cookie on static
  // pages would stop CDNs from caching the HTML.
  const marketless = hasPrefix ? pathname.slice(market.length + 1) || "/" : pathname
  if (!cacheIdCookie && needsCacheId(request, marketless)) {
    response.cookies.set("_medusa_cache_id", cacheId, { maxAge: 60 * 60 * 24 })
  }

  return response
}

const DYNAMIC_PREFIXES = ["/cart", "/checkout", "/account", "/order", "/track", "/verify-account", "/wishlist", "/review"]

/** Server actions (POST) and the per-visitor pages; never the static catalogue/info pages */
function needsCacheId(request: NextRequest, path: string) {
  if (request.method !== "GET" && request.method !== "HEAD") return true
  return DYNAMIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)"],
}
