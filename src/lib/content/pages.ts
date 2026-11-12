import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"
import { marked } from "marked"

import config from "@theme"
import { getMarket, marketPath } from "@lib/util/market"

/**
 * Information pages (shipping, returns, contact, privacy, terms, about …) are markdown files in
 * content/pages/{language}/{slug}.md with a small front matter (`title`, `description`). The language is the
 * market's dictionary (theme.config.ts `markets`); a page missing in one language falls back to `en`.
 *
 * Placeholders in the text: {{brand}}, {{email}}, {{whatsapp}}, {{location}} (theme.config.ts), {{country}}
 * (the market's country name in its language), {{year}} and {{date}} (today). Links that start with `/` get the
 * market prefix, so `[Returns](/returns)` works in every market.
 */
export type ContentPage = { slug: string; lang: string; title: string; description: string; html: string }

const ROOT = path.join(process.cwd(), "content", "pages")
const FALLBACK = "en"

/** Slugs that may be served: a file in the fallback language (or in any language) */
export async function listPageSlugs(): Promise<string[]> {
  const langs = await fs.readdir(ROOT).catch(() => [] as string[])
  const slugs = new Set<string>()
  for (const lang of langs) {
    const files = await fs.readdir(path.join(ROOT, lang)).catch(() => [] as string[])
    for (const f of files) if (f.endsWith(".md")) slugs.add(f.slice(0, -3))
  }
  return Array.from(slugs).sort()
}

const safeSlug = (slug: string) => /^[a-z0-9-]{1,64}$/.test(slug)

const read = async (lang: string, slug: string) => fs.readFile(path.join(ROOT, lang, `${slug}.md`), "utf8").catch(() => null)

function frontMatter(source: string): { data: Record<string, string>; body: string } {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { data: {}, body: source }
  const data: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":")
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "")
  }
  return { data, body: source.slice(m[0].length) }
}

function placeholders(countryCode: string, lang: string): Record<string, string> {
  const market = getMarket(countryCode)
  const now = new Date()
  let country = market.countryCode.toUpperCase()
  try {
    country = new Intl.DisplayNames([market.locale], { type: "region" }).of(country) ?? country
  } catch {}
  return {
    brand: config.brand.name,
    email: config.contact.email,
    whatsapp: config.contact.whatsapp,
    location: config.brand.location,
    country,
    year: String(now.getFullYear()),
    date: new Intl.DateTimeFormat(market.locale, { dateStyle: "long" }).format(now),
    lang,
  }
}

const fill = (text: string, values: Record<string, string>) => text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => values[k] ?? "")

/** The page's markdown with placeholders filled (llms-full.txt); null when no file exists */
export async function getPageText(countryCode: string, slug: string): Promise<{ title: string; description: string; markdown: string } | null> {
  const found = await locate(countryCode, slug)
  if (!found) return null
  const values = placeholders(countryCode, found.lang)
  const { data, body } = frontMatter(found.source)
  return { title: fill(data.title ?? slug, values), description: fill(data.description ?? "", values), markdown: fill(body, values).trim() }
}

/** The file for a slug: the market's language, else the fallback */
async function locate(countryCode: string, slug: string): Promise<{ lang: string; source: string } | null> {
  if (!safeSlug(slug)) return null
  const wanted = getMarket(countryCode).dictionary
  let lang = wanted
  let source = await read(lang, slug)
  if (source === null && wanted !== FALLBACK) {
    lang = FALLBACK
    source = await read(lang, slug)
  }
  return source === null ? null : { lang, source }
}

/** One page in the market's language (fallback `en`); null when no file exists */
export async function getPage(countryCode: string, slug: string): Promise<ContentPage | null> {
  const found = await locate(countryCode, slug)
  if (!found) return null
  const { lang, source } = found
  const values = placeholders(countryCode, lang)
  const { data, body } = frontMatter(source)
  const html = (await marked.parse(fill(body, values), { gfm: true, async: true }))
    // market prefix on internal links; tables in the blog's scrolling wrapper (styles/blog.css)
    .replace(/href="\/(?!\/)/g, `href="${marketPath(countryCode, "/")}`)
    .replace(/<table>/g, '<div class="blog-table"><table>')
    .replace(/<\/table>/g, "</table></div>")
  return { slug, lang, title: fill(data.title ?? slug, values), description: fill(data.description ?? "", values), html }
}
