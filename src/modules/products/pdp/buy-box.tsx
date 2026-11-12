"use client"

import { buttonVariants, cn } from "@heroui/styles"
import { Check, Minus, Plus } from "lucide-react"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"

import { addToCart } from "@lib/data/cart"
import { notifyCartUpdated, openCart } from "@lib/util/cart-events"
import Link from "@modules/common/components/app-link"
import { ICON } from "@modules/ds/icons"
import { formatPrice } from "@modules/ds/price-tag"

export type BuyBoxVariant = {
  id: string
  /** option_id -> value */
  options: Record<string, string>
  amount: number | null
  original: number | null
  inStock: boolean
  /** Units left when stock is low (managed inventory), else null */
  low: number | null
}

export type BuyBoxLabels = {
  quantity: string
  decrease: string
  increase: string
  addToCart: string
  /** "Add to cart · {price}" */
  addToCartPrice: string
  add: string
  adding: string
  added: string
  viewCart: string
  addError: string
  unavailable: string
  soldOut: string
  inStock: string
  /** "In stock · ships from {location}" (already filled) */
  shipsFrom: string
  lowStock: string
  from: string
}

type Props = {
  productId: string
  title: string
  countryCode: string
  currency: string
  /** Options with more than one value; empty for single-variant products */
  options: { id: string; title: string; values: string[] }[]
  variants: BuyBoxVariant[]
  defaultVariantId?: string
  actionUrl: string
  cartUrl: string
  /** Extra lines under the button (theme.config.ts product.notes) */
  notes?: string[]
  /** The inline wishlist heart, rendered next to the button */
  heart?: React.ReactNode
  labels: BuyBoxLabels
}

const MAX_QTY = 10
const sameOptions = (a: Record<string, string>, b: Record<string, string | undefined>) =>
  Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => b[k] === v)

/**
 * Product page price, option chips, quantity and add to cart (plus the wishlist heart slot). Without JavaScript the
 * form posts to /cart/add (radios carry `options[...]`). On phones a frost bar with the price and the button sticks
 * to the bottom once the main button has scrolled out above (transform only, CLS 0).
 */
