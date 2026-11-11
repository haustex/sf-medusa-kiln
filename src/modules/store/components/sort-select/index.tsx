"use client"

import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

import { ICON } from "@modules/ds/icons"
import type { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { submitFilters } from "@modules/store/components/filter-form/shell"

/**
 * Sort order as a native <select> dressed as a secondary button. Tied to the filter form through `form={formId}`,
 * so its value travels with the filters: changing it submits that form (client navigation via next/form). Without
 * JS the form's Apply button sends it.
 */
export default function SortSelect({ formId, value, options, label }: { formId: string; value: SortOptions; /** Each order with the listing URL that applies it (fallback when the form is not on the page) */ options: { value: SortOptions; label: string; href: string }[]; label: string }) {
  const router = useRouter()
  return (
    <label className="relative inline-flex flex-1 items-center sm:flex-none">
      <span aria-hidden="true" className="pointer-events-none absolute left-3.5 hidden text-sm text-muted sm:inline">
        {label}:
      </span>
      <select
        name="sort"
        form={formId}
        defaultValue={value}
        aria-label={label}
        className="k-select w-full sm:w-auto sm:pl-[calc(0.875rem+var(--k-sort-label,4.2rem))]"
        onChange={(e) => {
          const form = document.getElementById(formId) as HTMLFormElement | null
          if (form) submitFilters(form)
          else {
            const href = options.find((o) => o.value === e.currentTarget.value)?.href
            if (href) router.push(href, { scroll: false })
          }
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown {...ICON} size={16} className="pointer-events-none absolute right-3" />
    </label>
  )
}
