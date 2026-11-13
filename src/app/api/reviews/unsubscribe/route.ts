import { feature } from "@lib/features"

/**
 * One-click opt-out from review-request e-mails: the signed id of the e-mail link (storefront page
 * /review/unsubscribe/<id>) → the plugin's POST /reviews/unsubscribe/<id> (no publishable key needed).
 */
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "private, no-store", "Cloudflare-CDN-Cache-Control": "no-store" }
const BACKEND = (process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
const TOKEN = /^[A-Za-z0-9_.-]{8,512}$/

export async function POST(req: Request) {
  if (!(await feature("reviews"))) return Response.json({ message: "Not found" }, { status: 404 })
  const body = (await req.json().catch(() => null)) as { token?: unknown } | null
  const token = typeof body?.token === "string" && TOKEN.test(body.token) ? body.token : null
  if (!token) return Response.json({ unsubscribed: false, message: "token required" }, { status: 400, headers: NO_STORE })
  const res = await fetch(`${BACKEND}/reviews/unsubscribe/${encodeURIComponent(token)}`, { method: "POST", headers: { accept: "application/json" }, cache: "no-store" })
  const data = (await res.json().catch(() => ({}))) as { unsubscribed?: boolean }
  return Response.json({ unsubscribed: !!data.unsubscribed }, { status: res.ok ? 200 : res.status, headers: NO_STORE })
}
