"use client"

import { CART_UPDATED_EVENT } from "@lib/util/cart-events"
import { marketPath } from "@lib/util/market"
import Link from "@modules/common/components/app-link"
import CountBadge from "@modules/layout/components/count-badge"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * Cart link with item count. Static pages can't read the cart cookie, so the
 * count is loaded in the browser and refreshed on CART_UPDATED_EVENT.
 *
 * Loaded with a GET to /api/cart/count, not a server action: see the note in
 * app/api/cart/count/route.ts (a first visitor's action POST invalidated every
 * prefetched route).
 */
export default function CartLink({ initialCount, label }: { initialCount: number | null; label: string }) {
  const { countryCode } = useParams()
  const [count, setCount] = useState(initialCount ?? 0)

  useEffect(() => {
    const load = () =>
      fetch("/api/cart/count", { cache: "no-store", credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { count?: number } | null) => setCount(data?.count ?? 0))
        .catch(() => {})
    if (initialCount === null) load()
    window.addEventListener(CART_UPDATED_EVENT, load)
    return () => window.removeEventListener(CART_UPDATED_EVENT, load)
  }, [initialCount])

  return (
    <Link
      href={marketPath(countryCode as string, "/cart")}
      className="relative inline-flex size-11 items-center justify-center rounded-full outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus"
      aria-label={count > 0 ? `${label} (${count})` : label}
      data-testid="nav-cart-link"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
        <path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <CountBadge count={count} />
    </Link>
  )
}
