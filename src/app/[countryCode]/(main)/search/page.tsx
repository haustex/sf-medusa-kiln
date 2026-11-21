import { cn } from "@heroui/styles"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getRegion } from "@lib/data/regions"
import { feature } from "@lib/features"
import { searchProducts } from "@lib/data/search"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { marketPath } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS } from "@lib/util/product-card"
import config from "@theme"
import { Page, PageHeader, ProductGrid, Section, Stack } from "@modules/ds"
import HeaderSearch from "@modules/layout/components/header-search"
import CatalogCard from "@modules/products/components/catalog-card"

import SmartResults, { SearchEmpty, SearchRewriting, searchCards } from "./smart-results"

const RESULT_LIMIT = 24

type Props = { params: Promise<{ countryCode: string }>; searchParams: Promise<{ q?: string | string[] }> }

const getQuery = (q?: string | string[]) => (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 200) ?? ""

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const t = getDictionary(countryCode).listing
  const query = getQuery((await props.searchParams).q)
  return { title: query ? fill(t.searchResults, { q: query }) : t.searchTitle, robots: { index: false, follow: true } }
}

/**
 * /search?q=: Meilisearch through the backend when configured, Medusa's own product search otherwise
 * (lib/data/search.ts). Per visitor and uncached; the header form posts here. With smart search on
 * (theme.config.ts `searchRewrite`) and fewer than a page of keyword results, the extra products stream in under
 * them (smart-results.tsx); the keyword results never wait for it.
 */
export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const query = getQuery((await props.searchParams).q)
  const region = await getRegion(countryCode)
  if (!region) notFound()

  const dict = getDictionary(countryCode)
  const t = dict.listing
  const href = (p: string) => marketPath(countryCode, p)
  const { response } = await searchProducts({ countryCode, query, limit: RESULT_LIMIT, fields: PRODUCT_CARD_FIELDS })
  const cards = await searchCards(response.products, countryCode)
  const smart = !!query && response.products.length < RESULT_LIMIT && (await feature("searchRewrite"))
  const shown = response.products.map((p) => p.id)
  // Nothing found yet and smart search still to answer: no "0 results" line before it did
  const description = !query ? t.searchHint : smart && !cards.length ? null : response.count === 1 ? t.countOne : fill(t.count, { n: response.count })

  return (
    <Page data-testid="search-container">
      <Stack gap="md" className="content-container">
        {/* the title block (PageHeader) with the count as its description; the search field follows its alignment */}
        <PageHeader title={query ? fill(t.searchResults, { q: query }) : t.searchTitle} description={description} titleTestId="search-title">
          <HeaderSearch action={href("/search")} placeholder={dict.nav.search} label={dict.nav.searchLabel} formLabel={t.searchRefine} defaultValue={query} submitLabel={t.searchSubmit} className={cn("max-w-2xl pt-stack-sm", config.pageHeader.align === "center" && "mx-auto")} />
        </PageHeader>
        {query && (
          <Section id="results" title={t.searchTitle} titleHidden contained={false} className="pt-stack-md">
            {cards.length ? (
              <ProductGrid>
                {cards.map((p, i) => (
                  <CatalogCard key={p.href} product={p} countryCode={countryCode} priority={i < 4} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
                ))}
              </ProductGrid>
            ) : (
              !smart && <SearchEmpty countryCode={countryCode} />
            )}
            {smart && (
              <Suspense fallback={cards.length ? null : <SearchRewriting countryCode={countryCode} />}>
                <SmartResults countryCode={countryCode} query={query} shown={shown} limit={RESULT_LIMIT - shown.length} />
              </Suspense>
            )}
          </Section>
        )}
      </Stack>
    </Page>
  )
}
