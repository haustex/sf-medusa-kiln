"use client"

import { Heart } from "lucide-react"
import { useEffect } from "react"

import Link from "@modules/common/components/app-link"
import { ICON } from "@modules/ds/icons"
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
      <Heart {...ICON} />
      <CountBadge count={count} />
    </Link>
  )
}
