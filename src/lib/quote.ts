import { HttpTypes } from "@medusajs/types"

import config from "@theme"
import type { Dictionary } from "@lib/i18n/dictionaries"
import { fill } from "@lib/i18n/fill"
import { marketPath } from "@lib/util/market"

/**
 * Products sold by quote (theme.config.ts `product.quote`): the product page shows "Request a quote" instead of the
 * cart, and structured data, llms.txt and the Markdown page carry no fixed price. Nothing here is server-only.
 */
type QuoteProduct = Pick<HttpTypes.StoreProduct, "metadata" | "categories" | "handle" | "title"> | null | undefined

const QUOTE = config.product.quote
const truthy = (v: unknown) => v === true || v === "true"

/** The metadata flag, or a category whose handle contains the configured word: made to order */
export function isMadeToOrder(product: QuoteProduct): boolean {
  if (!QUOTE) return false
  const flag = product?.metadata?.[QUOTE.metadata]
  if (truthy(flag)) return true
  if (flag === false || flag === "false") return false
  return !!QUOTE.category && !!product?.categories?.some((c) => c?.handle?.includes(QUOTE.category))
}

/** …and this market sells it by quote (no fixed-size exception for the market) */
export function soldByQuote(product: QuoteProduct, countryCode: string): boolean {
  if (!isMadeToOrder(product)) return false
  const key = QUOTE?.fixedSize[countryCode]
  return !(key && truthy(product?.metadata?.[key]))
}

/** Where "Request a quote" goes for this product and market: the configured link, WhatsApp, or the contact page */
export function quoteLink(product: QuoteProduct, countryCode: string, productUrl: string, t: Pick<Dictionary["product"], "quoteWhatsapp">): { href: string; external: boolean } {
  const configured = QUOTE?.href[countryCode]
  if (configured) {
    const href = configured.replace(/\{handle\}/g, encodeURIComponent(product?.handle ?? ""))
    return /^https?:\/\//.test(href) ? { href, external: true } : { href: marketPath(countryCode, href), external: false }
  }
  const number = config.contact.whatsapp.replace(/\D/g, "")
  if (number) {
    const text = fill(t.quoteWhatsapp, { brand: config.brand.name, title: product?.title ?? "", url: productUrl })
    return { href: `https://wa.me/${number}?text=${encodeURIComponent(text)}`, external: true }
  }
  return { href: marketPath(countryCode, "/contact"), external: false }
}
