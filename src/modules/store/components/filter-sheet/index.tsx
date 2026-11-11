"use client"

import { SlidersHorizontal } from "lucide-react"
import { useState } from "react"

import Link from "@modules/common/components/app-link"
import { Sheet } from "@modules/ds"
import { ICON } from "@modules/ds/icons"

/**
 * Phone filters: a "Filters (n)" button and a bottom sheet (frost) holding the server-rendered FilterForm passed
 * as children. Each change inside the form navigates (next/form); React keeps this component's state across the
 * server re-render, so the sheet stays open and the count in its footer follows the result.
 */
export default function FilterSheet({ label, title, showLabel, clearLabel, clearHref, closeLabel, hasFilters, className, children }: { label: string; title: string; showLabel: string; clearLabel: string; clearHref: string; closeLabel: string; hasFilters: boolean; className?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={className}>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} data-testid="filter-sheet-button" className="k-select inline-flex w-full items-center justify-center gap-stack-sm pr-3.5 sm:w-auto">
        <SlidersHorizontal {...ICON} size={18} />
        {label}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} side="bottom" label={title} title={title} closeLabel={closeLabel}>
        <div className="flex flex-col gap-stack-lg pb-stack-lg">
          {children}
          <div className="sticky bottom-0 -mx-stack-lg flex items-center justify-between gap-stack-md border-t border-separator bg-background/90 px-stack-lg py-stack-sm">
            {hasFilters ? (
              <Link href={clearHref} scroll={false} className="inline-flex h-11 items-center px-stack-sm text-sm underline-offset-4 hover:underline">
                {clearLabel}
              </Link>
            ) : (
              <span />
            )}
            <button type="button" onClick={() => setOpen(false)} className="button button--primary h-11 rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
              {showLabel}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
