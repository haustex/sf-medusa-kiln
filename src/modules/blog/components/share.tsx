"use client"

import { buttonVariants, cn } from "@heroui/styles"
import { useState } from "react"

/**
 * Share row at the end of an article: WhatsApp (plain link, works without JS) and "copy link".
 * `url` is the article's absolute canonical URL.
 */
export default function ShareButtons({
  url,
  title,
  labels,
}: {
  url: string
  title: string
  labels: { share: string; whatsapp: string; copy: string; copied: string }
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard blocked (old browser, no permission): let the person copy it by hand
      window.prompt(labels.copy, url)
    }
  }
  const btn = cn(buttonVariants({ variant: "secondary" }), "h-11 gap-2 px-4")
  return (
    <div className="flex flex-wrap items-center gap-stack-sm">
      <p className="mr-stack-xs text-sm font-medium">{labels.share}</p>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={btn}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" />
          <path d="M9.2 8.2c-.4 1.3.3 3 1.8 4.6s3.3 2.2 4.6 1.8l.5-1.5-1.7-1-1 .8c-.9-.4-1.9-1.4-2.3-2.3l.8-1-1-1.7Z" />
        </svg>
        {labels.whatsapp}
      </a>
      <button type="button" onClick={copy} className={btn}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          {copied ? (
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          ) : (
            <>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </>
          )}
        </svg>
        <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
      </button>
    </div>
  )
}
