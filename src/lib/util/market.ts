import config, { type MarketConfig } from "@theme"

/**
 * Markets come from theme.config.ts. Isomorphic (client components, server code and the proxy).
 *
 * routing "default-no-prefix": the default market has no URL prefix (`/products/x` is rewritten internally to
 * `/us/products/x`; a direct `/us/...` request gets a 308 to the unprefixed URL); other markets keep theirs.
 * routing "always-prefix": every market has its prefix and `/` redirects to the default market's prefix.
 */
export type Market = MarketConfig & {
  /** URL prefix, "" for the default market in "default-no-prefix" routing. */
  prefix: string
}

const ROUTING = config.markets.routing
export const DEFAULT_MARKET = config.markets.default.toLowerCase()
export const X_DEFAULT_MARKET = config.markets.xDefault.toLowerCase()
export const ALWAYS_PREFIX = ROUTING === "always-prefix"

export const MARKETS: Record<string, Market> = Object.fromEntries(
  Object.entries(config.markets.list as Record<string, MarketConfig>).map(([code, m]) => {
    const countryCode = code.toLowerCase()
    const prefix = !ALWAYS_PREFIX && countryCode === DEFAULT_MARKET ? "" : `/${countryCode}`
    return [countryCode, { ...m, countryCode, prefix }]
  })
)

export type MarketCode = keyof typeof MARKETS

export const MARKET_CODES = Object.keys(MARKETS)

/** theme.config.ts `markets.passthrough`: root-level paths the proxy leaves alone (`/ucp`, `/buy`, …) */
const PASSTHROUGH: string[] = ((config.markets as { passthrough?: string[] }).passthrough ?? []).map((p) => `/${p.replace(/^\/+|\/+$/g, "")}`).filter((p) => p !== "/")
export const isPassthrough = (pathname: string): boolean => PASSTHROUGH.some((p) => pathname === p || pathname.startsWith(`${p}/`))

export const isMarketCode = (code: unknown): code is MarketCode =>
  typeof code === "string" && code.toLowerCase() in MARKETS

export const getMarket = (countryCode?: string | string[] | null): Market => {
  const code = Array.isArray(countryCode) ? countryCode[0] : countryCode
  return isMarketCode(code) ? MARKETS[code.toLowerCase()] : MARKETS[DEFAULT_MARKET]
}

/**
 * Public path for a market: `marketPath("us", "/cart")` -> `/cart` (default market, no prefix) or `/us/cart`.
 * `path` may be "" or start with "/" or "?".
 */
export const marketPath = (countryCode: string | string[] | null | undefined, path = ""): string => {
  const { prefix } = getMarket(countryCode)
  const full = `${prefix}${path}`
  if (!full) return "/"
  return full.startsWith("/") ? full : `/${full}`
}

/** Strips the market prefix from a public pathname: `/us/cart` -> `/cart`. */
export const stripMarketPrefix = (pathname: string): string => {
  const first = pathname.split("/")[1]?.toLowerCase()
  if (isMarketCode(first)) {
    return pathname.slice(first.length + 1) || "/"
  }
  return pathname || "/"
}

/** hreflang alternates for a market-independent path (for the Metadata API). Empty before launch (SITE_LIVE). */
export const marketAlternates = (origin: string, path = "") => {
  const languages: Record<string, string> = {}
  if (process.env.SITE_LIVE !== "true") return languages
  for (const code of MARKET_CODES) {
    languages[MARKETS[code].hreflang] = `${origin}${marketPath(code, path)}`
  }
  languages["x-default"] = `${origin}${marketPath(X_DEFAULT_MARKET, path)}`
  return languages
}
