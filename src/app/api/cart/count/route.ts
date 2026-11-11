import { cookies } from "next/headers"

import { retrieveCart } from "@lib/data/cart"

/**
 * Item count for the cart button on statically rendered pages (CartLink).
 *
 * A plain GET on purpose, not a server action: a server action is a POST, so proxy.ts sets the
 * `_medusa_cache_id` cookie on it for a first-time visitor, Next counts that as a cookie mutation
 * (`x-action-revalidated: 1`) and the browser throws away every prefetched route and fetches them
 * all again (home: 26 RSC requests instead of 17). `/api` is outside the proxy matcher, so nothing
 * is set here and nothing is invalidated.
 */
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "private, no-store", "Cloudflare-CDN-Cache-Control": "no-store" }

export async function GET() {
  const jar = await cookies()
  if (!jar.get("_medusa_cart_id")?.value) {
    return Response.json({ count: 0 }, { headers: NO_STORE })
  }
  const cart = await retrieveCart(undefined, "id,items.quantity", { fresh: true }).catch(() => null)
  const count = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0
  return Response.json({ count }, { headers: NO_STORE })
}
