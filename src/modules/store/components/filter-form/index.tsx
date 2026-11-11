import { cn } from "@heroui/styles"

import { fill, type Dictionary } from "@lib/i18n/dictionaries"
import type { Facet, ListingQuery } from "@lib/listing/filters"
import Link from "@modules/common/components/app-link"
import type { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import FilterFormShell from "./shell"

export type CategoryLink = { label: string; href: string; active: boolean; count?: number }

/** Rows shown before a facet folds (selected rows always show) */
const FOLD_AFTER = 6

/**
 * The filter sidebar (desktop) and the body of the filter sheet (phones): one server-rendered GET form. Category
 * rows are links (a category is a page, not a query); everything else is a native checkbox or number field whose
 * name/value is the listing query (lib/listing/filters.ts). Rendered twice on a listing page (aside + sheet), so
 * `id` must differ per instance; `sort` keeps the current order through a hidden field.
 */
export default function FilterForm({
  id,
  action,
  query,
  facets,
  categories,
  categoriesLabel,
  currencySymbol,
  sort,
  t,
  className,
}: {
  id: string
  /** Market-prefixed path of the listing (the form's action) */
  action: string
  query: ListingQuery
  facets: Facet[]
  categories: CategoryLink[]
  categoriesLabel: string
  currencySymbol: string
  /** Keep this sort through the hidden field (omit when a sort <select form={id}> is on the page) */
  sort?: SortOptions
  t: Dictionary["listing"]
  className?: string
}) {
  const legend = "type-label text-muted"
  const row = "flex min-h-11 cursor-pointer items-center gap-stack-sm"
  const count = "ml-auto text-sm tabular-nums text-muted"
  return (
    <FilterFormShell id={id} action={action} className={cn("flex flex-col gap-stack-lg", className)}>
      {sort && sort !== "created_at" && <input type="hidden" name="sort" value={sort} />}

      {categories.length > 0 && (
        <nav aria-label={categoriesLabel} className="flex flex-col gap-stack-xs">
          <h3 className={legend}>{categoriesLabel}</h3>
          <ul className="flex flex-col">
            {categories.map((c) => (
              <li key={c.href}>
                <Link href={c.href} aria-current={c.active ? "page" : undefined} className={cn(row, "group outline-none")}>
                  <span aria-hidden="true" className={cn("k-check pointer-events-none group-focus-visible:outline-2 group-focus-visible:outline-focus", c.active && "bg-foreground")} />
                  <span className={cn("text-sm", c.active && "font-medium")}>{c.label}</span>
                  {typeof c.count === "number" && <span className={count}>{c.count}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <fieldset className="flex flex-col gap-stack-sm">
        <legend className={cn(legend, "mb-stack-xs")}>{t.price}</legend>
        <div className="grid grid-cols-2 gap-stack-sm">
          {(["min", "max"] as const).map((k) => (
            <label key={k} className="relative block">
              <span className="sr-only">{k === "min" ? t.priceMin : t.priceMax}</span>
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">
                {currencySymbol}
              </span>
              <input
                type="number"
                name={k}
                min={0}
                step="any"
                inputMode="decimal"
                defaultValue={query[k] ?? ""}
                placeholder={k === "min" ? t.min : t.max}
                className="h-11 w-full rounded-control border border-foreground bg-background pl-8 pr-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </label>
          ))}
        </div>
      </fieldset>

      {facets.map((facet) => {
        if (facet.name === "stock") {
          return (
            <fieldset key={facet.group} className="flex flex-col">
              <legend className={cn(legend, "mb-stack-xs")}>{facet.label}</legend>
              <label className={row}>
                <input type="checkbox" name="stock" value="1" defaultChecked={facet.active} className="k-check" />
                <span className="text-sm">{t.inStock}</span>
                <span className={count}>{facet.count}</span>
              </label>
            </fieldset>
          )
        }
        if (facet.name === "rating") {
          return (
            <fieldset key={facet.group} className="flex flex-col">
              <legend className={cn(legend, "mb-stack-xs")}>{facet.label}</legend>
              <label className={row}>
                <input type="checkbox" name="rating" value={facet.threshold} defaultChecked={facet.active} disabled={!facet.count && !facet.active} className="k-check" />
                <span className="text-sm">{fill(t.ratingUp, { n: facet.threshold })}</span>
                <span className={count}>{facet.count}</span>
              </label>
            </fieldset>
          )
        }
        // Long lists: the first rows (and every selected one) stay visible, the rest folds behind a native <details>
        const visible = facet.values.filter((v, i) => i < FOLD_AFTER || v.active)
        const folded = facet.values.filter((v) => !visible.includes(v))
        const option = (v: (typeof facet.values)[number]) => (
          <label key={v.value} className={cn(row, !v.count && !v.active && "text-muted")}>
            <input type="checkbox" name={facet.name} value={v.value} defaultChecked={v.active} disabled={!v.count && !v.active} className="k-check" />
            <span className="text-sm">{v.label}</span>
            <span className={count}>{v.count}</span>
          </label>
        )
        return (
          <fieldset key={facet.group} className="flex flex-col">
            <legend className={cn(legend, "mb-stack-xs")}>{facet.label}</legend>
            {visible.map(option)}
            {folded.length > 0 && (
              <details className="group flex flex-col">
                <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm underline-offset-4 hover:underline group-open:hidden [&::-webkit-details-marker]:hidden">
                  {fill(t.showAll, { n: facet.values.length })}
                </summary>
                {folded.map(option)}
              </details>
            )}
          </fieldset>
        )
      })}

      <noscript>
        <button type="submit" className="k-chip">
          {t.apply}
        </button>
      </noscript>
    </FilterFormShell>
  )
}
