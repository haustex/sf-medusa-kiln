/**
 * Processing time (before dispatch) is separate from delivery time (after
 * dispatch, from the shipping plugin's estimates). Haus Kayu policy:
 * ready stock 3–14 working days, made-to-order 1–3 months.
 */
export type Range = { min: number; max: number; unit: "workday" | "day" | "week" | "month" }

export const PROCESSING = {
  ready: { min: 3, max: 14, unit: "workday" } as Range,
  custom: { min: 1, max: 3, unit: "month" } as Range,
}

type ProductLike = {
  metadata?: Record<string, unknown> | null
  categories?: { handle?: string | null }[] | null
} | null | undefined

/** Made to order: product metadata `made_to_order` (true/"true"), or a category whose handle contains "custom" */
export function isMadeToOrder(product: ProductLike): boolean {
  const flag = product?.metadata?.made_to_order
  if (flag === true || flag === "true") return true
  if (flag === false || flag === "false") return false
  return !!product?.categories?.some((c) => c?.handle?.includes("custom"))
}

const UNITS = {
  id: { workday: "hari kerja", day: "hari", week: "minggu", month: "bulan" },
  en: { workday: "working days", day: "days", week: "weeks", month: "months" },
}

export const formatRange = (r: Range, lang: "id" | "en") => `${r.min}–${r.max} ${UNITS[lang][r.unit]}`
