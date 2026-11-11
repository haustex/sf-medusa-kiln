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
import { CategoryTile, Page, ProductGrid, Section } from "@modules/ds"
import CatalogCard from "@modules/products/components/catalog-card"
import Hero from "@modules/home/components/hero"
import ValueProps from "@modules/home/components/value-props"

export const dynamic = "force-static"
export const revalidate = 60

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

export default async function Home(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const t = getDictionary(countryCode)
  const href = (path: string) => marketPath(countryCode, path)

  const [{ response }, categories] = await Promise.all([
    listProducts({ countryCode, queryParams: { limit: 8, fields: PRODUCT_CARD_FIELDS } }).catch(() => ({ response: { products: [], count: 0 } })),
    listCategories({ fields: "id,name,handle,rank,parent_category_id,metadata", limit: 20 }, countryCode).catch(() => []),
  ])
  const products = response.products.map((p) => toProductCard(p, countryCode))
  const topCategories = categories.filter((c) => !c.parent_category_id).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)).slice(0, 6)

  const origin = await getSiteOrigin()
  const structuredData = [organizationSchema(origin, countryCode), websiteSchema(origin, countryCode)]

  return (
    <Page>
      <JsonLd data={structuredData} />
      <Hero t={t.home} shopHref={href("/store")} secondaryHref={href(config.brand.navLinks[0]?.href ?? "/store")} />

      {topCategories.length > 0 && (
        <Section id="categories" title={t.home.categoriesTitle} titleHref={href("/store")}>
          <ul className="grid grid-cols-2 gap-gutter sm:grid-cols-3 lg:grid-cols-6">
            {topCategories.map((c) => (
              <li key={c.id}>
                <CategoryTile href={href(`/categories/${c.handle}`)} label={c.name} image={typeof c.metadata?.image === "string" ? c.metadata.image : undefined} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {products.length > 0 && (
        <Section id="featured" title={t.home.featuredTitle} titleHref={href("/store")} description={t.home.featuredDescription}>
          <ProductGrid>
            {products.map((p, i) => (
              <CatalogCard key={p.href} product={p} countryCode={countryCode} priority={i < 4} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" />
            ))}
          </ProductGrid>
        </Section>
      )}

      <ValueProps t={t.home} />
    </Page>
  )
}
