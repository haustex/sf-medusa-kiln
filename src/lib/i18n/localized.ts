/**
 * Strings in theme.config.ts can be one value for every language or one per dictionary code:
 *   tagline: "Objects for the home"                       → the same everywhere
 *   tagline: { en: "Objects for the home", id: "Benda rumah" }
 * `tx` picks the current language, falling back to `en`, then to the first value given.
 */
export type Localized = string | Record<string, string>

export function tx(value: Localized | undefined, lang: string): string {
  if (!value) return ""
  if (typeof value === "string") return value
  return value[lang] ?? value.en ?? Object.values(value)[0] ?? ""
}
