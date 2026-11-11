import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle } from "@lib/data/collections"
import { getDictionary } from "@lib/i18n/dictionaries"
import { activeFilterCount, parseListingQuery } from "@lib/listing/filters"
import { marketAlternates, marketPath } from "@lib/util/market"
import { getSiteOrigin } from "@lib/util/site"
import ListingTemplate from "@modules/store/templates/listing"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const descriptionOf = (c: { title: string; metadata?: Record<string, unknown> | null }) => (typeof c.metadata?.description === "string" ? c.metadata.description : undefined)

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const query = parseListingQuery(await props.searchParams)
  const collection = await getCollectionByHandle(params.handle, params.countryCode).catch(() => null)
  if (!collection) notFound()
  const origin = await getSiteOrigin()
  const path = `/collections/${params.handle}`
  return {
    title: collection.title,
    description: descriptionOf(collection) || collection.title,
    alternates: { canonical: `${origin}${marketPath(params.countryCode, path)}`, languages: marketAlternates(origin, path) },
    ...(activeFilterCount(query) ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function CollectionPage(props: Props) {
  const params = await props.params
  const query = parseListingQuery(await props.searchParams)
  const collection = await getCollectionByHandle(params.handle, params.countryCode).catch(() => null)
  if (!collection) notFound()

  const dict = getDictionary(params.countryCode)
  const href = (p: string) => marketPath(params.countryCode, p)
  return (
    <ListingTemplate
      countryCode={params.countryCode}
      title={collection.title}
      description={descriptionOf(collection)}
      crumbs={[{ label: dict.product.home, href: href("/") }, { label: dict.listing.allProducts, href: href("/store") }, { label: collection.title }]}
      basePath={`/collections/${params.handle}`}
      collectionId={collection.id}
      query={query}
    />
  )
}
