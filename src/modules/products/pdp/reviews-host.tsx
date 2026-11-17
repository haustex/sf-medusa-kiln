"use client"

import { lazy, Suspense, useEffect, useState } from "react"

import type { DrawerFilter, DrawerLabels } from "./reviews-drawer"
import type { WriteLabels } from "./write-review-sheet"

const ReviewsDrawer = lazy(() => import("./reviews-drawer"))
const WriteReviewSheet = lazy(() => import("./write-review-sheet"))

/**
 * The only client code of the reviews block that is on the page from the start, and it renders nothing until
 * used: it listens for clicks on `[data-reviews-open]` buttons inside `#reviews` (the server-rendered photo strip,
 * "See all reviews" and "Write a review") and then loads the drawer or the write sheet. Summary, strip and cards
 * stay plain server HTML, so hydration costs the same as a page without reviews.
 *   data-reviews-open="all" | "photos" (the drawer, filtered) | "write" (the sheet)
 */
export default function ReviewsHost({ productId, total, distribution, accountHref, labels, locale, t }: { productId: string; total: number; distribution: Record<number, number>; accountHref: string; labels: DrawerLabels; locale: string; t: WriteLabels }) {
  const [drawer, setDrawer] = useState<{ n: number; filter: DrawerFilter | null }>({ n: 0, filter: null })
  const [write, setWrite] = useState<{ n: number; open: boolean }>({ n: 0, open: false })

  useEffect(() => {
    const root = document.getElementById("reviews")
    if (!root) return
    const onClick = (e: Event) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-reviews-open]")
      if (!el || !root.contains(el)) return
      const what = el.dataset.reviewsOpen
      if (what === "write") setWrite((w) => ({ n: w.n + 1, open: true }))
      else setDrawer((d) => ({ n: d.n + 1, filter: what === "photos" ? { photos: true } : {} }))
    }
    root.addEventListener("click", onClick)
    return () => root.removeEventListener("click", onClick)
  }, [])

  return (
    <>
      {/* a fresh instance per open (key), so each open starts from the filter asked / checks the orders again */}
      {drawer.n > 0 && (
        <Suspense fallback={null}>
          <ReviewsDrawer key={drawer.n} open={drawer.filter !== null} onClose={() => setDrawer((d) => ({ ...d, filter: null }))} productId={productId} distribution={distribution} total={total} initial={drawer.filter ?? undefined} labels={labels} locale={locale} />
        </Suspense>
      )}
      {write.n > 0 && (
        <Suspense fallback={null}>
          <WriteReviewSheet key={write.n} open={write.open} onClose={() => setWrite((w) => ({ ...w, open: false }))} productId={productId} accountHref={accountHref} t={t} />
        </Suspense>
      )}
    </>
  )
}
