"use client"

import { usePathname } from "next/navigation"
import Script from "next/script"
import { useEffect } from "react"

/**
 * Metricool web tracking (theme.config.ts `analytics.metricool`, the hash of your tracker code). The tracker
 * (tracker.metricool.com/resources/be.js, ~400 bytes) only defines `beTracker.t()`, which requests a pixel with the
 * page URL, viewport size and referrer; it sets no cookies and writes no storage (checked 7 Nov 2026). Loaded in
 * browser idle time after everything else (`lazyOnload`), a page view is sent when it arrives and on every
 * client-side navigation. The layout renders it only when SITE_LIVE is true and never on the per-visitor pages in
 * `exclude` (checkout, account, order, transfer, review link, tracking: their URLs carry ids or tokens).
 */
const SRC = "https://tracker.metricool.com/resources/be.js"

declare global {
  interface Window {
    beTracker?: { t: (options: { hash: string }) => void }
  }
}

export default function Metricool({ hash, exclude }: { hash: string; exclude: string[] }) {
  const pathname = usePathname()
  const excluded = !pathname || exclude.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const pageView = () => window.beTracker?.t({ hash })

  // Client-side navigations: the script is already there, so send the page view here. On the first page the
  // script has not arrived yet when this runs (no-op); onLoad sends that one.
  useEffect(() => {
    if (!excluded) window.beTracker?.t({ hash })
  }, [pathname, excluded, hash])

  if (excluded) return null
  return <Script src={SRC} strategy="lazyOnload" onLoad={pageView} />
}
