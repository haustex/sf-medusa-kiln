import { HttpTypes } from "@medusajs/types"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { isVariantInStock } from "@lib/util/inventory"
import { marketPath } from "@lib/util/market"
import { productImageName } from "@lib/util/image-name"
import type { ProductCardData } from "@modules/ds"

/** Store API fields needed by {@link toProductCard} (and the PDP). */
export const PRODUCT_CARD_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.options,+metadata,*categories"

/** Cheapest priced variant, plus whether variant prices differ ("from" price). */
export function cheapestPrice(product: HttpTypes.StoreProduct) {
  const priced = (product.variants ?? []).filter(
    (v) => typeof v.calculated_price?.calculated_amount === "number"
  )
  if (!priced.length) return null
  const cheapest = priced.reduce((min, v) =>
    v.calculated_price!.calculated_amount! < min.calculated_price!.calculated_amount! ? v : min
  )
  const p = cheapest.calculated_price!
  return {
    amount: p.calculated_amount!,
    original: p.original_amount ?? null,
    currency: p.currency_code ?? "",
    varies: new Set(priced.map((v) => v.calculated_price!.calculated_amount)).size > 1,
  }
}

/** Stars on a card only when the product has approved reviews (medusa-reviews-wishlist ratings) */
export type CardRating = { average: number; count: number } | null | undefined

export function toProductCard(product: HttpTypes.StoreProduct, countryCode: string, rating?: CardRating): ProductCardData {
  const dict = getDictionary(countryCode)
  const t = dict.product
  const price = cheapestPrice(product)
  const soldOut = !(product.variants ?? []).some(isVariantInStock)
  const image2 = product.images?.find((i) => i.url && i.url !== product.thumbnail)?.url ?? null
  return {
    id: product.id,
    href: marketPath(countryCode, `/products/${product.handle}`),
    title: product.title ?? "",
    subtitle: product.categories?.[0]?.name ?? product.subtitle,
    image: product.thumbnail,
    image2,
    imageName: productImageName(product, product.thumbnail),
    image2Name: productImageName(product, image2),
    price: price && {
      amount: price.amount,
      currency: price.currency,
      original: price.original,
      from: price.varies ? t.from : undefined,
    },
    // Made-to-order pieces: "Custom" chip over the photo
    badges: product.categories?.some((c) => c.handle === "furniture-custom") ? [{ label: "Custom" }] : undefined,
    soldOut: soldOut ? t.soldOut : null,
    ...(rating && rating.count > 0
      ? {
          rating,
          ratingLabel: fill(dict.reviews.summaryLabel, {
            avg: rating.average.toLocaleString(dict === getDictionary("us") ? "en-US" : "id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            n: rating.count,
          }),
        }
      : {}),
  }
}
