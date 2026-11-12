import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPage, listPageSlugs } from "@lib/content/pages"
import { getDictionary } from "@lib/i18n/dictionaries"
import { marketAlternates, marketPath } from "@lib/util/market"
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
    alternates: { canonical: `${origin}${marketPath(countryCode, `/${slug}`)}`, languages: marketAlternates(origin, `/${slug}`) },
  }
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
  const crumbs = [{ label: t.product.home, href: marketPath(countryCode, "/") }, { label: page.title }]

  return (
    <Page data-testid="content-page">
      <Stack gap="section" className="content-container mx-auto max-w-[44rem]">
        <Stack gap="md" as="header">
          <Breadcrumb items={crumbs} label={t.listing.breadcrumb} />
          <h1 className="type-h1">{page.title}</h1>
          {page.description && <p className="type-body text-muted">{page.description}</p>}
        </Stack>
        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: page.html }} />
      </Stack>
    </Page>
  )
}

export async function generateStaticParams() {
  return (await listPageSlugs()).map((page) => ({ page }))
}
