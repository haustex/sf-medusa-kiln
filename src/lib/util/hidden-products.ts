/**
 * Products that exist in Medusa only for internal use and must never reach a public surface (lists, PDP, search,
 * sitemap, llms, feeds, JSON-LD, UCP). "Furniture custom" carries the lines of custom quotes (draft orders,
 * docs/desain-dp-custom.md nomor 4). It is in no sales channel already; this is the second lock in case someone
 * adds it to one in the Admin. Keep in sync with PLACEHOLDER_HANDLE in apps/backend/src/lib/custom-dp/quote.ts.
 */
export const HIDDEN_PRODUCT_HANDLES: ReadonlySet<string> = new Set(["hk-custom-quote-item"])

export const isHiddenProduct = (p: { handle?: string | null } | null | undefined) =>
  !!p?.handle && HIDDEN_PRODUCT_HANDLES.has(p.handle)

/** Drops hidden products; `count` is lowered by the number dropped from this page */
export function withoutHidden<T extends { handle?: string | null }>(products: T[], count: number) {
  const visible = products.filter((p) => !isHiddenProduct(p))
  return { products: visible, count: Math.max(count - (products.length - visible.length), 0) }
}

/** Secret test product: published, reachable only by its link (lists drop it in the backend). Never indexed. */
export const isSecretProduct = (p: { metadata?: Record<string, unknown> | null } | null | undefined) =>
  p?.metadata?.hk_secret === true || p?.metadata?.hk_secret === "true"
