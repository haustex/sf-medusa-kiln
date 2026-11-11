import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listingMetadata } from "@modules/blog/metadata"
import BlogListing from "@modules/blog/templates/listing"

type Props = { params: Promise<{ countryCode: string }> }

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return (await listingMetadata(countryCode)) ?? notFound()
}

/** /blog (Indonesia) and /us/blog (English) */
export default async function BlogPage(props: Props) {
  const { countryCode } = await props.params
  return <BlogListing countryCode={countryCode} />
}
