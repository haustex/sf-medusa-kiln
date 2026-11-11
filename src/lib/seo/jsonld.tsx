import { SITE_LIVE } from "@lib/util/site-live"

/** Serializes JSON-LD for a `<script>` tag without allowing `</script>` breakouts. */
export const toJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c")

/** JSON-LD block; rendered only when SITE_LIVE=true (pre-launch pages stay bare). */
export function JsonLd({ data }: { data: unknown }) {
  if (!SITE_LIVE || !data) return null
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(data) }} />
}

export const breadcrumbList = (items: { name: string; url?: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    ...(item.url ? { item: item.url } : {}),
  })),
})

export const faqPage = (items: { q: string; a: string }[], url?: string) =>
  items.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        ...(url ? { url } : {}),
        mainEntity: items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null
