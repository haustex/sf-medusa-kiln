import "server-only"
import { HttpTypes } from "@medusajs/types"

import config from "@theme"
import { getPageText, listPageSlugs } from "@lib/content/pages"
import { listPostIndex, postPath, indexLocale } from "@lib/data/blog"
import { listCategories } from "@lib/data/categories"
import { listMakers, listMakerProducts, type Maker } from "@lib/data/makers"
import { listProducts } from "@lib/data/products"
import { feature } from "@lib/features"
import { tx } from "@lib/i18n/localized"
import { isHiddenProduct } from "@lib/util/hidden-products"
import { MARKET_CODES, MARKETS, X_DEFAULT_MARKET, getMarket, marketPath } from "@lib/util/market"
import { formatPrice } from "@modules/ds/price-tag"

/**
 * /llms.txt and /llms-full.txt (https://llmstxt.org): the store described for AI assistants, in English, with
 * absolute URLs. The short file is a map (markets, categories, makers, information pages, journal, product names);
 * the full one adds each product's description, specifications and price in every market, and the text of the
 * information pages. Both are built from the same data as the pages, so they never say more than the site does.
 */

const PRODUCT_FIELDS = "id,title,handle,subtitle,description,*variants.calculated_price,*variants.options,+metadata,*categories,*collection"
const PAGE = 100
const MAX_PRODUCTS = 1000

type Product = HttpTypes.StoreProduct

/** The reference market: English (x-default) first, else the default */
const primary = () => (MARKETS[X_DEFAULT_MARKET]?.dictionary === "en" ? X_DEFAULT_MARKET : MARKET_CODES.find((c) => MARKETS[c].dictionary === "en") ?? X_DEFAULT_MARKET)

const countryName = (code: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}
const languageName = (lang: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(lang) ?? lang
  } catch {
    return lang
  }
}

const oneLine = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim()
const bullet = (label: string, url: string, note?: string | null) => `- [${label}](${url})${note ? `: ${oneLine(note)}` : ""}`

async function allProducts(countryCode: string): Promise<Product[]> {
  const out: Product[] = []
  for (let page = 1; out.length < MAX_PRODUCTS; page++) {
    const { response, nextPage } = await listProducts({ countryCode, pageParam: page, queryParams: { limit: PAGE, fields: PRODUCT_FIELDS, order: "created_at" } }).catch(() => ({ response: { products: [] as Product[], count: 0 }, nextPage: null }))
    out.push(...response.products.filter((p) => !isHiddenProduct(p)))
    if (!nextPage || !response.products.length) break
  }
  return out
}

const priceRange = (p: Product) => {
  const amounts = (p.variants ?? []).map((v) => v.calculated_price?.calculated_amount).filter((a): a is number => typeof a === "number")
  const currency = (p.variants ?? []).find((v) => v.calculated_price?.currency_code)?.calculated_price?.currency_code
  if (!amounts.length || !currency) return null
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  return min === max ? formatPrice(min, currency) : `${formatPrice(min, currency)} – ${formatPrice(max, currency)}`
}

async function header(origin: string) {
  const ref = primary()
  const lang = getMarket(ref).dictionary
  const lines = [
    `# ${config.brand.name}`,
    "",
    `> ${oneLine(tx(config.brand.tagline, lang))} ${oneLine(tx(config.brand.footerText, lang))}`.trim(),
    "",
    ...(config.brand.location ? [`Based in ${config.brand.location}.`] : []),
    ...(config.contact.email ? [`Contact: ${config.contact.email}`] : []),
    "",
    "## Markets",
    "",
    ...MARKET_CODES.map((c) => `- [${countryName(c)}](${origin}${marketPath(c) || "/"}): ${MARKETS[c].currency.toUpperCase()}, ${languageName(MARKETS[c].dictionary)}${MARKETS[c].prefix ? ` (URLs start with ${MARKETS[c].prefix})` : ""}`),
    "",
    `Every page below exists in each market; the links point at the ${countryName(ref)} version.`,
  ]
  return { lines, ref }
}

