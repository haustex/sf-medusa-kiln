/**
 * Custom furniture quote + 50 % deposit (docs/desain-dp-custom.md). Switch:
 * CUSTOM_DP_ENABLED in deploy/.env, read at build time like SITE_LIVE (flip =
 * rebuild with ./deploy.sh). Off: no /custom page, and the "Custom Furniture"
 * buttons open WhatsApp with an opening message instead. Phase 1 is Indonesia
 * only, so /us keeps WhatsApp even when it is on.
 */
import { isMadeToOrder } from "./lead-time"

export const CUSTOM_DP_ENABLED = process.env.CUSTOM_DP_ENABLED === "true"
/** "preview": only browsers with the preview cookie (set via the Admin link) see /custom and /penawaran; see custom-dp-server.ts */
export const CUSTOM_DP_PREVIEW = process.env.CUSTOM_DP_ENABLED === "preview"
export const PREVIEW_COOKIE = "hk_preview"

export const WHATSAPP_NUMBER = "6285111663330"

export const customQuoteAvailable = (countryCode: string) => CUSTOM_DP_ENABLED && countryCode !== "us"

export function customWhatsappUrl(countryCode: string) {
  const text =
    countryCode === "us"
      ? "Hello HAUS KAYU, I'd like to ask about custom furniture."
      : "Halo HAUS KAYU, saya mau tanya soal furniture custom."
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

/** Where "Custom Furniture" buttons point: the quote form, or WhatsApp while the feature is off */
export const customFurnitureHref = (countryCode: string) =>
  customQuoteAvailable(countryCode) ? "/custom" : customWhatsappUrl(countryCode)

type QuoteProduct = Parameters<typeof isMadeToOrder>[0] & { metadata?: Record<string, unknown> | null }

/** US store: a custom product with a fixed size can still be bought directly (product metadata us_fixed_size) */
export const usFixedSize = (p: QuoteProduct) => p?.metadata?.us_fixed_size === true || p?.metadata?.us_fixed_size === "true"

/**
 * Custom product sold by quote, in every mode: no cart on the PDP ("Minta penawaran" / "Request a quote"), no Product
 * JSON-LD (an item without a price is invalid for Google), left out of the Merchant feed, "harga sesuai penawaran" in llms.
 * Exception: a US product marked us_fixed_size.
 */
export const soldByQuote = (p: QuoteProduct, countryCode: string) => isMadeToOrder(p) && !(countryCode === "us" && usFixedSize(p))

/** …and the quote goes through the form + DP flow (switch on, Indonesia); otherwise through WhatsApp */
export const quoteForm = (p: QuoteProduct, countryCode: string) => CUSTOM_DP_ENABLED && countryCode !== "us" && soldByQuote(p, countryCode)

/** WhatsApp opening line for a product quote: product name + link */
export function productWhatsappUrl(countryCode: string, title: string, url: string) {
  const text =
    countryCode === "us"
      ? `Hello HAUS KAYU, I'd like a quote for ${title}: ${url}`
      : `Halo HAUS KAYU, saya mau minta penawaran untuk ${title}: ${url}`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}
