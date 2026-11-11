"use client"

import { cn } from "@heroui/styles"
import { stripMarketPrefix } from "@lib/util/market"
import Link from "@modules/common/components/app-link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

export type MenuItem = { href: string; label: string }

/**
 * The server renders the rewritten path (`/us/store`), the browser shows the public one (`/store`): compare both
 * without the market prefix, or hydration would flag aria-current.
 */
const normalize = (path: string) => stripMarketPrefix(path).replace(/\/$/, "") || "/"

const isActive = (pathname: string, href: string) => {
  const p = normalize(pathname)
  const h = normalize(href)
  return p === h || p.startsWith(`${h}/`)
}

/**
 * Category row under the search. Ink text (the header is translucent: Muted could drop under 4.5:1 over a dark
 * photo), no background. Hover (pointer
 * devices only): black text + 2px underline that grows (scaleX, 150ms) and sits
 * on the header's bottom border, as wide as the label. Active page: medium black
 * text + the same underline, permanent. Keyboard focus: thin rounded ring around
 * the label only. Tap targets stay 44px tall.
 */
export default function CategoryMenu({ items, label }: { items: MenuItem[]; label: string }) {
  const pathname = usePathname() ?? "/"
  const listRef = useRef<HTMLUListElement>(null)

  // Phones: bring the active item into the scroll row (horizontal only, no page scroll).
  useEffect(() => {
    const list = listRef.current
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !active || list.scrollWidth <= list.clientWidth) return
    const target = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2
    list.scrollLeft = Math.max(0, target)
  }, [pathname])

  return (
    <nav aria-label={label} className="content-container">
      <ul
        ref={listRef}
        className="no-scrollbar relative -mx-2 flex items-center overflow-x-auto whitespace-nowrap text-sm md:mx-0 md:justify-between md:overflow-visible md:text-[0.9375rem]"
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative inline-flex h-11 items-center px-2 outline-none transition-colors duration-150 md:px-3",
                  // underline: text width (inset = horizontal padding), on the header border
                  // (bottom-0 on phones: the scroll row clips overflow)
                  "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 md:after:-bottom-px after:origin-center after:bg-foreground after:transition-transform after:duration-150 after:ease-out md:after:inset-x-3",
                  "motion-reduce:after:transition-none",
                  active
                    ? "font-medium text-foreground after:scale-x-100"
                    : "text-foreground after:scale-x-0 hover:after:scale-x-100"
                )}
              >
                <span className="rounded-sm group-focus-visible:ring-2 group-focus-visible:ring-focus group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background">
                  {item.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
