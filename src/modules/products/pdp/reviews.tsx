import { fill, type Dictionary } from "@lib/i18n/dictionaries"
import { PDP_REVIEWS, type Rating, type StoreReview } from "@lib/data/reviews"
import { Section, Stars } from "@modules/ds"
import LoadMoreReviews from "./reviews-more"

type T = Dictionary["reviews"]
type Lang = "id" | "en"

const nf = (lang: Lang) => (lang === "id" ? "id-ID" : "en-US")
export const formatAverage = (avg: number, lang: Lang) => avg.toLocaleString(nf(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dateOf = (iso: string, lang: Lang) => new Intl.DateTimeFormat(nf(lang), { dateStyle: "medium" }).format(new Date(iso))

/** One review (server-rendered first page and the client "Show more" share the same markup via a plain object) */
export function ReviewItem({ r, t, lang }: { r: StoreReview; t: T; lang: Lang }) {
  return (
    <li className="flex flex-col gap-stack-sm border-b border-separator pb-stack-lg last:border-b-0 last:pb-0" data-testid="review" data-review-id={r.id}>
      <div className="flex flex-wrap items-center gap-x-stack-sm gap-y-stack-xs">
        <Stars value={r.rating} label={fill(t.starsLabel, { n: r.rating })} />
        {r.title && <h3 className="font-medium">{r.title}</h3>}
      </div>
      <p className="whitespace-pre-line text-foreground">{r.body}</p>
      {r.images.length > 0 && (
        <ul className="flex flex-wrap gap-stack-sm" aria-label={t.photoAlt.replace(" {n}", "")}>
          {r.images.map((img, i) => (
            <li key={img.id} className="photo-placeholder relative size-24 overflow-hidden rounded-lg sm:size-28">
              {/* eslint-disable-next-line @next/next/no-img-element -- buyer photo from the media bucket, fixed box (CLS 0) */}
              <img src={img.url} alt={fill(t.photoAlt, { n: i + 1 })} width={224} height={224} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
            </li>
          ))}
        </ul>
      )}
      <p className="flex flex-wrap items-center gap-x-stack-sm gap-y-stack-xs text-sm text-muted">
        <span className="font-medium text-foreground">{r.display_name}</span>
        <span>{dateOf(r.created_at, lang)}</span>
        {r.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-default px-2.5 py-0.5 text-xs font-medium text-foreground" data-testid="review-verified">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.verified}
          </span>
        )}
      </p>
      {r.reply && (
        <blockquote className="flex flex-col gap-stack-xs rounded-media bg-default p-stack-md text-sm" data-testid="review-reply">
          <p className="font-medium">{t.storeReply}</p>
          <p className="whitespace-pre-line">{r.reply.body}</p>
        </blockquote>
      )}
    </li>
  )
}

/**
 * Product page reviews (medusa-reviews-wishlist): summary + distribution + the newest reviews. Rendered only when
 * the product has approved reviews; with none the section does not exist (never "0 reviews"). Static HTML (ISR),
 * re-rendered on moderation; "Show more" is the only client code.
 */
export default function ProductReviews({ rating, reviews, count, productId, t, lang }: { rating: Rating; reviews: StoreReview[]; count: number; productId: string; t: T; lang: Lang }) {
  if (!rating || rating.count <= 0) return null
  const avg = formatAverage(rating.average, lang)
  const total = rating.count
  return (
    <Section id="reviews" title={t.title} titleSize="display" headerExtra={undefined}>
      <div className="grid gap-section lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-stack-md lg:sticky lg:top-36 lg:self-start" data-testid="reviews-summary">
          <div className="flex items-end gap-stack-sm">
            <span className="type-section tabular-nums" data-testid="reviews-average">{avg}</span>
            <div className="flex flex-col gap-stack-xs pb-1">
              <Stars value={rating.average} label={fill(t.summaryLabel, { avg, n: total })} size="md" />
              <span className="text-sm text-muted" data-testid="reviews-count">{total === 1 ? t.countOne : fill(t.count, { n: total })}</span>
            </div>
          </div>
          <ol className="flex flex-col gap-stack-xs" aria-label={t.distributionLabel} data-testid="reviews-distribution">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = rating.distribution[n as 1 | 2 | 3 | 4 | 5] ?? 0
              const pct = total ? Math.round((c / total) * 100) : 0
              return (
                <li key={n} className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-stack-sm text-sm">
                  <span className="text-muted">{fill(t.ratingStar, { n })}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-default" aria-hidden="true">
                    <span className="block h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="text-right tabular-nums text-muted">{c}</span>
                </li>
              )
            })}
          </ol>
        </div>
        <div className="flex flex-col gap-stack-lg">
          <ol className="flex flex-col gap-stack-lg" data-testid="reviews-list">
            {reviews.map((r) => (
              <ReviewItem key={r.id} r={r} t={t} lang={lang} />
            ))}
          </ol>
          {count > reviews.length && <LoadMoreReviews productId={productId} offset={reviews.length} total={count} pageSize={PDP_REVIEWS} labels={{ more: t.loadMore, loading: t.loading, error: t.loadError, stars: t.starsLabel, verified: t.verified, reply: t.storeReply, photo: t.photoAlt }} lang={lang} />}
        </div>
      </div>
    </Section>
  )
}
