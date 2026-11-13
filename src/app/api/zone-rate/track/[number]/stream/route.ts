import { NextRequest } from "next/server"

import { feature } from "@lib/features"
import { trackingBackend } from "@lib/tracking/backend"
import { openTrackingStream, SSE_HEADERS } from "@modules/tracking/core/api"

export const dynamic = "force-dynamic"

/** Relays the plugin's Server-Sent Events stream of one tracking number */
export async function GET(req: NextRequest, { params }: { params: Promise<{ number: string }> }) {
  if (!(await feature("tracking"))) return new Response(null, { status: 404 })
  const { number } = await params
  const upstream = await openTrackingStream(await trackingBackend(), number, req.signal).catch(() => null)
  if (!upstream?.ok || !upstream.body) return new Response(null, { status: upstream?.status ?? 502 })
  return new Response(upstream.body, { headers: SSE_HEADERS })
}
