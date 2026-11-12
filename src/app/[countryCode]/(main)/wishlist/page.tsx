import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listProducts } from "@lib/data/products"
import { cardRating, getProductRatings } from "@lib/data/reviews"
import { getWishlist } from "@lib/data/wishlist"
import { feature } from "@lib/features"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { isHiddenProduct } from "@lib/util/hidden-products"
import { marketPath } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS, toProductCard } from "@lib/util/product-card"
import { ButtonLink, Page, Stack } from "@modules/ds"
import WishlistGrid from "@modules/wishlist/grid"

/**
 * The visitor's wishlist (medusa-reviews-wishlist): guest (cookie token) or account. Per visitor: dynamic, never
 * indexed. Products render with this market's prices; one not sold here drops out.
 */
export const dynamic = "force-dynamic"

export async function generateMetadata(props: { params: Promise<{ countryCode: string }> }): Promise<Metadata> {
  return { title: getDictionary((await props.params).countryCode).wishlist.title, robots: { index: false, follow: false } }
}

export default async function WishlistPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  if (!(await feature("wishlist"))) notFound()
  const t = getDictionary(countryCode).wishlist
  const view = await getWishlist()
  const ids = view.productIds
  const products = ids.length
    ? await listProducts({ countryCode, queryParams: { id: ids, limit: ids.length, fields: PRODUCT_CARD_FIELDS } })
        .then(({ response }) => response.products.filter((p) => !isHiddenProduct(p)))
        .catch(() => [])
    : []
  const ratings = await getProductRatings(products.map((p) => p.id))
  const order = new Map(ids.map((id, i) => [id, i]))
  products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  const cards = products.map((p) => toProductCard(p, countryCode, cardRating(ratings.get(p.id))))

  return (
    <Page data-testid="wishlist-page">
      <Stack gap="section-head" className="content-container">
        <Stack gap="xs">
          <h1 className="type-h1">{t.title}</h1>
          <p className="max-w-2xl text-muted">{view.customer ? t.introCustomer : t.intro}</p>
          {cards.length > 0 && (
            <p className="text-sm text-muted" data-testid="wishlist-count">
              {cards.length === 1 ? t.countOne : fill(t.count, { n: cards.length })}
            </p>
          )}
        </Stack>
        {cards.length ? (
          <WishlistGrid cards={cards} labels={{ add: t.add, remove: t.remove }} />
        ) : (
          <div className="flex flex-col items-start gap-stack-md rounded-media bg-default p-stack-lg" data-testid="wishlist-empty">
            <div className="flex flex-col gap-stack-xs">
              <p className="font-medium">{t.empty}</p>
              <p className="text-sm text-muted">{t.emptyHint}</p>
            </div>
            <ButtonLink href={marketPath(countryCode, "/store")}>{t.shop}</ButtonLink>
          </div>
        )}
      </Stack>
    </Page>
  )
}
