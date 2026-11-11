import { categoryPath, postPath, toPostCard, type BlogArticle, type BlogCard } from "@lib/data/blog"
import { listProducts } from "@lib/data/products"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { blogPosting } from "@lib/seo/blog"
import { breadcrumbList, faqPage, JsonLd } from "@lib/seo/jsonld"
import { isHiddenProduct } from "@lib/util/hidden-products"
import { marketPath } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS, toProductCard } from "@lib/util/product-card"
import { cardRating, getProductRatings } from "@lib/data/reviews"
import { getSiteOrigin } from "@lib/util/site"
import { EyebrowLink, Page, ProductCard, type ProductCardData, ProductGrid, SectionHeader, Stack } from "@modules/ds"

import "../blog.css"
import PostBody from "../components/post-body"
import PostCard, { PostGrid, PostMeta } from "../components/post-card"
import PostCover from "../components/post-cover"
import ShareButtons from "../components/share"
import Toc from "../components/toc"
import { formatPostDate } from "../format"

/** Product cards (market prices, photos) for the ids an article mentions; products not sold in this market drop out */
async function productCards(countryCode: string, ids: string[]): Promise<Record<string, ProductCardData>> {
  if (!ids.length) return {}
  const products = await listProducts({ countryCode, queryParams: { id: ids, limit: ids.length, fields: PRODUCT_CARD_FIELDS } as any })
    .then(({ response }) => response.products)
    .catch(() => [])
  const ratings = await getProductRatings(products.map((p) => p.id))
  return Object.fromEntries(products.filter((p) => !isHiddenProduct(p)).map((p) => [p.id, toProductCard(p, countryCode, cardRating(ratings.get(p.id)))]))
}

/**
 * An article: big title, cover, text in a 680px column with the contents beside it on wide screens, the products
 * it mentions, and more articles. Used by /blog/{slug} and by the secret preview (`preview`: a note on top, no
 * structured data).
 */
export default async function ArticleTemplate({
  countryCode,
  post,
  more,
  preview,
}: {
  countryCode: string
  post: BlogArticle
  more: { same_category: boolean; posts: BlogCard[] }
  preview?: boolean
}) {
  const t = getDictionary(countryCode)
  const lang = countryCode === "us" ? "en" : "id"
  const href = (p: string) => marketPath(countryCode, p)
  const embedded = post.blocks.flatMap((b) => (b.type === "product" ? [b.id] : []))
  const [origin, cards] = await Promise.all([getSiteOrigin(), productCards(countryCode, Array.from(new Set([...embedded, ...post.product_ids])))])

  const url = `${origin}${href(postPath(post.slug))}`
  const card = toPostCard(post, countryCode, "long")
  const related = post.product_ids.map((id) => cards[id]).filter(Boolean)
  const categoryHref = post.category ? href(categoryPath(post.category.slug)) : null
  // "Diperbarui …" only when the text changed on a later day than it was published
  const updated = formatPostDate(post.updated_at || post.published_at, lang, "long")
  const showUpdated = updated !== card.dateLabel && new Date(post.updated_at) > new Date(post.published_at)
  const updatedText = t.blog.updated.split("{date}")

  return (
    <Page>
      {!preview && (
        <>
          <JsonLd data={blogPosting(origin, countryCode, post)} />
          <JsonLd
            data={breadcrumbList([
              { name: t.product.home, url: `${origin}${href("/")}` },
              { name: t.blog.title, url: `${origin}${href("/blog")}` },
              ...(post.category ? [{ name: post.category.name, url: `${origin}${categoryHref}` }] : []),
              { name: post.title },
            ])}
          />
          <JsonLd data={faqPage(post.faq, url)} />
        </>
      )}

      <article className="content-container flex flex-col gap-section">
        {/* No visual breadcrumb (JSON-LD only): the category label above the title links back up */}
        <Stack gap="lg">
          {preview && (
            <p role="status" className="rounded-md bg-default px-stack-md py-stack-sm text-sm">
              {t.blog.preview}
            </p>
          )}
          <header className="blog-column flex flex-col gap-stack-md">
            <Stack gap="sm">
              {post.category && categoryHref && <EyebrowLink href={categoryHref}>{post.category.name}</EyebrowLink>}
              <h1 className="blog-title">{post.title}</h1>
            </Stack>
            {post.excerpt && <p className="text-lg leading-relaxed text-muted sm:text-xl">{post.excerpt}</p>}
            <div className="flex flex-col gap-stack-xs">
              <PostMeta post={card} author={post.author} />
              {showUpdated && (
                <p className="text-sm text-muted">
                  {updatedText[0]}
                  <time dateTime={post.updated_at}>{updated}</time>
                  {updatedText[1]}
                </p>
              )}
            </div>
          </header>
          {post.cover && (
            <PostCover
              slug={post.slug}
              src={post.cover}
              wideSrc={post.cover_wide}
              alt={post.cover_alt}
              shape="article"
              priority
              sizes="(min-width: 1024px) 960px, 100vw"
              className="mx-auto max-w-[60rem]"
            />
          )}
        </Stack>

        <div className="blog-layout">
          <Toc items={post.toc} title={t.blog.toc} />
          <PostBody blocks={post.blocks} products={cards} labels={{ viewProduct: t.blog.viewProduct, playVideo: t.blog.playVideo, videoTitle: t.blog.videoTitle }} />
          <footer>
            <ShareButtons url={url} title={post.title} labels={t.blog.share} />
          </footer>
        </div>
      </article>

      {related.length > 0 && (
        <section className="content-container flex flex-col gap-section-head" aria-labelledby="post-products">
          <SectionHeader id="post-products" title={t.blog.productsTitle} />
          <ProductGrid>
            {related.map((p) => (
              <ProductCard key={p.href} product={p} />
            ))}
          </ProductGrid>
        </section>
      )}

      {more.posts.length > 0 && (
        <section className="content-container flex flex-col gap-section-head" aria-labelledby="post-more">
          <SectionHeader
            id="post-more"
            title={more.same_category && post.category ? fill(t.blog.moreIn, { name: post.category.name }) : t.blog.more}
            action={{ label: t.blog.allArticles, href: more.same_category && categoryHref ? categoryHref : href("/blog") }}
          />
          {/* 4 on phones (2 x 2), 3 from md (one row) */}
          <PostGrid className="md:[&>li:nth-child(n+4)]:hidden">
            {more.posts.map((p) => (
              <PostCard key={p.id} post={toPostCard(p, countryCode)} />
            ))}
          </PostGrid>
        </section>
      )}
    </Page>
  )
}
