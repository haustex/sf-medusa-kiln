"use client"

import { useRouter } from "next/navigation"

import { type Dictionary } from "@lib/i18n/dictionaries"
import ReviewForm, { type ReviewItem } from "./review-form"

/** The open items of a magic link, one form each; after a submit the page re-reads the link (the item is gone) */
export default function RequestItems({ items, token, t }: { items: ReviewItem[]; token: string; t: Dictionary["reviews"] }) {
  const router = useRouter()
  return (
    <div className="flex flex-col gap-stack-lg">
      {items.map((item) => (
        <ReviewForm key={item.order_item_id} item={item} token={token} t={t} onDone={() => router.refresh()} />
      ))}
    </div>
  )
}
