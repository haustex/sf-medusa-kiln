import config from "@theme"
import { feature } from "@lib/features"
import { trackingBackend } from "@lib/tracking/backend"
import { provinceName } from "@lib/util/id-provinces"
import { trackingLocale } from "@lib/util/tracking-path"

import { getOrderShipments } from "./core/api"
import { TrackingSummary } from "./core/components/tracking-summary"
import { TrackingTimeline } from "./core/components/tracking-timeline"
import { LABELS } from "./core/labels"
import { kilnTrackingTheme } from "./theme"

/**
 * The customer's order page: every shipment of the order with the full timeline, notes and proof photos
 * (medusa-fulfillment-zone-rate). Nothing without the plugin, for guests, or before a shipment exists.
 */
export async function OrderShipments({ orderId, countryCode }: { orderId: string; countryCode: string }) {
  if (!(await feature("tracking"))) return null
  const locale = trackingLocale(countryCode)
  const shipments = await getOrderShipments(await trackingBackend({ withCustomer: true }), orderId, locale).catch(() => [])
  if (!shipments.length) return null
  const t = LABELS[locale]
  return (
    <section className="flex flex-col gap-stack-md" aria-labelledby="order-shipments-title" data-testid="order-shipments">
      <h2 id="order-shipments-title" className="type-h3">
        {t.history}
      </h2>
      {shipments.map((s) => (
        <div key={s.tracking_number} className={kilnTrackingTheme.card}>
          <TrackingSummary
            shipment={s}
            locale={locale}
            timeZone={config.brand.timeZone}
            theme={kilnTrackingTheme}
            provinceName={(code) => provinceName(code) ?? code}
          />
          <TrackingTimeline
            events={s.events}
            locale={locale}
            timeZone={config.brand.timeZone}
            theme={kilnTrackingTheme}
            photoUrl={(id) => `/api/zone-rate/photos/${encodeURIComponent(id)}`}
          />
        </div>
      ))}
    </section>
  )
}
