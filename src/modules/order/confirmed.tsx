import { HttpTypes } from "@medusajs/types"
import { Check } from "lucide-react"

import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { getMarket, marketPath } from "@lib/util/market"
import { ButtonLink, Page, Stack } from "@modules/ds"
import { ICON } from "@modules/ds/icons"

import { CARD, OrderLines, OrderMeta } from "./parts"

/**
 * Order confirmation: thanks + what happens next, order number and date, the lines, totals, where it ships and
 * how it was paid. One narrow column; the same card style as the cart summary.
 */
export default function OrderConfirmed({ order, countryCode }: { order: HttpTypes.StoreOrder; countryCode: string }) {
  const dict = getDictionary(countryCode)
  const t = dict.order
  const market = getMarket(countryCode)
  const date = new Intl.DateTimeFormat(market.locale, { dateStyle: "long" }).format(new Date(order.created_at))

  return (
    <Page>
      <Stack gap="section" className="content-container max-w-3xl" data-testid="order-complete-container">
        <Stack gap="md">
          <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-full bg-foreground text-background">
            <Check {...ICON} size={24} strokeWidth={2} />
          </span>
          <Stack gap="xs">
            <h1 className="type-h1">{t.thanks}</h1>
            <p className="text-muted">{fill(t.thanksHint, { email: order.email ?? "" })}</p>
          </Stack>
          <p className="text-sm">
            <span className="font-medium" data-testid="order-id" data-value={order.display_id}>
              {fill(t.number, { n: order.display_id ?? "" })}
            </span>
            <span className="text-muted"> · {fill(t.placed, { date })}</span>
          </p>
        </Stack>
        <section className={CARD} aria-labelledby="order-items">
          <h2 id="order-items" className="type-h3">
            {t.summary}
          </h2>
          <OrderLines order={order} t={t} />
        </section>
        <OrderMeta order={order} t={t} tc={dict.checkout} />
        <div>
          <ButtonLink href={marketPath(countryCode, "/store")} variant="secondary">
            {t.continueShopping}
          </ButtonLink>
        </div>
      </Stack>
    </Page>
  )
}
