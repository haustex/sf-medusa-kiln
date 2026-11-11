import "server-only"

import { listRegions } from "@lib/data/regions"
import { MARKETS, MARKET_CODES } from "@lib/util/market"
import type { MarketOption } from "."

/**
 * Markets offered in the switch: the ones in theme.config.ts whose country is in a Medusa region (a market without a
 * region would 404). Country names in the visitor's language (Intl.DisplayNames).
 */
export async function marketOptions(localeForNames: string): Promise<MarketOption[]> {
  const regions = await listRegions().catch(() => [])
  const live = new Set(regions.flatMap((r) => (r.countries ?? []).map((c) => c.iso_2?.toLowerCase()).filter(Boolean)))
  const names = new Intl.DisplayNames([localeForNames], { type: "region" })
  return MARKET_CODES.filter((code) => live.size === 0 || live.has(code)).map((code) => {
    const m = MARKETS[code]
    let country = code.toUpperCase()
    try {
      country = names.of(code.toUpperCase()) ?? country
    } catch {}
    return { code, country, currency: m.currency, hrefLang: m.hreflang }
  })
}
