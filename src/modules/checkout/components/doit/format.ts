import { formatPrice } from "@modules/ds/price-tag"

/** Rupiah as stored by Medusa and doit.id (Rp150.000 = 150000): no scaling. Same format as the rest of the site. */
export const rupiah = (amount: number | null | undefined): string => formatPrice(amount ?? 0, "idr")

/** "02:14:05" / "14:05" until `until`; "00:00" when past. */
export function remaining(until: number, now: number): string {
  const total = Math.max(0, Math.floor((until - now) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
