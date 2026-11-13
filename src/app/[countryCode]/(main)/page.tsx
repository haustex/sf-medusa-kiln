import { Metadata } from "next"

import config from "@theme"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { getDictionary } from "@lib/i18n/dictionaries"
import { tx } from "@lib/i18n/localized"
import { organizationSchema, websiteSchema } from "@lib/seo/organization"
import { JsonLd } from "@lib/seo/jsonld"
import { getMarket, marketAlternates, marketPath } from "@lib/util/market"
import { getSiteOrigin } from "@lib/util/site"
import { PRODUCT_CARD_FIELDS, toProductCard } from "@lib/util/product-card"
import { Page, ProductGrid, Section } from "@modules/ds"
import CatalogCard from "@modules/products/components/catalog-card"
import CategoryCard from "@modules/home/components/category-card"
import Hero from "@modules/home/components/hero"
import Journal from "@modules/home/components/journal"
import Promo from "@modules/home/components/promo"
import ValueProps from "@modules/home/components/value-props"

export const dynamic = "force-static"
export const revalidate = 60

/** Top-level categories shown as cards (4 per row from lg) */
const CATEGORY_CARDS = 8

export async function generateMetadata(props: { params: Promise<{ countryCode: string }> }): Promise<Metadata> {
  const { countryCode } = await props.params
  const origin = await getSiteOrigin()
  const lang = getMarket(countryCode).dictionary
  return {
    title: { absolute: `${config.brand.name} · ${tx(config.brand.tagline, lang)}` },
    description: `${tx(config.brand.tagline, lang)} ${tx(config.brand.footerText, lang)}`,
    alternates: { canonical: `${origin}${marketPath(countryCode)}`, languages: marketAlternates(origin) },
  }
}

/**
 * The two newest products of a category, as thumbnail URLs (the category cards). Fetched at render time like the
 * rest of the page, so the cards follow the catalogue within the page's revalidation (60 s).
 */
const newestThumbnails = (countryCode: string, categoryId: string) =>
  listProducts({ countryCode, queryParams: { category_id: [categoryId], limit: 2, order: "-created_at", fields: "id,handle,thumbnail,title" } })
    .then(({ response }) => response.products.map((p) => p.thumbnail).filter((u): u is string => !!u))
    .catch(() => [] as string[])

export default async function Home(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const t = getDictionary(countryCode)
  const href = (path: string) => marketPath(countryCode, path)

  const [{ response }, categories] = await Promise.all([
    listProducts({ countryCode, queryParams: { limit: 8, fields: PRODUCT_CARD_FIELDS } }).catch(() => ({ response: { products: [], count: 0 } })),
    listCategories({ fields: "id,name,handle,rank,parent_category_id,metadata", limit: 20 }, countryCode).catch(() => []),
  ])
  const products = response.products.map((p) => toProductCard(p, countryCode))
  const topCategories = categories.filter((c) => !c.parent_category_id).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)).slice(0, CATEGORY_CARDS)
  const thumbnails = await Promise.all(topCategories.map((c) => newestThumbnails(countryCode, c.id)))
  // two newest products; one product = one photo; none = the category's own image (metadata.image); nothing = no card
  const categoryCards = topCategories
    .map((c, i) => {
      const own = typeof c.metadata?.image === "string" ? c.metadata.image : null
      const images = thumbnails[i].length ? thumbnails[i].slice(0, 2) : own ? [own] : []
      return { id: c.id, href: href(`/categories/${c.handle}`), label: c.name, images }
    })
    .filter((c) => c.images.length > 0)

  const origin = await getSiteOrigin()
  const structuredData = [organizationSchema(origin, countryCode), websiteSchema(origin, countryCode)]

  return (
    <Page>
      <JsonLd data={structuredData} />
      <Hero countryCode={countryCode} t={t.home} shopHref={href("/store")} secondaryHref={href(config.brand.navLinks[0]?.href ?? "/store")} />

      {categoryCards.length > 0 && (
        <Section id="categories" title={t.home.categoriesTitle} action={{ label: t.home.seeAll, href: href("/store") }}>
          {/* phones: a swipeable rail (1.3 cards visible); from sm a grid of 2, from lg of 4 */}
          <ul className="no-scrollbar -mx-container-x flex snap-x snap-mandatory gap-gutter overflow-x-auto scroll-px-container-x px-container-x sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {categoryCards.map((c) => (
              <li key={c.id} className="w-[76%] shrink-0 snap-start sm:w-auto">
                <CategoryCard href={c.href} label={c.label} images={c.images} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {products.length > 0 && (
        <Section id="featured" title={t.home.featuredTitle} action={{ label: t.home.seeAll, href: href("/store") }} description={t.home.featuredDescription}>
          <ProductGrid>
            {products.map((p) => (
              <CatalogCard key={p.href} product={p} countryCode={countryCode} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" />
            ))}
          </ProductGrid>
        </Section>
      )}

      <Promo countryCode={countryCode} />

      <ValueProps t={t.home} />

      <Journal countryCode={countryCode} t={t.home} href={href(config.blogPath)} />
    </Page>
  )
}
