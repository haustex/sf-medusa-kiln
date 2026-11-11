import { formatPrice } from "@modules/ds/price-tag"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
    shipping_methods?: unknown[] | null
  }
}

// Each market has one currency, so the currency picks the language (cart,
// checkout and order pages share this component).
const LABELS = {
  idr: { subtotal: "Subtotal", shipping: "Ongkos kirim", later: "Dihitung saat checkout", discount: "Diskon", taxes: "Pajak", total: "Total" },
  usd: { subtotal: "Subtotal", shipping: "Shipping", later: "Calculated at checkout", discount: "Discount", taxes: "Taxes", total: "Total" },
}

/** Totals rows (server or client). Medusa amounts are whole units. */
const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const { currency_code, total, tax_total, item_subtotal, shipping_subtotal, discount_subtotal, shipping_methods } = totals
  const t = LABELS[currency_code?.toLowerCase() as keyof typeof LABELS] ?? LABELS.usd
  const money = (n?: number | null) => formatPrice(n ?? 0, currency_code)
  const noShippingYet = Array.isArray(shipping_methods) && shipping_methods.length === 0

  return (
    <div className="flex flex-col gap-stack-md text-sm">
      <dl className="flex flex-col gap-stack-sm">
        <div className="flex items-center justify-between gap-stack-md">
          <dt className="text-muted">{t.subtotal}</dt>
          <dd className="tabular-nums" data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {money(item_subtotal)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-stack-md">
          <dt className="text-muted">{t.shipping}</dt>
          <dd className="tabular-nums" data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {noShippingYet && !shipping_subtotal ? <span className="text-muted">{t.later}</span> : money(shipping_subtotal)}
          </dd>
        </div>
        {!!discount_subtotal && (
          <div className="flex items-center justify-between gap-stack-md">
            <dt className="text-muted">{t.discount}</dt>
            <dd className="tabular-nums text-foreground" data-testid="cart-discount" data-value={discount_subtotal || 0}>
              -{money(discount_subtotal)}
            </dd>
          </div>
        )}
        {!!tax_total && (
          <div className="flex items-center justify-between gap-stack-md">
            <dt className="text-muted">{t.taxes}</dt>
            <dd className="tabular-nums" data-testid="cart-taxes" data-value={tax_total || 0}>
              {money(tax_total)}
            </dd>
          </div>
        )}
      </dl>
      <div className="flex items-baseline justify-between gap-stack-md border-t border-separator pt-stack-md">
        <span className="font-medium">{t.total}</span>
        <span className="text-xl font-medium tabular-nums" data-testid="cart-total" data-value={total || 0}>
          {money(total)}
        </span>
      </div>
    </div>
  )
}

export default CartTotals
