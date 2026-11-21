/**
 * A product option's title in the page language: the dictionary's product.optionTitles ("Size" → "Ukuran", matched
 * case-insensitively), else as written in the Admin. Used by the product page's option legends and by the listing
 * filters, so both say the same thing.
 */
export const optionTitle = (title: string | null | undefined, t: { optionTitles: Record<string, string> }) => t.optionTitles[(title ?? "").trim().toLowerCase()] ?? title ?? ""
