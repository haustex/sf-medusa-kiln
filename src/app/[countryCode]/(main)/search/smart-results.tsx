import { productAlts } from "@lib/data/image-alt"
import { cardRating, getProductRatings } from "@lib/data/reviews"
import config from "@theme"
import { rewriteSearch, searchRewriteProducts } from "@lib/data/search"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { marketPath } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS, toProductCard } from "@lib/util/product-card"
import type { HttpTypes } from "@medusajs/types"
import { ButtonLink, ProductGrid, Section, Stack } from "@modules/ds"
import CatalogCard from "@modules/products/components/catalog-card"

/** Product cards with ratings and alt texts, as the listings show them */
export async function searchCards(products: HttpTypes.StoreProduct[], countryCode: string) {
  const ids = products.map((p) => p.id)
  const [ratings, alts] = await Promise.all([getProductRatings(ids), productAlts(countryCode, ids)])
  return products.map((p) => toProductCard(p, countryCode, cardRating(ratings.get(p.id)), alts))
}

export function SearchEmpty({ countryCode }: { countryCode: string }) {
  const t = getDictionary(countryCode).listing
  return (
    <Stack gap="md" className="items-start rounded-media bg-default p-stack-lg" data-testid="search-empty">
      <p className="text-muted">{t.searchEmpty}</p>
      <ButtonLink href={marketPath(countryCode, "/store")} variant="secondary">
        {t.emptyCta}
      </ButtonLink>
    </Stack>
  )
}

/**
 * While the keywords are being looked up and the keyword search found nothing (no flash of the empty state): the
 * line "Looking for similar products…" over four card skeletons the size of the real cards (no layout shift when
 * they arrive). The pulse respects prefers-reduced-motion.
 */
export function SearchRewriting({ countryCode }: { countryCode: string }) {
  return (
    <Stack gap="md" role="status" data-testid="search-rewriting">
      <p className="type-body text-muted">{getDictionary(countryCode).listing.searchRewriting}</p>
      <div aria-hidden="true">
        <ProductGrid>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="motion-safe:animate-pulse">
              <div className="aspect-square w-full rounded-media bg-default" />
              <div className="mt-stack-sm h-4 w-3/4 rounded-full bg-default" />
              <div className="mt-2 h-4 w-1/3 rounded-full bg-default" />
            </div>
          ))}
        </ProductGrid>
      </div>
    </Stack>
  )
}

type Props = { countryCode: string; query: string; shown: string[]; limit: number }

/**
 * Smart search, streamed under the keyword results (theme.config.ts `searchRewrite`): the backend's keywords for the
 * query, each searched like the query, the products not already shown, under "Showing results for: …". Nothing to
 * add: the empty state when the keyword search found nothing too, else nothing at all.
 */
export default async function SmartResults({ countryCode, query, shown, limit }: Props) {
  const t = getDictionary(countryCode).listing
  // Nothing shown yet: wait longer (the visitor sees the skeleton); keyword results shown: a short extra pass
  const waitMs = shown.length ? config.searchRewrite.timeoutMs.withResults : config.searchRewrite.timeoutMs.empty
  const rewrite = await rewriteSearch({ countryCode, query, waitMs })
  const extra = rewrite && !rewrite.no_match && rewrite.terms.length ? await searchRewriteProducts({ countryCode, terms: rewrite.terms, exclude: new Set(shown), limit, fields: PRODUCT_CARD_FIELDS }) : null
  if (!extra?.products.length) return shown.length ? null : <SearchEmpty countryCode={countryCode} />

  const cards = await searchCards(extra.products, countryCode)
  return (
    <Section id="results-more" title={fill(t.searchRewritten, { terms: extra.terms.join(", ") })} titleHidden contained={false} className={shown.length ? "pt-stack-lg" : undefined}>
      <Stack gap="md">
        <p className="type-body text-muted" data-testid="search-rewritten">
          {fill(t.searchRewritten, { terms: extra.terms.join(", ") })}
        </p>
        <ProductGrid>
          {cards.map((p, i) => (
            <CatalogCard key={p.href} product={p} countryCode={countryCode} priority={!shown.length && i < 4} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
          ))}
        </ProductGrid>
      </Stack>
    </Section>
  )
}
