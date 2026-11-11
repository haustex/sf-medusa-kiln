import { cn } from "@heroui/styles"
import Link from "@modules/common/components/app-link"

// Same chips as the product listing (store/templates/listing.tsx): white + hairline, Ink when active
const chip =
  "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
const on = "border-foreground bg-foreground text-surface"
const off = "border-separator bg-surface hover:border-control"

/** Category filter: plain links (crawlable, no JS). Scrolls sideways on phones. */
export function CategoryChips({ items, label }: { items: { label: string; href: string; active?: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="-mx-container-x lg:mx-0">
      <ul className="no-scrollbar flex gap-stack-sm overflow-x-auto px-container-x py-1 lg:px-0">
        {items.map((c) => (
          <li key={c.href}>
            <Link href={c.href} aria-current={c.active ? "page" : undefined} className={cn(chip, c.active ? on : off)}>
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const Chevron = ({ flip }: { flip?: boolean }) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" className={cn("size-4 shrink-0", flip && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/**
 * Pagination as links (?page=2). 44px targets. Up to 7 page numbers; longer lists keep first, last and the
 * neighbours of the current page.
 */
export function Pagination({
  page,
  totalPages,
  href,
  labels,
}: {
  page: number
  totalPages: number
  href: (page: number) => string
  labels: { nav: string; prev: string; next: string; page: string }
}) {
  if (totalPages <= 1) return null
  const pages =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : Array.from(new Set([1, page - 1, page, page + 1, totalPages])).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const cell = "inline-flex h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-focus"
  const step = (target: number, text: string, flip: boolean) => {
    const disabled = target < 1 || target > totalPages
    const body = (
      <>
        {flip && <Chevron flip />}
        <span className="max-sm:sr-only">{text}</span>
        {!flip && <Chevron />}
      </>
    )
    return disabled ? (
      <span aria-disabled="true" className={cn(cell, "gap-1.5 text-muted")}>
        {body}
      </span>
    ) : (
      <Link href={href(target)} rel={flip ? "prev" : "next"} className={cn(cell, "gap-1.5 font-medium hover:bg-default")}>
        {body}
      </Link>
    )
  }
  return (
    <nav aria-label={labels.nav} className="flex items-center justify-center gap-stack-xs">
      {step(page - 1, labels.prev, true)}
      <ol className="flex items-center gap-stack-xs">
        {pages.map((p, i) => (
          <li key={p} className="flex items-center gap-stack-xs">
            {i > 0 && p - pages[i - 1] > 1 && (
              <span aria-hidden="true" className="px-1 text-muted">
                ...
              </span>
            )}
            {p === page ? (
              <span aria-current="page" className={cn(cell, "bg-foreground font-medium text-surface")}>
                <span className="sr-only">{labels.page} </span>
                {p}
              </span>
            ) : (
              <Link href={href(p)} className={cn(cell, "hover:bg-default")}>
                <span className="sr-only">{labels.page} </span>
                {p}
              </Link>
            )}
          </li>
        ))}
      </ol>
      {step(page + 1, labels.next, false)}
    </nav>
  )
}
