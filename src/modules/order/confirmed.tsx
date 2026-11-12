import { HttpTypes } from "@medusajs/types"
import { Check } from "lucide-react"

import { isManual, isStripeLike } from "@lib/constants"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { getMarket, marketPath } from "@lib/util/market"
import { cleanSlug } from "@lib/util/image-name"
import CartTotals from "@modules/common/components/cart-totals"
import { ButtonLink, Page, ProductImage, Stack } from "@modules/ds"
import { ICON } from "@modules/ds/icons"
import { formatPrice } from "@modules/ds/price-tag"

const lines = (a?: HttpTypes.StoreOrderAddress | null) =>
  a ? [[a.first_name, a.last_name].filter(Boolean).join(" "), [a.address_1, a.address_2].filter(Boolean).join(", "), [a.postal_code, a.city, a.province].filter(Boolean).join(" "), a.country_code?.toUpperCase()].filter(Boolean) : []

function Block({ title, children, testId }: { title: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-stack-xs text-sm" data-testid={testId}>
      <span className="text-muted">{title}</span>
      {children}
    </div>
  )
}

/**
 * Order confirmation: thanks + what happens next, order number and date, the lines, totals, where it ships and
 * how it was paid. One narrow column; the same card style as the cart summary.
 */
export default function OrderConfirmed({ order, countryCode }: { order: HttpTypes.StoreOrder; countryCode: string }) {
  const dict = getDictionary(countryCode)
  const t = dict.order
  const tc = dict.checkout
  const market = getMarket(countryCode)
  const items = [...(order.items ?? [])].sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
  const method = order.shipping_methods?.[0]
  const payment = order.payment_collections?.[0]?.payments?.[0]
  const paymentLabel = payment ? (isStripeLike(payment.provider_id) ? tc.providers.card : isManual(payment.provider_id) ? tc.providers.manual : payment.provider_id) : null
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

        <section className="flex flex-col gap-stack-lg rounded-media bg-default p-stack-lg" aria-labelledby="order-items">
          <h2 id="order-items" className="type-h3">
            {t.summary}
          </h2>
          <ul className="flex flex-col gap-stack-md" data-testid="products-table">
            {items.map((item) => {
              const variant = item.variant_title && item.variant_title !== "Default variant" ? item.variant_title : null
              return (
                <li key={item.id} className="flex items-center gap-stack-md" data-testid="product-row">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-background">
                    <ProductImage src={item.thumbnail} name={cleanSlug(item.product_handle ?? item.title ?? "item")} alt="" sizes="64px" className="size-full" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-stack-xs text-sm">
                    <span className="font-medium">{item.product_title ?? item.title}</span>
                    <span className="text-muted">
                      {variant ? `${variant} · ` : ""}
                      {t.qty} {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">{formatPrice(item.total ?? 0, order.currency_code)}</span>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-separator pt-stack-md">
            <CartTotals totals={order} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-stack-lg rounded-media bg-default p-stack-lg sm:grid-cols-3" aria-label={t.fulfillment}>
          <Block title={t.shippingAddress} testId="shipping-address-summary">
            {[...lines(order.shipping_address), order.shipping_address?.phone].filter(Boolean).map((l, i) => (
              <span key={i} className="[overflow-wrap:anywhere]">
                {l}
              </span>
            ))}
          </Block>
          <Block title={t.method} testId="shipping-method-summary">
            {method && <span>{`${method.name} · ${method.total ? formatPrice(method.total, order.currency_code) : tc.free}`}</span>}
          </Block>
          <Block title={t.payment} testId="payment-method">
            {paymentLabel && <span>{paymentLabel}</span>}
            {payment && <span className="text-muted tabular-nums">{formatPrice(payment.amount, order.currency_code)}</span>}
          </Block>
        </section>

        <div>
          <ButtonLink href={marketPath(countryCode, "/store")} variant="secondary">
            {t.continueShopping}
          </ButtonLink>
        </div>
      </Stack>
    </Page>
  )
}
