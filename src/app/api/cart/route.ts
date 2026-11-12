import { cookies } from "next/headers"

import { retrieveCart } from "@lib/data/cart"
import { toCartLine, type CartDrawerData } from "@modules/cart/components/cart-line/data"

/**
 * The cart for the drawer (CartDrawer), as a small JSON: lines, item subtotal, count. Read fresh on every call,
 * never cached. A plain GET like /api/cart/count, not a server action (see the note there).
 */
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "private, no-store", "Cloudflare-CDN-Cache-Control": "no-store" }
const FIELDS = "id,currency_code,item_subtotal,total,*items,+items.total,+items.product_handle,+items.product_title,+items.thumbnail,*items.variant"

export async function GET() {
  const empty: CartDrawerData = { id: null, currency: "", subtotal: 0, count: 0, items: [] }
  const jar = await cookies()
  if (!jar.get("_medusa_cart_id")?.value) return Response.json(empty, { headers: NO_STORE })
  const cart = await retrieveCart(undefined, FIELDS, { fresh: true }).catch(() => null)
  if (!cart) return Response.json(empty, { headers: NO_STORE })
  const items = [...(cart.items ?? [])].sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1)).map(toCartLine)
  const data: CartDrawerData = {
    id: cart.id,
    currency: cart.currency_code,
    subtotal: cart.item_subtotal ?? cart.subtotal ?? 0,
    count: items.reduce((n, i) => n + i.quantity, 0),
    items,
  }
  return Response.json(data, { headers: NO_STORE })
}
