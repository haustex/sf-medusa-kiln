/**
 * Buyer-facing text for a failed action. Server actions surface minified React/Next errors or English API messages,
 * so the raw error is never shown: it is logged (browser console; the server action logs its own side through
 * lib/util/medusa-error) and the context's friendly fallback is returned.
 */
export function friendlyError(err: unknown, fallback: string, where: string): string {
  console.error(`[${where}]`, err)
  return fallback
}
