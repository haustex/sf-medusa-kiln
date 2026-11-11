"use client"

import { buttonVariants, cn } from "@heroui/styles"
import { fill } from "@lib/i18n/dictionaries"
import type { StoreReview } from "medusa-reviews-wishlist/sdk"
import { Stars } from "@modules/ds"
import { useState } from "react"

type Labels = { more: string; loading: string; error: string; stars: string; verified: string; reply: string; photo: string }

/** "Show more" under the static first page of reviews: fetches the next page from /api/reviews (public, 60 s). */
export default function LoadMoreReviews({ productId, offset, total, pageSize, labels, lang }: { productId: string; offset: number; total: number; pageSize: number; labels: Labels; lang: "id" | "en" }) {
  const [items, setItems] = useState<StoreReview[]>([])
  const [next, setNext] = useState(offset)
  const [state, setState] = useState<"idle" | "loading" | "error">("idle")
  const left = total - next
  const load = async () => {
    setState("loading")
    try {
      const r = await fetch(`/api/reviews?product_id=${encodeURIComponent(productId)}&offset=${next}&limit=${pageSize}`)
      if (!r.ok) throw new Error(String(r.status))
      const data = (await r.json()) as { reviews: StoreReview[] }
      setItems((prev) => [...prev, ...data.reviews])
      setNext(next + data.reviews.length)
      setState("idle")
      if (!data.reviews.length) setNext(total)
    } catch {
      setState("error")
    }
  }
  const date = (iso: string) => new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-US", { dateStyle: "medium" }).format(new Date(iso))
  return (
    <div className="flex flex-col gap-stack-lg">
      {items.length > 0 && (
        <ol className="flex flex-col gap-stack-lg" data-testid="reviews-list-more">
          {items.map((r) => (
            <li key={r.id} className="flex flex-col gap-stack-sm border-b border-separator pb-stack-lg last:border-b-0 last:pb-0" data-testid="review" data-review-id={r.id}>
              <div className="flex flex-wrap items-center gap-x-stack-sm gap-y-stack-xs">
                <Stars value={r.rating} label={fill(labels.stars, { n: r.rating })} />
                {r.title && <h3 className="font-medium">{r.title}</h3>}
              </div>
              <p className="whitespace-pre-line">{r.body}</p>
              {r.images.length > 0 && (
                <ul className="flex flex-wrap gap-stack-sm">
                  {r.images.map((img, i) => (
                    <li key={img.id} className="photo-placeholder relative size-24 overflow-hidden rounded-lg sm:size-28">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={fill(labels.photo, { n: i + 1 })} width={224} height={224} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
                    </li>
                  ))}
                </ul>
              )}
              <p className="flex flex-wrap items-center gap-x-stack-sm gap-y-stack-xs text-sm text-muted">
                <span className="font-medium text-foreground">{r.display_name}</span>
                <span>{date(r.created_at)}</span>
                {r.verified && <span className="rounded-full bg-default px-2.5 py-0.5 text-xs font-medium text-foreground">{labels.verified}</span>}
              </p>
              {r.reply && (
                <blockquote className="flex flex-col gap-stack-xs rounded-media bg-default p-stack-md text-sm">
                  <p className="font-medium">{labels.reply}</p>
                  <p className="whitespace-pre-line">{r.reply.body}</p>
                </blockquote>
              )}
            </li>
          ))}
        </ol>
      )}
      {state === "error" && (
        <p className="text-sm text-danger" role="alert">
          {labels.error}
        </p>
      )}
      {left > 0 && (
        <button type="button" onClick={load} disabled={state === "loading"} className={cn(buttonVariants({ variant: "secondary", size: "md" }), "self-start")} data-testid="reviews-more">
          {state === "loading" ? labels.loading : `${labels.more} (${left})`}
        </button>
      )}
    </div>
  )
}
