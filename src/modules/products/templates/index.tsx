import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { productReviews } from "medusa-reviews-wishlist/jsonld"

import config from "@theme"
import { listProducts } from "@lib/data/products"
import { formatEstimate, shippingEstimates } from "@lib/data/shipping-rates"
import { cardRating, getProductRating, getProductRatings, listProductReviews, PDP_REVIEWS } from "@lib/data/reviews"
import { feature } from "@lib/features"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { tx } from "@lib/i18n/localized"
import { breadcrumbList, faqPage, JsonLd } from "@lib/seo/jsonld"
import { isVariantInStock } from "@lib/util/inventory"
import { getMarket, marketPath } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS, toProductCard } from "@lib/util/product-card"
import { quoteLink, soldByQuote } from "@lib/quote"
import { buildProductStructuredData } from "@lib/util/product-structured-data"
import { getSiteOrigin, STORE_NAME } from "@lib/util/site"
import Link from "@modules/common/components/app-link"
import { Breadcrumb, Carousel, Page, Stars } from "@modules/ds"
import CatalogCard from "@modules/products/components/catalog-card"
import BuyBox, { type BuyBoxVariant } from "@modules/products/pdp/buy-box"
import QuoteCta from "@modules/products/pdp/quote-cta"
import Gallery from "@modules/products/pdp/gallery"
import { Accordion, meta, optionValues, productFaq, ProductSpecs, specRows } from "@modules/products/pdp/product-details"
import ProductReviews, { formatAverage } from "@modules/products/pdp/reviews"
import WishlistHeart from "@modules/wishlist/heart"

const LOW_STOCK = 5

const toBuyBoxVariant = (v: HttpTypes.StoreProductVariant): BuyBoxVariant => {
  const qty = v.inventory_quantity ?? 0
  const managed = !!v.manage_inventory && !v.allow_backorder
  return {
    id: v.id,
    options: Object.fromEntries((v.options ?? []).map((o) => [o.option_id!, o.value])),
    amount: v.calculated_price?.calculated_amount ?? null,
    original: v.calculated_price?.original_amount ?? null,
    inStock: isVariantInStock(v),
    low: managed && qty > 0 && qty <= LOW_STOCK ? qty : null,
  }
}

const firstParagraph = (text?: string | null) => text?.trim().split(/\n\s*\n/)[0]?.trim() ?? null

/**
 * Product page: gallery | sticky info column (maker, title, rating, buy box, notes, accordions), then
 * specifications, reviews (medusa-reviews-wishlist, only with approved reviews) and "More from {maker}"
 * (the product's collection, else its category). JSON-LD: Product (+ reviews), BreadcrumbList, FAQPage.
 */
