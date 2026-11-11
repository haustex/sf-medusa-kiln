import { notFound } from "next/navigation"

import { categoryPath, listBlogCategories, listPosts, pagePath, toPostCard } from "@lib/data/blog"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { blogItemList } from "@lib/seo/blog"
import { breadcrumbList, JsonLd } from "@lib/seo/jsonld"
import { marketPath } from "@lib/util/market"
import { getSiteOrigin } from "@lib/util/site"
import { ButtonLink, Page, Stack } from "@modules/ds"

import { CategoryChips, Pagination } from "../components/blog-nav"
import FeaturedPost from "../components/featured-post"
import PostCard, { PostGrid } from "../components/post-card"

/**
 * /blog, /blog/page/{n}, /blog/kategori/{slug} and its pages (and the same under /us).
 * Page 1 of the main listing opens with the featured article; everything else is the card grid. Server-rendered,
 * links only (category chips, pagination).
 */
export default async function BlogListing({ countryCode, category, page = 1 }: { countryCode: string; category?: string; page?: number }) {
  const [data, categories, origin] = await Promise.all([listPosts(countryCode, { page, category }), listBlogCategories(countryCode).catch(() => []), getSiteOrigin()])
  if (!data || (page > 1 && page > data.totalPages)) notFound()

  const t = getDictionary(countryCode)
  const href = (p: string) => marketPath(countryCode, p)
  const base = category ? categoryPath(category) : "/blog"
  const featured = !category && page === 1 ? data.featured : null
  const posts = data.posts
  const title = data.category?.name ?? t.blog.title
  const intro = data.category ? data.category.description : t.blog.intro
  const empty = !featured && !posts.length


  return (
    <Page>
      <JsonLd
        data={breadcrumbList([
          { name: t.product.home, url: `${origin}${href("/")}` },
          { name: t.blog.title, url: `${origin}${href("/blog")}` },
          ...(data.category ? [{ name: data.category.name, url: `${origin}${href(base)}` }] : []),
        ])}
      />
      <JsonLd data={blogItemList(origin, countryCode, [...(featured ? [featured] : []), ...posts])} />

      <Stack gap="md" className="content-container">
        <Stack gap="section-head">
          <Stack gap="xs">
            <h1 className="type-section">{title}</h1>
            {intro && <p className="max-w-2xl text-muted">{intro}</p>}
          </Stack>
          {categories.length > 0 && (
            <CategoryChips
              label={t.blog.filter}
              items={[
                { label: t.blog.all, href: href("/blog"), active: !category },
                ...categories.map((c) => ({ label: c.name, href: href(categoryPath(c.slug)), active: c.slug === category })),
              ]}
            />
          )}
        </Stack>
      </Stack>

      {empty && (
        <div className="content-container flex flex-col items-start gap-stack-md">
          <p className="text-muted">{category ? t.blog.emptyCategory : t.blog.empty}</p>
          <ButtonLink href={href("/store")} variant="secondary">
            {t.blog.emptyCta}
          </ButtonLink>
        </div>
      )}

      {featured && (
        <section className="content-container" aria-label={t.blog.featured}>
          <FeaturedPost post={toPostCard(featured, countryCode)} cta={t.blog.read} label={featured.featured ? t.blog.featured : undefined} />
        </section>
      )}

      {posts.length > 0 && (
        <section className="content-container flex flex-col gap-section-head" aria-labelledby={featured ? "latest-title" : undefined} aria-label={featured ? undefined : title}>
          {featured && (
            <h2 id="latest-title" className="type-heading">
              {t.blog.latest}
            </h2>
          )}
          <Stack gap="section">
            <PostGrid>
              {posts.map((p, i) => (
                // Without a featured article the first row is the first screen: its covers load first
                <PostCard key={p.id} post={toPostCard(p, countryCode)} as={featured ? "h3" : "h2"} priority={!featured && i === 0} />
              ))}
            </PostGrid>
            <Pagination page={data.page} totalPages={data.totalPages} href={(p) => href(pagePath(base, p))} labels={t.blog.pagination} />
          </Stack>
        </section>
      )}
    </Page>
  )
}

/** "Halaman 2" suffix for titles of later pages */
export const pageSuffix = (countryCode: string, page: number) => (page > 1 ? ` · ${fill(getDictionary(countryCode).blog.pageTitle, { page })}` : "")
