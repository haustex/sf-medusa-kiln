import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { getMarket, marketPath } from "@lib/util/market"
import OrderCard from "@modules/account/order-card"
import { NoOrders } from "@modules/account/no-orders"
import Link from "@modules/common/components/app-link"
import { Stack } from "@modules/ds"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  return { title: getDictionary((await props.params).countryCode).account.title, robots: { index: false, follow: false } }
}

/** Account → Overview: greeting, two small stats, the last three orders */
export default async function AccountOverview(props: Props) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  if (!customer) return null
  const dict = getDictionary(countryCode)
  const t = dict.account
  const orders = (await listOrders(3).catch(() => null)) ?? []
  const href = (p: string) => marketPath(countryCode, p)
  const completion = [customer.email, customer.first_name && customer.last_name, customer.phone, customer.addresses?.length].filter(Boolean).length * 25

  return (
    <Stack gap="section" data-testid="overview-page-wrapper">
      <Stack gap="xs">
        <h1 className="type-h1" data-testid="welcome-message" data-value={customer.first_name}>
          {fill(t.hello, { name: customer.first_name ?? "" })}
        </h1>
        <p className="text-sm text-muted">
          {t.signedInAs}{" "}
          <span className="font-medium text-foreground" data-testid="customer-email">
            {customer.email}
          </span>
        </p>
      </Stack>
      <div className="grid grid-cols-2 gap-gutter">
        <div className="flex flex-col gap-stack-xs rounded-media bg-default p-stack-md">
          <span className="text-sm text-muted">{t.profileDone}</span>
          <span className="text-2xl font-medium tabular-nums" data-testid="customer-profile-completion" data-value={completion}>
            {completion}%
          </span>
        </div>
        <div className="flex flex-col gap-stack-xs rounded-media bg-default p-stack-md">
          <span className="text-sm text-muted">{t.savedAddresses}</span>
          <span className="text-2xl font-medium tabular-nums" data-testid="addresses-count" data-value={customer.addresses?.length ?? 0}>
            {customer.addresses?.length ?? 0}
          </span>
        </div>
      </div>
      <section className="flex flex-col gap-section-head" aria-labelledby="recent-orders">
        <div className="flex items-center justify-between gap-stack-sm">
          <h2 id="recent-orders" className="type-h2">
            {t.recentOrders}
          </h2>
          {orders.length > 0 && (
            <Link href={href("/account/orders")} prefetch={false} className="text-sm underline-offset-4 hover:underline">
              {t.allOrders}
            </Link>
          )}
        </div>
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
      </section>
    </Stack>
  )
}
