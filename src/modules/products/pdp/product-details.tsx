import { __iconData as chevronDown } from "lucide-react/icons/chevron-down"
import { HttpTypes } from "@medusajs/types"

import { Dictionary } from "@lib/i18n/dictionaries"
import { Icon } from "@modules/ds/icons"

type T = Dictionary["product"]
type Lang = "id" | "en"

/** metadata.{key}_{lang} first, then metadata.{key} */
export const meta = (product: HttpTypes.StoreProduct, key: string, lang: Lang) => {
  const m = (product.metadata ?? {}) as Record<string, unknown>
  const v = m[`${key}_${lang}`] ?? m[key]
  return typeof v === "string" && v.trim() ? v.trim() : null
}

/** Options with more than one value, values in variant order */
export const optionValues = (product: HttpTypes.StoreProduct) =>
  (product.options ?? [])
    .filter((o) => (o.values?.length ?? 0) > 1 || (product.variants?.length ?? 0) > 1)
    .map((o) => ({
      id: o.id,
      title: o.title ?? "",
      values: Array.from(new Set((product.variants ?? []).flatMap((v) => v.options?.filter((vo) => vo.option_id === o.id).map((vo) => vo.value) ?? []))),
    }))
    .filter((o) => o.values.length > 0)

const dims = (p: { length?: number | null; width?: number | null; height?: number | null }) => (p.length && p.width && p.height ? `${p.length} × ${p.width} × ${p.height} cm` : null)

/**
 * Specification rows from the product and its metadata: dimensions (metadata.dimensions or length/width/height),
 * material, options, weight, maker (collection), made in (collection metadata.location or metadata.origin).
 */
export function specRows(product: HttpTypes.StoreProduct, t: T, lang: Lang, location: string | null) {
  const material = meta(product, "material", lang) ?? product.material ?? null
  const rows: { k: string; v: string }[] = []
  const d = meta(product, "dimensions", lang) ?? dims(product)
  if (d) rows.push({ k: t.dimensions, v: d })
  if (material) rows.push({ k: t.material, v: material })
  for (const o of optionValues(product)) rows.push({ k: o.title || t.sizes, v: o.values.join(", ") })
  if (product.weight) rows.push({ k: t.weight, v: product.weight >= 1000 ? `${(product.weight / 1000).toLocaleString(lang === "en" ? "en-US" : "id-ID")} kg` : `${product.weight} g` })
  if (product.collection?.title) rows.push({ k: t.maker, v: product.collection.title })
  const origin = meta(product, "origin", lang) ?? location
  if (origin) rows.push({ k: t.madeIn, v: origin })
  return rows
}

export function ProductSpecs({ rows, t }: { rows: { k: string; v: string }[]; t: T }) {
  if (!rows.length) return null
  return (
    <section aria-labelledby="specs-title" className="flex flex-col gap-section-head">
      <h2 id="specs-title" className="type-h2">
        {t.specsTitle}
      </h2>
      <table className="w-full table-fixed text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.k} className="border-b border-separator">
              <th scope="row" className="w-2/5 py-stack-sm pr-stack-md text-left font-normal text-muted sm:w-1/4">
                {r.k}
              </th>
              <td className="py-stack-sm">{r.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

/** Native <details> rows (no JS, content stays in the HTML): Details, Materials & care, Shipping & returns, FAQ */
export function Accordion({ items, className }: { items: { title: string; body: React.ReactNode; open?: boolean }[]; className?: string }) {
  if (!items.length) return null
  return (
    <div className={className}>
      <div className="divide-y divide-separator border-y border-separator">
        {items.map((item) => (
          <details key={item.title} className="group" open={item.open}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-stack-md py-stack-sm text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
              {item.title}
              <Icon icon={chevronDown} size={18} className="shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="pb-stack-md text-sm leading-relaxed text-muted">{item.body}</div>
          </details>
        ))}
      </div>
    </div>
  )
}

/** FAQ from metadata.faq / faq_{lang} (JSON [{ "q", "a" }]) plus care and sizes when present */
export function productFaq(product: HttpTypes.StoreProduct, t: T, lang: Lang): { q: string; a: string }[] {
  const raw = (product.metadata ?? {})[`faq_${lang}`] ?? (product.metadata ?? {}).faq
  let items: { q: string; a: string }[] = []
  try {
    const list = typeof raw === "string" ? JSON.parse(raw) : raw
    if (Array.isArray(list)) items = list.filter((x) => x?.q && x?.a)
  } catch {
    items = []
  }
  const care = meta(product, "care", lang)
  if (care) items.push({ q: t.faq.careQ, a: care })
  const sizes = optionValues(product).find((o) => o.values.length > 1)
  if (sizes) items.push({ q: t.faq.sizesQ, a: sizes.values.join(", ") + "." })
  return items
}
