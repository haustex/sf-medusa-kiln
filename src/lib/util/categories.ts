import config from "@theme"

/**
 * Categories the shop lists in its navigation (header row, footer "Shop", home cards, listing filters, llms.txt):
 * everything but `brand.hideCategories` (handles). A hidden category's own page stays reachable by its address.
 */
export function shownCategories<T extends { handle?: string | null }>(categories: T[]): T[] {
  const hidden = config.brand.hideCategories
  if (!hidden.length) return categories
  return categories.filter((c) => !c.handle || !hidden.includes(c.handle))
}
