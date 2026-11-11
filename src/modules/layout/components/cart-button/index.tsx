import { retrieveCart } from "@lib/data/cart"
import CartLink from "./cart-link"

/** Server part: on dynamic pages the count comes with the HTML. */
export default async function CartButton({ label }: { label: string }) {
  const cart = await retrieveCart().catch(() => null)
  const count = cart ? cart.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0 : null
  return <CartLink initialCount={count} label={label} />
}
