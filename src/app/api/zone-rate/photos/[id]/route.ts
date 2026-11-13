import { feature } from "@lib/features"
import { trackingBackend } from "@lib/tracking/backend"
import { getPhoto } from "@modules/tracking/core/api"

export const dynamic = "force-dynamic"

/** A proof photo of the logged-in customer's own order (the plugin checks the session) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await feature("tracking"))) return new Response(null, { status: 404 })
  const { id } = await params
  const res = await getPhoto(await trackingBackend({ withCustomer: true }), id)
  if (!res.ok || !res.body) return new Response(null, { status: 404 })
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/webp",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
