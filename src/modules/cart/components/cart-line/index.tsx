"use client"

import { cn } from "@heroui/styles"
import { Minus, Plus, X } from "lucide-react"
import { useParams } from "next/navigation"
import { useState } from "react"

import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { cleanSlug } from "@lib/util/image-name"
import { marketPath } from "@lib/util/market"
import Link from "@modules/common/components/app-link"
import { ProductImage } from "@modules/ds"
import { ICON } from "@modules/ds/icons"
import { formatPrice } from "@modules/ds/price-tag"
import type { CartLineData } from "./data"

const MAX_QTY = 10

export type CartLineLabels = {
  quantity: string
  decrease: string
  increase: string
  remove: string
  each: string
  removeFailed: string
  updateFailed: string
}

/**
 * One cart line: 1:1 thumbnail, title (link) + variant, unit price, quantity stepper (Minus/Plus, 44 px targets),
 * remove, line total. Mutations are the cart server actions (updateLineItem / deleteLineItem); afterwards
 * CART_UPDATED_EVENT refreshes the header count and the drawer, and the cart page re-renders from the action.
 * `compact`: the drawer layout (smaller photo, remove as an X).
 */
export default function CartLine({ item, currency, labels: t, compact, onClose }: { item: CartLineData; currency: string; labels: CartLineLabels; compact?: boolean; /** Drawer: close it when the title is followed */ onClose?: () => void }) {
  const { countryCode } = useParams() as { countryCode: string }
  const [busy, setBusy] = useState<"qty" | "remove" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setQty = async (quantity: number) => {
    if (quantity < 1 || quantity > MAX_QTY || busy) return
    setError(null)
    setBusy("qty")
    await updateLineItem({ lineId: item.id, quantity })
      .then(notifyCartUpdated)
      // Never the raw error (server actions surface minified React/Next errors); details are in the server log
      .catch((e) => {
        console.error("[cart] update line failed", e)
        setError(t.updateFailed)
      })
      .finally(() => setBusy(null))
  }

  const remove = async () => {
    if (busy) return
    setError(null)
    setBusy("remove")
    await deleteLineItem(item.id)
      .then(notifyCartUpdated)
      .catch((e) => {
        console.error("[cart] remove line failed", e)
        setError(t.removeFailed)
        setBusy(null)
      })
  }

  const href = item.handle ? marketPath(countryCode, `/products/${item.handle}`) : null
  const stepBtn = "flex size-11 items-center justify-center rounded-control outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-focus disabled:text-muted disabled:hover:bg-transparent"
  const title = href ? (
    <Link href={href} onClick={onClose} className="font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus rounded-sm" data-testid="product-title">
      {item.title}
    </Link>
  ) : (
    <span className="font-medium" data-testid="product-title">{item.title}</span>
  )

  return (
    <li className={cn("flex gap-stack-md", compact ? "py-stack-md" : "py-stack-lg", busy === "remove" && "opacity-50")} aria-busy={!!busy} data-testid="product-row">
      <div className={cn("shrink-0", compact ? "w-20" : "w-20 sm:w-28")}>
        <ProductImage src={item.thumbnail} name={cleanSlug(item.handle ?? "product")} alt="" sizes="112px" className="rounded-media" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-stack-sm">
        <div className="flex items-start justify-between gap-stack-md">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title}
            {item.variant && (
              <p className="text-sm text-muted" data-testid="product-variant">
                {item.variant}
              </p>
            )}
            <p className="type-price text-sm text-muted">
              {formatPrice(item.unitPrice, currency)} {t.each}
            </p>
          </div>
          {compact ? (
            <button type="button" onClick={remove} disabled={!!busy} aria-label={`${t.remove}: ${item.title}`} className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus" data-testid="product-delete-button">
              <X {...ICON} size={18} />
            </button>
          ) : (
            <p className="type-price shrink-0 font-medium" data-testid="product-price">
              {formatPrice(item.total, currency)}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-stack-md">
          <div className="flex h-11 items-center rounded-control border border-control" aria-busy={busy === "qty"}>
            <button type="button" aria-label={t.decrease} onClick={() => setQty(item.quantity - 1)} disabled={item.quantity <= 1 || !!busy} className={stepBtn}>
              <Minus {...ICON} size={16} />
            </button>
            <span className="type-price w-8 text-center" aria-label={`${t.quantity}: ${item.quantity}`} data-testid="product-select-button">
              {item.quantity}
            </span>
            <button type="button" aria-label={t.increase} onClick={() => setQty(item.quantity + 1)} disabled={item.quantity >= MAX_QTY || !!busy} className={stepBtn}>
              <Plus {...ICON} size={16} />
            </button>
          </div>
          {compact ? (
            <p className="type-price font-medium" data-testid="product-price">
              {formatPrice(item.total, currency)}
            </p>
          ) : (
            <button type="button" onClick={remove} disabled={!!busy} className="inline-flex h-11 items-center rounded-sm px-stack-sm text-sm text-muted underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-focus" data-testid="product-delete-button">
              {t.remove}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-danger" role="alert" data-testid="product-error-message">
            {error}
          </p>
        )}
      </div>
    </li>
  )
}
