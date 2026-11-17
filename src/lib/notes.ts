/**
 * theme.config.ts `product.notes`: the short promises under the add-to-cart button, one line icon each
 * (lucide, drawn server-side by ds/icons `Icon`). An item is either a text (check icon) or `{ icon, text }`.
 * The text may hold Markdown links, `[label](href)`: a market-relative path ("/custom") gets the market prefix,
 * an absolute URL opens in a new tab. Rendered by modules/products/pdp/product-notes.tsx.
 */
type Localized = string | Record<string, string>

export const NOTE_ICONS = ["check", "truck", "package", "hand", "ruler", "undo", "shield", "leaf", "trees", "gift", "clock", "sparkles", "badge", "hammer"] as const
export type NoteIcon = (typeof NOTE_ICONS)[number]

export type ProductNote = Localized | { icon?: NoteIcon; text: Localized }

export const noteOf = (n: ProductNote): { icon: NoteIcon; text: Localized } =>
  typeof n === "object" && "text" in n && (typeof n.text === "string" || typeof n.text === "object") ? { icon: (n.icon as NoteIcon | undefined) ?? "check", text: n.text as Localized } : { icon: "check", text: n as Localized }
