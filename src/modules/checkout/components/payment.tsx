"use client"

import { HttpTypes } from "@medusajs/types"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe, type StripeElementsOptions, type StripeError } from "@stripe/stripe-js"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"

import { isManual, isStripeLike } from "@lib/constants"
import { initiatePaymentSession, placeOrder } from "@lib/data/cart"
import { Button } from "@modules/common/components/ui"

import Option from "./option"

export type PaymentLabels = {
  card: string
  cardHint: string
  manual: string
  manualHint: string
  stripeMissing: string
  loadingPayment: string
  paymentFailed: string
  errorPayment: string
  errorPlaceOrder: string
  placeOrder: string
  consent: string
  selectPayment: string
}

let stripePromise: Promise<Stripe | null> | null = null
const getStripe = (key: string) => (stripePromise ??= loadStripe(key))

const pendingSession = (cart: HttpTypes.StoreCart) => cart.payment_collection?.payment_sessions?.find((s) => s.status === "pending")

/**
 * Payment step: the region's providers as a radio list; choosing one opens a payment session on the cart (server
 * action, the page re-renders with it). Stripe renders its Payment Element inside the option (card, wallets,
 * redirect methods from the Stripe dashboard) and "Place order" confirms the PaymentIntent, then completes the
 * cart. The dev provider (pp_system_default) completes the cart directly. Address, e-mail and a shipping method
 * must already be on the cart.
 */
export default function Payment({ cart, providers, stripeKey, error, labels: t }: { cart: HttpTypes.StoreCart; providers: { id: string }[]; stripeKey: string | null; error: string | null; labels: PaymentLabels }) {
  const session = pendingSession(cart)
  const [selected, setSelected] = useState<string>(() => session?.provider_id ?? (providers.length === 1 ? providers[0].id : ""))
  const [message, setMessage] = useState<string | null>(error === "payment_failed" ? t.paymentFailed : null)
  const [pending, startTransition] = useTransition()
  const started = useRef(false)

  const start = (providerId: string) => {
    setMessage(null)
    startTransition(async () => {
      try {
        await initiatePaymentSession(cart, { provider_id: providerId })
      } catch (e) {
        console.error("[checkout] payment session", e)
        setMessage(t.errorPayment)
      }
    })
  }

  // One provider and no session yet: open it without a click
  useEffect(() => {
    if (started.current || session || providers.length !== 1) return
    started.current = true
    start(providers[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const choose = (id: string) => {
    setSelected(id)
    if (session?.provider_id !== id) start(id)
  }

  const notReady = !cart.shipping_address || !cart.email || !(cart.shipping_methods?.length ?? 0)
  const active = session && session.provider_id === selected ? session : null
  const label = (id: string) => (isStripeLike(id) ? { title: t.card, hint: t.cardHint } : isManual(id) ? { title: t.manual, hint: t.manualHint } : { title: id, hint: undefined })

  const stripeOptions: StripeElementsOptions | null =
    active && isStripeLike(active.provider_id) && typeof active.data?.client_secret === "string"
      ? { clientSecret: active.data.client_secret, appearance: { theme: "stripe", variables: { colorPrimary: "#0c0c0c", colorText: "#0c0c0c", borderRadius: "8px", fontFamily: "system-ui, sans-serif" } } }
      : null

  const body = (
    <div className="flex flex-col gap-stack-lg" data-testid="payment-step">
      <div className="flex flex-col gap-stack-sm" role="radiogroup">
        {providers.map((p) => (
          <Option key={p.id} name="payment_provider" value={p.id} checked={selected === p.id} onChange={choose} title={label(p.id).title} hint={label(p.id).hint} testId={`payment-option-${p.id}`}>
            {isStripeLike(p.id) && (!stripeKey ? <p className="text-sm text-danger">{t.stripeMissing}</p> : stripeOptions ? <PaymentElement options={{ layout: "tabs" }} /> : <p className="text-sm text-muted">{t.loadingPayment}</p>)}
          </Option>
        ))}
      </div>
      {message && (
        <p className="text-sm text-danger" role="alert" data-testid="payment-error-message">
          {message}
        </p>
      )}
      {active && isStripeLike(active.provider_id) ? (
        stripeOptions && stripeKey ? <StripePlaceOrder cart={cart} notReady={notReady || pending} labels={t} onError={setMessage} /> : null
      ) : (
        <ManualPlaceOrder notReady={notReady || pending || !active} labels={t} onError={setMessage} />
      )}
      <p className="text-xs text-muted">{t.consent}</p>
    </div>
  )

  return stripeOptions && stripeKey ? (
    <Elements stripe={getStripe(stripeKey)} options={stripeOptions} key={stripeOptions.clientSecret}>
      {body}
    </Elements>
  ) : (
    body
  )
}

const customerMessage = (e: StripeError | undefined) => (e && (e.type === "card_error" || e.type === "validation_error") && e.message ? e.message : null)

function StripePlaceOrder({ cart, notReady, labels: t, onError }: { cart: HttpTypes.StoreCart; notReady: boolean; labels: PaymentLabels; onError: (m: string | null) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const { countryCode } = useParams() as { countryCode: string }
  const [submitting, setSubmitting] = useState(false)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    if (!elements) return
    const el = elements.getElement("payment")
    if (!el) return
    const onChange = (e: { complete: boolean }) => setComplete(e.complete)
    el.on("change", onChange)
    return () => {
      el.off("change", onChange)
    }
  }, [elements])

  const pay = async () => {
    if (!stripe || !elements) return
    setSubmitting(true)
    onError(null)
    const b = cart.billing_address
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/api/payment-return?cart_id=${cart.id}&country_code=${countryCode}`,
        payment_method_data: {
          billing_details: {
            name: [b?.first_name, b?.last_name].filter(Boolean).join(" "),
            email: cart.email ?? undefined,
            phone: b?.phone ?? undefined,
            address: { city: b?.city ?? undefined, country: b?.country_code?.toUpperCase() ?? undefined, line1: b?.address_1 ?? undefined, line2: b?.address_2 ?? undefined, postal_code: b?.postal_code ?? undefined, state: b?.province ?? undefined },
          },
        },
      },
      // Only redirect-based methods (iDEAL, …) leave the site; cards complete here
      redirect: "if_required",
    })
    const status = paymentIntent?.status ?? error?.payment_intent?.status
    if (status === "succeeded" || status === "requires_capture") {
      await placeOrder().catch((e) => {
        console.error("[checkout] place order", e)
        onError(t.errorPlaceOrder)
        setSubmitting(false)
      })
      return
    }
    if (error) {
      if (!customerMessage(error)) console.error("[checkout] stripe", error)
      onError(customerMessage(error) ?? t.paymentFailed)
    }
    setSubmitting(false)
  }

  return (
    <Button type="button" size="large" disabled={notReady || !stripe || !elements || !complete} isLoading={submitting} onClick={pay} data-testid="submit-order-button">
      {t.placeOrder}
    </Button>
  )
}

function ManualPlaceOrder({ notReady, labels: t, onError }: { notReady: boolean; labels: PaymentLabels; onError: (m: string | null) => void }) {
  const [submitting, setSubmitting] = useState(false)
  const submit = async () => {
    setSubmitting(true)
    onError(null)
    await placeOrder().catch((e) => {
      console.error("[checkout] place order", e)
      onError(t.errorPlaceOrder)
      setSubmitting(false)
    })
  }
  return (
    <Button type="button" size="large" disabled={notReady} isLoading={submitting} onClick={submit} data-testid="submit-order-button">
      {t.placeOrder}
    </Button>
  )
}
