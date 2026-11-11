import { HttpTypes } from "@medusajs/types"
import { isVariantInStock } from "./inventory"
import { STORE_NAME } from "./site"
import { productImageName } from "@lib/util/image-name"
import { imageJpeg, imageRef } from "@lib/util/image-url"
export { toJsonLd } from "@lib/seo/jsonld"

const SCHEMA_IN_STOCK = "https://schema.org/InStock"
const SCHEMA_OUT_OF_STOCK = "https://schema.org/OutOfStock"

export const getPricedVariants = (product: HttpTypes.StoreProduct) =>
  (product.variants ?? []).filter(
    (variant) => variant.calculated_price?.calculated_amount != null
  )

/**
 * Product (one variant) or ProductGroup (several) with an Offer per variant.
 * `offerExtras` adds per-variant shipping details and the return policy
 * (lib/seo/commerce.ts), so the published shipping price matches checkout.
 */
export const buildProductStructuredData = ({
  product,
  currency,
  productUrl,
  offerExtras,
  priceOnRequest = false,
}: {
  product: HttpTypes.StoreProduct
  currency: string
  productUrl: string
  offerExtras?: (variant: HttpTypes.StoreProductVariant) => Record<string, unknown>
  /** Custom product sold by quote: no Offer with a fixed price (the price follows size and material) */
  priceOnRequest?: boolean
}) => {
  const cur = currency.toUpperCase()
  // Our photos as clean JPEG URLs on the shop's domain (/img/produk/{handle}-{n}-1280-{hash}.jpg), others as they are
  const origin = new URL(productUrl).origin
  const photo = (url: string) => {
    const ref = imageRef("produk", productImageName(product, url), url)
    return ref ? imageJpeg(origin, ref) : url
  }
  const raw = [...(product.images ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)).map((image) => image.url).filter(Boolean)
  if (!raw.length && product.thumbnail) raw.push(product.thumbnail)
  const images = raw.map(photo)
  const description = product.description || product.title
  const brand = { "@type": "Brand", name: STORE_NAME }
  const common = {
    brand,
    countryOfOrigin: { "@type": "Country", name: "ID" },
    ...(product.material ? { material: product.material } : {}),
    ...(product.categories?.[0]?.name ? { category: product.categories[0].name } : {}),
  }
  const optionTitles = new Map((product.options ?? []).map((option) => [option.id, option.title]))

  const buildOffer = (variant: HttpTypes.StoreProductVariant, url: string) => ({
    "@type": "Offer",
    url,
    sku: variant.sku || undefined,
    price: variant.calculated_price!.calculated_amount!.toFixed(2),
    priceCurrency: cur,
    availability: isVariantInStock(variant) ? SCHEMA_IN_STOCK : SCHEMA_OUT_OF_STOCK,
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization", name: STORE_NAME },
    ...(offerExtras?.(variant) ?? {}),
  })

  const weight = (v: HttpTypes.StoreProductVariant) =>
    v.weight ? { weight: { "@type": "QuantitativeValue", value: v.weight, unitCode: "GRM" } } : {}

  const variants = getPricedVariants(product)

  if (variants.length <= 1) {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description,
      image: images,
      ...common,
      sku: variants[0]?.sku || undefined,
      url: productUrl,
      ...(variants[0] ? weight(variants[0]) : {}),
      offers: variants[0] && !priceOnRequest ? buildOffer(variants[0], productUrl) : undefined,
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: product.title,
    description,
    image: images,
    ...common,
    url: productUrl,
    productGroupID: product.id,
    variesBy: (product.options ?? []).map((option) =>
      /size|ukuran/i.test(option.title ?? "") ? "https://schema.org/size" : option.title
    ),
    hasVariant: variants.map((variant) => {
      const variantUrl = `${productUrl}?v_id=${variant.id}`
      const size = (variant.options ?? []).find((value) => /size|ukuran/i.test(optionTitles.get(value.option_id ?? "") ?? ""))
      return {
        "@type": "Product",
        name: `${product.title} - ${variant.title}`,
        sku: variant.sku || undefined,
        image: variant.images?.[0]?.url ? photo(variant.images[0].url) : images[0],
        ...weight(variant),
        ...(size?.value ? { size: size.value } : {}),
        additionalProperty: (variant.options ?? []).map((value) => ({
          "@type": "PropertyValue",
          name: optionTitles.get(value.option_id ?? ""),
          value: value.value,
        })),
        offers: priceOnRequest ? undefined : buildOffer(variant, variantUrl),
      }
    }),
  }
}
