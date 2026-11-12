"use client"

import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { Button } from "@modules/common/components/ui"
import { formatPrice } from "@modules/ds/price-tag"

import Option from "./option"

export type DeliveryLabels = {
  hint: string
  free: string
  calculating: string
  noShipping: string
  errorShipping: string
  continuePayment: string
}

type Priced = Record<string, number | null>

/**
 * Shipping options of the cart as a radio list; choosing one sets it on the cart at once (server action), the
 * button goes on to the payment step. Calculated prices are fetched when the step opens.
 */
export default function Delivery({ cart, options, currency, nextHref, labels: t }: { cart: HttpTypes.StoreCart; options: HttpTypes.StoreCartShippingOption[]; currency: string; nextHref: string; labels: DeliveryLabels }) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(cart.shipping_methods?.at(-1)?.shipping_option_id ?? null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const calculated = options.filter((o) => o.price_type === "calculated")
  const [prices, setPrices] = useState<Priced>(() => Object.fromEntries(calculated.map((o) => [o.id, null])))
  const [loadingPrices, setLoadingPrices] = useState(calculated.length > 0)

  useEffect(() => {
    if (!calculated.length) return
    let live = true
    Promise.allSettled(calculated.map((o) => calculatePriceForShippingOption(o.id, cart.id))).then((results) => {
      if (!live) return
      setPrices(Object.fromEntries(results.map((r, i) => [calculated[i].id, r.status === "fulfilled" && typeof r.value?.shipping_option?.amount === "number" ? r.value.shipping_option.amount : null])))
      setLoadingPrices(false)
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.id])

  const choose = (id: string) => {
    const previous = selected
    setError(null)
    setSelected(id)
    startTransition(async () => {
      try {
        await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      } catch (e) {
        console.error("[checkout] shipping method", e)
        setSelected(previous)
        setError(t.errorShipping)
      }
    })
  }

  const price = (o: HttpTypes.StoreCartShippingOption) => {
    const amount = o.price_type === "flat" ? o.amount : prices[o.id]
    if (o.price_type === "calculated" && loadingPrices) return <span className="text-muted">{t.calculating}</span>
    if (typeof amount !== "number") return "–"
    return amount === 0 ? t.free : formatPrice(amount, currency)
  }

  const ready = !!cart.shipping_methods?.length && !pending

  if (!options.length) {
    return <p className="text-sm text-muted" data-testid="delivery-options-container">{t.noShipping}</p>
  }

  return (
    <div className="flex flex-col gap-stack-lg">
      <p className="text-sm text-muted">{t.hint}</p>
      <div className="flex flex-col gap-stack-sm" role="radiogroup" data-testid="delivery-options-container">
        {options.map((o) => (
          <Option key={o.id} name="shipping_option" value={o.id} checked={selected === o.id} onChange={choose} title={o.name} hint={(o as { metadata?: { description?: string } }).metadata?.description} trailing={price(o)} disabled={o.price_type === "calculated" && !loadingPrices && typeof prices[o.id] !== "number"} testId="delivery-option-radio" />
        ))}
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert" data-testid="delivery-option-error-message">
          {error}
        </p>
      )}
      <Button type="button" size="large" disabled={!ready} isLoading={pending} onClick={() => router.push(nextHref, { scroll: false })} className="sm:self-start sm:px-8" data-testid="submit-delivery-option-button">
        {t.continuePayment}
      </Button>
    </div>
  )
}
