import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { __iconData as pkg } from "lucide-react/icons/package"
import { __iconData as pkgX } from "lucide-react/icons/package-x"
import { __iconData as truck } from "lucide-react/icons/truck"
import { productReviews } from "medusa-reviews-wishlist/jsonld"

import config from "@theme"
import { productAlts } from "@lib/data/image-alt"
import { listProducts } from "@lib/data/products"
import { formatEstimate, shippingEstimates } from "@lib/data/shipping-rates"
import { cardRating, getProductRating, getProductRatings, listProductReviews, listReviewPhotos, PDP_REVIEWS } from "@lib/data/reviews"
import { feature } from "@lib/features"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { breadcrumbList, faqPage, JsonLd } from "@lib/seo/jsonld"
import { isVariantInStock } from "@lib/util/inventory"
import { getMarket, marketPath } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS, toProductCard } from "@lib/util/product-card"
import { quoteLink, soldByQuote } from "@lib/quote"
import { buildProductStructuredData } from "@lib/util/product-structured-data"
import { getSiteOrigin, STORE_NAME } from "@lib/util/site"
import Link from "@modules/common/components/app-link"
import { Breadcrumb, Carousel, Page, Stars } from "@modules/ds"
import { Icon } from "@modules/ds/icons"
import CatalogCard from "@modules/products/components/catalog-card"
import BuyBox, { type BuyBoxVariant } from "@modules/products/pdp/buy-box"
import QuoteCta from "@modules/products/pdp/quote-cta"
import Gallery from "@modules/products/pdp/gallery"
import { Accordion, meta, optionValues, productFaq, SpecList, specRows } from "@modules/products/pdp/product-details"
import ProductNotes, { NoteRow } from "@modules/products/pdp/product-notes"
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

