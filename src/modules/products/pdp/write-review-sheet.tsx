"use client"

import { buttonVariants, cn } from "@heroui/styles"
import { useEffect, useState } from "react"

import type { Dictionary } from "@lib/i18n/dictionaries"
import { fill } from "@lib/i18n/fill"
import Link from "@modules/common/components/app-link"
import Sheet from "@modules/ds/sheet"
import ReviewForm, { type ReviewFormLabels, type ReviewItem } from "@modules/reviews/review-form"

export type WriteLabels = ReviewFormLabels & Pick<Dictionary["reviews"], "writeReview" | "close" | "orderRef" | "toAccount" | "writeChecking" | "writeError" | "writeLogin" | "writeLoginCta" | "writeNotEligible">

type Eligible = { logged_in: boolean; items: { order_id: string; display_id: number; item: ReviewItem }[] }

/**
 * The sheet behind "Write a review" on the product page. The page is static, so who the visitor is and whether
 * they may review this product is asked on open (/api/reviews/eligible): a login prompt, "nothing to review yet",
 * or one form per reviewable order item (the plugin's rules: verified buyers, after shipping). Loaded on first use;
 * the button mounts a fresh sheet per open (key), so every open checks again.
 */
export default function WriteReviewSheet({ open, onClose, productId, accountHref, t }: { open: boolean; onClose: () => void; productId: string; accountHref: string; t: WriteLabels }) {
  const [state, setState] = useState<"loading" | "error" | Eligible>("loading")

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch(`/api/reviews/eligible?product_id=${encodeURIComponent(productId)}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<Eligible>) : Promise.reject(new Error(String(r.status)))))
      .then((data) => !cancelled && setState(data))
      .catch(() => !cancelled && setState("error"))
    return () => {
      cancelled = true
    }
  }, [open, productId])

  const secondary = cn(buttonVariants({ variant: "secondary", size: "md" }), "self-start")
  return (
    <Sheet open={open} onClose={onClose} side="bottom" label={t.writeReview} title={t.writeReview} closeLabel={t.close}>
      <div className="flex flex-col gap-stack-md" data-testid="write-review">
        {state === "loading" && (
          <p className="text-sm text-muted" role="status">
            {t.writeChecking}
          </p>
        )}
        {state === "error" && (
          <p className="text-sm text-danger" role="alert">
            {t.writeError}
          </p>
        )}
        {typeof state === "object" && !state.logged_in && (
          <>
            <p className="text-sm text-muted">{t.writeLogin}</p>
            <Link href={accountHref} className={secondary} data-testid="write-review-login">
              {t.writeLoginCta}
            </Link>
          </>
        )}
        {typeof state === "object" && state.logged_in && !state.items.length && (
          <>
            <p className="text-sm text-muted">{t.writeNotEligible}</p>
            <Link href={`${accountHref}/reviews`} className={secondary}>
              {t.toAccount}
            </Link>
          </>
        )}
        {typeof state === "object" &&
          state.items.map(({ order_id, display_id, item }) => (
            <div key={item.order_item_id} className="flex flex-col gap-stack-xs">
              <p className="text-sm text-muted">{fill(t.orderRef, { n: display_id })}</p>
              <ReviewForm item={item} orderId={order_id} t={t} />
            </div>
          ))}
      </div>
    </Sheet>
  )
}
