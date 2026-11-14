import { cn } from "@heroui/styles"
import { __iconData as chevronLeft } from "lucide-react/icons/chevron-left"
import { __iconData as chevronRight } from "lucide-react/icons/chevron-right"
import { __iconData as x } from "lucide-react/icons/x"

import config from "@theme"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { cardRating, getProductRatings } from "@lib/data/reviews"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { activeChips, activeFilterCount, applyFilters, buildFacets, clearedQuery, listingSearch, SORTS, sortListing, type ListingQuery } from "@lib/listing/filters"
import { breadcrumbList, JsonLd } from "@lib/seo/jsonld"
import { getMarket, marketPath } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS, toProductCard } from "@lib/util/product-card"
import { getSiteOrigin } from "@lib/util/site"
import Link from "@modules/common/components/app-link"
import { Breadcrumb, ButtonLink, type Crumb, formatPrice, Page, ProductGrid } from "@modules/ds"
import { Icon } from "@modules/ds/icons"
import CatalogCard from "@modules/products/components/catalog-card"
import FilterForm, { type CategoryLink } from "@modules/store/components/filter-form"
import FilterSheet from "@modules/store/components/filter-sheet"
import SortSelect from "@modules/store/components/sort-select"

const FORM_ID = "kiln-filters"
const SHEET_FORM_ID = "kiln-filters-sheet"

/**
 * Product listing for /store, categories and collections: breadcrumb, title, toolbar (count, filters on phones,
 * sort), filter sidebar from lg, product grid, numbered pages. Everything is in the first HTML; filters and pages
 * are URL state (lib/listing/filters.ts), so every state is a link. The listing fetches up to config.listing.scan
 * products once (Next cache) and filters in memory: fine up to a few hundred products per listing; a search engine
 * with facets can replace this later without touching the UI.
 */
