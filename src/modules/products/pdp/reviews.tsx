import { buttonVariants, cn } from "@heroui/styles"
import { __iconData as star } from "lucide-react/icons/star"

import { fill, type Dictionary } from "@lib/i18n/dictionaries"
import { type Rating, type ReviewPhoto, type StoreReview } from "@lib/data/reviews"
import { relativeTime } from "@lib/util/relative-time"
import CarouselControls from "@modules/ds/carousel-controls"
import { Icon } from "@modules/ds/icons"
import Section from "@modules/ds/section"
import Stars from "@modules/ds/stars"
import { ReviewCard, type ReviewLabels } from "./review-card"
import ReviewsHost from "./reviews-host"

type T = Dictionary["reviews"]
type Lang = "id" | "en"

const nf = (lang: Lang) => (lang === "id" ? "id-ID" : "en-US")
/** Cards in the rail (the JSON-LD still carries PDP_REVIEWS reviews; the rest is in the drawer) */
const RAIL_CARDS = 6
export const formatAverage = (avg: number, lang: Lang) => avg.toLocaleString(nf(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Average, stars, count and the 5→1 distribution bars */
function Summary({ rating, t, lang }: { rating: Rating; t: T; lang: Lang }) {
  const avg = formatAverage(rating.average, lang)
  const total = rating.count
  return (
    <div className="flex flex-col gap-stack-md" data-testid="reviews-summary">
      <div className="flex items-end gap-stack-md">
        <span className="text-5xl font-medium leading-none tabular-nums tracking-tight" data-testid="reviews-average">
          {avg}
        </span>
        <div className="flex flex-col gap-stack-xs pb-0.5">
          <Stars value={rating.average} label={fill(t.summaryLabel, { avg, n: total })} size="md" />
          <span className="text-sm text-muted" data-testid="reviews-count">
            {total === 1 ? t.countOne : fill(t.count, { n: total })}
          </span>
        </div>
      </div>
      <ol className="flex flex-col gap-stack-xs" aria-label={t.distributionLabel} data-testid="reviews-distribution">
        {[5, 4, 3, 2, 1].map((n) => {
          const c = rating.distribution[n as 1 | 2 | 3 | 4 | 5] ?? 0
          const pct = total ? Math.round((c / total) * 100) : 0
          return (
            <li key={n} className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.5rem] items-center gap-stack-sm text-sm">
              <span className="flex items-center gap-stack-xs whitespace-nowrap tabular-nums text-muted">
                <span className="sr-only">{fill(t.ratingStar, { n })}</span>
                <span aria-hidden="true">{n}</span>
                <Icon icon={star} size={12} fill="currentColor" />
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-default" aria-hidden="true">
                <span className="block h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-right tabular-nums text-muted">{c}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Buyers' photos; each opens the drawer on "with photos" (reviews-host.tsx) */
function PhotoStrip({ photos, t }: { photos: ReviewPhoto[]; t: T }) {
  return (
    <div className="flex min-w-0 flex-col gap-stack-sm" data-testid="reviews-photos">
      <h3 className="text-sm font-medium">{t.photosTitle}</h3>
      <ul className="no-scrollbar -mx-container-x flex gap-stack-sm overflow-x-auto px-container-x lg:mx-0 lg:px-0">
        {photos.map((p) => (
          <li key={p.id} className="shrink-0">
            <button type="button" data-reviews-open="photos" aria-haspopup="dialog" aria-label={fill(t.photoFrom, { name: p.name })} className="photo-placeholder relative block size-24 overflow-hidden rounded-md outline-none ring-offset-2 transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-focus sm:size-28">
              {/* eslint-disable-next-line @next/next/no-img-element -- buyer photo from the media bucket, fixed box (CLS 0) */}
              <img src={p.url} alt="" width={224} height={224} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The newest reviews as cards in a horizontal rail (native scroll + snap, arrows from md) */
function Rail({ reviews, labels, t, lang, locale, prev, next }: { reviews: StoreReview[]; labels: ReviewLabels; t: T; lang: Lang; locale: string; prev: string; next: string }) {
  return (
    <div className="flex flex-col gap-stack-sm">
      <div className="flex items-center justify-between gap-stack-md">
        <h3 className="text-sm font-medium">{t.railLabel}</h3>
        <CarouselControls targetId="reviews-rail" prevLabel={prev} nextLabel={next} />
      </div>
      <ul id="reviews-rail" aria-label={t.railLabel} className="no-scrollbar -mx-container-x flex snap-x snap-mandatory gap-stack-md overflow-x-auto scroll-px-container-x px-container-x lg:mx-0 lg:scroll-px-0 lg:px-0" data-testid="reviews-list" lang={lang}>
        {reviews.slice(0, RAIL_CARDS).map((r) => (
          <li key={r.id} className="w-[82%] shrink-0 snap-start sm:w-[48%] lg:w-[calc((100%-2*var(--space-stack-md))/3)]">
            <ReviewCard r={r} when={relativeTime(r.created_at, locale)} labels={labels} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** "Write a review": a plain button; reviews-host.tsx opens the sheet (which checks the visitor's orders) */
function WriteButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" data-reviews-open="write" aria-haspopup="dialog" className={cn(buttonVariants({ variant: "secondary", size: "md" }), className)} data-testid="write-review-button">
      {label}
    </button>
  )
}

/**
 * Product page reviews (medusa-reviews-wishlist), full width under the gallery and the info column: the average with
 * the distribution bars, a strip of buyers' photos, the newest reviews as cards in a rail, "See all reviews" (a
 * drawer with star filter and sort, loaded on first open) and "Write a review" (the plugin's rules: verified buyers
 * after shipping; the sheet checks the visitor's orders on open). Without reviews: a short invitation, no empty
 * bars. Everything here is static HTML (ISR, re-rendered on moderation); the buttons are wired by ReviewsHost, a
 * client component that renders nothing until a click. Rendered only when the reviews feature is on.
 */
export default function ProductReviews({ rating, reviews, photos, productId, countryCode, accountHref, brand, t, lang, locale, labels }: { rating: Rating | null; reviews: StoreReview[]; photos: ReviewPhoto[]; productId: string; countryCode: string; accountHref: string; brand: string; t: T; lang: Lang; locale: string; labels: { prev: string; next: string } }) {
  const total = rating?.count ?? 0
  const reviewLabels: ReviewLabels = { stars: t.starsLabel, verified: t.verified, reply: fill(t.storeReply, { brand }), photo: t.photoAlt }
  const drawerLabels = { ...reviewLabels, title: t.allTitle, close: t.close, filterLabel: t.filterLabel, filterAll: t.filterAll, filterPhotos: t.filterPhotos, ratingStar: t.ratingStar, sortLabel: t.sortLabel, sort: t.sort, loading: t.loading, loadMore: t.loadMore, loadError: t.loadError, noneFiltered: t.noneFiltered }
  // only what the write sheet and the plugin's form need goes to the client
  const writeLabels = { rating: t.rating, ratingStar: t.ratingStar, ratingHint: t.ratingHint, formTitle: t.formTitle, formBody: t.formBody, formBodyHint: t.formBodyHint, formPhotos: t.formPhotos, formPhotosHint: t.formPhotosHint, formRemovePhoto: t.formRemovePhoto, formSubmit: t.formSubmit, formDone: t.formDone, formErrorRating: t.formErrorRating, formErrorBody: t.formErrorBody, formErrorPhotos: t.formErrorPhotos, formError: t.formError, writeReview: t.writeReview, close: t.close, orderRef: t.orderRef, toAccount: t.toAccount, writeChecking: t.writeChecking, writeError: t.writeError, writeLogin: t.writeLogin, writeLoginCta: t.writeLoginCta, writeNotEligible: t.writeNotEligible }
  return (
    // the anchor of the "{avg} · n reviews" link under the title; scroll margin for the sticky header
    <div id="reviews" className="scroll-mt-28" data-testid="reviews" data-count={total} data-country={countryCode}>
      <Section id="reviews" title={t.title} headerExtra={total > 0 ? <WriteButton label={t.writeReview} /> : undefined}>
        {total > 0 && rating ? (
          <div className="flex flex-col gap-stack-lg">
            {/* minmax(0, …): the photo strip (its own scroller) must not widen the column to its content */}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-stack-lg lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-section">
              <Summary rating={rating} t={t} lang={lang} />
              {photos.length > 0 && <PhotoStrip photos={photos} t={t} />}
            </div>
            <Rail reviews={reviews} labels={reviewLabels} t={t} lang={lang} locale={locale} prev={labels.prev} next={labels.next} />
            <button type="button" data-reviews-open="all" aria-haspopup="dialog" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-12 self-start")} data-testid="reviews-see-all">
              {t.seeAll} ({total})
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-stack-md rounded-media border border-separator p-stack-lg" data-testid="reviews-empty">
            <div className="flex flex-col gap-stack-xs">
              <h3 className="font-medium">{t.empty}</h3>
              <p className="max-w-2xl text-sm text-muted">{t.emptyBody}</p>
            </div>
            <WriteButton label={t.writeReview} />
          </div>
        )}
      </Section>
      <ReviewsHost productId={productId} total={total} distribution={rating?.distribution ?? {}} accountHref={accountHref} labels={drawerLabels} locale={locale} t={writeLabels} />
    </div>
  )
}
