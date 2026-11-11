"use client"

import { cn } from "@heroui/styles"
import { useParams, usePathname } from "next/navigation"
import { Check, ChevronDown } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

import { marketPath, stripMarketPrefix } from "@lib/util/market"
import Flag from "@modules/brand/flags"
import { ICON } from "@modules/ds/icons"

export type MarketOption = {
  code: string
  /** Country name in the current language */
  country: string
  currency: string
  hrefLang: string
}

/**
 * Market switch in the header: a flag button that opens a small frost menu of the markets that exist as Medusa
 * regions (flag, country, currency). Plain links, so it works as a list of alternates for crawlers too. Keyboard:
 * Enter/Space/ArrowDown open, arrows move, Home/End jump, Escape closes, Tab leaves and closes.
 */
export default function MarketSelect({ options: given, label, className }: { options: MarketOption[]; label: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const id = useId()
  const params = useParams()
  const pathname = usePathname() ?? "/"
  // The same page in every market (links, so the header can stay static HTML; the path is read in the browser)
  const page = stripMarketPrefix(pathname)
  const options = given.map((o) => ({ ...o, href: marketPath(o.code, page), current: o.code === String(params.countryCode ?? "").toLowerCase() }))
  const current = options.find((o) => o.current) ?? options[0]

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    const first = menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")
    first?.focus()
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open])

  if (options.length < 2 || !current) return null

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
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${current.country} (${current.currency})`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className="inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus"
        data-testid="market-select"
      >
        <Flag code={current.code} />
        <ChevronDown {...ICON} size={16} className={cn("transition-transform motion-reduce:transition-none", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          id={id}
          ref={menuRef}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className="frost absolute right-0 top-full z-50 mt-1 min-w-56 overflow-hidden rounded-media border border-separator py-1 shadow-lift"
        >
          {options.map((o) => (
            <li key={o.code} role="none">
              <a
                role="menuitem"
                href={o.href}
                hrefLang={o.hrefLang}
                aria-current={o.current ? "true" : undefined}
                className={cn(
                  "flex h-11 items-center gap-stack-sm px-3 text-sm outline-none hover:bg-default/70 focus-visible:bg-default/70",
                  o.current && "font-medium"
                )}
              >
                <Flag code={o.code} />
                <span className="flex-1">{o.country}</span>
                <span className="type-price text-muted">{o.currency.toUpperCase()}</span>
                {o.current && (
                  <Check {...ICON} size={16} />
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
