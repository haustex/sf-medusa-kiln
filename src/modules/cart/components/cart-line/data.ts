import type { HttpTypes } from "@medusajs/types"

/** What a cart line needs to render (cart page and drawer share CartLine) */
export type CartLineData = {
  id: string
  title: string
  /** Variant title, null for the default variant */
  variant: string | null
  handle: string | null
  thumbnail: string | null
  quantity: number
  unitPrice: number
  total: number
}

/** What the drawer reads from /api/cart */
export type CartDrawerData = { id: string | null; currency: string; subtotal: number; count: number; items: CartLineData[] }

export const toCartLine = (item: HttpTypes.StoreCartLineItem): CartLineData => ({
  id: item.id,
  title: item.product_title ?? item.title ?? "",
  variant: item.variant_title && item.variant_title !== "Default variant" ? item.variant_title : item.variant?.title && item.variant.title !== "Default variant" ? item.variant.title : null,
  handle: item.product_handle ?? null,
  thumbnail: item.thumbnail ?? null,
  quantity: item.quantity,
  unitPrice: item.unit_price ?? 0,
  total: item.total ?? (item.unit_price ?? 0) * item.quantity,
})