export default async function ListingTemplate({
  countryCode,
  title,
  description,
  crumbs,
  basePath,
  categoryId,
  categoryHandle,
  collectionId,
  query,
}: {
  countryCode: string
  title: string
  description?: string | null
  crumbs: Crumb[]
  /** Unprefixed path of this listing, e.g. "/store" or "/categories/kitchen" */
  basePath: string
  categoryId?: string
  /** Top-level handle to highlight in the phone chip row */
  categoryHandle?: string
  collectionId?: string
  query: ListingQuery
}) {
  const dict = getDictionary(countryCode)
  const t = dict.listing
  const market = getMarket(countryCode)
  const lang = market.dictionary
  const href = (path: string) => marketPath(countryCode, path)
  const link = (q: ListingQuery) => href(basePath + listingSearch(q))
  const pageSize = config.listing.pageSize

  const [{ response }, categories] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: {
        limit: config.listing.scan,
        fields: `${PRODUCT_CARD_FIELDS},*collection`,
        ...(categoryId ? { category_id: [categoryId] } : {}),
        ...(collectionId ? { collection_id: [collectionId] } : {}),
      },
    }).catch(() => ({ response: { products: [], count: 0 } })),
    listCategories({ fields: "id,name,handle,rank,parent_category_id", limit: 100 }, countryCode).catch(() => []),
  ])
  const scanned = response.products
  const ratings = config.listing.filters.rating ? await getProductRatings(scanned.map((p) => p.id)) : new Map()

  const matched = applyFilters(scanned, query, ratings)
  const sorted = sortListing(matched, query.sort)
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const page = Math.min(query.page, totalPages)
  const pageProducts = sorted.slice((page - 1) * pageSize, page * pageSize)
  const cards = pageProducts.map((p) => toProductCard(p, countryCode, cardRating(ratings.get(p.id))))

  const facets = buildFacets(scanned, query, ratings, lang, t)
  const filters = activeFilterCount(query)
  const currency = scanned[0]?.variants?.[0]?.calculated_price?.currency_code ?? market.currency ?? "usd"
  const money = (n: number) => formatPrice(n, currency)
  const currencySymbol = new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency.toUpperCase()
  const chips = activeChips(query, facets, t, money)
  const countText = sorted.length === 1 ? t.countOne : fill(t.count, { n: sorted.length })

  // Category rows: the children of this category when it has any, otherwise the top level (with counts from the scan)
  const byRank = (a: { rank?: number | null }, b: { rank?: number | null }) => (a.rank ?? 0) - (b.rank ?? 0)
  const topLevel = categories.filter((c) => !c.parent_category_id).sort(byRank)
  const children = categoryId ? categories.filter((c) => c.parent_category_id === categoryId).sort(byRank) : []
  const inCategory = (id: string) => scanned.filter((p) => p.categories?.some((c) => c.id === id)).length
  const categoryRows: CategoryLink[] = (children.length ? children : topLevel).map((c) => ({
    label: c.name,
    href: href(`/categories/${c.handle}`),
    active: c.id === categoryId,
    count: children.length || !categoryId ? inCategory(c.id) : undefined,
  }))

  const origin = await getSiteOrigin()
  const structuredData = [
    breadcrumbList(crumbs.map((c) => ({ name: c.label, url: c.href ? `${origin}${c.href}` : undefined }))),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: title,
      numberOfItems: sorted.length,
      itemListElement: cards.map((c, i) => ({ "@type": "ListItem", position: (page - 1) * pageSize + i + 1, url: `${origin}${c.href}`, name: c.title })),
    },
  ]

  const form = (id: string, withSort: boolean) => (
    <FilterForm
      id={id}
      action={href(basePath)}
      query={query}
      facets={facets}
      categories={categoryRows}
      categoriesLabel={t.category}
      currencySymbol={currencySymbol}
      sort={withSort ? query.sort : undefined}
      t={t}
    />
  )

  return (
    <Page data-testid="category-container">
      <JsonLd data={structuredData} />
      <div className="content-container flex flex-col gap-stack-lg">
        <div className="flex flex-col gap-section-head">
          <div className="flex flex-col gap-stack-md">
            <Breadcrumb items={crumbs} label={t.breadcrumb} />
            <div className="flex flex-col gap-stack-sm">
              <h1 className="type-h1" data-testid="category-page-title">
                {title}
              </h1>
              {description && <p className="type-body max-w-2xl text-muted">{description}</p>}
            </div>
          </div>

          {/* Phones and tablets: the top-level categories as a chip row (the header's category row is hidden there) */}
          <nav aria-label={t.filterLabel} className="-mx-container-x lg:hidden">
            <ul className="no-scrollbar flex gap-stack-sm overflow-x-auto px-container-x">
              <li>
                <Link href={href("/store")} aria-current={basePath === "/store" ? "page" : undefined} className="k-chip">
                  {t.all}
                </Link>
              </li>
              {topLevel.map((c) => (
                <li key={c.id}>
                  <Link href={href(`/categories/${c.handle}`)} aria-current={c.handle === categoryHandle ? "page" : undefined} className="k-chip">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Toolbar: count + (filters on phones/tablets) + sort; on phones the two controls share a second row */}
        <div className="flex flex-col gap-stack-sm sm:flex-row sm:items-center sm:justify-between sm:gap-stack-md">
          <p className="text-sm text-muted" aria-live="polite">
            {countText}
          </p>
          <div className="flex items-center gap-stack-sm">
            <FilterSheet
              className="flex-1 sm:flex-none lg:hidden"
              label={filters ? fill(t.filtersWithCount, { n: filters }) : t.filters}
              title={t.filters}
              showLabel={sorted.length === 1 ? t.showResultsOne : fill(t.showResults, { n: sorted.length })}
              clearLabel={t.clear}
              clearHref={link(clearedQuery(query))}
              closeLabel={dict.product.close}
              hasFilters={filters > 0}
            >
              {form(SHEET_FORM_ID, true)}
            </FilterSheet>
            <SortSelect formId={FORM_ID} value={query.sort} label={t.sortLabel} options={SORTS.map((s) => ({ value: s, label: t.sort[s], href: link({ ...query, sort: s, page: 1 }) }))} />
          </div>
        </div>

        <div className="grid gap-x-12 gap-y-stack-lg lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden lg:block" aria-label={t.filtersLabel}>
            {form(FORM_ID, false)}
          </aside>

          <div className="flex flex-col gap-stack-lg">
            {chips.length > 0 && (
              <ul className="flex flex-wrap items-center gap-stack-sm" aria-label={t.activeFilters}>
                {chips.map((c) => (
                  <li key={c.label}>
                    <Link href={link(c.query)} scroll={false} rel="nofollow" aria-label={fill(t.removeFilter, { f: c.label })} className="k-chip" data-active="true">
                      {c.label}
                      <Icon icon={x} size={14} />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={link(clearedQuery(query))} scroll={false} rel="nofollow" className="inline-flex h-9 items-center px-stack-sm text-sm underline-offset-4 hover:underline">
                    {t.clearAll}
                  </Link>
                </li>
              </ul>
            )}

            <h2 className="sr-only">{countText}</h2>

            {cards.length ? (
              <ProductGrid columns={3}>
                {cards.map((p, i) => (
                  <CatalogCard key={p.href} product={p} countryCode={countryCode} priority={i < 3} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 33vw, 50vw" />
                ))}
              </ProductGrid>
            ) : (
              <div className="flex flex-col items-start gap-stack-md rounded-media border border-separator p-inset-banner">
                <p className="type-body text-muted">{filters ? t.noMatch : t.empty}</p>
                <ButtonLink href={filters ? link(clearedQuery(query)) : href("/store")} variant="secondary">
                  {filters ? t.noMatchCta : t.emptyCta}
                </ButtonLink>
              </div>
            )}

            {totalPages > 1 && (
              <nav aria-label={t.pagination} className="flex items-center justify-center gap-stack-sm" data-testid="product-pagination">
                <Link href={link({ ...query, page: page - 1 })} aria-label={t.prevPage} aria-disabled={page === 1 || undefined} tabIndex={page === 1 ? -1 : undefined} className={cn("k-chip w-9 justify-center px-0", page === 1 && "pointer-events-none opacity-40")}>
                  <Icon icon={chevronLeft} size={16} />
                </Link>
                {pageWindow(page, totalPages).map((n, i) =>
                  n === 0 ? (
                    <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
                      …
                    </span>
                  ) : (
                    <Link key={n} href={link({ ...query, page: n })} aria-label={fill(t.pageN, { n })} aria-current={n === page ? "page" : undefined} className="k-chip w-9 justify-center px-0 tabular-nums">
                      {n}
                    </Link>
                  )
                )}
                <Link href={link({ ...query, page: page + 1 })} aria-label={t.nextPage} aria-disabled={page === totalPages || undefined} tabIndex={page === totalPages ? -1 : undefined} className={cn("k-chip w-9 justify-center px-0", page === totalPages && "pointer-events-none opacity-40")}>
                  <Icon icon={chevronRight} size={16} />
                </Link>
              </nav>
            )}
          </div>
        </div>
      </div>
    </Page>
  )
}

/** Page numbers to show (0 = ellipsis): all up to 7 pages, otherwise first, last and a window around the current */
function pageWindow(page: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total))
  if (page <= 3) [2, 3, 4].forEach((n) => pages.add(n))
  if (page >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => pages.add(n))
  const sorted = Array.from(pages).sort((a, b) => a - b)
  const out: number[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i && sorted[i] - sorted[i - 1] > 1) out.push(0)
    out.push(sorted[i])
  }
  return out
}
