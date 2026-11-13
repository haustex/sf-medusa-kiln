import { logoPng } from "@lib/og/brand-png"

/** GET /brand/logo.png: 1200×300 on white, for Organization.logo in the structured data */
export const dynamic = "force-static"

export function GET() {
  return logoPng()
}
