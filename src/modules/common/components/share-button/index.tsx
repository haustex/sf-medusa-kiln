"use client"

import { cn } from "@heroui/styles"
import { Share } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

import { Mark, MARK_LABELS, type MarkName } from "@modules/brand/marks"
import { ICON } from "@modules/ds/icons"

export type ShareLabels = {
  /** aria-label of the button: "Share {title}" already filled */
  button: string
  /** name of the menu */
  menu: string
  shareOn: string
  copy: string
  copied: string
  email: string
}

type Channel = { key: MarkName; medium: string; label: (l: ShareLabels) => string; href: (p: { url: string; title: string; image: string | null; imageAlt: string | null }) => string }

/** Share targets: plain intent links, nothing from the networks runs on the page. Each gets its own utm_medium. */
const CHANNELS: Channel[] = [
  { key: "whatsapp", medium: "whatsapp", label: (l) => l.shareOn.replace("{network}", MARK_LABELS.whatsapp), href: ({ url, title }) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  { key: "facebook", medium: "facebook", label: (l) => l.shareOn.replace("{network}", MARK_LABELS.facebook), href: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { key: "x", medium: "x", label: (l) => l.shareOn.replace("{network}", MARK_LABELS.x), href: ({ url, title }) => `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
  {
    key: "pinterest",
    medium: "pinterest",
    label: (l) => l.shareOn.replace("{network}", MARK_LABELS.pinterest),
    href: ({ url, title, image, imageAlt }) => `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(imageAlt || title)}${image ? `&media=${encodeURIComponent(image)}` : ""}`,
  },
  { key: "mail", medium: "email", label: (l) => l.email, href: ({ url, title }) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${url}`)}` },
]

/** The canonical URL tagged for the channel: utm_source=share&utm_medium={medium} */
export const shareUrl = (url: string, medium: string) => `${url}${url.includes("?") ? "&" : "?"}utm_source=share&utm_medium=${medium}`

const item = "flex h-11 w-full items-center gap-stack-sm rounded-control px-3 text-sm outline-none hover:bg-default/70 focus-visible:bg-default/70"

/**
 * Share button: a round glass disc, over the product photo (under the wishlist heart, `surface` "photo") or on the
 * page at the end of an article ("page"). On touch devices with the Web Share API (phones) it opens the system share
 * sheet with the title and URL; elsewhere a small frost menu: copy link (with a "link copied" toast), WhatsApp,
 * Facebook, X, Pinterest (the photo and its alt text), e-mail, with the filled brand marks. `url`: the page's
 * canonical URL; every channel gets its own utm_medium on it (utm_source=share). `align`: which edge of the button
 * the menu hangs from. Keyboard: Escape closes, arrows move, Tab leaves and closes.
 */
export default function ShareButton({
  url,
  title,
  image,
  imageAlt,
  labels,
  surface = "photo",
  align = "end",
  className,
}: {
  url: string
  title: string
  image: string | null
  imageAlt: string | null
  labels: ShareLabels
  /** "photo": glass-photo disc over a picture; "page": glass disc on the page */
  surface?: "photo" | "page"
  /** The menu's edge: "end" hangs from the right edge of the button, "start" from the left */
  align?: "start" | "end"
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus()
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const onClick = async () => {
    // the system share sheet on touch devices; the menu on desktops (more targets, and Pinterest needs the photo)
    if (typeof navigator.share === "function" && window.matchMedia("(hover: none)").matches) {
      try {
        await navigator.share({ title, url: shareUrl(url, "native") })
        return
      } catch (e) {
        if ((e as Error).name === "AbortError") return
        // share sheet unavailable after all: the menu
      }
    }
    setOpen((v) => !v)
  }

  const copy = async () => {
    const link = shareUrl(url, "copy")
    setOpen(false)
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard blocked (old browser, no permission): let the person copy it by hand
      window.prompt(labels.copy, link)
    }
    rootRef.current?.querySelector<HTMLElement>("button")?.focus()
  }

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])
  const onMenuKey = (e: React.KeyboardEvent) => {
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLElement)
    const go = (n: number) => {
      e.preventDefault()
      list[(n + list.length) % list.length]?.focus()
    }
    if (e.key === "ArrowDown") go(i + 1)
    else if (e.key === "ArrowUp") go(i - 1)
    else if (e.key === "Home") go(0)
    else if (e.key === "End") go(list.length - 1)
    else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
      rootRef.current?.querySelector<HTMLElement>("button")?.focus()
    } else if (e.key === "Tab") setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={onClick}
        aria-label={labels.button}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        className={cn("inline-flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus", surface === "photo" ? "glass-photo" : "glass focus-visible:ring-offset-2")}
        data-testid="share-button"
      >
        <Share {...ICON} />
      </button>
      {open && (
        <div id={id} ref={menuRef} role="menu" aria-label={labels.menu} onKeyDown={onMenuKey} className={cn("frost absolute top-full z-50 mt-stack-sm w-56 rounded-media border border-separator p-1 shadow-lift", align === "end" ? "right-0" : "left-0")} data-testid="share-menu">
          <button type="button" role="menuitem" onClick={copy} className={item} data-share="copy">
            <Mark name="link" size={20} />
            <span>{labels.copy}</span>
          </button>
          {CHANNELS.map((c) => (
            <a key={c.key} role="menuitem" href={c.href({ url: shareUrl(url, c.medium), title, image, imageAlt })} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={item} data-share={c.key}>
              <Mark name={c.key} size={20} />
              <span>{c.label(labels)}</span>
            </a>
          ))}
        </div>
      )}
      {/* "link copied": a glass pill where the menu was, 2.5 s */}
      <div role="status" aria-live="polite" className={cn("absolute top-full z-50 mt-stack-sm whitespace-nowrap rounded-full px-3 py-2 text-sm shadow-lift", align === "end" ? "right-0" : "left-0", copied ? "glass-photo" : "sr-only")} data-testid="share-copied">
        {copied ? labels.copied : ""}
      </div>
    </div>
  )
}
