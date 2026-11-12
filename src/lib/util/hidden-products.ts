/**
 * Products that exist in Medusa only for internal use and must never reach a public surface (lists, PDP, search,
 * sitemap, feeds, JSON-LD): list their handles here. Sales channels are the first lock; this is the second one in
 * case someone adds such a product to a channel in the Admin.
 */
export const HIDDEN_PRODUCT_HANDLES: ReadonlySet<string> = new Set<string>([])

export const isHiddenProduct = (p: { handle?: string | null } | null | undefined) =>
  !!p?.handle && HIDDEN_PRODUCT_HANDLES.has(p.handle)

/** Drops hidden products; `count` is lowered by the number dropped from this page */
export function withoutHidden<T extends { handle?: string | null }>(products: T[], count: number) {
  const visible = products.filter((p) => !isHiddenProduct(p))
  return { products: visible, count: Math.max(count - (products.length - visible.length), 0) }
}

/** Product reachable only by its link (metadata `secret: true`): never indexed, never in a list */
export const isSecretProduct = (p: { metadata?: Record<string, unknown> | null } | null | undefined) =>
  p?.metadata?.secret === true || p?.metadata?.secret === "true"
