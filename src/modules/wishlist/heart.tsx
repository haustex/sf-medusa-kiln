"use client"

import { cn } from "@heroui/styles"
import { Heart } from "lucide-react"
import { useEffect, useState } from "react"

import { ICON } from "@modules/ds/icons"
import { loadWishlist, toggleWishlist, useWishlistState } from "./store"

/**
 * Heart toggle for a product (card corner, product photo). Renders unfilled in the static HTML, fills once the
 * shared wishlist state is loaded (modules/wishlist/store.ts). A button, never inside the card's link.
 * overlay: a solid heart over a card photo, no background or shadow: cardIconColor (theme.config.ts) when not saved,
 * the opposite tone when saved (white → ink by default); 44 px transparent target.
 * photo: the product page gallery: a glass-photo disc (translucent white + blur) with an ink outline heart, filled when saved.
 * inline: a plain outlined button.
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
  /** overlay: bare icon over a card photo; photo: frost disc over the gallery photo; inline: plain outlined button */
  variant?: "overlay" | "photo" | "inline"
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
        variant === "overlay" ? cn("size-11", saved ? "k-card-icon-alt" : "k-card-icon") : variant === "photo" ? "glass-photo size-11" : "size-11 border border-foreground bg-surface hover:bg-default",
        className
      )}
    >
      {variant === "overlay" ? <Heart {...ICON} size={22} strokeWidth={0} fill="currentColor" /> : <Heart {...ICON} fill={saved ? "currentColor" : "none"} />}
    </button>
  )
}
