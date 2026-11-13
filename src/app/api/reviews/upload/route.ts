import { feature } from "@lib/features"
import { getAuthHeaders } from "@lib/data/cookies"

/**
 * Review photos → the plugin's POST /store/reviews/uploads (multipart `files`), stored private until the review is
 * approved. Auth: the customer cookie, or the magic-link token in `x-review-token` (forwarded as is). Limits match
 * the form (modules/reviews/review-form.tsx): 3 photos of 5 MB.
 */
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "private, no-store", "Cloudflare-CDN-Cache-Control": "no-store" }
const BACKEND = (process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
const MAX_BODY = 3 * 5 * 1024 * 1024 + 64 * 1024
const TOKEN = /^[A-Za-z0-9_.-]{16,256}$/

export async function POST(req: Request) {
  if (!(await feature("reviews"))) return Response.json({ message: "Not found" }, { status: 404 })
  const length = Number(req.headers.get("content-length") ?? 0)
  if (length > MAX_BODY) return Response.json({ message: "too large" }, { status: 413, headers: NO_STORE })
  const form = await req.formData().catch(() => null)
  if (!form) return Response.json({ message: "multipart form expected" }, { status: 400, headers: NO_STORE })
  const out = new FormData()
  let total = 0
  for (const f of form.getAll("files")) {
    if (!(f instanceof File) || !f.size) continue
    total += f.size
    if (total > MAX_BODY) return Response.json({ message: "too large" }, { status: 413, headers: NO_STORE })
    out.append("files", f, f.name || "photo")
  }
  const token = req.headers.get("x-review-token") ?? ""
  const res = await fetch(`${BACKEND}/store/reviews/uploads`, {
    method: "POST",
    headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "", ...(TOKEN.test(token) ? { "x-review-token": token } : {}), ...(await getAuthHeaders()) },
    body: out,
    cache: "no-store",
  })
  const text = await res.text()
  return new Response(text, { status: res.status, headers: { ...NO_STORE, "content-type": res.headers.get("content-type") ?? "application/json" } })
}
