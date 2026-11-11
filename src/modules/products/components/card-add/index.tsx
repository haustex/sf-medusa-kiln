"use client"

import { cn } from "@heroui/styles"
import { useEffect, useRef, useState, useTransition } from "react"

import { addToCart } from "@lib/data/cart"
import { notifyCartUpdated } from "@lib/util/cart-events"
import type { ProductCardData } from "@modules/ds"
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
 * one. Sold out: disabled. 44 px target, solid white chip (no blur: a grid has many of these).
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
          // solid white chip (no blur: a grid has many); ink while the tick shows
          state === "added" ? "bg-foreground text-background shadow-soft" : "chip-over-photo",
          state === "error" && "ring-2 ring-danger"
        )}
      >
        {pending ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5 animate-spin motion-reduce:animate-none">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
            <path d="M20 12a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : state === "added" ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
            <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "added" ? `${labels.addedShort}: ${product.title}` : state === "error" ? labels.addError : ""}
      </span>
      {open && <QuickView product={product} countryCode={countryCode} labels={labels} onClose={() => setOpen(false)} />}
    </>
  )
}
