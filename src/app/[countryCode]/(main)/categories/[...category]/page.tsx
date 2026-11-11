import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import { getDictionary } from "@lib/i18n/dictionaries"
import { activeFilterCount, parseListingQuery } from "@lib/listing/filters"
import { categoryShareImage, ogBase } from "@lib/og/share"
import { marketAlternates, marketPath } from "@lib/util/market"
import { getSiteOrigin } from "@lib/util/site"
import ListingTemplate from "@modules/store/templates/listing"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const query = parseListingQuery(await props.searchParams)
  const category = await getCategoryByHandle(params.category, params.countryCode).catch(() => null)
  if (!category) notFound()
  const origin = await getSiteOrigin()
  const path = `/categories/${params.category.join("/")}`
  return {
    title: category.name,
    description: category.description || category.name,
    alternates: { canonical: `${origin}${marketPath(params.countryCode, path)}`, languages: marketAlternates(origin, path) },
    openGraph: { ...ogBase(params.countryCode), type: "website", images: [categoryShareImage(origin, params.countryCode, params.category, category.name)] },
    ...(activeFilterCount(query) ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function CategoryPage(props: Props) {
  const params = await props.params
  const query = parseListingQuery(await props.searchParams)
  const category = await getCategoryByHandle(params.category, params.countryCode).catch(() => null)
  if (!category) notFound()

  const dict = getDictionary(params.countryCode)
  const href = (p: string) => marketPath(params.countryCode, p)
  const parents: { label: string; href: string }[] = []
  for (let c = category.parent_category; c; c = c.parent_category) {
    parents.unshift({ label: c.name, href: href(`/categories/${c.handle}`) })
  }

  return (
    <ListingTemplate
      countryCode={params.countryCode}
      title={category.name}
      description={category.description}
      crumbs={[{ label: dict.product.home, href: href("/") }, { label: dict.listing.allProducts, href: href("/store") }, ...parents, { label: category.name }]}
      basePath={`/categories/${params.category.join("/")}`}
      categoryId={category.id}
      categoryHandle={params.category[0]}
      query={query}
    />
  )
}
