import type { Metadata } from "next"

import { type LinksPage, linksPath } from "@lib/data/links"
import { getDictionary } from "@lib/i18n/dictionaries"
import { fill } from "@lib/i18n/fill"
import { linksShareImage, ogBase } from "@lib/og/share"
import { marketAlternates, marketPath } from "@lib/util/market"
import { getSiteOrigin, STORE_NAME } from "@lib/util/site"

/** Title, description, canonical, hreflang and share image of a link-in-bio page; `noindex` from the plugin wins */
export async function linksMetadata(countryCode: string, page: LinksPage): Promise<Metadata> {
  const origin = await getSiteOrigin()
  const path = linksPath(page.handle)
  const url = `${origin}${marketPath(countryCode, path)}`
  const t = getDictionary(countryCode).links
  const title = page.seo_title || page.title
  const description = page.seo_description || page.bio || fill(t.meta, { brand: STORE_NAME })
  const image = /^https:\/\//.test(page.og_image ?? "") ? { url: page.og_image as string, alt: title } : linksShareImage(origin, countryCode, page.handle, title)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: marketAlternates(origin, path, { noindex: page.noindex }) },
    openGraph: { ...ogBase(countryCode), type: "profile", title, description, url, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
    ...(page.noindex ? { robots: { index: false, follow: true } } : {}),
  }
}
