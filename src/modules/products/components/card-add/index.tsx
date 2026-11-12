"use client"

import { cn } from "@heroui/styles"
import { Check, LoaderCircle, Plus } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"

import { addToCart } from "@lib/data/cart"
import { notifyCartUpdated, openCart } from "@lib/util/cart-events"
import type { ProductCardData } from "@modules/ds"
import { ICON } from "@modules/ds/icons"
import QuickView, { type QuickViewLabels } from "./quick-view"

export type CardAddLabels = QuickViewLabels & {
  /** "Add {title} to cart" */
  addToCartTitle: string
  /** "Choose options for {title}" */
  chooseOptions: string
  addedShort: string
  addError: string
  soldOut: string
}

const fill = (s: string, title: string) => s.replace("{title}", title)

/**
 * The "+" in a card's bottom-right corner. One variant: adds it straight to the cart (spinner while pending, a tick
 * for 1.6 s, the header count refreshes through CART_UPDATED_EVENT). Several variants: opens the quick view to pick
 * one. Sold out: disabled. 44 px transparent target; the icon alone over the photo (k-card-icon).
 */
export default function CardAdd({ product, countryCode, labels }: { product: ProductCardData; countryCode: string; labels: CardAddLabels }) {
  const [pending, start] = useTransition()
  const [state, setState] = useState<"idle" | "added" | "error">("idle")
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const variants = product.variants ?? []
  const single = variants.length === 1 ? variants[0] : null
  const soldOut = !!product.soldOut || (variants.length > 0 && !variants.some((v) => v.inStock))
  const flash = (next: "added" | "error") => {
    setState(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState("idle"), next === "added" ? 1600 : 3000)
  }

  const onClick = () => {
    if (soldOut || pending) return
    if (!single) {
      setOpen(true)
      return
    }
    start(async () => {
      try {
        await addToCart({ variantId: single.id, quantity: 1, countryCode })
        notifyCartUpdated()
        openCart()
        flash("added")
      } catch {
        flash("error")
      }
    })
  }

  const label = soldOut ? `${labels.soldOut}: ${product.title}` : single ? fill(labels.addToCartTitle, product.title) : fill(labels.chooseOptions, product.title)
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={soldOut}
        aria-disabled={soldOut || pending || undefined}
        aria-busy={pending || undefined}
        aria-label={label}
        aria-haspopup={!single && !soldOut ? "dialog" : undefined}
        title={soldOut ? labels.soldOut : undefined}
        data-testid="card-add"
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // bare icon over the photo (k-card-icon: colour from theme.config.ts cardIconColor), no background or shadow
          "k-card-icon",
          state === "error" && "ring-2 ring-danger"
        )}
      >
        {pending ? (
          <LoaderCircle {...ICON} size={22} strokeWidth={2} className="animate-spin motion-reduce:animate-none" />
        ) : state === "added" ? (
          <Check {...ICON} size={22} strokeWidth={2} />
        ) : (
          <Plus {...ICON} size={22} strokeWidth={2} />
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "added" ? `${labels.addedShort}: ${product.title}` : state === "error" ? labels.addError : ""}
      </span>
      {open && <QuickView product={product} countryCode={countryCode} labels={labels} onClose={() => setOpen(false)} />}
    </>
  )
}
