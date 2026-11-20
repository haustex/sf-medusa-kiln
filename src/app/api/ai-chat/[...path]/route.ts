import { feature } from "@lib/features"

/**
 * Relay for the AI assistant (medusa-ai-chat), so the browser never talks to the backend directly and the
 * publishable key stays on the server. Only the plugin's five Store routes pass, with the visitor's IP forwarded as
 * CF-Connecting-IP for the plugin's rate limits. The answer stream (server-sent events) is piped through untouched.
 *   GET  config?lang=
 *   POST sessions | sessions/:id/messages | sessions/:id/handoff | messages/:id/feedback
 */
export const dynamic = "force-dynamic"

const BACKEND = (process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
const NO_STORE = { "Cache-Control": "private, no-store", "Cloudflare-CDN-Cache-Control": "no-store" }
const ID = "[A-Za-z0-9_-]{1,64}"
const ALLOWED: [RegExp, "GET" | "POST"][] = [
  [/^config$/, "GET"],
  [/^sessions$/, "POST"],
  [new RegExp(`^sessions/${ID}/(messages|handoff)$`), "POST"],
  [new RegExp(`^messages/${ID}/feedback$`), "POST"],
]
const MAX_BODY = 16 * 1024

const clientIp = (req: Request) => req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || ""

async function relay(req: Request, params: Promise<{ path: string[] }>) {
  if (!(await feature("aiChat"))) return Response.json({ message: "Not found" }, { status: 404, headers: NO_STORE })
  const path = (await params).path.join("/")
  if (!ALLOWED.some(([re, method]) => re.test(path) && method === req.method)) return Response.json({ message: "Not found" }, { status: 404, headers: NO_STORE })
  const search = new URL(req.url).search
  const headers: Record<string, string> = { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "", accept: req.headers.get("accept") || "application/json" }
  const ip = clientIp(req)
  if (ip) headers["cf-connecting-ip"] = ip
  let body: string | undefined
  if (req.method === "POST") {
    body = await req.text()
    if (body.length > MAX_BODY) return Response.json({ message: "too large" }, { status: 413, headers: NO_STORE })
    headers["content-type"] = "application/json"
  }
  try {
    const upstream = await fetch(`${BACKEND}/store/ai-chat/${path}${search}`, { method: req.method, headers, body, signal: AbortSignal.timeout(120_000), cache: "no-store" })
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...NO_STORE, "Content-Type": upstream.headers.get("content-type") || "application/json", "X-Accel-Buffering": "no" },
    })
  } catch {
    return Response.json({ message: "assistant unavailable" }, { status: 502, headers: NO_STORE })
  }
}

export const GET = (req: Request, ctx: { params: Promise<{ path: string[] }> }) => relay(req, ctx.params)
export const POST = (req: Request, ctx: { params: Promise<{ path: string[] }> }) => relay(req, ctx.params)
