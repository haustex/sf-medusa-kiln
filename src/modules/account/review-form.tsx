"use client"

import { useRouter } from "next/navigation"

import { type Dictionary } from "@lib/i18n/dictionaries"
import { fill } from "@lib/i18n/fill"
import ReviewForm, { type ReviewItem } from "@modules/reviews/review-form"

/** Account → Reviews: one form per reviewable item (customer cookie, `order_id`); the page refreshes after each */
export function ReviewForms({ items, t }: { items: { orderId: string; displayId: number; item: ReviewItem }[]; t: Dictionary["reviews"] }) {
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
