import "server-only"
import { HttpTypes } from "@medusajs/types"

import config from "@theme"
import { feature } from "@lib/features"
import { getDictionary } from "@lib/i18n/dictionaries"
import { fill } from "@lib/i18n/fill"
import { publicBackend } from "@lib/tracking/backend"
import { provinceName } from "@lib/util/id-provinces"
import { getMarket } from "@lib/util/market"
import { trackingLocale } from "@lib/util/tracking-path"
import { formatPrice } from "@modules/ds/price-tag"
import { getRateCard } from "@modules/tracking/core/api"
import type { RateCard } from "@modules/tracking/core/types"

export type RateService = RateCard["services"][number]
export type Estimate = NonNullable<RateService["estimate"]>

/**
 * The public rate card of medusa-fulfillment-zone-rate (services, zones, rates per kg in the market's currency,
 * delivery estimates): the same numbers checkout prices from. Cached 5 minutes; null without the plugin.
 */
export async function getShippingRateCard(countryCode: string): Promise<RateCard | null> {
  if (!(await feature("tracking"))) return null
  const market = getMarket(countryCode)
  return getRateCard(publicBackend(), market.currency, trackingLocale(countryCode), { next: { revalidate: 300, tags: ["shipping-rates"] } }).catch(() => null)
}

/**
 * Services that deliver to the market's country: country services whose zones list it; province services for
 * Indonesia (the plugin's province list is Indonesian; the rate card names the provinces, not their country)
 */
export const servicesFor = (card: RateCard | null, countryCode: string): RateService[] => {
  const cc = countryCode.toLowerCase()
  return (card?.services ?? []).filter((s) =>
    s.destination === "province" ? cc === "id" : s.zones.some((z) => z.destinations.some((d) => d.toLowerCase() === cc))
  )
}

/** The rate-card service behind a shipping option (zone-rate options carry the service id in `data.id`) */
export const serviceForOption = (card: RateCard | null, option: HttpTypes.StoreCartShippingOption): RateService | null => {
  const id = (option as { data?: { id?: unknown } | null }).data?.id
  return typeof id === "string" ? card?.services.find((s) => s.id === id) ?? null : null
}

/** "2–7 days" in the market's language (dictionary checkout.estimate) */
export const formatEstimate = (estimate: Estimate, countryCode: string) => fill(getDictionary(countryCode).checkout.estimate[estimate.unit], estimate)

/** Delivery time after dispatch per service of a market, for the product page; [] without the plugin */
export async function shippingEstimates(countryCode: string): Promise<{ name: string; estimate: Estimate }[]> {
  const card = await getShippingRateCard(countryCode)
  return servicesFor(card, countryCode)
    .filter((s): s is RateService & { estimate: Estimate } => !!s.estimate)
    .map((s) => ({ name: s.name, estimate: s.estimate }))
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string))

/**
 * The rate card as HTML tables for the shipping information page (`{{rates}}` in content/pages/{lang}/shipping.md):
 * one table per service, zone / price per kg / destinations, with the delivery estimate and the service's notice.
 * "" without the plugin, so the placeholder vanishes.
 */
export async function rateCardHtml(countryCode: string): Promise<string> {
  const card = await getShippingRateCard(countryCode)
  const services = servicesFor(card, countryCode)
  if (!card || !services.length) return ""
  const market = getMarket(countryCode)
  const t = getDictionary(countryCode).shippingRates
  let countries: Intl.DisplayNames | null = null
  try {
    countries = new Intl.DisplayNames([market.locale], { type: "region" })
  } catch {}
  const place = (s: RateService, d: string) => (s.destination === "province" ? provinceName(d) ?? d : countries?.of(d.toUpperCase()) ?? d.toUpperCase())
  const perKg = (z: RateService["zones"][number]) => (typeof z.rate_per_kg === "number" ? `${formatPrice(z.rate_per_kg, card.currency)} / ${t.kg}` : "–")
  return services
    .map((s) => {
      const meta = [
        s.estimate ? fill(t.delivery, { range: formatEstimate(s.estimate, countryCode) }) : null,
        s.minimum_kg > 1 ? fill(t.minimum, { kg: s.minimum_kg }) : null,
      ]
        .filter(Boolean)
        .join(" · ")
      const rows = s.zones
        .map((z) => `<tr><td>${esc(z.name)}</td><td>${esc(perKg(z))}</td><td>${esc(z.destinations.map((d) => place(s, d)).join(", "))}</td></tr>`)
        .join("")
      return `<h3>${esc(s.name)}</h3>${meta ? `<p>${esc(meta)}</p>` : ""}<div class="blog-table"><table><thead><tr><th>${esc(t.zone)}</th><th>${esc(
        t.perKg
      )}</th><th>${esc(t.destinations)}</th></tr></thead><tbody>${rows}</tbody></table></div>${s.notice ? `<p><em>${esc(s.notice)}</em></p>` : ""}`
    })
    .join("\n")
    .concat(
      `\n<p>${esc(
        fill(t.howCounted, {
          divisor: services[0].volumetric_divisor,
          unit: card.units.dimension,
        })
      )}</p>`
    )
}

/** Shop time zone for shipping dates (theme.config.ts brand.timeZone) */
export const shopTimeZone = config.brand.timeZone
