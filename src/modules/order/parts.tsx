import { HttpTypes } from "@medusajs/types"

import { isManual, isStripeLike } from "@lib/constants"
import { type Dictionary } from "@lib/i18n/dictionaries"
import { cleanSlug } from "@lib/util/image-name"
import { getMarket, marketPath } from "@lib/util/market"
import { doitLabels, isDoit } from "@modules/checkout/components/doit/labels"
import Link from "@modules/common/components/app-link"
import CartTotals from "@modules/common/components/cart-totals"
import { ArrowRight, ProductImage } from "@modules/ds"
import { formatPrice } from "@modules/ds/price-tag"
import { labelsFor as transferLabels, pickLocale } from "@modules/manual-transfer/core/labels"
import { isManualTransfer } from "@modules/manual-transfer/core/types"

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

/**
 * Shipping address, delivery method and payment of an order. `transferLink`: show the "payment instructions" link of a
 * bank-transfer order; the tokenless /transfer/{id} page only opens for the logged-in customer who placed it (a guest
 * keeps the tokened link from the order e-mail, and already landed on that page after checkout).
 */
export function OrderMeta({ order, t, tc, countryCode, transferLink = true }: { order: HttpTypes.StoreOrder; t: Dictionary["order"]; tc: Dictionary["checkout"]; countryCode: string; transferLink?: boolean }) {
  const method = order.shipping_methods?.[0]
  // A bank-transfer order has no payment until the money arrived: the session names the provider
  const payment = order.payment_collections?.[0]?.payments?.[0] ?? order.payment_collections?.[0]?.payment_sessions?.[0]
  const lang = getMarket(countryCode).htmlLang
  const transfer = isManualTransfer(payment?.provider_id) ? transferLabels(pickLocale([lang])) : null
  const paymentLabel = payment ? (isStripeLike(payment.provider_id) ? tc.providers.card : transfer ? transfer.method : isDoit(payment.provider_id) ? doitLabels(lang).methodTitle : isManual(payment.provider_id) ? tc.providers.manual : payment.provider_id) : null
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
        {transfer && transferLink && (
          <Link href={marketPath(countryCode, `/transfer/${order.id}`)} prefetch={false} className="inline-flex items-center gap-1 font-medium underline underline-offset-4" data-testid="order-transfer-link">
            {transfer.instructionsLink}
            <ArrowRight />
          </Link>
        )}
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