async function sections(origin: string, ref: string) {
  const url = (path: string) => `${origin}${marketPath(ref, path)}`
  const [categories, makers, slugs, blogOn] = await Promise.all([
    listCategories({ fields: "id,name,handle,description,parent_category_id", limit: 100 }, ref).catch(() => []),
    listMakers(ref).catch(() => [] as Maker[]),
    listPageSlugs(),
    feature("blog"),
  ])
  const makerCounts = await Promise.all(makers.map((m) => listMakerProducts(ref, m.id, 1, "id").then((r) => r.count)))
  const pages = (await Promise.all(slugs.map((slug) => getPageText(ref, slug).then((p) => (p ? { slug, ...p } : null))))).filter((p): p is NonNullable<typeof p> => !!p)
  const posts = blogOn ? await listPostIndex().catch(() => []) : []

  const out: string[] = ["", "## Shop", "", bullet("All products", url("/store"))]
  for (const c of categories.filter((c) => !c.parent_category_id)) out.push(bullet(c.name, url(`/categories/${c.handle}`), c.description))
  if (makers.length) {
    out.push("", "## Makers", "")
    makers.forEach((m, i) => {
      if (makerCounts[i] > 0) out.push(bullet(m.name, url(`/makers/${m.handle}`), [m.location, m.description].filter(Boolean).join(" — ")))
    })
  }
  if (pages.length) {
    out.push("", "## Information", "")
    for (const p of pages) out.push(bullet(p.title, url(`/${p.slug}`), p.description))
  }
  if (posts.length) {
    out.push("", "## Journal", "", bullet("Journal", url(config.blogPath)))
    for (const p of posts) {
      const l = indexLocale(p, ref)
      if (l) out.push(bullet(l.title, url(postPath(l.slug)), l.excerpt))
    }
  }
  return { out, pages, url }
}

export async function llmsTxt(origin: string): Promise<string> {
  const { lines, ref } = await header(origin)
  const { out, url } = await sections(origin, ref)
  const products = await allProducts(ref)
  const productLines = products.length ? ["", "## Products", "", ...products.map((p) => bullet(p.title, url(`/products/${p.handle}`), [p.collection?.title ? `by ${p.collection.title}` : null, priceRange(p)].filter(Boolean).join(", ")))] : []
  return [...lines, ...out, ...productLines, "", `Full version with descriptions and prices in every market: ${origin}/llms-full.txt`, ""].join("\n")
}

export async function llmsFullTxt(origin: string): Promise<string> {
  const { lines, ref } = await header(origin)
  const { out, pages, url } = await sections(origin, ref)
  // prices per market: one product list per market, matched by handle
  const byMarket = new Map<string, Map<string, Product>>()
  for (const c of MARKET_CODES) byMarket.set(c, new Map((await allProducts(c)).map((p) => [p.handle, p])))
  const products = Array.from(byMarket.get(ref)?.values() ?? [])
  const attributes = config.listing.filters.attributes

  const productBlocks = products.flatMap((p) => {
    const specs: string[] = []
    if (p.collection?.title) specs.push(`- Maker: ${p.collection.title} (${url(`/makers/${p.collection.handle}`)})`)
    if (p.categories?.length) specs.push(`- Category: ${p.categories.map((c) => c.name).join(", ")}`)
    for (const a of attributes) {
      const v = p.metadata?.[a.key]
      if (typeof v === "string" && v) specs.push(`- ${tx(a.label, "en")}: ${v}`)
    }
    for (const key of ["materials", "care", "dimensions"]) {
      const v = p.metadata?.[key]
      if (typeof v === "string" && v) specs.push(`- ${key[0].toUpperCase()}${key.slice(1)}: ${oneLine(v)}`)
    }
    const options = (p.options ?? []).filter((o) => (o.values?.length ?? 0) > 1).map((o) => `- ${o.title}: ${o.values!.map((v) => v.value).join(", ")}`)
    const prices = MARKET_CODES.map((c) => {
      const m = byMarket.get(c)?.get(p.handle)
      const range = m ? priceRange(m) : null
      return range ? `- Price (${countryName(c)}): ${range}` : null
    }).filter(Boolean) as string[]
    return ["", `### ${p.title}`, "", `URL: ${url(`/products/${p.handle}`)}`, ...(p.subtitle ? ["", oneLine(p.subtitle)] : []), ...(p.description ? ["", p.description.trim()] : []), "", ...specs, ...options, ...prices]
  })

  const pageBlocks = pages.flatMap((p) => ["", `## ${p.title}`, "", `URL: ${url(`/${p.slug}`)}`, "", p.markdown.replace(/^#/gm, "##")])

  return [...lines, ...out, ...(products.length ? ["", "## Products"] : []), ...productBlocks, ...(pages.length ? ["", "# Information pages"] : []), ...pageBlocks, ""].join("\n")
}
