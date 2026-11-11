import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPost } from "@lib/data/blog"
import { articleMetadata } from "@modules/blog/metadata"
import { isBlogSlug } from "@modules/blog/paging"
import ArticleTemplate from "@modules/blog/templates/article"

type Props = { params: Promise<{ countryCode: string; slug: string }> }

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, slug } = await props.params
  const data = isBlogSlug(slug) ? await getPost(countryCode, slug) : null
  if (!data) notFound()
  return articleMetadata(countryCode, data.post)
}

/** /blog/{slug} (Indonesian text) and /us/blog/{slug} (English text): same slug in both markets */
export default async function BlogArticlePage(props: Props) {
  const { countryCode, slug } = await props.params
  const data = isBlogSlug(slug) ? await getPost(countryCode, slug) : null
  if (!data) notFound()
  return <ArticleTemplate countryCode={countryCode} post={data.post} more={data.more} />
}
