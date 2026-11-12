"use client"

import { useEffect } from "react"

import { dismissRemovedItems } from "@lib/data/cart"

/**
 * "Some items are no longer available": shown once on the cart page after the backend took lines of products no
 * longer for sale out of the cart, then cleared (it stays visible until the page is left).
 */
export default function RemovedNotice({ titles, message }: { titles: string[]; message: string }) {
  useEffect(() => {
    void dismissRemovedItems().catch(() => undefined)
  }, [])
  return (
    <div role="status" className="rounded-media border border-control p-stack-md text-sm" data-testid="cart-removed-notice">
      <p className="font-medium">{message}</p>
      <p className="mt-1 text-muted">{titles.join(", ")}</p>
    </div>
  )
}
