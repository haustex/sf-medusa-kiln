"use client"

import { HttpTypes } from "@medusajs/types"
import { X } from "lucide-react"
import { useSyncExternalStore } from "react"

import { cn } from "@heroui/styles"
import { fill } from "@lib/i18n/fill"
import Link from "@modules/common/components/app-link"
import { formatPrice } from "@modules/ds/price-tag"
import { ICON } from "@modules/ds/icons"

export type NudgeLabels = {
  unlocked: string
  away: string
  progress: string
  dismiss: string
  viewCart: string
}

type Target = { reached: boolean; remaining: number; percent: number }

/** The free-shipping threshold of the cart: the first option whose price is 0 above an `item_total` rule */
export function freeShippingTarget(cart: HttpTypes.StoreCart, options: HttpTypes.StoreCartShippingOption[]): Target | null {
  for (const option of options) {
    for (const price of option.prices ?? []) {
      if (price.currency_code !== cart.currency_code || price.amount !== 0) continue
      const rule = (price.price_rules ?? []).find((r) => r.attribute === "item_total")
      if (!rule) continue
      const target = parseFloat(rule.value)
      if (!Number.isFinite(target) || target <= 0) continue
      const current = cart.item_total ?? 0
      // gt needs one unit more than the threshold; gte / eq the threshold itself
      const needed = rule.operator === "gt" ? target + 1 : target
      const reached = rule.operator === "gt" ? current > target : current >= target
      return {
        reached,
        remaining: reached ? 0 : needed - current,
        percent: Math.min(100, Math.round((current / needed) * 100)),
      }
    }
  }
  return null
}

const KEY = "kiln_free_shipping_dismissed"
// the "dismissed" flag lives in sessionStorage; read through useSyncExternalStore so the server render (true) and
// the first client render agree, and every popup on the page hides at once when one is closed
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const isDismissed = () => sessionStorage.getItem(KEY) === "1"
const dismissForSession = () => {
  sessionStorage.setItem(KEY, "1")
  listeners.forEach((fn) => fn())
}

/**
 * "{amount} away from free shipping" with a progress line, for shops with a free shipping option above an order
 * value (Medusa price rule on `item_total`). `inline` sits in the cart summary; `popup` is a small card in the
 * corner on the catalogue pages, dismissible for the session, gone once the threshold is reached.
 */
export default function FreeShippingPriceNudge({ variant = "inline", cart, shippingOptions, labels: t, cartHref }: { variant?: "popup" | "inline"; cart: HttpTypes.StoreCart; shippingOptions: HttpTypes.StoreCartShippingOption[]; labels: NudgeLabels; cartHref?: string }) {
  const target = freeShippingTarget(cart, shippingOptions)
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true)
  if (!target || !(cart.items?.length ?? 0)) return null

  const text = target.reached ? t.unlocked : fill(t.away, { amount: formatPrice(target.remaining, cart.currency_code) })
  const bar = (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full", variant === "popup" ? "bg-background/30" : "bg-control/40")}
      role="progressbar"
      aria-label={t.progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={target.percent}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", variant === "popup" ? "bg-background" : "bg-foreground")}
        style={{ width: `${target.percent}%` }}
      />
    </div>
  )

  if (variant === "inline") {
    return (
      <div className="flex flex-col gap-stack-sm rounded-media bg-default p-stack-md text-sm" data-testid="free-shipping-nudge">
        <p>{text}</p>
        {bar}
      </div>
    )
  }
  if (dismissed || target.reached) return null
  return (
    <div
      className="fixed inset-x-4 bottom-4 z-40 flex flex-col gap-stack-sm rounded-media bg-foreground p-stack-md text-sm text-background shadow-lift sm:inset-x-auto sm:right-6 sm:w-[22rem]"
      role="status"
      data-testid="free-shipping-nudge"
    >
      <div className="flex items-start justify-between gap-stack-sm">
        <p>{text}</p>
        <button
          type="button"
          aria-label={t.dismiss}
          onClick={dismissForSession}
          className="-mr-2 -mt-2 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-background outline-none hover:bg-background/15 focus-visible:ring-2 focus-visible:ring-focus"
        >
          <X {...ICON} />
        </button>
      </div>
      {bar}
      {cartHref && (
        <Link href={cartHref} prefetch={false} className="w-fit font-medium underline underline-offset-4">
          {t.viewCart}
        </Link>
      )}
    </div>
  )
}
