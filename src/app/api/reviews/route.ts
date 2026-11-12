import { feature } from "@lib/features"
import { getAuthHeaders } from "@lib/data/cookies"
import { listProductReviews } from "@lib/data/reviews"

/**
 * Reviews of medusa-reviews-wishlist, through the storefront so the browser never talks to the backend directly.
 *   GET ?product_id=&offset=&limit=  → approved reviews (public, short cache): "Show more" on the product page
 *   POST { order_id | request_token, reviews: [...], website: "" } → create (customer cookie or magic-link token)
 */
export const dynamic = "force-dynamic"

const OFF = () => Response.json({ message: "Not found" }, { status: 404 })

const NO_STORE = { "Cache-Control": "private, no-store", "Cloudflare-CDN-Cache-Control": "no-store" }
const PUBLIC = { "Cache-Control": "public, max-age=60", "Cloudflare-CDN-Cache-Control": "max-age=60" }
const BACKEND = (process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
const ID = /^[A-Za-z0-9_-]{1,64}$/

export async function GET(req: Request) {
  if (!(await feature("reviews"))) return OFF()
  const url = new URL(req.url)
  const productId = url.searchParams.get("product_id") ?? ""
  if (!ID.test(productId)) return Response.json({ message: "product_id required" }, { status: 400, headers: NO_STORE })
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0)
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10) || 10))
  const page = await listProductReviews(productId, { offset, limit })
  return Response.json(page, { headers: PUBLIC })
}

export async function POST(req: Request) {
  if (!(await feature("reviews"))) return OFF()
  const raw = await req.text()
  if (raw.length > 64 * 1024) return Response.json({ message: "too large" }, { status: 413, headers: NO_STORE })
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return Response.json({ message: "invalid json" }, { status: 400, headers: NO_STORE })
  }
  // Honeypot: the hidden "website" field stays empty for humans. A filled one gets a fake success and nothing is
  // forwarded; the backend's strict validator never sees the field.
  const { website, ...rest } = parsed
  if (typeof website === "string" && website.trim()) return Response.json({ reviews: [] }, { status: 201, headers: NO_STORE })
  const body = JSON.stringify(rest)
  const res = await fetch(`${BACKEND}/store/reviews`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      "accept-language": req.headers.get("accept-language") ?? "",
      ...(await getAuthHeaders()),
    },
    body,
    cache: "no-store",
  })
  const text = await res.text()
  return new Response(text, { status: res.status, headers: { ...NO_STORE, "content-type": res.headers.get("content-type") ?? "application/json" } })
}
