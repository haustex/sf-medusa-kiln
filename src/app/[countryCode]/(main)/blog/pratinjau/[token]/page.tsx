import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPreview } from "@lib/data/blog"
import ArticleTemplate from "@modules/blog/templates/article"

type Props = { params: Promise<{ countryCode: string; token: string }> }

// Rendered per request from the backend (drafts change while they are written); never cached, never indexed
export const dynamic = "force-dynamic"

const load = async (props: Props) => {
  const { countryCode, token } = await props.params
  const data = /^[A-Za-z0-9_-]{20,80}$/.test(token) ? await getPreview(countryCode, token) : null
  return { countryCode, data }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { data } = await load(props)
  return { title: data?.post.title || "Pratinjau", robots: { index: false, follow: false, nocache: true } }
}

/** Secret preview link from the Admin ("Pratinjau"): the article as it is saved now, whatever its status */
export default async function BlogPreviewPage(props: Props) {
  const { countryCode, data } = await load(props)
  if (!data) notFound()
  // a draft has no publication date yet: show today's
  const post = { ...data.post, published_at: data.post.published_at ?? new Date().toISOString(), updated_at: data.post.updated_at ?? new Date().toISOString() }
  return <ArticleTemplate countryCode={countryCode} post={post} more={data.more} preview />
}
