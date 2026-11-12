import { Metadata } from "next"

import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDictionary } from "@lib/i18n/dictionaries"
import CartTemplate from "@modules/cart/templates"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return { title: getDictionary(countryCode).cart.title, robots: { index: false, follow: false } }
}

/** /cart: read fresh (the backend drops lines of products no longer for sale on every read) */
export default async function CartPage(props: Props) {
  const { countryCode } = await props.params
  const [cart, customer] = await Promise.all([retrieveCart(undefined, undefined, { fresh: true }).catch(() => null), retrieveCustomer().catch(() => null)])
  return <CartTemplate cart={cart} customer={customer} countryCode={countryCode} />
}
