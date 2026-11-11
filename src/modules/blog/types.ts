/** What a blog card needs. Built from a Post + its translation for the page's language. */
export type PostCardData = {
  href: string
  title: string
  excerpt?: string | null
  /** Category name in the page's language, e.g. "Perawatan Kayu" */
  category?: string | null
  /** ISO date (datetime attribute) + the same date written for people */
  publishedAt: string
  dateLabel: string
  /** e.g. "6 menit baca" */
  readingTime: string
  /** 1:1 cover */
  cover?: string | null
  /** Wide cover (1200x630), used from 640px on the article page */
  coverWide?: string | null
}

export type TocItem = { id: string; label: string }
