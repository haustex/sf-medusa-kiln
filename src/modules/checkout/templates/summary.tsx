import { HttpTypes } from "@medusajs/types"
import { ChevronDown } from "lucide-react"

import { cleanSlug } from "@lib/util/image-name"
import CartTotals from "@modules/common/components/cart-totals"
import { ProductImage } from "@modules/ds"
import { ICON } from "@modules/ds/icons"
import { formatPrice } from "@modules/ds/price-tag"

import PromoCode, { type PromoLabels } from "../components/promo-code"

export type SummaryLabels = { title: string; show: string; promo: PromoLabels }

function Lines({ cart }: { cart: HttpTypes.StoreCart }) {
  const items = [...(cart.items ?? [])].sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
  return (
    <ul className="flex flex-col gap-stack-md" data-testid="items-table">
      {items.map((item) => {
        const variant = item.variant_title && item.variant_title !== "Default variant" ? item.variant_title : null
        return (
          <li key={item.id} className="flex items-center gap-stack-md" data-testid="product-row">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-background">
              <ProductImage src={item.thumbnail} name={cleanSlug(item.product_handle ?? item.title ?? "item")} alt="" sizes="64px" className="size-full" />
              <span className="absolute -right-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-medium text-background" data-testid="product-quantity">
                {item.quantity}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-stack-xs text-sm">
              <span className="line-clamp-2 font-medium" data-testid="product-title">
                {item.product_title ?? item.title}
              </span>
              {variant && <span className="text-muted">{variant}</span>}
            </span>
            <span className="shrink-0 text-sm tabular-nums" data-testid="product-price">
              {formatPrice(item.total ?? (item.unit_price ?? 0) * item.quantity, cart.currency_code)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Order summary: lines (thumb with quantity badge, title, variant, line total), promotion code, totals. A sticky
 * card on desktop; on phones a collapsed <details> above the steps with the total in its summary line.
 */
export default function CheckoutSummary({ cart, labels: t }: { cart: HttpTypes.StoreCart; labels: SummaryLabels }) {
  const content = (
    <div className="flex flex-col gap-stack-lg">
      <Lines cart={cart} />
      <PromoCode promotions={cart.promotions ?? []} labels={t.promo} />
      <CartTotals totals={cart} />
    </div>
  )
  return (
    <>
      <details className="group rounded-media bg-default lg:hidden" data-testid="summary-details">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-stack-md p-stack-md [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-stack-xs text-sm font-medium">
            {t.show}
            <ChevronDown {...ICON} size={16} className="transition-transform group-open:rotate-180" />
          </span>
          <span className="text-lg font-medium tabular-nums" data-testid="summary-total">
            {formatPrice(cart.total ?? 0, cart.currency_code)}
          </span>
        </summary>
        <div className="px-stack-md pb-stack-md">{content}</div>
      </details>
      <aside className="hidden lg:sticky lg:top-stack-lg lg:block" aria-labelledby="checkout-summary-title">
        <div className="flex flex-col gap-stack-lg rounded-media bg-default p-stack-lg">
          <h2 id="checkout-summary-title" className="type-h3">
            {t.title}
          </h2>
          {content}
        </div>
      </aside>
    </>
  )
}
