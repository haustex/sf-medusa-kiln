import { HttpTypes } from "@medusajs/types"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { isVariantInStock } from "@lib/util/inventory"
import { marketPath } from "@lib/util/market"
import { productImageName } from "@lib/util/image-name"
import type { CardVariant, ProductCardData } from "@modules/ds"

/** Store API fields needed by {@link toProductCard} (and the PDP). */
export const PRODUCT_CARD_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.options,*options.values,+metadata,*categories"

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
  const options = (product.options ?? []).map((o) => ({ id: o.id, title: o.title, values: (o.values ?? []).map((v) => v.value) }))
  const optionTitle = new Map(options.map((o) => [o.id, o.title]))
  const variants: CardVariant[] = (product.variants ?? []).map((v) => ({
    id: v.id,
    title: v.title ?? "",
    options: Object.fromEntries((v.options ?? []).map((o) => [o.option?.title ?? optionTitle.get(o.option_id ?? "") ?? "", o.value])),
    price:
      typeof v.calculated_price?.calculated_amount === "number"
        ? { amount: v.calculated_price.calculated_amount, currency: v.calculated_price.currency_code ?? "", original: v.calculated_price.original_amount ?? null }
        : null,
    inStock: isVariantInStock(v),
  }))
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
    soldOut: soldOut ? t.soldOut : null,
    options,
    variants,
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
