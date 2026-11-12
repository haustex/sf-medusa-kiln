import { Metadata } from "next"

import { listMakers, listMakerProducts } from "@lib/data/makers"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { marketAlternates, marketPath } from "@lib/util/market"
import { getSiteOrigin } from "@lib/util/site"
import { Breadcrumb, Page, Stack } from "@modules/ds"
import MakerCard from "@modules/makers/maker-card"

type Props = { params: Promise<{ countryCode: string }> }

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const t = getDictionary(countryCode).makers
  const origin = await getSiteOrigin()
  return { title: t.title, description: t.intro, alternates: { canonical: `${origin}${marketPath(countryCode, "/makers")}`, languages: marketAlternates(origin, "/makers") } }
}

/** /makers: every collection with products, as cards with its two newest pieces (lib/data/makers.ts) */
export default async function MakersPage(props: Props) {
  const { countryCode } = await props.params
  const t = getDictionary(countryCode)
  const href = (p: string) => marketPath(countryCode, p)
  const makers = await listMakers(countryCode).catch(() => [])
  const products = await Promise.all(makers.map((m) => listMakerProducts(countryCode, m.id, 2, "id,thumbnail")))
  const cards = makers
    .map((m, i) => ({ maker: m, count: products[i].count, images: products[i].products.map((p) => p.thumbnail).filter((u): u is string => !!u) }))
    .filter((c) => c.count > 0)

  return (
    <Page data-testid="makers-page">
      <Stack gap="section" className="content-container">
        <Stack gap="md" as="header">
          <Breadcrumb items={[{ label: t.product.home, href: href("/") }, { label: t.makers.title }]} label={t.listing.breadcrumb} />
          <h1 className="type-h1">{t.makers.title}</h1>
          <p className="type-body max-w-2xl text-muted">{t.makers.intro}</p>
        </Stack>
        {cards.length > 0 ? (
          <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            {cards.map(({ maker, count, images }) => (
              <li key={maker.id}>
                <MakerCard href={href(`/makers/${maker.handle}`)} name={maker.name} location={maker.location} description={maker.description} images={images} productsLabel={count === 1 ? t.makers.countOne : fill(t.makers.count, { n: count })} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{t.makers.empty}</p>
        )}
      </Stack>
    </Page>
  )
}
