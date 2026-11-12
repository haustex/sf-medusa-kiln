import config from "@theme"

import { type BlogAuthor } from "@lib/data/blog"
import { fill, type Dictionary } from "@lib/i18n/dictionaries"
import { tx } from "@lib/i18n/localized"
import { Glyph, glyphForUrl, GLYPH_LABELS } from "@modules/brand/glyphs"
import { socialLinks } from "@modules/brand/social"

const iconLink =
  "inline-flex size-11 items-center justify-center rounded-full text-foreground outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-focus"

/**
 * "Written by …" box after the article text, centred like Medium's: round photo, name, job title, bio, website and
 * profile icons. Without an author on the post the shop itself is the writer: its name, tagline and the social
 * profiles of theme.config.ts. No follower counts.
 */
export default function AuthorBox({ author, origin, lang, labels: t }: { author: BlogAuthor | null; origin: string; lang: string; labels: Dictionary["blog"] }) {
  const shop = !author
  const name = author?.name ?? config.brand.name
  const bio = author ? author.bio : tx(config.brand.tagline, lang)
  const jobTitle = author?.job_title ?? null
  const url = author ? author.url : origin
  const profiles = author ? author.same_as.map((href) => ({ href, glyph: glyphForUrl(href) })) : socialLinks().map((s) => ({ href: s.href, glyph: glyphForUrl(s.href) }))
  const label = (glyph: ReturnType<typeof glyphForUrl>, href: string) => GLYPH_LABELS[glyph] ?? (() => { try { return new URL(href).hostname.replace(/^www\./, "") } catch { return href } })()

  return (
    <section aria-label={fill(t.writtenBy, { name })} className="flex flex-col items-center gap-stack-md border-t border-separator pt-stack-lg text-center" data-testid="author-box">
      {author?.avatar ? (
        <img src={author.avatar} alt="" width={96} height={96} loading="lazy" decoding="async" className="size-24 rounded-full bg-default object-cover" />
      ) : (
        <span aria-hidden="true" className="flex size-24 items-center justify-center rounded-full bg-foreground text-3xl font-semibold text-background">
          {shop ? <span className="size-7 rounded-md bg-background" /> : name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <div className="flex flex-col items-center gap-stack-xs">
        {/* "Written by" above the name: the template split at {name} (a language may put the name first) */}
        <p className="text-sm text-muted">{t.writtenBy.split("{name}").map((x) => x.trim()).filter(Boolean).join(" ")}</p>
        <p className="type-h3">{name}</p>
        {jobTitle && <p className="text-sm text-muted">{jobTitle}</p>}
      </div>
      {bio && <p className="max-w-[32rem] text-base leading-relaxed text-muted">{bio}</p>}
      {(url || profiles.length > 0) && (
        <ul aria-label={fill(t.authorProfiles, { name })} className="flex flex-wrap items-center justify-center gap-stack-xs">
          {url && (
            <li>
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label={t.authorWebsite} title={t.authorWebsite} className={iconLink}>
                <Glyph name="globe" />
              </a>
            </li>
          )}
          {profiles.map((p) => (
            <li key={p.href}>
              <a href={p.href} target="_blank" rel="noopener noreferrer" aria-label={label(p.glyph, p.href)} title={label(p.glyph, p.href)} className={iconLink}>
                <Glyph name={p.glyph} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
