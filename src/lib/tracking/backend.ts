import "server-only"
import { headers } from "next/headers"

import { getAuthHeaders } from "@lib/data/cookies"
import { type BackendConfig, clientIpFrom } from "@modules/tracking/core/api"

const BASE_URL = (process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")

/**
 * How this server reaches medusa-fulfillment-zone-rate's Store API: the backend URL and publishable key, the
 * customer's session for their own order (withCustomer) and the buyer's IP with ZONE_RATE_PROXY_SECRET (= the
 * plugin's `tracking.trustedProxySecret`), so the per-IP lookup limit counts buyers, not this server.
 */
export async function trackingBackend(opts: { withCustomer?: boolean } = {}): Promise<BackendConfig> {
  const auth = opts.withCustomer ? ((await getAuthHeaders()) as { authorization?: string }) : {}
  return {
    baseUrl: BASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
    authorization: auth.authorization ?? null,
    clientIp: clientIpFrom(await headers()),
    proxySecret: process.env.ZONE_RATE_PROXY_SECRET ?? null,
  }
}

/** Without request context (rate card at build time) */
export const publicBackend = (): BackendConfig => ({
  baseUrl: BASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
})
