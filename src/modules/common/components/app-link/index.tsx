"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

/**
 * Every <Link> in the storefront goes through this, for one prefetch policy (docs/keputusan.md "Prefetch selektif"):
 *
 * - default (`prefetch` left out): Next's own, a prefetch when the link enters the viewport (again on hover once
 *   stale). For the main category menu, the logo, product cards, the cart button.
 * - off for pages nobody reaches from a fresh visit: info pages, account, order tracking, search (each prefetch is
 *   2 RSC requests). Callers can switch any link off with `prefetch={false}`; the footer does so for all its links,
 *   which also drops the second prefetch of links that are in the header too.
 * - all off with Save-Data or a slow connection (effectiveType slow-2g/2g/3g, i.e. RTT ≥ 270 ms: Chrome's "3g"
 *   bucket is what DevTools' slow 3G lands in). Next only honors that in the pages router.
 *
 * `prefetch` does not render into the HTML, so deciding it during render on the client (navigator) cannot cause
 * a hydration mismatch.
 */
const NO_PREFETCH = /^(?:\/[a-z]{2})?\/(?:shipping|returns|privacy|terms|contact|account|lacak|track|review|transfer|search)(?:[/?#]|$)/

type Connection = { saveData?: boolean; effectiveType?: string }

export function lowData() {
  if (typeof navigator === "undefined") return false
  const c = (navigator as Navigator & { connection?: Connection }).connection
  return !!c && (c.saveData === true || /^(?:slow-2g|2g|3g)$/.test(c.effectiveType ?? ""))
}

export default function AppLink({ prefetch, ...props }: ComponentProps<typeof Link>) {
  const href = typeof props.href === "string" ? props.href : (props.href.pathname ?? "")
  const off = prefetch === false || NO_PREFETCH.test(href) || lowData()
  return <Link {...props} prefetch={off ? false : prefetch} />
}
