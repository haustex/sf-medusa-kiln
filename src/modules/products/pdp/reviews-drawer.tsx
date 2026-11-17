"use client"

import { buttonVariants, cn } from "@heroui/styles"
import type { StoreReview } from "medusa-reviews-wishlist/sdk"
import { useEffect, useState } from "react"

import { fill } from "@lib/i18n/fill"
import { relativeTime } from "@lib/util/relative-time"
import Sheet from "@modules/ds/sheet"
import { ReviewFull, type ReviewLabels } from "./review-card"

export type DrawerLabels = ReviewLabels & {
  title: string
  close: string
  filterLabel: string
  filterAll: string
  filterPhotos: string
  /** "{n} stars" */
  ratingStar: string
  sortLabel: string
  sort: Record<string, string>
  loading: string
  loadMore: string
  loadError: string
  noneFiltered: string
}

export type DrawerFilter = { rating?: number; photos?: boolean }

type Page = { reviews: StoreReview[]; count: number }
type Sort = (typeof SORTS)[number]
/** The loaded reviews of one filter + sort (`key`); a key that differs from the current one means "loading" */
type Loaded = { key: string; items: StoreReview[]; count: number; error?: boolean }
const PAGE = 10
const SORTS = ["newest", "highest", "lowest"] as const

const fetchPage = async (productId: string, filter: DrawerFilter, sort: Sort, offset: number): Promise<Page> => {
  const q = new URLSearchParams({ product_id: productId, offset: String(offset), limit: String(PAGE), order: sort })
  if (filter.rating) q.set("rating", String(filter.rating))
  if (filter.photos) q.set("with_images", "1")
  const r = await fetch(`/api/reviews?${q}`)
  if (!r.ok) throw new Error(String(r.status))
  return (await r.json()) as Page
}

/**
 * "All reviews" drawer of the product page: a filter by stars (with the counts of the stored distribution) or
 * "with photos", a sort, and pages of full reviews from /api/reviews (public, 60 s). Loaded on first open
 * (reviews-browser.tsx), nothing of it is in the page's bundle before; mounted fresh per open (key).
 */
export default function ReviewsDrawer({ open, onClose, productId, distribution, total, initial, labels, locale }: { open: boolean; onClose: () => void; productId: string; distribution: Record<number, number>; total: number; initial?: DrawerFilter; labels: DrawerLabels; locale: string }) {
  const [filter, setFilter] = useState<DrawerFilter>(initial ?? {})
  const [sort, setSort] = useState<Sort>("newest")
  const [loaded, setLoaded] = useState<Loaded>({ key: "", items: [], count: 0 })
  const [busy, setBusy] = useState(false)
  const [now] = useState(() => Date.now())

  const key = `${filter.rating ?? ""}|${filter.photos ? 1 : 0}|${sort}`
  const fresh = loaded.key === key
  const items = fresh ? loaded.items : []
  const count = fresh ? loaded.count : 0
  const state: "loading" | "idle" | "error" = !fresh || busy ? "loading" : loaded.error ? "error" : "idle"

  // first page on open and on every filter/sort change (a stale answer is dropped)
  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetchPage(productId, filter, sort, 0)
      .then((page) => !cancelled && setLoaded({ key, items: page.reviews, count: page.count }))
      .catch(() => !cancelled && setLoaded({ key, items: [], count: 0, error: true }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for filter + sort
  }, [open, key, productId])

  const loadMore = async () => {
    setBusy(true)
    try {
      const page = await fetchPage(productId, filter, sort, items.length)
      setLoaded((prev) => (prev.key === key ? { ...prev, items: [...prev.items, ...page.reviews], count: page.count } : prev))
    } catch {
      setLoaded((prev) => (prev.key === key ? { ...prev, error: true } : prev))
    } finally {
      setBusy(false)
    }
  }

  // the plugin applies "with photos" after paging: keep asking for pages until none comes back
  const more = filter.photos ? items.length > 0 && items.length % PAGE === 0 : items.length < count

  const chip = (active: boolean) => cn("k-chip", active && "bg-foreground text-background")
  const starCount = (n: number) => distribution[n] ?? 0

  return (
    <Sheet open={open} onClose={onClose} side="right" label={labels.title} title={`${labels.title} (${total})`} closeLabel={labels.close} className="sm:w-[min(36rem,92vw)]">
      <div className="flex flex-col gap-stack-lg">
        <div className="flex flex-col gap-stack-sm">
          <div role="group" aria-label={labels.filterLabel} className="no-scrollbar -mx-stack-lg flex gap-stack-sm overflow-x-auto px-stack-lg">
            <button type="button" onClick={() => setFilter({})} aria-pressed={!filter.rating && !filter.photos} className={chip(!filter.rating && !filter.photos)}>
              {labels.filterAll}
            </button>
            {[5, 4, 3, 2, 1].map((n) => (
              <button key={n} type="button" onClick={() => setFilter({ rating: n })} aria-pressed={filter.rating === n} disabled={!starCount(n)} className={cn(chip(filter.rating === n), !starCount(n) && "opacity-40")} data-testid={`reviews-filter-${n}`}>
                {n} <span aria-hidden="true">★</span>
                <span className="sr-only">{fill(labels.ratingStar, { n })}</span>
                <span className="text-muted">({starCount(n)})</span>
              </button>
            ))}
            <button type="button" onClick={() => setFilter({ photos: true })} aria-pressed={!!filter.photos} className={chip(!!filter.photos)} data-testid="reviews-filter-photos">
              {labels.filterPhotos}
            </button>
          </div>
          <label className="flex items-center gap-stack-sm text-sm">
            <span className="text-muted">{labels.sortLabel}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])} className="k-select h-10 text-sm" data-testid="reviews-sort">
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {labels.sort[s] ?? s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {items.length > 0 && (
          <ol className="flex flex-col gap-stack-lg" data-testid="reviews-all">
            {items.map((r) => (
              <ReviewFull key={r.id} r={r} when={relativeTime(r.created_at, locale, now)} labels={labels} />
            ))}
          </ol>
        )}
        {state === "loading" && (
          <p className="text-sm text-muted" role="status">
            {labels.loading}
          </p>
        )}
        {state === "error" && (
          <p className="text-sm text-danger" role="alert">
            {labels.loadError}
          </p>
        )}
        {state === "idle" && !items.length && <p className="text-sm text-muted">{labels.noneFiltered}</p>}
        {state === "idle" && more && (
          <button type="button" onClick={loadMore} className={cn(buttonVariants({ variant: "secondary", size: "md" }), "self-start")} data-testid="reviews-more">
            {labels.loadMore}
          </button>
        )}
      </div>
    </Sheet>
  )
}
