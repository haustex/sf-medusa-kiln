import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getLinksPage, MAIN_HANDLE } from "@lib/data/links"
import { linksMetadata } from "@modules/links/metadata"
import LinksTemplate from "@modules/links/template"

type Props = { params: Promise<{ countryCode: string }> }

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const page = await getLinksPage(countryCode, MAIN_HANDLE)
  if (!page) notFound()
  return linksMetadata(countryCode, page)
}

/** /links (Indonesia) and /us/links (English): the page whose handle is theme.config.ts `linkInBio.handle` */
export default async function LinksPage(props: Props) {
  const { countryCode } = await props.params
  const page = await getLinksPage(countryCode, MAIN_HANDLE)
  if (!page) notFound()
  return <LinksTemplate countryCode={countryCode} page={page} />
}
