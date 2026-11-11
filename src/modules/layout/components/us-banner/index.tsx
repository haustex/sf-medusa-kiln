"use client"

import { closeButtonVariants, cn } from "@heroui/styles"
import { ArrowRight } from "@modules/ds/icons"
import Link from "@modules/common/components/app-link"
import { useEffect, useState } from "react"

const STORAGE_KEY = "hk_us_banner_dismissed"

type UsBannerProps = {
  text: string
  cta: string
  closeLabel: string
}

/**
 * Small dismissible pill pointing US shoppers to /us. No geo-IP: shown to every
 * visitor of the Indonesian store until closed. Fixed position; shown after the fonts load (no layout shift).
 */
export default function UsBanner({ text, cta, closeLabel }: UsBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let show = true
    try {
      show = window.localStorage.getItem(STORAGE_KEY) !== "1"
    } catch {}
    if (!show) return
    // Appear once the web fonts are in: its text wraps differently in the fallback font, and a fixed element
    // that changes height still counts as a layout shift (CLS 0.047 on /cart). A newly shown element does not.
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
      lang="en"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-[var(--radius)] border border-border bg-surface py-2 pl-4 pr-2 text-sm shadow-lift transition-transform duration-200 motion-reduce:transition-none sm:inset-x-auto sm:right-6 max-lg:[html[data-sticky-bar]_&]:-translate-y-20"
    >
      <span className="text-muted">{text}</span>
      <Link href="/us" prefetch={false} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4" onClick={dismiss}>
        {cta}
        <ArrowRight className="ml-1" />
      </Link>
      <button type="button" aria-label={closeLabel} onClick={dismiss} className={cn(closeButtonVariants(), "ml-auto size-11")}>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
