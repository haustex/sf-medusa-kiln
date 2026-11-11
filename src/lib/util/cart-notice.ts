/** Key the backend fills with the titles of lines it took out (apps/backend/src/lib/cart/unavailable.ts) */
export const REMOVED_ITEMS_KEY = "hk_removed_items"

/** Titles of lines taken out of the cart because their product is no longer for sale */
export const removedItems = (cart: { metadata?: Record<string, unknown> | null } | null | undefined): string[] => {
  const v = cart?.metadata?.[REMOVED_ITEMS_KEY]
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x) : []
}
