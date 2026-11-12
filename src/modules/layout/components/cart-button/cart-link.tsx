"use client"

import { CART_UPDATED_EVENT, openCart } from "@lib/util/cart-events"
import { marketPath } from "@lib/util/market"
import { ShoppingBag } from "lucide-react"
import Link from "@modules/common/components/app-link"
import { ICON } from "@modules/ds/icons"
import CountBadge from "@modules/layout/components/count-badge"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * Cart button with item count: opens the cart drawer (a link to /cart without JS). Static pages can't read the
 * cart cookie, so the count is loaded in the browser and refreshed on CART_UPDATED_EVENT.
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
      onClick={(e) => {
        e.preventDefault()
        openCart()
      }}
      aria-haspopup="dialog"
      className="relative inline-flex size-11 items-center justify-center rounded-full outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus"
      aria-label={count > 0 ? `${label} (${count})` : label}
      data-testid="nav-cart-link"
    >
      <ShoppingBag {...ICON} />
      <CountBadge count={count} />
    </Link>
  )
}
