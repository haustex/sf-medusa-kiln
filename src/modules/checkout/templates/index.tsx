import { HttpTypes } from "@medusajs/types"

import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { getMarket, marketPath } from "@lib/util/market"
import config from "@theme"
import { formatPrice } from "@modules/ds/price-tag"

import AddressForm from "../components/address-form"
import Delivery from "../components/delivery"
import Payment from "../components/payment"
import Step, { type StepState } from "../components/step"
import CheckoutSummary from "./summary"

export type CheckoutStep = "address" | "delivery" | "payment"
const ORDER: CheckoutStep[] = ["address", "delivery", "payment"]

const addressLines = (a?: HttpTypes.StoreCartAddress | null) =>
  a
    ? [[a.first_name, a.last_name].filter(Boolean).join(" "), [a.address_1, a.address_2].filter(Boolean).join(", "), [a.postal_code, a.city, a.province].filter(Boolean).join(" "), a.country_code?.toUpperCase()].filter(Boolean)
    : []

/**
 * Checkout: three steps in one column (contact + address, delivery, payment with "Place order") and the order
 * summary beside them. The open step comes from the URL (?step=), the server decides what is done (cart state).
 */
export default async function CheckoutTemplate({ cart, customer, countryCode, step, error }: { cart: HttpTypes.StoreCart; customer: HttpTypes.StoreCustomer | null; countryCode: string; step: CheckoutStep; error: string | null }) {
  const dict = getDictionary(countryCode)
  const t = dict.checkout
  const href = (p: string) => marketPath(countryCode, p)
  const [shippingOptions, paymentProviders] = await Promise.all([
    step === "address" ? Promise.resolve([]) : listCartShippingMethods(cart.id).catch(() => null),
    step === "payment" ? listCartPaymentMethods(cart.region?.id ?? "").catch(() => null) : Promise.resolve(null),
  ])
  const state = (s: CheckoutStep): StepState => (s === step ? "open" : ORDER.indexOf(s) < ORDER.indexOf(step) ? "done" : "todo")
  const method = cart.shipping_methods?.at(-1)
  const shipping = addressLines(cart.shipping_address)

  return (
    <div className="content-container grid items-start gap-section pb-section pt-stack-md lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-16">
      <div className="order-first lg:order-last">
        <CheckoutSummary cart={cart} labels={{ title: t.orderSummary, show: t.showSummary, promo: { label: t.promoAdd, apply: t.promoApply, remove: t.promoRemove, error: t.errorDiscount } }} />
      </div>
      <div className="flex flex-col divide-y divide-separator" data-testid="checkout-form">
        <Step
          index={1}
          title={t.shippingAddress}
          state={state("address")}
          editHref={href("/checkout?step=address")}
          editLabel={t.edit}
          testId="checkout-step-address"
          summary={
            <div className="flex flex-col gap-stack-xs" data-testid="shipping-address-summary">
              <span className="[overflow-wrap:anywhere]">{cart.email}</span>
              <span>{shipping.join(" · ")}</span>
            </div>
          }
        >
          <AddressForm cart={cart} customer={customer} market={countryCode} labels={{ email: t.email, emailInvalid: t.emailInvalid, firstName: t.firstName, lastName: t.lastName, address: t.address, apartment: t.apartment, city: t.city, province: t.province, postalCode: t.postalCode, country: t.country, phone: t.phone, sameBilling: t.sameBilling, billingAddress: t.billingAddress, savedAddresses: t.savedAddresses, newAddress: t.newAddress, continueDelivery: t.continueDelivery, errorAddress: t.errorAddress }} />
        </Step>
        <Step
          index={2}
          title={t.delivery}
          state={state("delivery")}
          editHref={href("/checkout?step=delivery")}
          editLabel={t.edit}
          testId="checkout-step-delivery"
          summary={method && <span data-testid="shipping-method-summary">{`${method.name} · ${method.amount ? formatPrice(method.amount, cart.currency_code) : t.free}`}</span>}
        >
          <Delivery cart={cart} options={shippingOptions ?? []} currency={cart.currency_code} nextHref={href("/checkout?step=payment")} labels={{ hint: t.shippingMethodHint, free: t.free, calculating: t.calculating, noShipping: t.noShipping, errorShipping: t.errorShipping, continuePayment: t.continuePayment }} />
        </Step>
        <Step index={3} title={t.payment} state={state("payment")} editHref={href("/checkout?step=payment")} editLabel={t.edit} testId="checkout-step-payment">
          <Payment
            cart={cart}
            providers={paymentProviders ?? []}
            stripeKey={process.env.NEXT_PUBLIC_STRIPE_KEY || null}
            error={error}
            locale={getMarket(countryCode).htmlLang}
            labels={{ card: t.providers.card, cardHint: t.providers.cardHint, manual: t.providers.manual, manualHint: t.providers.manualHint, stripeMissing: t.stripeMissing, loadingPayment: t.loadingPayment, paymentFailed: t.paymentFailed, errorPayment: t.errorPayment, errorPlaceOrder: t.errorPlaceOrder, placeOrder: t.placeOrder, consent: fill(t.reviewConsent, { brand: config.brand.name }), selectPayment: t.selectPayment }}
          />
        </Step>
      </div>
    </div>
  )
}
