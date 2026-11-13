"use client"

import { ArrowRight } from "@modules/ds/icons"
import Link from "@modules/common/components/app-link"
import { IconButton } from "@modules/common/components/ui"
import { useEffect, useState } from "react"

const STORAGE_KEY = "kiln_market_banner_dismissed"

/**
 * theme.config.ts markets.suggest: a small dismissible pill on one market pointing to another ("Shopping from the
 * US? → Go to the US store"). No geo-IP: every visitor of market `on` sees it until closed. Fixed position, shown
 * once the web fonts are in: a fixed element that changes height when the font swaps still counts as a layout
 * shift, an element that appears afterwards does not.
 */
export default function MarketBanner({ href, text, cta, closeLabel, lang }: { href: string; text: string; cta: string; closeLabel: string; lang: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let show = true
    try {
      show = window.localStorage.getItem(STORAGE_KEY) !== "1"
    } catch {}
    if (!show) return
    let alive = true
    const ready = document.fonts?.ready ?? Promise.resolve()
    ready.then(() => alive && setVisible(true))
    return () => {
      alive = false
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1")
    } catch {}
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label={text}
      lang={lang}
      data-testid="market-banner"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-[var(--radius)] border border-separator bg-surface py-2 pl-4 pr-2 text-sm shadow-lift sm:inset-x-auto sm:right-6"
    >
      <span className="text-muted">{text}</span>
      <Link href={href} prefetch={false} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4" onClick={dismiss}>
        {cta}
        <ArrowRight className="ml-1" />
      </Link>
      <IconButton type="button" aria-label={closeLabel} onClick={dismiss} className="ml-auto">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </IconButton>
    </div>
  )
}
