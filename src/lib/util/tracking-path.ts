import { getDictionary } from "@lib/i18n/dictionaries"
import { getMarket } from "./market"

/**
 * The tracking page (medusa-fulfillment-zone-rate) lives at /track inside the app; each language may show it at
 * its own address, dictionary `footer.trackPath` ("/lacak" in Indonesian, overridable in theme.config.ts `text`).
 * The proxy rewrites the public address to /track and sends /track itself to the public one (308), so one URL per
 * market reaches the page.
 */
export const TRACK = "/track"

/** Public, market-relative path of the tracking page for a market ("/track", "/lacak", …) */
export const trackingPath = (countryCode: string): string => {
  const p = getDictionary(countryCode).footer.trackPath?.trim()
  return p && p.startsWith("/") && p !== "/" ? p.replace(/\/+$/, "") : TRACK
}

/** The plugin's two text languages; other dictionaries fall back to English */
export const trackingLocale = (countryCode: string): "en" | "id" => (getMarket(countryCode).dictionary === "id" ? "id" : "en")

/** What the proxy does with a market-relative path: rewrite the public address to /track, redirect /track to it */
export function trackingRoute(market: string, marketless: string): { rewrite: string } | { redirect: string } | null {
  const pub = trackingPath(market)
  if (pub === TRACK) return null
  if (marketless === pub || marketless.startsWith(`${pub}/`)) return { rewrite: `${TRACK}${marketless.slice(pub.length)}` }
  if (marketless === TRACK || marketless.startsWith(`${TRACK}/`)) return { redirect: `${pub}${marketless.slice(TRACK.length)}` }
  return null
}
