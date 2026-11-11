import { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

import { categoryPath } from "@lib/data/blog"
import { marketPath } from "@lib/util/market"
import { listingMetadata } from "@modules/blog/metadata"
import { isBlogSlug, parsePageParam } from "@modules/blog/paging"
import BlogListing from "@modules/blog/templates/listing"

type Props = { params: Promise<{ countryCode: string; slug: string; page: string }> }

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, slug, page } = await props.params
  const n = parsePageParam(page)
  if (!isBlogSlug(slug) || !n) notFound()
  if (n === 1) return {}
  return (await listingMetadata(countryCode, { category: slug, page: n })) ?? notFound()
}

/** /blog/kategori/{slug}/page/2, … */
export default async function BlogCategoryPageN(props: Props) {
  const { countryCode, slug, page } = await props.params
  const n = parsePageParam(page)
  if (!isBlogSlug(slug) || !n) notFound()
  if (n === 1) permanentRedirect(marketPath(countryCode, categoryPath(slug)))
  return <BlogListing countryCode={countryCode} category={slug} page={n} />
}
