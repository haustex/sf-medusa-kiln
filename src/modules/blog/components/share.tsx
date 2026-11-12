"use client"

import { cn } from "@heroui/styles"
import { useState, useSyncExternalStore } from "react"

import { Glyph, GLYPH_LABELS, type GlyphName } from "@modules/brand/glyphs"

export type ShareLabels = { share: string; native: string; shareOn: string; copy: string; copied: string }

/** Share targets: plain intent links, nothing from the networks runs on the page */
const TARGETS: { key: GlyphName; href: (p: { url: string; title: string; image?: string | null }) => string }[] = [
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

const subscribeNever = () => () => {}

const round =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-separator bg-surface text-foreground outline-none transition-colors hover:border-foreground focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"

/**
 * Share row at the end of an article (and, from xl, a sticky rail beside the text): one round button per network
 * (WhatsApp, Telegram, Threads, Facebook, X, LinkedIn, Pinterest), "copy link", and on phones the system share
 * sheet (Web Share API) when the browser has one. The links work without JS. `url`: the article's canonical URL;
 * `image`: the cover, for Pinterest.
 */
export default function ShareButtons({
  url,
  title,
  image,
  labels,
  orientation = "row",
  className,
}: {
  url: string
  title: string
  image?: string | null
  labels: ShareLabels
  orientation?: "row" | "column"
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  // false on the server and in the first client render (hydration), then whatever the browser has
  const canShare = useSyncExternalStore(subscribeNever, () => typeof navigator.share === "function", () => false)

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
  const share = async () => {
    try {
      await navigator.share({ title, url })
    } catch {
      // dismissed
    }
  }
  const on = (network: string) => labels.shareOn.replace("{network}", network)
  const column = orientation === "column"

  return (
    <div className={cn("flex gap-stack-sm", column ? "flex-col items-center" : "flex-wrap items-center", className)} data-testid={column ? "share-rail" : "share-row"}>
      <p className={cn("text-sm font-medium", column ? "sr-only" : "mr-stack-xs")}>{labels.share}</p>
      {canShare && (
        <button type="button" onClick={share} aria-label={labels.native} title={labels.native} className={cn(round, "md:hidden")} data-testid="share-native">
          <Glyph name="share" />
        </button>
      )}
      {TARGETS.map((x) => {
        const name = GLYPH_LABELS[x.key] ?? x.key
        return (
          <a key={x.key} href={x.href({ url, title, image })} target="_blank" rel="noopener noreferrer" aria-label={on(name)} title={on(name)} className={round} data-share={x.key}>
            <Glyph name={x.key} />
          </a>
        )
      })}
      <button type="button" onClick={copy} aria-label={labels.copy} title={labels.copy} className={cn(round, copied && "border-foreground bg-foreground text-background")} data-testid="copy-link">
        <Glyph name={copied ? "check" : "link"} />
      </button>
      {/* Announced when the link was copied; visible text only in the row (the rail has no room for it) */}
      <span role="status" aria-live="polite" className={cn("text-sm text-muted", (column || !copied) && "sr-only")}>
        {copied ? labels.copied : ""}
      </span>
    </div>
  )
}
