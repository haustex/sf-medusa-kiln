import { wordmarkPng } from "@lib/og/brand-png"

/** GET /brand/wordmark.png: the logo, black on transparent (e-mails, invoices, payment plugins' logo_url) */
export const dynamic = "force-static"

export function GET() {
  return wordmarkPng()
}
