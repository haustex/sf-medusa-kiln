import { cn } from "@heroui/styles"
import type { StoreReview } from "medusa-reviews-wishlist/sdk"

import { fill } from "@lib/i18n/fill"
import Stars from "@modules/ds/stars"

/*
 * Review markup shared by the server-rendered rail on the product page and the client-side "All reviews" drawer:
 * plain components, no hooks, no dictionaries (labels come in as props).
 */

export type ReviewLabels = {
  /** "{n} out of 5 stars" */
  stars: string
  verified: string
  /** "Reply from {brand}", already filled */
  reply: string
  /** "Review photo {n}" */
  photo: string
}

/** "Sari W." → "SW"; one letter for one word; a dot for an empty name */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "•"

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-default text-xs font-medium", className)}>
      {initials(name)}
    </span>
  )
}

export function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted" data-testid="review-verified">
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  )
}

function Photos({ images, size, labels }: { images: StoreReview["images"]; size: "sm" | "lg"; labels: ReviewLabels }) {
  if (!images.length) return null
  return (
    <ul className="flex flex-wrap gap-stack-sm">
      {images.map((img, i) => (
        <li key={img.id} className={cn("photo-placeholder relative overflow-hidden rounded-md", size === "lg" ? "size-24 sm:size-28" : "size-14")}>
          {/* eslint-disable-next-line @next/next/no-img-element -- buyer photo from the media bucket, fixed box (CLS 0) */}
          <img src={img.url} alt={fill(labels.photo, { n: i + 1 })} width={size === "lg" ? 224 : 112} height={size === "lg" ? 224 : 112} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
        </li>
      ))}
    </ul>
  )
}

/**
 * Compact card for the horizontal rail: stars and relative time, title, the text clamped to four lines, photo thumbs,
 * then avatar initials, name and the verified badge. `when`: the relative time, formatted by the caller.
 */
export function ReviewCard({ r, when, labels, className }: { r: StoreReview; when: string; labels: ReviewLabels; className?: string }) {
  return (
    <article className={cn("flex h-full flex-col gap-stack-sm rounded-media border border-separator p-stack-md", className)} data-testid="review" data-review-id={r.id}>
      <div className="flex items-center justify-between gap-stack-sm text-sm">
        <Stars value={r.rating} label={fill(labels.stars, { n: r.rating })} />
        <time dateTime={r.created_at} className="shrink-0 text-muted">
          {when}
        </time>
      </div>
      {r.title && <h3 className="font-medium leading-snug">{r.title}</h3>}
      <p className="line-clamp-4 text-sm leading-relaxed text-foreground">{r.body}</p>
      <Photos images={r.images} size="sm" labels={labels} />
      <div className="mt-auto flex items-center gap-stack-sm pt-stack-xs text-sm">
        <Avatar name={r.display_name} />
        <span className="min-w-0 truncate font-medium">{r.display_name}</span>
        {r.verified && <VerifiedBadge label={labels.verified} />}
      </div>
    </article>
  )
}

/** One review in full (the drawer): everything the card has, the whole text, large photos and the store's reply */
export function ReviewFull({ r, when, labels }: { r: StoreReview; when: string; labels: ReviewLabels }) {
  return (
    <li className="flex flex-col gap-stack-sm border-b border-separator pb-stack-lg last:border-b-0 last:pb-0" data-testid="review" data-review-id={r.id}>
      <div className="flex items-center gap-stack-sm text-sm">
        <Avatar name={r.display_name} />
        <div className="flex min-w-0 flex-col">
          <span className="flex flex-wrap items-center gap-x-stack-sm gap-y-0.5">
            <span className="font-medium">{r.display_name}</span>
            {r.verified && <VerifiedBadge label={labels.verified} />}
          </span>
          <span className="flex items-center gap-stack-sm text-muted">
            <Stars value={r.rating} label={fill(labels.stars, { n: r.rating })} />
            <time dateTime={r.created_at}>{when}</time>
          </span>
        </div>
      </div>
      {r.title && <h3 className="font-medium">{r.title}</h3>}
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{r.body}</p>
      <Photos images={r.images} size="lg" labels={labels} />
      {r.reply && (
        <blockquote className="flex flex-col gap-stack-xs rounded-media bg-default p-stack-md text-sm" data-testid="review-reply">
          <p className="font-medium">{labels.reply}</p>
          <p className="whitespace-pre-line">{r.reply.body}</p>
        </blockquote>
      )}
    </li>
  )
}
