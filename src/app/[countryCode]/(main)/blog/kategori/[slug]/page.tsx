import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listingMetadata } from "@modules/blog/metadata"
import { isBlogSlug } from "@modules/blog/paging"
import BlogListing from "@modules/blog/templates/listing"

type Props = { params: Promise<{ countryCode: string; slug: string }> }

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, slug } = await props.params
  if (!isBlogSlug(slug)) notFound()
  return (await listingMetadata(countryCode, { category: slug })) ?? notFound()
}

/** /blog/kategori/{slug}: the articles of one blog category */
export default async function BlogCategoryPage(props: Props) {
  const { countryCode, slug } = await props.params
  if (!isBlogSlug(slug)) notFound()
  return <BlogListing countryCode={countryCode} category={slug} />
}
