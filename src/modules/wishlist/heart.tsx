"use client"

import { cn } from "@heroui/styles"
import { useEffect, useState } from "react"
import { loadWishlist, toggleWishlist, useWishlistState } from "./store"

/**
 * Heart toggle for a product (card corner or next to the PDP title). Renders unfilled in the static HTML, fills once
 * the shared wishlist state is loaded (modules/wishlist/store.ts). A button, never inside the card's link.
 */
export default function WishlistHeart({
  productId,
  variantId,
  labels,
  variant = "overlay",
  className,
}: {
  productId: string
  variantId?: string | null
  labels: { add: string; remove: string }
  /** overlay: white chip over the photo (cards); inline: plain button (PDP) */
  variant?: "overlay" | "inline"
  className?: string
}) {
  const { ids } = useWishlistState()
  const saved = ids.has(productId)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    void loadWishlist()
  }, [])
  const onClick = async () => {
    if (busy) return
    setBusy(true)
    try {
      await toggleWishlist(productId, variantId)
    } catch {
      /* state rolled back by the store */
    } finally {
      setBusy(false)
    }
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? labels.remove : labels.add}
      data-testid="wishlist-heart"
      data-product-id={productId}
      className={cn(
        "inline-flex items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
        variant === "overlay" ? "chip-over-photo size-11" : "size-11 border border-separator bg-surface hover:border-control",
        className
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill={saved ? "currentColor" : "none"}>
        <path
          d="M12 20.3 4.9 13.6a4.6 4.6 0 0 1 0-6.6 4.7 4.7 0 0 1 6.6 0l.5.5.5-.5a4.7 4.7 0 0 1 6.6 0 4.6 4.6 0 0 1 0 6.6L12 20.3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
