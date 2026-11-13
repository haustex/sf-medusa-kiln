"use client"

import { cn } from "@heroui/styles"
import { useId, useRef, useState } from "react"

import { type Dictionary } from "@lib/i18n/dictionaries"
import { fill } from "@lib/i18n/fill"
import { Button } from "@modules/common/components/ui"

type T = Dictionary["reviews"]
export type ReviewItem = { order_item_id: string; title?: string | null; product_title?: string | null; thumbnail?: string | null }

export const MAX_PHOTOS = 3
export const MAX_MB = 5
const MIN_BODY = 10
const ACCEPT = ["image/jpeg", "image/png", "image/webp"]

type Picked = { file: File; url: string }

/**
 * One review for one purchased item (medusa-reviews-wishlist): stars as a radio group, title, text, up to three
 * photos (uploaded private first, published only when the review is approved), honeypot field. Works from the
 * magic link (`token`, request_token) and from the account (`orderId`, customer cookie). Everything goes through
 * the storefront's /api/reviews routes, the browser never talks to the backend.
 */
export default function ReviewForm({ item, token, orderId, t, onDone }: { item: ReviewItem; token?: string; orderId?: string; t: T; onDone?: () => void }) {
  const id = useId()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [photos, setPhotos] = useState<Picked[]>([])
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<"idle" | "sending" | "done">("idle")
  const fileInput = useRef<HTMLInputElement>(null)
  const name = item.product_title ?? item.title ?? ""

  const okFile = (f: File) => f.size <= MAX_MB * 1024 * 1024 && ACCEPT.includes(f.type)
  const pickFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    const rejected = picked.some((f) => !okFile(f)) || photos.length + picked.length > MAX_PHOTOS
    setError(rejected ? fill(t.formErrorPhotos, { n: MAX_PHOTOS, mb: MAX_MB }) : null)
    const room = MAX_PHOTOS - photos.length
    setPhotos([...photos, ...picked.filter(okFile).slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }))])
    if (fileInput.current) fileInput.current.value = ""
  }
  const removePhoto = (i: number) => {
    URL.revokeObjectURL(photos[i].url)
    setPhotos(photos.filter((_, j) => j !== i))
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body = String(fd.get("body") ?? "").trim()
    if (!rating) return setError(t.formErrorRating)
    if (Array.from(body).length < MIN_BODY) return setError(t.formErrorBody)
    setError(null)
    setState("sending")
    try {
      let upload_ids: string[] = []
      if (photos.length) {
        const up = new FormData()
        photos.forEach((p) => up.append("files", p.file, p.file.name))
        const r = await fetch("/api/reviews/upload", { method: "POST", body: up, credentials: "same-origin", headers: token ? { "x-review-token": token } : {} })
        if (!r.ok) throw new Error(`upload ${r.status}`)
        upload_ids = ((await r.json()) as { uploads: { id: string }[] }).uploads.map((u) => u.id)
      }
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...(token ? { request_token: token } : { order_id: orderId }),
          website: String(fd.get("website") ?? ""),
          reviews: [{ order_item_id: item.order_item_id, rating, title: String(fd.get("title") ?? "").trim() || undefined, body, ...(upload_ids.length ? { upload_ids } : {}) }],
        }),
      })
      if (!r.ok) throw new Error(`create ${r.status}`)
      photos.forEach((p) => URL.revokeObjectURL(p.url))
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
      <div className="flex flex-col gap-stack-xs text-sm">
        <span className="font-medium">{fill(t.formPhotos, { n: MAX_PHOTOS })}</span>
        <div className="flex flex-wrap items-center gap-stack-sm">
          {photos.map((p, i) => (
            <div key={p.url} className="relative size-20 overflow-hidden rounded-md bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the picked file */}
              <img src={p.url} alt="" className="size-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} aria-label={t.formRemovePhoto} className="chip-over-photo absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full text-xs" data-testid="review-photo-remove">
                ×
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex size-20 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-field-border text-2xl text-muted transition-colors hover:border-foreground hover:text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus">
              +
              <input ref={fileInput} type="file" name="photos" accept={ACCEPT.join(",")} multiple className="sr-only" onChange={(e) => pickFiles(e.target.files)} data-testid="review-photos" />
            </label>
          )}
        </div>
        <span className="text-muted">{fill(t.formPhotosHint, { mb: MAX_MB })}</span>
      </div>
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
