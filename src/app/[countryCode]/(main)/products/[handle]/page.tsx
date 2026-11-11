import { Metadata } from "next"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { ogBase, productShareImage } from "@lib/og/share"
import { isVariantInStock } from "@lib/util/inventory"
import { marketAlternates, marketPath } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS } from "@lib/util/product-card"
import { getPricedVariants } from "@lib/util/product-structured-data"
import { getSiteOrigin, STORE_NAME } from "@lib/util/site"
import ProductTemplate from "@modules/products/templates"

/** Fields the product page needs on top of the card fields: photos, collection (maker), dimensions, weight */
const PDP_FIELDS = `${PRODUCT_CARD_FIELDS},*images,*collection,+subtitle,+material,+weight,+length,+width,+height,+variants.weight`

type Props = { params: Promise<{ countryCode: string; handle: string }> }

export const dynamic = "force-static"
export const revalidate = 60

const getProduct = (countryCode: string, handle: string) => listProducts({ countryCode, queryParams: { handle, fields: PDP_FIELDS } }).then(({ response }) => response.products[0])

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const region = await getRegion(countryCode)
  if (!region) notFound()
  const product = await getProduct(countryCode, handle)
  if (!product) notFound()

  const origin = await getSiteOrigin()
  const path = `/products/${product.handle}`
  const productUrl = `${origin}${marketPath(countryCode, path)}`
  const description = product.subtitle || product.description?.split(/\n\s*\n/)[0] || product.title
  return {
    title: product.title,
    description,
    alternates: { canonical: productUrl, languages: marketAlternates(origin, path) },
    openGraph: {
      ...ogBase(countryCode),
      title: `${product.title} | ${STORE_NAME}`,
      description,
      url: productUrl,
      images: [productShareImage(origin, countryCode, product)],
    },
  }
}

/** Open Graph product tags (price, availability) for link previews and feeds */
function ProductMetaTags({ product, region }: { product: HttpTypes.StoreProduct; region: HttpTypes.StoreRegion }) {
  const variants = getPricedVariants(product)
  const cheapest = variants.reduce<HttpTypes.StoreProductVariant | undefined>((min, v) => (!min || v.calculated_price!.calculated_amount! < min.calculated_price!.calculated_amount! ? v : min), undefined)
  const currency = region.currency_code.toUpperCase()
  const amount = cheapest?.calculated_price?.calculated_amount?.toFixed(2)
  return (
    <>
      <meta property="og:type" content="product" />
      {amount && (
        <>
          <meta property="product:price:amount" content={amount} />
          <meta property="product:price:currency" content={currency} />
        </>
      )}
      <meta property="product:availability" content={variants.some(isVariantInStock) ? "in stock" : "out of stock"} />
    </>
  )
}

export default async function ProductPage(props: Props) {
  const { countryCode, handle } = await props.params
  const region = await getRegion(countryCode)
  if (!region) notFound()
  const product = await getProduct(countryCode, handle)
  if (!product) notFound()

  return (
    <>
      <ProductMetaTags product={product} region={region} />
      <ProductTemplate product={product} region={region} countryCode={countryCode} />
    </>
  )
}
