import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import { retrieveOrder } from "@lib/data/orders"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { getMarket, marketPath } from "@lib/util/market"
import Link from "@modules/common/components/app-link"
import { Stack } from "@modules/ds"
import { CARD, OrderLines, OrderMeta, OrderStatus } from "@modules/order/parts"

type Props = { params: Promise<{ countryCode: string; id: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  return { title: getDictionary((await props.params).countryCode).order.details, robots: { index: false, follow: false } }
}

/** Account → Orders → one order: number, date, status chips, lines, totals, address, method, payment */
export default async function OrderDetailPage(props: Props) {
  const { countryCode, id } = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  if (!customer) return null
  const order = await retrieveOrder(id).catch(() => null)
  if (!order) notFound()
  const dict = getDictionary(countryCode)
  const t = dict.order
  const date = new Intl.DateTimeFormat(getMarket(countryCode).locale, { dateStyle: "long" }).format(new Date(order.created_at))

  return (
    <Stack gap="section-head" data-testid="order-details-container">
      <div className="flex flex-wrap items-center justify-between gap-stack-sm">
        <h1 className="type-h1">{fill(t.number, { n: order.display_id ?? "" })}</h1>
        <Link href={marketPath(countryCode, "/account/orders")} prefetch={false} className="text-sm underline-offset-4 hover:underline" data-testid="back-to-overview-button">
          {t.backToOrders}
        </Link>
      </div>
      <Stack gap="sm">
        <p className="text-sm text-muted">
          <span data-testid="order-date">{fill(t.placed, { date })}</span> · <span data-testid="order-email">{order.email}</span>
        </p>
        <OrderStatus order={order} t={t} />
      </Stack>
      <section className={CARD} aria-labelledby="order-items">
        <h2 id="order-items" className="type-h3">
          {t.items}
        </h2>
        <OrderLines order={order} t={t} />
      </section>
      <OrderMeta order={order} t={t} tc={dict.checkout} />
    </Stack>
  )
}
