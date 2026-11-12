"use client"

import { cn } from "@heroui/styles"
import { useRouter } from "next/navigation"
import { useId, useState } from "react"

import { fill, type Dictionary } from "@lib/i18n/dictionaries"
import { Button } from "@modules/common/components/ui"

type T = Dictionary["reviews"]
export type ReviewItem = { order_item_id: string; title?: string | null; product_title?: string | null; thumbnail?: string | null }
const MIN_BODY = 10

/**
 * One review for one purchased item (medusa-reviews-wishlist), from the account (customer cookie + order id),
 * through the storefront's POST /api/reviews (honeypot field included). Stars are a radio group.
 */
export default function ReviewForm({ item, orderId, t, onDone }: { item: ReviewItem; orderId: string; t: T; onDone?: () => void }) {
  const id = useId()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<"idle" | "sending" | "done">("idle")
  const name = item.product_title ?? item.title ?? ""

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body = String(fd.get("body") ?? "").trim()
    if (!rating) return setError(t.formErrorRating)
    if (Array.from(body).length < MIN_BODY) return setError(t.formErrorBody)
    setError(null)
    setState("sending")
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ order_id: orderId, website: String(fd.get("website") ?? ""), reviews: [{ order_item_id: item.order_item_id, rating, title: String(fd.get("title") ?? "").trim() || undefined, body }] }),
      })
      if (!r.ok) throw new Error(`create ${r.status}`)
      setState("done")
      onDone?.()
    } catch (err) {
      console.error("[reviews] create", err)
      setState("idle")
      setError(t.formError)
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col gap-stack-xs rounded-media bg-default p-stack-md" role="status" data-testid="review-done" data-order-item-id={item.order_item_id}>
        <p className="font-medium">{name}</p>
        <p className="text-sm">{t.formDone}</p>
      </div>
    )
  }

  const field = "block w-full rounded-[var(--field-radius)] border border-field-border bg-field-background px-4 py-3 text-base transition-colors hover:border-muted focus:border-foreground focus:outline-none focus:ring-2 focus:ring-focus"
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-stack-md rounded-media bg-default p-stack-lg" data-testid="review-form" data-order-item-id={item.order_item_id}>
      <div className="flex items-center gap-stack-md">
        {item.thumbnail && (
          <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnail} alt="" width={56} height={56} loading="lazy" className="absolute inset-0 size-full object-cover" />
          </span>
        )}
        <h3 className="type-h3">{name}</h3>
      </div>
      <fieldset className="flex flex-col gap-stack-xs">
        <legend className="text-sm font-medium">{t.rating}</legend>
        <div className="flex items-center gap-stack-sm" onMouseLeave={() => setHover(0)}>
          <div className="flex" role="radiogroup" aria-label={t.rating}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                <input type="radio" name={`${id}-rating`} value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" aria-label={fill(t.ratingStar, { n })} />
                <svg aria-hidden="true" viewBox="0 0 20 20" className={cn("size-8 transition-colors peer-focus-visible:rounded-sm peer-focus-visible:ring-2 peer-focus-visible:ring-focus", (hover || rating) >= n ? "text-foreground" : "text-control")}>
                  <path d="M10 1.8l2.47 5.2 5.73.7-4.2 3.95 1.08 5.65L10 14.5l-5.08 2.8L6 11.65 1.8 7.7l5.73-.7L10 1.8z" fill={(hover || rating) >= n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                </svg>
              </label>
            ))}
          </div>
          <span className="text-sm text-muted" aria-live="polite">
            {t.ratingHint[hover || rating] ?? ""}
          </span>
        </div>
      </fieldset>
      <label className="flex flex-col gap-stack-xs text-sm font-medium">
        {t.formTitle}
        <input name="title" maxLength={120} className={field} data-testid="review-title" />
      </label>
      <label className="flex flex-col gap-stack-xs text-sm font-medium">
        {t.formBody}
        <textarea name="body" required minLength={MIN_BODY} maxLength={2000} rows={4} className={field} data-testid="review-body" />
        <span className="font-normal text-muted">{t.formBodyHint}</span>
      </label>
      {/* honeypot: bots fill it, people never see it */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error && (
        <p className="text-sm text-danger" role="alert" data-testid="review-error">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={state === "sending"} className="self-start" data-testid="review-submit">
        {t.formSubmit}
      </Button>
    </form>
  )
}

/** One form per reviewable item; the page refreshes after each so the item moves to "my reviews" */
export function ReviewForms({ items, t }: { items: { orderId: string; displayId: number; item: ReviewItem }[]; t: T }) {
  const router = useRouter()
  return (
    <div className="flex flex-col gap-stack-lg">
      {items.map(({ orderId, displayId, item }) => (
        <div key={item.order_item_id} className="flex flex-col gap-stack-xs">
          <p className="text-sm text-muted">{fill(t.orderRef, { n: displayId })}</p>
          <ReviewForm item={item} orderId={orderId} t={t} onDone={() => router.refresh()} />
        </div>
      ))}
    </div>
  )
}