export default async function ProductTemplate({ product, region, countryCode }: { product: HttpTypes.StoreProduct; region: HttpTypes.StoreRegion; countryCode: string }) {
  if (!product?.id) notFound()

  const dict = getDictionary(countryCode)
  const t = dict.product
  const market = getMarket(countryCode)
  const lang = market.dictionary as "id" | "en"
  const href = (path: string) => marketPath(countryCode, path)
  const category = product.categories?.[0]
  const maker = product.collection ?? null
  const makerLocation = typeof maker?.metadata?.location === "string" ? (maker.metadata.location as string) : null
  const location = makerLocation ?? config.brand.location
  const variants = (product.variants ?? []).map(toBuyBoxVariant)
  const options = (product.variants?.length ?? 0) > 1 ? optionValues(product) : []

  const [related, rating, reviewPage, origin, wish] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: { limit: 9, fields: PRODUCT_CARD_FIELDS, ...(maker ? { collection_id: [maker.id] } : category ? { category_id: [category.id] } : {}) },
    })
      .then(({ response }) => response.products.filter((p) => p.id !== product.id).slice(0, 8))
      .catch(() => [] as HttpTypes.StoreProduct[]),
    getProductRating(product.id),
    listProductReviews(product.id, { limit: PDP_REVIEWS }),
    getSiteOrigin(),
    feature("wishlist"),
  ])
  const relatedRatings = await getProductRatings(related.map((p) => p.id))
  const hasReviews = !!rating && rating.count > 0
  // delivery time after dispatch per service (medusa-fulfillment-zone-rate); [] without the plugin
  const estimates = await shippingEstimates(countryCode)
  const estimateLine = estimates.length
    ? fill(t.deliveryAfter, {
        range: new Intl.ListFormat(market.locale, { type: "disjunction" }).format(estimates.map((e) => (estimates.length > 1 ? `${e.name} ${formatEstimate(e.estimate, countryCode)}` : formatEstimate(e.estimate, countryCode)))),
      })
    : null

  const description = product.description?.trim() || null
  const intro = product.subtitle?.trim() || firstParagraph(description)
  const materials = meta(product, "materials", lang)
  const care = meta(product, "care", lang)
  const faq = productFaq(product, t, lang)
  const specs = specRows(product, t, lang, location)
  // Sold by quote (theme.config.ts product.quote): the quote button instead of the cart, and no Product item in the
  // structured data (an item without a price is invalid for Google); breadcrumbs and FAQ stay
  const byQuote = soldByQuote(product, countryCode)
  const amounts = variants.map((v) => v.amount).filter((a): a is number => typeof a === "number")

  const abs = (path: string) => `${origin}${href(path)}`
  const productUrl = abs(`/products/${product.handle}`)
  const crumbs = [{ label: t.home, href: href("/") }, category ? { label: category.name, href: href(`/categories/${category.handle}`) } : { label: t.store, href: href("/store") }, { label: product.title ?? "" }]
  const structuredData = [
    ...(byQuote
      ? []
      : [
          {
            ...buildProductStructuredData({ product, currency: region.currency_code, productUrl }),
            ...(hasReviews ? productReviews(rating, reviewPage.reviews, { storeName: STORE_NAME, limit: PDP_REVIEWS }) : {}),
          },
        ]),
    breadcrumbList(crumbs.map((c) => ({ name: c.label, url: c.href ? `${origin}${c.href}` : undefined }))),
    faqPage(faq, productUrl),
  ].filter(Boolean)

  type Row = { title: string; body: React.ReactNode; open?: boolean }
  const accordion = ([
    description && description !== intro ? { title: t.details, body: <div className="whitespace-pre-line">{description}</div>, open: true } : null,
    materials || care ? { title: t.materialsCare, body: <div className="flex flex-col gap-stack-xs">{materials && <p>{materials}</p>}{care && <p>{care}</p>}</div> } : null,
    {
      title: t.shippingReturns,
      body: (
        <div className="flex flex-col gap-stack-xs">
          {estimateLine && <p data-testid="delivery-estimate">{estimateLine}</p>}
          <p>
            {fill(t.shippingReturnsBody, { location })}{" "}
            <Link href={href("/shipping")} className="underline underline-offset-4">
              {t.shippingLink}
            </Link>
            {" · "}
            <Link href={href("/returns")} className="underline underline-offset-4">
              {t.returnsLink}
            </Link>
          </p>
        </div>
      ),
    },
    ...faq.map((f) => ({ title: f.q, body: <p>{f.a}</p> })),
  ] as (Row | null)[]).filter((x): x is Row => !!x)

  return (
    <Page data-testid="product-container">
      <JsonLd data={structuredData} />
      <div className="content-container flex flex-col gap-stack-lg">
        <Breadcrumb items={crumbs} label={dict.listing.breadcrumb} />
        <div className="grid gap-stack-lg lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-section">
          <Gallery images={[...(product.images ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)).map((i) => ({ id: i.id, url: i.url }))} handle={product.handle ?? ""} alt={product.title ?? ""} labels={{ gallery: fill(t.gallery, { title: product.title ?? "" }), photoN: t.photoN, showPhoto: t.showPhoto }} />

          <div className="flex flex-col gap-stack-lg lg:sticky lg:top-36 lg:self-start">
            <div className="flex flex-col gap-stack-sm">
              {(maker || category) && (
                <p className="type-label text-muted">
                  {maker ? (
                    <Link href={href(`/collections/${maker.handle}`)} className="underline-offset-4 hover:underline">
                      {maker.title}
                    </Link>
                  ) : (
                    <Link href={href(`/categories/${category!.handle}`)} className="underline-offset-4 hover:underline">
                      {category!.name}
                    </Link>
                  )}
                  {makerLocation && <span> · {makerLocation}</span>}
                </p>
              )}
              <h1 className="type-h1 text-balance" data-testid="product-title">
                {product.title}
              </h1>
              {hasReviews && (
                <a href="#reviews-title" className="flex w-fit items-center gap-stack-xs text-sm underline-offset-4 hover:underline" data-testid="pdp-rating">
                  <Stars value={rating.average} label={fill(dict.reviews.summaryLabel, { avg: rating.average.toFixed(1), n: rating.count })} />
                  <span className="text-muted">{fill(rating.count === 1 ? t.reviewsLinkOne : t.reviewsLink, { avg: formatAverage(rating.average, lang), n: rating.count })}</span>
                </a>
              )}
            </div>

            {byQuote ? (
              <QuoteCta {...quoteLink(product, countryCode, productUrl, t)} fromAmount={amounts.length ? Math.min(...amounts) : null} currency={region.currency_code} notes={config.product.notes.map((n) => tx(n, lang))} labels={{ requestQuote: t.requestQuote, requestQuoteNote: t.requestQuoteNote, from: t.from }} />
            ) : (

            <BuyBox
              productId={product.id}
              title={product.title ?? ""}
              countryCode={countryCode}
              currency={region.currency_code}
              options={options}
              variants={variants}
              actionUrl={href("/cart/add")}
              cartUrl={href("/cart")}
              notes={config.product.notes.map((n) => tx(n, lang))}
              heart={wish ? <WishlistHeart productId={product.id} variant="inline" labels={{ add: dict.wishlist.add, remove: dict.wishlist.remove }} className="size-12 shrink-0 rounded-control" /> : undefined}
              labels={{
                quantity: t.quantity,
                decrease: t.decrease,
                increase: t.increase,
                addToCart: t.addToCart,
                addToCartPrice: t.addToCartPrice,
                add: t.add,
                adding: t.adding,
                added: t.added,
                viewCart: t.viewCart,
                addError: t.addError,
                unavailable: t.unavailable,
                soldOut: t.soldOut,
                inStock: t.inStock,
                shipsFrom: fill(t.shipsFrom, { location }),
                lowStock: t.lowStock,
                from: t.from,
              }}
            />
            )}

            {intro && (
              <p className="type-body text-muted" data-testid="product-description">
                {intro}
              </p>
            )}

            <Accordion items={accordion} />
          </div>
        </div>
      </div>

      {specs.length > 0 && (
        <div className="content-container">
          <ProductSpecs rows={specs} t={t} />
        </div>
      )}

      {hasReviews && <ProductReviews rating={rating} reviews={reviewPage.reviews} count={reviewPage.count} productId={product.id} t={dict.reviews} lang={lang} />}

      {related.length > 0 && (
        <Carousel id="related" title={maker ? fill(t.moreFrom, { maker: maker.title }) : category ? fill(t.moreFrom, { maker: category.name }) : t.relatedTitle} labels={{ prev: t.prev, next: t.next }} action={{ label: t.seeAll, href: maker ? href(`/collections/${maker.handle}`) : category ? href(`/categories/${category.handle}`) : href("/store") }}>
          {related.map((p) => (
            <CatalogCard key={p.id} product={toProductCard(p, countryCode, cardRating(relatedRatings.get(p.id)))} countryCode={countryCode} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 38vw, 62vw" />
          ))}
        </Carousel>
      )}
    </Page>
  )
}
