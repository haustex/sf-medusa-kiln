import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { reviewEligibility } from "@lib/data/reviews"
import { feature } from "@lib/features"

/**
 * "Write a review" on the product page (static, so it cannot know the visitor): which of the logged-in customer's
 * order items of this product can be reviewed right now, per the plugin's rules (the item must have shipped /
 * been delivered and not be reviewed yet). `{ logged_in: false }` without a session. Per visitor, never cached.
 */
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "private, no-store", "Cloudflare-CDN-Cache-Control": "no-store" }
const ID = /^[A-Za-z0-9_-]{1,64}$/

export async function GET(req: Request) {
  if (!(await feature("reviews"))) return Response.json({ message: "Not found" }, { status: 404 })
  const productId = new URL(req.url).searchParams.get("product_id") ?? ""
  if (!ID.test(productId)) return Response.json({ message: "product_id required" }, { status: 400, headers: NO_STORE })
  const customer = await retrieveCustomer().catch(() => null)
  if (!customer) return Response.json({ logged_in: false, items: [] }, { headers: NO_STORE })
  const orders = await listOrders(50, 0, undefined, { fresh: true }).catch(() => [])
  // only orders of this product with something shipped can have reviewable items (same rule as Account → Reviews)
  const candidates = (orders ?? []).filter((o) => o.status !== "canceled" && !["not_fulfilled", "fulfilled", "partially_fulfilled"].includes(String(o.fulfillment_status)) && (o.items ?? []).some((i) => i.product_id === productId))
  const items = (await Promise.all(candidates.map(async (o) => (await reviewEligibility(o.id)).filter((i) => i.reviewable && i.product_id === productId).map((item) => ({ order_id: o.id, display_id: o.display_id as number, item }))))).flat()
  return Response.json({ logged_in: true, items }, { headers: NO_STORE })
}
