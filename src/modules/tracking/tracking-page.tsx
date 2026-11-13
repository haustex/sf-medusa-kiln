import { redirect } from "next/navigation"

import config from "@theme"
import { getDictionary } from "@lib/i18n/dictionaries"
import { trackingBackend } from "@lib/tracking/backend"
import { provinceName } from "@lib/util/id-provinces"
import { marketPath } from "@lib/util/market"
import { trackingLocale, trackingPath } from "@lib/util/tracking-path"
import { Breadcrumb, Page, Stack } from "@modules/ds"

import { getTracking } from "./core/api"
import { TrackingLookup } from "./core/components/tracking-lookup"
import { TrackingView } from "./core/components/tracking-view"
import { LABELS, looksLikeTrackingNumber, normalizeInput } from "./core/labels"
import { kilnTrackingTheme } from "./theme"

/**
 * The public tracking page of medusa-fulfillment-zone-rate, at the market's address (lib/util/tracking-path.ts):
 *   /{path}             the lookup form
 *   /{path}?number=…    the form's GET → redirect to /{path}/{NUMBER}
 *   /{path}/{number}    the live card (status, dates, timeline; SSE through /api/zone-rate/track)
 * Texts come from the plugin (English, Indonesian); the look from modules/tracking/theme.ts.
 */
export async function TrackingPage({ countryCode, number, query }: { countryCode: string; number?: string; query?: string }) {
  const locale = trackingLocale(countryCode)
  const base = marketPath(countryCode, trackingPath(countryCode))
  const t = LABELS[locale]
  const d = getDictionary(countryCode)

  if (!number && query && looksLikeTrackingNumber(query)) redirect(`${base}/${encodeURIComponent(normalizeInput(query))}`)

  const raw = number ? decodeURIComponent(number) : query
  let error: string | null = null
  let view: React.ReactNode = null
  if (number) {
    const result = await getTracking(await trackingBackend(), raw!, locale)
    if (result.ok) {
      const enc = encodeURIComponent(result.shipment.tracking_number)
      const province = result.shipment.destination.province
      view = (
        <TrackingView
          initial={result.shipment}
          fetchUrl={`/api/zone-rate/track/${enc}?locale=${locale}`}
          streamUrl={`/api/zone-rate/track/${enc}/stream`}
          locale={locale}
          timeZone={config.brand.timeZone}
          theme={kilnTrackingTheme}
          // functions cannot cross into the client component: resolve the one province name here
          placeNames={province ? { [province]: provinceName(province) ?? province } : undefined}
        />
      )
    } else {
      error = result.reason === "rate_limited" ? t.tooMany : `${t.notFound}. ${t.notFoundHint}`
    }
  } else if (query) {
    error = t.invalid
  }

  return (
    <Page data-testid="tracking-page">
      <Stack gap="section" className="content-container mx-auto max-w-2xl">
        <Stack gap="md" as="header">
          <Breadcrumb items={[{ label: d.product.home, href: marketPath(countryCode, "/") }, { label: t.title }]} label={d.listing.breadcrumb} />
          <h1 className="type-h1">{t.title}</h1>
          <p className="type-body text-muted">{t.intro}</p>
        </Stack>
        <TrackingLookup action={base} locale={locale} defaultValue={raw ?? ""} error={error} theme={kilnTrackingTheme} />
        {view}
      </Stack>
    </Page>
  )
}
