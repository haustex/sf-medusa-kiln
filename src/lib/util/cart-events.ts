export const CART_UPDATED_EVENT = "medusa:cart-updated"
export const CART_OPEN_EVENT = "medusa:cart-open"

/** Lets client-loaded cart UI (header count, drawer) refresh after a mutation on statically rendered pages. */
export const notifyCartUpdated = () => {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}

/** Opens the cart drawer (layout/components/cart-drawer): the header button and every add to cart call it. */
export const openCart = () => {
  window.dispatchEvent(new Event(CART_OPEN_EVENT))
}
