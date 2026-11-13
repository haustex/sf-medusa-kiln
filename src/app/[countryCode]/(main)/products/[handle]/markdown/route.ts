import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { formatEstimate, shippingEstimates } from "@lib/data/shipping-rates"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { getMarket } from "@lib/util/market"
import { PRODUCT_CARD_FIELDS } from "@lib/util/product-card"
import { renderProductMarkdown } from "@lib/util/product-markdown"
import { getRequestOrigin } from "@lib/util/site"
import { meta } from "@modules/products/pdp/product-details"
import config from "@theme"

const FIELDS = `${PRODUCT_CARD_FIELDS},*collection,+subtitle,+material,+weight,+length,+width,+height,+variants.sku`

const HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
  Vary: "Accept",
  // Cloudflare ignores Vary: never keep the Markdown at the edge, or a browser asking for the same URL could get it
  // instead of the HTML page.
  "Cloudflare-CDN-Cache-Control": "no-store",
}

/** Served for `/products/{handle}.md` and for the page URL with `Accept: text/markdown` (rewrites in next.config.js) */
export async function GET(request: Request, { params }: { params: Promise<{ countryCode: string; handle: string }> }) {
  const { countryCode, handle } = await params
  const region = await getRegion(countryCode)
  const product = region
    ? await listProducts({ countryCode, queryParams: { handle, fields: FIELDS } })
        .then(({ response }) => response.products[0])
        .catch(() => undefined)
    : undefined
  if (!region || !product) return new Response("# Not found\n", { status: 404, headers: HEADERS })

  const market = getMarket(countryCode)
  const lang = market.dictionary
  const t = getDictionary(countryCode).product
  const estimates = await shippingEstimates(countryCode)
  const estimateLine = estimates.length
    ? fill(t.deliveryAfter, { range: new Intl.ListFormat(market.locale, { type: "disjunction" }).format(estimates.map((e) => (estimates.length > 1 ? `${e.name} ${formatEstimate(e.estimate, countryCode)}` : formatEstimate(e.estimate, countryCode)))) })
    : null
  const location = meta(product, "origin", lang) ?? (typeof product.collection?.metadata?.location === "string" ? product.collection.metadata.location : null) ?? config.brand.location
  return new Response(renderProductMarkdown({ product, currency: region.currency_code, origin: getRequestOrigin(request), countryCode, lang, t, estimateLine, location }), { headers: HEADERS })
}
