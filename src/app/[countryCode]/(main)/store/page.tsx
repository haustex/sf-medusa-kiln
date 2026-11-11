import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getRegion } from "@lib/data/regions"
import { getDictionary } from "@lib/i18n/dictionaries"
import { activeFilterCount, parseListingQuery } from "@lib/listing/filters"
import { marketAlternates, marketPath } from "@lib/util/market"
import { getSiteOrigin } from "@lib/util/site"
import ListingTemplate from "@modules/store/templates/listing"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const query = parseListingQuery(await props.searchParams)
  const t = getDictionary(countryCode).listing
  const origin = await getSiteOrigin()
  return {
    title: t.allProducts,
    description: t.allDescription,
    alternates: { canonical: `${origin}${marketPath(countryCode, "/store")}`, languages: marketAlternates(origin, "/store") },
    // Filtered views are for people, not the index; the canonical listing stays indexable
    ...(activeFilterCount(query) ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function StorePage(props: Props) {
  const { countryCode } = await props.params
  const query = parseListingQuery(await props.searchParams)
  const region = await getRegion(countryCode)
  if (!region) notFound()

  const dict = getDictionary(countryCode)
  return (
    <ListingTemplate
      countryCode={countryCode}
      title={dict.listing.allProducts}
      description={dict.listing.allDescription}
      crumbs={[{ label: dict.product.home, href: marketPath(countryCode, "/") }, { label: dict.listing.allProducts }]}
      basePath="/store"
      query={query}
    />
  )
}
