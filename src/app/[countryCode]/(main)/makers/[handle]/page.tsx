import { Metadata } from "next"
import { getImageProps } from "next/image"
import { notFound } from "next/navigation"
import { marked } from "marked"

import { getMaker, listMakerProducts } from "@lib/data/makers"
import { cardRating, getProductRatings } from "@lib/data/reviews"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { marketAlternates, marketPath } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS, toProductCard } from "@lib/util/product-card"
import { getSiteOrigin } from "@lib/util/site"
import { Breadcrumb, ButtonLink, Page, ProductGrid, Section, Stack } from "@modules/ds"
import CatalogCard from "@modules/products/components/catalog-card"

type Props = { params: Promise<{ countryCode: string; handle: string }> }

/** Products on the profile; the rest sits behind "See all" (the collection listing with filters) */
const PRODUCTS = 8

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const maker = await getMaker(countryCode, handle)
  if (!maker) notFound()
  const t = getDictionary(countryCode).makers
  const origin = await getSiteOrigin()
  const path = `/makers/${handle}`
  return {
    title: maker.name,
    description: maker.description || fill(t.products, { name: maker.name }),
    alternates: { canonical: `${origin}${marketPath(countryCode, path)}`, languages: marketAlternates(origin, path) },
    ...(maker.image ? { openGraph: { images: [maker.image] } } : {}),
  }
}

/**
 * /makers/{handle}: the maker's profile: name, location, short description, cover (metadata.image), the story
 * (metadata.story, markdown) and the newest products with a link to the full collection listing.
 */
export default async function MakerPage(props: Props) {
  const { countryCode, handle } = await props.params
  const maker = await getMaker(countryCode, handle)
  if (!maker) notFound()
  const t = getDictionary(countryCode)
  const href = (p: string) => marketPath(countryCode, p)
  const { products, count } = await listMakerProducts(countryCode, maker.id, PRODUCTS, PRODUCT_CARD_FIELDS)
  const ratings = await getProductRatings(products.map((p) => p.id))
  const cards = products.map((p) => toProductCard(p, countryCode, cardRating(ratings.get(p.id))))
  const story = maker.story ? await marked.parse(maker.story, { gfm: true, async: true }) : null
  const cover = maker.image ? getImageProps({ src: maker.image, alt: "", width: 1920, height: 800, sizes: "(min-width: 1280px) 1280px, 100vw", priority: true, className: "size-full object-cover" }).props : null

  return (
    <Page data-testid="maker-page">
      <Stack gap="section" className="content-container">
        <Stack gap="md" as="header">
          <Breadcrumb items={[{ label: t.product.home, href: href("/") }, { label: t.makers.title, href: href("/makers") }, { label: maker.name }]} label={t.listing.breadcrumb} />
          <Stack gap="xs">
            <h1 className="type-h1">{maker.name}</h1>
            {maker.location && <p className="text-muted">{maker.location}</p>}
          </Stack>
          {maker.description && <p className="type-body max-w-2xl text-muted">{maker.description}</p>}
          {maker.website && (
            <a href={maker.website} target="_blank" rel="noopener noreferrer" className="w-fit text-sm font-medium underline underline-offset-4">
              {t.makers.website}
            </a>
          )}
        </Stack>

        {cover && (
          <div className="aspect-[4/5] overflow-hidden rounded-media bg-default md:aspect-[12/5]">
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- next/image's own props */}
            <img {...cover} />
          </div>
        )}

        {story && <div className="blog-prose mx-auto w-full max-w-[44rem]" dangerouslySetInnerHTML={{ __html: story }} data-testid="maker-story" />}

        {cards.length > 0 && (
          <Section id="maker-products" title={fill(t.makers.products, { name: maker.name })} contained={false} action={count > cards.length ? { label: fill(t.makers.seeAll, { n: count }), href: href(`/collections/${maker.handle}`) } : undefined}>
            <ProductGrid>
              {cards.map((p, i) => (
                <CatalogCard key={p.href} product={p} countryCode={countryCode} priority={!cover && i < 4} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
              ))}
            </ProductGrid>
            {count > cards.length && (
              <div className="pt-stack-lg">
                <ButtonLink href={href(`/collections/${maker.handle}`)} variant="secondary">
                  {fill(t.makers.seeAll, { n: count })}
                </ButtonLink>
              </div>
            )}
          </Section>
        )}
      </Stack>
    </Page>
  )
}