/**
 * Product page: gallery (with the wishlist heart over the photo) | sticky info column (maker, title, rating, buy
 * box, the icon rows "shipping & policies", accordions), 50:50 from lg; then the reviews block (medusa-reviews-wishlist:
 * summary, photos, cards, drawer, write) full width, and "More from {maker}" (the product's collection, else its
 * category). JSON-LD: Product (+ AggregateRating and Review only with approved reviews), BreadcrumbList, FAQPage.
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
  const options = (product.variants?.length ?? 0) > 1 ? optionValues(product, t, lang) : []

  const [related, rating, reviewPage, origin, wish, reviewsOn] = await Promise.all([
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
    feature("reviews"),
  ])
  const hasReviews = !!rating && rating.count > 0
  const [relatedRatings, alts, photos] = await Promise.all([getProductRatings(related.map((p) => p.id)), productAlts(countryCode, [product.id, ...related.map((p) => p.id)]), hasReviews ? listReviewPhotos(product.id) : []])
  // delivery time after dispatch per service (medusa-fulfillment-zone-rate); [] without the plugin
  const estimates = await shippingEstimates(countryCode)
  const estimateLine = estimates.length
    ? fill(t.deliveryAfter, {
        range: new Intl.ListFormat(market.locale, { type: "disjunction" }).format(estimates.map((e) => (estimates.length > 1 ? `${e.name} ${formatEstimate(e.estimate, countryCode)}` : formatEstimate(e.estimate, countryCode)))),
      })
    : null

  // Shown once: the subtitle as the short paragraph above (when there is one), the description in "Details"
  const description = product.description?.trim() || null
  const intro = product.subtitle?.trim() || null
  const materials = meta(product, "materials", lang)
  const care = meta(product, "care", lang)
  const faq = productFaq(product, t, lang)
  const specs = specRows(product, t, lang, location)
  // Sold by quote (theme.config.ts product.quote): the quote button instead of the cart, and no Product item in the
  // structured data (an item without a price is invalid for Google); breadcrumbs and FAQ stay
  const byQuote = soldByQuote(product, countryCode)
  const amounts = variants.map((v) => v.amount).filter((a): a is number => typeof a === "number")

  // Rows under the buy button: the delivery estimate (truck), then theme.config.ts product.notes (lib/notes.ts)
  const noteRows = (
    <>
      {estimateLine && (
        <NoteRow icon={truck} data-testid="delivery-estimate">
          {estimateLine}
        </NoteRow>
      )}
      <ProductNotes notes={config.product.notes} countryCode={countryCode} lang={lang} />
    </>
  )

  const abs = (path: string) => `${origin}${href(path)}`
  const productUrl = abs(`/products/${product.handle}`)
  const crumbs = [{ label: t.home, href: href("/") }, category ? { label: category.name, href: href(`/categories/${category.handle}`) } : { label: t.store, href: href("/store") }, { label: product.title ?? "" }]
  const structuredData = [
    ...(byQuote
      ? []
      : [
          {
            ...buildProductStructuredData({ product, currency: region.currency_code, productUrl, alts }),
            ...(hasReviews ? productReviews(rating, reviewPage.reviews, { storeName: STORE_NAME, limit: PDP_REVIEWS }) : {}),
          },
        ]),
    breadcrumbList(crumbs.map((c) => ({ name: c.label, url: c.href ? `${origin}${c.href}` : undefined }))),
    faqPage(faq, productUrl),
  ].filter(Boolean)

  type Row = { title: string; body: React.ReactNode; open?: boolean }
  const accordion = ([
    description || specs.length
      ? {
          title: t.details,
          body: (
            <div className="flex flex-col gap-stack-md">
              {description && <div className="whitespace-pre-line">{description}</div>}
              <SpecList rows={specs} />
            </div>
          ),
          open: true,
        }
      : null,
    materials || care ? { title: t.materialsCare, body: <div className="flex flex-col gap-stack-xs">{materials && <p>{materials}</p>}{care && <p>{care}</p>}</div> } : null,
    {
      title: t.shippingReturns,
      body: (
        <div className="flex flex-col gap-stack-xs">
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
        {/* 50:50 from lg; minmax(0, …) on every breakpoint: a column never grows to the min-content width of a nowrap row inside it */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-stack-lg lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-section">
          <Gallery
            images={[...(product.images ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)).map((i) => ({ id: i.id, url: i.url, alt: alts[i.url] ?? null }))}
            handle={product.handle ?? ""}
            alt={product.title ?? ""}
            action={wish ? <WishlistHeart productId={product.id} variant="photo" labels={{ add: dict.wishlist.add, remove: dict.wishlist.remove }} /> : undefined}
            labels={{ gallery: fill(t.gallery, { title: product.title ?? "" }), photoN: t.photoN, showPhoto: t.showPhoto }}
          />

          <div className="flex min-w-0 flex-col gap-stack-lg lg:sticky lg:top-36 lg:self-start">
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
                <a href="#reviews" className="flex w-fit items-center gap-stack-xs text-sm underline-offset-4 hover:underline" data-testid="pdp-rating">
                  <Stars value={rating.average} label={fill(dict.reviews.summaryLabel, { avg: rating.average.toFixed(1), n: rating.count })} />
                  <span className="text-muted">{fill(rating.count === 1 ? t.reviewsLinkOne : t.reviewsLink, { avg: formatAverage(rating.average, lang), n: rating.count })}</span>
                </a>
              )}
            </div>

            {byQuote ? (
              <QuoteCta {...quoteLink(product, countryCode, productUrl, t)} fromAmount={amounts.length ? Math.min(...amounts) : null} currency={region.currency_code} notes={noteRows} labels={{ requestQuote: t.requestQuote, requestQuoteNote: t.requestQuoteNote, from: t.from }} />
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
              notes={noteRows}
              icons={{ inStock: <Icon icon={pkg} size={18} />, soldOut: <Icon icon={pkgX} size={18} /> }}
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

      {reviewsOn && <ProductReviews rating={rating} reviews={reviewPage.reviews} photos={photos} productId={product.id} countryCode={countryCode} accountHref={href("/account")} brand={config.brand.name} t={dict.reviews} lang={lang} locale={market.locale} labels={{ prev: t.prev, next: t.next }} />}

      {related.length > 0 && (
        <Carousel id="related" title={maker ? fill(t.moreFrom, { maker: maker.title }) : category ? fill(t.moreFrom, { maker: category.name }) : t.relatedTitle} labels={{ prev: t.prev, next: t.next }} action={{ label: t.seeAll, href: maker ? href(`/collections/${maker.handle}`) : category ? href(`/categories/${category.handle}`) : href("/store") }}>
          {related.map((p) => (
            <CatalogCard key={p.id} product={toProductCard(p, countryCode, cardRating(relatedRatings.get(p.id)), alts)} countryCode={countryCode} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 38vw, 62vw" />
          ))}
        </Carousel>
      )}
    </Page>
  )
}
