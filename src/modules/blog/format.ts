/** Dates are shown in Jakarta time in both markets (the workshop's day), so a post never shows two dates. */
const TZ = "Asia/Jakarta"

/** "6 Nov 2026" / "Nov 6, 2026" (cards) or "6 November 2026" / "November 6, 2026" (article) */
export function formatPostDate(iso: string, lang: "id" | "en", month: "short" | "long" = "short") {
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "id-ID", { day: "numeric", month, year: "numeric", timeZone: TZ }).format(new Date(iso))
}

/** Minutes to read, from the article's plain text: 200 words a minute, never below 1. */
export const readingMinutes = (text: string) => Math.max(1, Math.round(text.trim().split(/\s+/).filter(Boolean).length / 200))

export const readingTimeLabel = (minutes: number, lang: "id" | "en") => (lang === "en" ? `${minutes} min read` : `${minutes} menit baca`)
