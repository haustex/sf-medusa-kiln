import { HttpTypes } from "@medusajs/types"

import config from "@theme"
import { type Dictionary } from "@lib/i18n/dictionaries"
import { tx } from "@lib/i18n/localized"
import { isVariantInStock } from "@lib/util/inventory"
import { marketPath } from "@lib/util/market"
import { getPricedVariants } from "@lib/util/product-structured-data"
import { soldByQuote } from "@lib/quote"
import { formatPrice } from "@modules/ds/price-tag"
import { productFaq, specRows } from "@modules/products/pdp/product-details"

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim()

/**
 * The product page as Markdown for agents and crawlers (`/products/{handle}.md`, or the page URL with
 * `Accept: text/markdown`, both rewritten in next.config.js): title, description, specifications and FAQ as on the
 * page, a variants table with prices and stock, delivery estimates (medusa-fulfillment-zone-rate) and the shop's
 * information pages from the footer columns. In the market's language and currency; `lang` picks the metadata
 * translations (`material_id`, `faq_en`, …).
 */
export function renderProductMarkdown({ product, currency, origin, countryCode, lang, t, estimateLine, location }: { product: HttpTypes.StoreProduct; currency: string; origin: string; countryCode: string; lang: "id" | "en"; t: Dictionary["product"]; estimateLine: string | null; location: string | null }) {
  const m = t.markdown
  const base = `${origin}${marketPath(countryCode, "/")}`.replace(/\/$/, "")
  const productUrl = `${base}/products/${product.handle}`
  const optionTitles = new Map((product.options ?? []).map((o) => [o.id, o.title]))
  const variants = getPricedVariants(product)
  const inStock = variants.some(isVariantInStock)

  const specs = specRows(product, t, lang, location)
  const faq = productFaq(product, t, lang)
  // sold by quote (theme.config.ts product.quote): no price table, "price on request" instead
  const byQuote = soldByQuote(product, countryCode)
  const rows = variants.map((v) => {
    const options = (v.options ?? []).map((o) => `${optionTitles.get(o.option_id ?? "") ?? m.options}: ${o.value}`).join(", ")
    const price = formatPrice(v.calculated_price!.calculated_amount!, currency)
    return `| ${cell(options || v.title || "")} | ${cell(v.sku ?? "")} | ${price} | ${isVariantInStock(v) ? t.inStock : t.soldOut} | \`${v.id}\` |`
  })
  const links = config.brand.footerColumns.flatMap((c) => c.links).filter((l) => l.href.startsWith("/") && l.href !== "/track")

  const out: string[] = [`# ${product.title}`, ""]
  if (product.subtitle?.trim()) out.push(`*${product.subtitle.trim()}*`, "")
  if (product.description?.trim()) out.push(product.description.trim(), "")
  out.push(`- ${m.url}: ${productUrl}`, `- ${m.availability}: ${inStock ? t.inStock : t.soldOut}`)
  if (byQuote) out.push(`- ${m.price}: ${t.priceOnRequest}`)
  if (estimateLine) out.push(`- ${estimateLine}`)
  if (product.collection?.title) out.push(`- ${t.maker}: ${product.collection.title}`)
  out.push("")
  if (specs.length) out.push(`## ${t.specsTitle}`, "", ...specs.map((r) => `- ${r.k}: ${r.v}`), "")
  if (rows.length && !byQuote) out.push(`## ${m.variants}`, "", `| ${m.options} | ${t.sku} | ${m.price} | ${m.availability} | ${m.variantId} |`, "| --- | --- | --- | --- | --- |", ...rows, "")
  if (faq.length) out.push(`## ${t.faqTitle}`, "", ...faq.flatMap((f) => [`**${f.q}**`, "", f.a, ""]))
  out.push(`## ${m.links}`, "", `- [${m.page}](${productUrl})`, ...links.map((l) => `- [${tx(l.label, lang)}](${base}${l.href})`), "")
  return out.join("\n")
}
