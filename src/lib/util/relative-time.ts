/**
 * "3 days ago" / "3 hari lalu": the coarsest unit that fits (years, months, weeks, days, hours, minutes), with
 * Intl's own words for the near ones ("yesterday", "last month"). Product pages are static (ISR), so the text is
 * as fresh as the page: fine for review dates, which only move by a day at a time.
 */
export function relativeTime(iso: string, locale: string, now = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  const diff = (new Date(iso).getTime() - now) / 1000
  const abs = Math.abs(diff)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]
  for (const [unit, s] of units) if (abs >= s) return rtf.format(Math.round(diff / s), unit)
  return rtf.format(0, "second")
}
