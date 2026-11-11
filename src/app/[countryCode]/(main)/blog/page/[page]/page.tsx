import { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

import { marketPath } from "@lib/util/market"
import { listingMetadata } from "@modules/blog/metadata"
import { parsePageParam } from "@modules/blog/paging"
import BlogListing from "@modules/blog/templates/listing"

type Props = { params: Promise<{ countryCode: string; page: string }> }

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, page } = await props.params
  const n = parsePageParam(page)
  if (!n || n === 1) return {}
  return (await listingMetadata(countryCode, { page: n })) ?? notFound()
}

/** /blog/page/2, /blog/page/3, … (page 1 is /blog) */
export default async function BlogPageN(props: Props) {
  const { countryCode, page } = await props.params
  const n = parsePageParam(page)
  if (!n) notFound()
  if (n === 1) permanentRedirect(marketPath(countryCode, "/blog"))
  return <BlogListing countryCode={countryCode} page={n} />
}
