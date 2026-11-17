import type { HttpTypes } from "@medusajs/types"

/** What a cart line needs to render (cart page and drawer share CartLine) */
export type CartLineData = {
  id: string
  title: string
  /** Variant title, null for the default variant */
  variant: string | null
  handle: string | null
  thumbnail: string | null
  /** Alt text of the thumbnail (medusa-image-alt); "" = decorative (the title is next to it) */
  thumbnailAlt: string
  quantity: number
  unitPrice: number
  total: number
}

/** What the drawer reads from /api/cart */
export type CartDrawerData = { id: string | null; currency: string; subtotal: number; count: number; items: CartLineData[] }

/** `alts`: medusa-image-alt texts by image URL (lib/data/image-alt.ts productAlts of the lines' product ids) */
export const toCartLine = (item: HttpTypes.StoreCartLineItem, alts?: Record<string, string>): CartLineData => ({
  id: item.id,
  title: item.product_title ?? item.title ?? "",
  variant: item.variant_title && item.variant_title !== "Default variant" ? item.variant_title : item.variant?.title && item.variant.title !== "Default variant" ? item.variant.title : null,
  handle: item.product_handle ?? null,
  thumbnail: item.thumbnail ?? null,
  thumbnailAlt: (item.thumbnail && alts?.[item.thumbnail]) || "",
  quantity: item.quantity,
  unitPrice: item.unit_price ?? 0,
  total: item.total ?? (item.unit_price ?? 0) * item.quantity,
})
