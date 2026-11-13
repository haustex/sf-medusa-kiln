import { NextRequest, NextResponse } from "next/server"

import { feature } from "@lib/features"
import { trackingBackend } from "@lib/tracking/backend"
import { getTracking } from "@modules/tracking/core/api"

export const dynamic = "force-dynamic"

/** Relays the public lookup for the live tracking card (the browser cannot send the publishable key with SSE) */
export async function GET(req: NextRequest, { params }: { params: Promise<{ number: string }> }) {
  if (!(await feature("tracking"))) return NextResponse.json({ type: "not_found" }, { status: 404 })
  const { number } = await params
  const locale = req.nextUrl.searchParams.get("locale") === "id" ? "id" : "en"
  const result = await getTracking(await trackingBackend(), number, locale)
  if (!result.ok)
    return NextResponse.json(
      { type: result.reason },
      {
        status: result.reason === "not_found" ? 404 : result.reason === "rate_limited" ? 429 : 502,
      }
    )
  return NextResponse.json({ shipment: result.shipment }, { headers: { "Cache-Control": "no-store" } })
}
