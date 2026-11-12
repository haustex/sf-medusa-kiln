import { HttpTypes } from "@medusajs/types"

import { isManual, isStripeLike } from "@lib/constants"
import { type Dictionary } from "@lib/i18n/dictionaries"
import { cleanSlug } from "@lib/util/image-name"
import CartTotals from "@modules/common/components/cart-totals"
import { ProductImage } from "@modules/ds"
import { formatPrice } from "@modules/ds/price-tag"

/** Pieces shared by the order confirmation and Account → Orders → order: lines + totals, address/method/payment */
export const CARD = "flex flex-col gap-stack-lg rounded-media bg-default p-stack-lg"

export const addressLines = (a?: HttpTypes.StoreOrderAddress | HttpTypes.StoreCartAddress | null) =>
  a ? [[a.first_name, a.last_name].filter(Boolean).join(" "), [a.address_1, a.address_2].filter(Boolean).join(", "), [a.postal_code, a.city, a.province].filter(Boolean).join(" "), a.country_code?.toUpperCase(), a.phone].filter(Boolean) as string[] : []

export function OrderLines({ order, t }: { order: HttpTypes.StoreOrder; t: Dictionary["order"] }) {
  const items = [...(order.items ?? [])].sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
  return (
    <>
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
    </>
  )
}

function Block({ title, children, testId }: { title: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-stack-xs text-sm" data-testid={testId}>
      <span className="text-muted">{title}</span>
      {children}
    </div>
  )
}

export function OrderMeta({ order, t, tc }: { order: HttpTypes.StoreOrder; t: Dictionary["order"]; tc: Dictionary["checkout"] }) {
  const method = order.shipping_methods?.[0]
  const payment = order.payment_collections?.[0]?.payments?.[0]
  const paymentLabel = payment ? (isStripeLike(payment.provider_id) ? tc.providers.card : isManual(payment.provider_id) ? tc.providers.manual : payment.provider_id) : null
  return (
    <section className="grid grid-cols-1 gap-stack-lg rounded-media bg-default p-stack-lg sm:grid-cols-3" aria-label={t.fulfillment}>
      <Block title={t.shippingAddress} testId="shipping-address-summary">
        {addressLines(order.shipping_address).map((l, i) => (
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
  )
}

const TONE: Record<string, string> = {
  good: "bg-foreground text-background",
  wait: "ring-1 ring-inset ring-control",
  bad: "ring-1 ring-inset ring-danger text-danger",
  neutral: "bg-background ring-1 ring-inset ring-separator",
}
const toneOf = (s: string) => (["captured", "delivered", "completed", "shipped"].includes(s) ? "good" : ["canceled", "requires_action", "refunded"].includes(s) ? "bad" : ["not_paid", "awaiting", "authorized", "pending"].includes(s) ? "wait" : "neutral")

/** Payment and shipping status as two small chips (a canceled order: one) */
export function OrderStatus({ order, t }: { order: HttpTypes.StoreOrder; t: Dictionary["order"] }) {
  const label = (s: string) => t.statuses[s] ?? s.replace(/_/g, " ")
  const chips = order.status === "canceled" ? [{ k: "status", v: "canceled" }] : [{ k: t.payment, v: String(order.payment_status) }, { k: t.fulfillment, v: String(order.fulfillment_status) }]
  return (
    <div className="flex flex-wrap gap-stack-xs" data-testid="order-status">
      {chips.map((c) => (
        <span key={c.k} className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium ${TONE[toneOf(c.v)]}`}>
          {c.k === "status" ? label(c.v) : `${c.k}: ${label(c.v)}`}
        </span>
      ))}
    </div>
  )
}
