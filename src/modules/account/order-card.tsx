import { HttpTypes } from "@medusajs/types"

import { type Dictionary, fill } from "@lib/i18n/dictionaries"
import { cleanSlug } from "@lib/util/image-name"
import Link from "@modules/common/components/app-link"
import { ProductImage } from "@modules/ds"
import { formatPrice } from "@modules/ds/price-tag"
import { OrderStatus } from "@modules/order/parts"

/** One order in Account → Orders: number, date, item count, total, status chips, up to 4 thumbnails */
export default function OrderCard({ order, href, locale, t, to }: { order: HttpTypes.StoreOrder; href: string; locale: string; t: Dictionary["account"]; to: Dictionary["order"] }) {
  const qty = order.items?.reduce((n, i) => n + i.quantity, 0) ?? 0
  const items = order.items ?? []
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(order.created_at))
  return (
    <Link href={href} prefetch={false} className="group flex flex-col gap-stack-md rounded-media bg-default p-stack-md outline-none transition-shadow hover:ring-1 hover:ring-foreground focus-visible:ring-2 focus-visible:ring-focus" data-testid="order-card">
      <div className="flex flex-wrap items-start justify-between gap-stack-sm">
        <div className="flex flex-col gap-stack-xs">
          <span className="font-medium">
            #<span data-testid="order-display-id">{order.display_id}</span>
          </span>
          <span className="text-sm text-muted" data-testid="order-created-at">
            {date} · {qty === 1 ? t.itemOne : fill(t.items, { n: qty })}
          </span>
        </div>
        <span className="font-medium tabular-nums" data-testid="order-amount">
          {formatPrice(order.total, order.currency_code)}
        </span>
      </div>
      <OrderStatus order={order} t={to} />
      <div className="flex items-center gap-stack-sm">
        {items.slice(0, 4).map((i) => (
          <span key={i.id} className="relative size-14 shrink-0 overflow-hidden rounded-md bg-background" data-testid="order-item">
            <ProductImage src={i.thumbnail} name={cleanSlug(i.product_handle ?? i.title ?? "item")} alt="" sizes="56px" className="size-full" />
          </span>
        ))}
        {items.length > 4 && <span className="text-sm text-muted">{fill(t.more, { n: items.length - 4 })}</span>}
        <span className="ml-auto text-sm font-medium underline-offset-4 group-hover:underline" data-testid="order-details-link">
          {t.details}
        </span>
      </div>
    </Link>
  )
}
