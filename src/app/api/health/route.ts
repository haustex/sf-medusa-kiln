/**
 * Health check for uptime monitoring (UptimeRobot keyword "ok":true):
 * storefront (answers at all) + backend deep check (database, Redis, worker
 * heartbeat) via GET /hk/health. 200 when everything passes, else 503.
 */
export const dynamic = "force-dynamic"

const BACKEND = process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function GET() {
  const t0 = Date.now()
  let backend: { ok: boolean; status?: number; ms: number; checks?: unknown } = { ok: false, ms: 0 }
  try {
    const res = await fetch(`${BACKEND}/hk/health`, { cache: "no-store", signal: AbortSignal.timeout(8000) })
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; checks?: unknown }
    backend = { ok: res.ok && json.ok === true, status: res.status, ms: Date.now() - t0, checks: json.checks }
  } catch {
    backend = { ok: false, ms: Date.now() - t0 }
  }
  const ok = backend.ok
  return Response.json(
    { ok, storefront: { ok: true }, backend, time: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store", "Cloudflare-CDN-Cache-Control": "no-store" } }
  )
}
