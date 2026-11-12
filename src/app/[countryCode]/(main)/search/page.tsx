import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getRegion } from "@lib/data/regions"
import { cardRating, getProductRatings } from "@lib/data/reviews"
import { searchProducts } from "@lib/data/search"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { marketPath } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS, toProductCard } from "@lib/util/product-card"
import { ButtonLink, Page, ProductGrid, Section, Stack } from "@modules/ds"
import HeaderSearch from "@modules/layout/components/header-search"
import CatalogCard from "@modules/products/components/catalog-card"

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
 * (lib/data/search.ts). Per visitor and uncached; the header form posts here.
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
  const ratings = await getProductRatings(response.products.map((p) => p.id))
  const cards = response.products.map((p) => toProductCard(p, countryCode, cardRating(ratings.get(p.id))))

  return (
    <Page data-testid="search-container">
      <Stack gap="md" className="content-container">
        <Stack gap="xs">
          <h1 className="type-h1">{query ? fill(t.searchResults, { q: query }) : t.searchTitle}</h1>
          <p className="text-muted" data-testid="search-count">
            {query ? (response.count === 1 ? t.countOne : fill(t.count, { n: response.count })) : t.searchHint}
          </p>
        </Stack>
        <HeaderSearch action={href("/search")} placeholder={dict.nav.search} label={dict.nav.searchLabel} formLabel={t.searchRefine} defaultValue={query} submitLabel={t.searchSubmit} className="max-w-2xl" />
        {query && (
          <Section id="results" title={t.searchTitle} titleHidden contained={false} className="pt-stack-md">
            {cards.length ? (
              <ProductGrid>
                {cards.map((p, i) => (
                  <CatalogCard key={p.href} product={p} countryCode={countryCode} priority={i < 4} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
                ))}
              </ProductGrid>
            ) : (
              <Stack gap="md" className="items-start rounded-media bg-default p-stack-lg" data-testid="search-empty">
                <p className="text-muted">{t.searchEmpty}</p>
                <ButtonLink href={href("/store")} variant="secondary">
                  {t.emptyCta}
                </ButtonLink>
              </Stack>
            )}
          </Section>
        )}
      </Stack>
    </Page>
  )
}
