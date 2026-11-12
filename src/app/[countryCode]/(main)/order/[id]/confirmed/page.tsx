import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveOrder } from "@lib/data/orders"
import { getDictionary } from "@lib/i18n/dictionaries"
import OrderConfirmed from "@modules/order/confirmed"

type Props = { params: Promise<{ countryCode: string; id: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return { title: getDictionary(countryCode).order.confirmedTitle, robots: { index: false, follow: false } }
}

/** Order confirmation after checkout (placeOrder redirects here). The order is read with the visitor's auth. */
export default async function OrderConfirmedPage(props: Props) {
  const { countryCode, id } = await props.params
  const order = await retrieveOrder(id).catch(() => null)
  if (!order) notFound()
  return <OrderConfirmed order={order} countryCode={countryCode} />
}
