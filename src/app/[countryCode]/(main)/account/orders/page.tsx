import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { getDictionary } from "@lib/i18n/dictionaries"
import { getMarket, marketPath } from "@lib/util/market"
import OrderCard from "@modules/account/order-card"
import { NoOrders } from "@modules/account/no-orders"
import { Stack } from "@modules/ds"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  return { title: getDictionary((await props.params).countryCode).account.orders, robots: { index: false, follow: false } }
}

/** Account → Orders: every order, newest first */
export default async function OrdersPage(props: Props) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  if (!customer) return null
  const dict = getDictionary(countryCode)
  const t = dict.account
  const orders = (await listOrders(50).catch(() => null)) ?? []
  const href = (p: string) => marketPath(countryCode, p)

  return (
    <Stack gap="section-head" data-testid="orders-page-wrapper">
      <Stack gap="xs">
        <h1 className="type-h1">{t.orders}</h1>
        <p className="text-muted">{t.ordersIntro}</p>
      </Stack>
      {orders.length ? (
        <ul className="flex flex-col gap-stack-sm" data-testid="orders-wrapper">
          {orders.map((o) => (
            <li key={o.id} data-testid="order-wrapper" data-value={o.id}>
              <OrderCard order={o} href={href(`/account/orders/${o.id}`)} locale={getMarket(countryCode).locale} t={t} to={dict.order} />
            </li>
          ))}
        </ul>
      ) : (
        <NoOrders title={t.noOrders} hint={t.noOrdersHint} shop={t.shop} href={href("/store")} />
      )}
    </Stack>
  )
}
