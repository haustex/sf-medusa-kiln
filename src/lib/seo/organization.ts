import config from "@theme"
import { tx } from "@lib/i18n/localized"
import { getMarket } from "@lib/util/market"

/**
 * Facts about the business for structured data, llms.txt and feeds. Everything comes from theme.config.ts
 * (brand, contact); fill in `contact` there and the Organization schema follows.
 */
export const ORG = {
  name: config.brand.name,
  email: config.contact.email,
  whatsapp: config.contact.whatsapp,
  location: config.brand.location,
} as const

const marketBase = (origin: string, countryCode: string) => `${origin}${countryCode === "us" ? "/us" : ""}`

/** Organization (same @id on every market). */
export function organizationSchema(origin: string, countryCode: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: ORG.name,
    url: origin,
    logo: `${origin}/android-chrome-512x512.png`,
    ...(ORG.email ? { email: ORG.email } : {}),
    description: tx(config.brand.tagline, getMarket(countryCode).dictionary),
    ...(ORG.location ? { foundingLocation: { "@type": "Place", name: ORG.location } } : {}),
    sameAs: Object.values(config.social).filter(Boolean),
  }
}

/** WebSite + SearchAction, one per market (different inLanguage and search URL). */
export function websiteSchema(origin: string, countryCode: string) {
  const base = marketBase(origin, countryCode)
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base,
    name: ORG.name,
    inLanguage: countryCode === "us" ? "en-US" : "id-ID",
    publisher: { "@id": `${origin}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  }
}