export default function BuyBox({ productId, title, countryCode, currency, options, variants, defaultVariantId, actionUrl, cartUrl, notes = [], heart, labels: t }: Props) {
  const initial = variants.find((v) => v.id === defaultVariantId) ?? variants.find((v) => v.inStock) ?? variants[0]
  const [selected, setSelected] = useState<Record<string, string | undefined>>(initial?.options ?? {})
  const [qty, setQty] = useState(1)
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle")
  const [showBar, setShowBar] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const variant = useMemo(() => variants.find((v) => sameOptions(v.options, selected)), [variants, selected])

  // `?v_id=` deep links (the page itself is static)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("v_id")
    const v = variants.find((x) => x.id === id)
    if (v) setSelected(v.options)
  }, [variants])

  // Sticky bar on phones once the form has scrolled out of view above
  useEffect(() => {
    const el = formRef.current
    if (!el || !("IntersectionObserver" in window)) return
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (showBar) root.dataset.stickyBar = ""
    else delete root.dataset.stickyBar
    return () => {
      delete root.dataset.stickyBar
    }
  }, [showBar])

  const select = (optionId: string, value: string) => {
    setSelected((s) => ({ ...s, [optionId]: value }))
    if (status !== "adding") setStatus("idle")
  }

  const prices = variants.map((v) => v.amount).filter((a): a is number => a !== null)
  const minPrice = prices.length ? Math.min(...prices) : null
  const shownAmount = variant?.amount ?? minPrice
  const varies = !variant && new Set(prices).size > 1
  const onSale = variant?.original != null && variant.amount != null && variant.original > variant.amount
  const canBuy = !!variant?.inStock && status !== "adding"
  const price = shownAmount !== null ? formatPrice(shownAmount, currency) : null

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!variant || !canBuy) return
    setStatus("adding")
    try {
      await addToCart({ variantId: variant.id, quantity: qty, countryCode })
      notifyCartUpdated()
      openCart()
      setStatus("added")
    } catch {
      setStatus("error")
    }
  }

  const availability = !variant ? t.unavailable : !variant.inStock ? t.soldOut : variant.low ? t.lowStock.replace("{n}", String(variant.low)) : t.shipsFrom
  const buttonLabel = status === "adding" ? t.adding : variant && !variant.inStock ? t.soldOut : price ? t.addToCartPrice.replace("{price}", price) : t.addToCart
  const primary = cn(buttonVariants({ variant: "primary", size: "lg" }), "h-12 min-w-0 flex-1")
  const chip = "flex h-11 min-w-11 cursor-pointer select-none items-center justify-center rounded-control border border-foreground bg-background px-4 text-sm transition-colors hover:bg-default peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2"

  return (
    <>
      {price && (
        <p className="flex flex-wrap items-baseline gap-x-stack-sm type-price text-2xl tracking-tight" data-testid="product-price">
          {varies && <span className="text-base text-muted">{t.from}</span>}
          <span className="font-medium">{price}</span>
          {onSale && <s className="text-base text-muted">{formatPrice(variant!.original!, currency)}</s>}
        </p>
      )}

      <form ref={formRef} method="post" action={actionUrl} onSubmit={submit} className="flex flex-col gap-stack-lg" {...{ toolname: "add_to_cart", tooldescription: "Add the selected product variant to the shopping cart" }}>
        <input type="hidden" name="product_id" value={productId} />
        {!options.length && variant && <input type="hidden" name="variant_id" value={variant.id} />}

        {options.map((o) => (
          <fieldset key={o.id} className="flex flex-col gap-stack-sm">
            <legend className="flex w-full items-baseline justify-between text-sm">
              <span className="font-medium">{o.title}</span>
              {selected[o.id] && <span className="text-muted">{selected[o.id]}</span>}
            </legend>
            <div className="flex flex-wrap gap-stack-sm">
              {o.values.map((value) => {
                // Only single-option products can tell a value is sold out on its own
                const v = options.length === 1 ? variants.find((x) => x.options[o.id] === value) : undefined
                const out = !!v && !v.inStock
                return (
                  <label key={value} className="relative">
                    <input type="radio" name={`options[${o.id}]`} value={value} checked={selected[o.id] === value} onChange={() => select(o.id, value)} className="peer sr-only" />
                    <span className={cn(chip, out && "border-dashed text-muted")}>
                      {value}
                      {out && <span className="ml-1.5 text-xs">· {t.soldOut.toLowerCase()}</span>}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}

        <div className="flex gap-stack-sm">
          <div className="flex h-12 shrink-0 items-center rounded-control border border-foreground bg-background">
            <button type="button" aria-label={t.decrease} onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="flex size-11 items-center justify-center rounded-control outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:text-muted">
              <Minus {...ICON} size={16} />
            </button>
            <label className="sr-only" htmlFor="pdp-qty">
              {t.quantity}
            </label>
            <input id="pdp-qty" name="quantity" type="number" inputMode="numeric" min={1} max={MAX_QTY} value={qty} onChange={(e) => setQty(Math.min(MAX_QTY, Math.max(1, Number(e.target.value) || 1)))} className="w-8 appearance-none bg-transparent text-center type-price outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
            <button type="button" aria-label={t.increase} onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} className="flex size-11 items-center justify-center rounded-control outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:text-muted">
              <Plus {...ICON} size={16} />
            </button>
          </div>
          <button type="submit" disabled={!canBuy} className={primary} data-testid="add-product-button">
            <span className="truncate">{buttonLabel}</span>
          </button>
          {heart}
        </div>

        <div role="status" aria-live="polite" className="min-h-0 text-sm empty:hidden">
          {status === "added" && (
            <p className="flex flex-wrap items-center gap-x-stack-sm gap-y-stack-xs rounded-control border border-separator px-stack-md py-stack-sm">
              <Check {...ICON} size={16} />
              <span>{t.added}</span>
              <Link href={cartUrl} className="ml-auto font-medium underline underline-offset-4">
                {t.viewCart}
              </Link>
            </p>
          )}
          {status === "error" && <p className="rounded-control border border-separator px-stack-md py-stack-sm text-danger">{t.addError}</p>}
        </div>

        <ul className="flex flex-col gap-stack-xs text-sm text-muted" data-testid="product-availability">
          <li className="flex items-start gap-stack-sm">
            <span aria-hidden="true" className={cn("mt-[0.45em] size-1.5 shrink-0 rounded-full", variant?.inStock ? "bg-foreground" : "border border-foreground")} />
            {availability}
          </li>
          {notes.map((n) => (
            <li key={n} className="flex items-start gap-stack-sm">
              <span aria-hidden="true" className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-foreground" />
              {n}
            </li>
          ))}
        </ul>
      </form>

      {/* Phone sticky bar (frost) */}
      <div
        aria-hidden={!showBar}
        inert={!showBar}
        className={cn(
          "frost fixed inset-x-0 bottom-0 z-40 border-t border-separator px-container-x pb-[max(var(--space-stack-sm),env(safe-area-inset-bottom))] pt-stack-sm transition-transform duration-200 motion-reduce:transition-none lg:hidden",
          showBar ? "translate-y-0" : "translate-y-full"
        )}
        data-testid="sticky-bar"
      >
        <div className="flex items-center gap-stack-md">
          <div className="min-w-0 flex-1">
            {variant && options.length > 0 ? <p className="truncate text-sm text-muted">{Object.values(selected).join(" · ")}</p> : <p className="truncate text-sm text-muted">{title}</p>}
            {price && <p className="type-price text-lg font-medium">{price}</p>}
          </div>
          <button type="button" onClick={() => submit()} disabled={!canBuy} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "h-12 px-8")}>
            {status === "adding" ? t.adding : status === "added" ? t.added : variant && !variant.inStock ? t.soldOut : t.addToCart}
          </button>
        </div>
      </div>
    </>
  )
}
