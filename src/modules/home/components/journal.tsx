import { listJournalPicks, toPostCard } from "@lib/data/blog"
import type { Dictionary } from "@lib/i18n/dictionaries"
import { Section } from "@modules/ds"
import PostCard from "@modules/blog/components/post-card"

/**
 * "From the Journal" on the home page: three articles from medusa-blog-seo, the ones tagged "pilihan" first
 * (an editor's pick), the newest ones after that. Renders nothing when the plugin is not installed, the backend
 * is down or there is no public article yet.
 */
export default async function Journal({ countryCode, t, href }: { countryCode: string; t: Dictionary["home"]; href: string }) {
  const posts = await listJournalPicks(countryCode, 3)
  if (!posts.length) return null
  return (
    <Section id="journal" title={t.journalTitle} action={{ label: t.seeAll, href }}>
      <ul className="grid gap-x-gutter gap-y-stack-lg sm:grid-cols-3" data-testid="journal">
        {posts.map((p) => (
          <li key={p.id}>
            <PostCard post={toPostCard(p, countryCode)} variant="journal" sizes="(min-width: 640px) 33vw, 100vw" />
          </li>
        ))}
      </ul>
    </Section>
  )
}
