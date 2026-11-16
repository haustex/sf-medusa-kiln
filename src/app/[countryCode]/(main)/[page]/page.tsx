import { Metadata } from "next"
import { notFound } from "next/navigation"

import Image from "next/image"

import { type ContentPage, getPage, listPageSlugs } from "@lib/content/pages"
import { getDictionary } from "@lib/i18n/dictionaries"
import { JsonLd } from "@lib/seo/jsonld"
import { organizationSchema, websiteSchema } from "@lib/seo/organization"
import { getMarket, marketAlternates, marketPath, marketUrl } from "@lib/util/market"
import { getSiteOrigin } from "@lib/util/site"
import { Breadcrumb, Page, Stack } from "@modules/ds"

type Props = { params: Promise<{ countryCode: string; page: string }> }

export const dynamic = "force-static"

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, page: slug } = await props.params
  const page = await getPage(countryCode, slug)
  if (!page) notFound()
  const origin = await getSiteOrigin()
  return {
    title: page.title,
    description: page.description || undefined,
    alternates: { canonical: marketUrl(origin, countryCode, `/${slug}`), languages: marketAlternates(origin, `/${slug}`) },
  }
}

/** AboutPage / ContactPage (front matter `schema`) about the Organization, which is listed with it */
function pageJsonLd(page: ContentPage, origin: string, countryCode: string) {
  if (!page.schema) return null
  const url = marketUrl(origin, countryCode, `/${page.slug}`)
  return [
    {
      "@context": "https://schema.org",
      "@type": page.schema,
      "@id": `${url}#${page.schema === "AboutPage" ? "about" : "contact"}`,
      url,
      name: page.title,
      ...(page.description ? { description: page.description } : {}),
      inLanguage: getMarket(countryCode).locale,
      isPartOf: { "@id": websiteSchema(origin, countryCode)["@id"] },
      about: { "@id": `${origin}/#organization` },
      ...(page.image ? { primaryImageOfPage: { "@type": "ImageObject", contentUrl: page.image.src.startsWith("/") ? `${origin}${page.image.src}` : page.image.src } } : {}),
    },
    organizationSchema(origin, countryCode),
  ]
}

/**
 * /{slug}: an information page from content/pages (markdown, per language; lib/content/pages.ts). Every other
 * route of the store is a real route, so this segment only sees what nothing else matched; an unknown slug is the
 * 404 page.
 */
export default async function ContentPageRoute(props: Props) {
  const { countryCode, page: slug } = await props.params
  const page = await getPage(countryCode, slug)
  if (!page) notFound()
  const t = getDictionary(countryCode)
  const origin = await getSiteOrigin()
  const crumbs = [{ label: t.product.home, href: marketPath(countryCode, "/") }, { label: page.title }]

  return (
    <Page data-testid="content-page">
      <JsonLd data={pageJsonLd(page, origin, countryCode)} />
      <Stack gap="section" className="content-container mx-auto max-w-[44rem]">
        <Stack gap="md" as="header">
          <Breadcrumb items={crumbs} label={t.listing.breadcrumb} />
          <h1 className="type-h1">{page.title}</h1>
          {page.description && <p className="type-body text-muted">{page.description}</p>}
        </Stack>
        {page.image && (
          <figure className="relative aspect-[3/2] overflow-hidden rounded-media bg-surface" data-testid="content-page-image">
            <Image src={page.image.src} alt={page.image.alt} fill sizes="(min-width: 768px) 44rem, 100vw" className="object-cover" />
          </figure>
        )}
        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: page.html }} />
      </Stack>
    </Page>
  )
}

export async function generateStaticParams() {
  return (await listPageSlugs()).map((page) => ({ page }))
}
