import { MARKET_CODES, marketPath } from "@lib/util/market"
import { trackingPath } from "@lib/util/tracking-path"

/** Per-visitor pages in every market: their URLs carry order ids, tokens or tracking numbers, no tracker there */
const PRIVATE = ["/checkout", "/account", "/order", "/transfer", "/verify-account", "/review", "/track"]

export const analyticsExclude = () => Array.from(new Set(MARKET_CODES.flatMap((cc) => [...PRIVATE, trackingPath(cc)].map((p) => marketPath(cc, p)))))
