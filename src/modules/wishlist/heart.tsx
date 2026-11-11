"use client"

import { cn } from "@heroui/styles"
import { Heart } from "lucide-react"
import { useEffect, useState } from "react"

import { ICON } from "@modules/ds/icons"
import { loadWishlist, toggleWishlist, useWishlistState } from "./store"

/**
 * Heart toggle for a product (card corner or next to the PDP title). Renders unfilled in the static HTML, fills once
 * the shared wishlist state is loaded (modules/wishlist/store.ts). A button, never inside the card's link.
 * overlay: a solid heart over the photo, no background or shadow: cardIconColor (theme.config.ts) when not saved,
 * the opposite tone when saved (white → ink by default); 44 px transparent target.
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
        variant === "overlay" ? cn("size-11", saved ? "k-card-icon-alt" : "k-card-icon") : "size-11 border border-foreground bg-surface hover:bg-default",
        className
      )}
    >
      {variant === "overlay" ? <Heart {...ICON} size={22} strokeWidth={0} fill="currentColor" /> : <Heart {...ICON} fill={saved ? "currentColor" : "none"} />}
    </button>
  )
}
