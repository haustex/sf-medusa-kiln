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

/**
 * theme.config.ts `markets.passthrough`: root-level paths the proxy leaves alone (`/ucp`, `/buy`, …). `/l` is built
 * in: the counted links of medusa-link-in-bio (src/app/l/[key]/route.ts) carry the language as a query, not a prefix.
 */
const PASSTHROUGH: string[] = [...((config.markets as { passthrough?: string[] }).passthrough ?? []), "/l"].map((p) => `/${p.replace(/^\/+|\/+$/g, "")}`).filter((p) => p !== "/")
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

/** Absolute URL of a market path. The home page is the bare origin, the form its canonical takes. */
export const marketUrl = (origin: string, countryCode: string | string[] | null | undefined, path = ""): string => {
  const p = marketPath(countryCode, path)
  return p === "/" ? origin : `${origin}${p}`
}

/**
 * The market-less path of a page per market: one string = the same path in every market; a record = the path per
 * market code, a market left out or `null` has no version of the page (an untranslated article, a page one market
 * does not have).
 */
export type MarketPaths = string | Partial<Record<string, string | null>>

/**
 * hreflang alternates for the Metadata API (`alternates.languages`) and the sitemap: every market that has the
 * page, each by its own URL, plus `x-default` = the `markets.xDefault` market's URL (the first listed market's when
 * that one has no version). The set is the same on every version, so the links are reciprocal and self-referencing.
 * Empty before launch (SITE_LIVE) and for a page kept out of the index (`noindex`): a page that is not indexed must
 * not be an alternate, and must not point at any.
 */
export const marketAlternates = (origin: string, paths: MarketPaths = "", opts: { noindex?: boolean } = {}) => {
  const languages: Record<string, string> = {}
  if (process.env.SITE_LIVE !== "true" || opts.noindex) return languages
  const pathOf = (code: string): string | null => (typeof paths === "string" ? paths : (paths[code] ?? null))
  const codes = MARKET_CODES.filter((code) => pathOf(code) !== null)
  for (const code of codes) languages[MARKETS[code].hreflang] = marketUrl(origin, code, pathOf(code) as string)
  const xDefault = codes.includes(X_DEFAULT_MARKET) ? X_DEFAULT_MARKET : codes[0]
  if (xDefault) languages["x-default"] = marketUrl(origin, xDefault, pathOf(xDefault) as string)
  return languages
}
