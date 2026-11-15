import { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

import { getLinksPage, isLinksHandle, MAIN_HANDLE } from "@lib/data/links"
import { marketPath } from "@lib/util/market"
import { linksMetadata } from "@modules/links/metadata"
import LinksTemplate from "@modules/links/template"

type Props = { params: Promise<{ countryCode: string; handle: string }> }

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const page = isLinksHandle(handle) && handle !== MAIN_HANDLE ? await getLinksPage(countryCode, handle) : null
  if (!page) notFound()
  return linksMetadata(countryCode, page)
}

/** /links/{handle}: any other page (a campaign, a market, an event); the main handle lives at /links */
export default async function LinksHandlePage(props: Props) {
  const { countryCode, handle } = await props.params
  if (handle === MAIN_HANDLE) permanentRedirect(marketPath(countryCode, "/links"))
  const page = isLinksHandle(handle) ? await getLinksPage(countryCode, handle) : null
  if (!page) notFound()
  return <LinksTemplate countryCode={countryCode} page={page} />
}
