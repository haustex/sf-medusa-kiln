"use client"

import { cn } from "@heroui/styles"
import { useState } from "react"

import { Mark, MARK_LABELS, type MarkName } from "@modules/brand/marks"

export type ShareLabels = { share: string; shareOn: string; copy: string; copied: string }

/** Share targets: plain intent links, nothing from the networks runs on the page */
const TARGETS: { key: MarkName; href: (p: { url: string; title: string; image?: string | null }) => string }[] = [
  { key: "whatsapp", href: ({ url, title }) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  { key: "telegram", href: ({ url, title }) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { key: "threads", href: ({ url, title }) => `https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} ${url}`)}` },
  { key: "facebook", href: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { key: "x", href: ({ url, title }) => `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
  { key: "linkedin", href: ({ url }) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  {
    key: "pinterest",
    href: ({ url, title, image }) =>
      `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}${image ? `&media=${encodeURIComponent(image)}` : ""}`,
  },
]

// 44px targets, no border or background: the filled mark (22px, Ink) greys on hover
const btn = "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-foreground outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-focus"

/**
 * Share row at the end of an article: one filled brand mark per network (WhatsApp, Telegram, Threads, Facebook, X,
 * LinkedIn, Pinterest) and "copy link". Plain intent links (work without JS). `url`: the article's canonical URL;
 * `image`: the cover, for Pinterest.
 */
export default function ShareButtons({ url, title, image, labels, className }: { url: string; title: string; image?: string | null; labels: ShareLabels; className?: string }) {
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
  const on = (network: string) => labels.shareOn.replace("{network}", network)

  return (
    <div className={cn("flex flex-wrap items-center gap-x-1 gap-y-stack-xs", className)} data-testid="share-row">
      <p className="mr-stack-sm text-sm font-medium">{labels.share}</p>
      {TARGETS.map((x) => (
        <a key={x.key} href={x.href({ url, title, image })} target="_blank" rel="noopener noreferrer" aria-label={on(MARK_LABELS[x.key])} title={on(MARK_LABELS[x.key])} className={btn} data-share={x.key}>
          <Mark name={x.key} />
        </a>
      ))}
      <button type="button" onClick={copy} aria-label={labels.copy} title={labels.copy} className={btn} data-testid="copy-link">
        {copied ? (
          <svg aria-hidden="true" focusable={false} viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13L9 17L19 7" />
          </svg>
        ) : (
          <Mark name="link" />
        )}
      </button>
      <span role="status" aria-live="polite" className={cn("text-sm text-muted", !copied && "sr-only")}>
        {copied ? labels.copied : ""}
      </span>
    </div>
  )
}
