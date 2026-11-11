import { addToWishlist, getWishlist, removeFromWishlist } from "@lib/data/wishlist"

/**
 * Wishlist state for the heart buttons on statically rendered pages (modules/wishlist/store.ts), like
 * /api/cart/count: a plain GET/POST outside the proxy matcher (no cache-id cookie, no action POST that invalidates
 * prefetches), answered with `private, no-store` on both the browser and Cloudflare so one visitor's list can never
 * be cached for another. GET merges a guest list into the account after login.
 *   GET            → { ids: string[], count, customer }
 *   POST { product_id, variant_id?, action: "add" | "remove" } → the same
 */
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "private, no-store", "Cloudflare-CDN-Cache-Control": "no-store", Vary: "Cookie" }
const ID = /^[A-Za-z0-9_-]{1,64}$/

const json = (view: Awaited<ReturnType<typeof getWishlist>>, status = 200) =>
  Response.json({ ids: view.productIds, count: view.productIds.length, customer: view.customer }, { status, headers: NO_STORE })

export async function GET() {
  return json(await getWishlist())
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { product_id?: unknown; variant_id?: unknown; action?: unknown } | null
  const productId = typeof body?.product_id === "string" && ID.test(body.product_id) ? body.product_id : null
  const variantId = typeof body?.variant_id === "string" && ID.test(body.variant_id) ? body.variant_id : null
  if (!productId || (body?.action !== "add" && body?.action !== "remove")) {
    return Response.json({ message: "product_id and action (add | remove) are required" }, { status: 400, headers: NO_STORE })
  }
  try {
    const view = body.action === "add" ? await addToWishlist(productId, variantId) : await removeFromWishlist(productId)
    return json(view)
  } catch (e) {
    const message = (e as { message?: string })?.message ?? "wishlist error"
    return Response.json({ message }, { status: /not found|404/i.test(message) ? 404 : 502, headers: NO_STORE })
  }
}
