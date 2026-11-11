"use client"

import { useEffect } from "react"

import Link from "@modules/common/components/app-link"
import CountBadge from "@modules/layout/components/count-badge"
import { loadWishlist, useWishlistState } from "@modules/wishlist/store"

/** Heart in the header with the wishlist count (loaded in the browser from /api/wishlist, private no-store). */
export default function WishlistLink({ href, label }: { href: string; label: string }) {
  const { count } = useWishlistState()
  useEffect(() => {
    void loadWishlist()
  }, [])
  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={count > 0 ? `${label} (${count})` : label}
      className="relative inline-flex size-11 items-center justify-center rounded-full outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus"
      data-testid="nav-wishlist-link"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
        <path d="M12 20.3 4.9 13.6a4.6 4.6 0 0 1 0-6.6 4.7 4.7 0 0 1 6.6 0l.5.5.5-.5a4.7 4.7 0 0 1 6.6 0 4.6 4.6 0 0 1 0 6.6L12 20.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <CountBadge count={count} />
    </Link>
  )
}
