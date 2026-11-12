import { Metadata } from "next"
import { redirect } from "next/navigation"

import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDictionary } from "@lib/i18n/dictionaries"
import { marketPath } from "@lib/util/market"
import CheckoutTemplate, { type CheckoutStep } from "@modules/checkout/templates"
import { checkoutStep } from "@modules/cart/templates/summary"

type Props = { params: Promise<{ countryCode: string }>; searchParams: Promise<{ step?: string; error?: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return { title: getDictionary(countryCode).checkout.title, robots: { index: false, follow: false } }
}

const STEPS: CheckoutStep[] = ["address", "delivery", "payment"]

/**
 * /checkout?step=address|delivery|payment. Without a step the first unfinished one opens (cart/templates/summary
 * checkoutStep). No cart or an empty one → back to the cart page. Read fresh: never a cached cart here.
 */
export default async function CheckoutPage(props: Props) {
  const [{ countryCode }, { step, error }] = await Promise.all([props.params, props.searchParams])
  const [cart, customer] = await Promise.all([retrieveCart(undefined, undefined, { fresh: true }).catch(() => null), retrieveCustomer().catch(() => null)])
  if (!cart?.items?.length) redirect(marketPath(countryCode, "/cart"))

  const requested = STEPS.includes(step as CheckoutStep) ? (step as CheckoutStep) : null
  // A later step than the cart allows falls back to the first unfinished one
  const allowed = checkoutStep(cart)
  const current = requested && STEPS.indexOf(requested) <= STEPS.indexOf(allowed) ? requested : allowed

  return <CheckoutTemplate cart={cart} customer={customer} countryCode={countryCode} step={current} error={error ?? null} />
}
