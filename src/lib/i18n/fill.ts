/** `fill("Page {n} of {total}", { n: 2, total: 9 })`. Its own module so client components do not bundle the dictionaries. */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""))
