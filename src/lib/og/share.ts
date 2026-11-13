import { getDictionary } from "@lib/i18n/dictionaries"
import { getMarket } from "@lib/util/market"
import { imageHash, productImageName, type ImageRef } from "@lib/util/image-name"
import { imageRef, KIND_SEGMENT } from "@lib/util/image-url"
import { STORE_NAME } from "@lib/util/site"

/**
 * Share images (og:image, twitter:image) for link previews: WhatsApp, Facebook, X, iMessage. Rendered by
 * app/og/[...path]/route.tsx; the paths end in .png/.jpg so the market proxy passes them through untouched.
 *
 * Every image is 1200×630 with its important part in the centred 630×630 square: WhatsApp shows the wide image in
 * large previews and a centre-cropped square in small ones, so neither cuts the wordmark or the product.
 *   brand   /og/{id|us}/brand.png            white, wordmark, market tagline (home, info pages, fallback)
 *   category /og/{id|us}/c/{handle}.png      white, wordmark, category name + its tile colour
 *   photo   /og/{id|us}/produk/{name}-{hash}.jpg   first product photo (1:1, never cropped) on white; JPEG, small
 *           /og/{id|us}/blog/{slug}-{hash}.jpg     an article's 1:1 cover, same layout
 *   wide    /og/{id|us}/blog/{slug}-lebar-{hash}.jpg  an article's wide cover, filling the image (lib/seo/blog.ts)
 * Names + hash as in the /img URLs (lib/util/image-name.ts). Old /og/{id|us}/p|w/{file}.jpg answer 301.
 * Bump OG_VERSION after a design change: previews are cached per URL by the apps (WhatsApp for weeks).
 */
export const OG_VERSION = "1"
export const OG_SIZE = { width: 1200, height: 630 } as const

/**
 * openGraph fields every page needs. A page's own `openGraph` replaces the layout's whole object (shallow merge), so
 * pages that set openGraph spread this in.
 */
export const ogBase = (countryCode: string) => ({
  siteName: STORE_NAME,
  locale: getMarket(countryCode).locale.replace("-", "_"),
})

export type ShareImage = { url: string; width: number; height: number; alt: string; type: string }

const img = (url: string, alt: string, type: string): ShareImage => ({ url: `${url}?v=${OG_VERSION}`, ...OG_SIZE, alt, type })

export const brandAlt = (countryCode: string) => `${STORE_NAME}: ${getDictionary(countryCode).footer.tagline}`

export const brandShareImage = (origin: string, countryCode: string) =>
  img(`${origin}/og/${countryCode}/brand.png`, brandAlt(countryCode), "image/png")

export const categoryShareImage = (origin: string, countryCode: string, handle: string[], name: string) =>
  img(`${origin}/og/${countryCode}/c/${handle.map(encodeURIComponent).join("/")}.png`, `${name} · ${STORE_NAME}`, "image/png")

/** /og/{market}/{kind}/{name}-{hash}.jpg for one of our photos */
export const photoShareImage = (origin: string, countryCode: string, ref: ImageRef, alt: string) =>
  img(`${origin}/og/${countryCode}/${KIND_SEGMENT[ref.kind]}/${ref.name}-${imageHash(ref.file)}.jpg`, alt, "image/jpeg")

/** First product photo when it is one of our backend's files; otherwise the brand image. */
export const productShareImage = (
  origin: string,
  countryCode: string,
  product: { handle?: string | null; title: string; thumbnail?: string | null; images?: { url: string; rank?: number | null }[] | null }
) => {
  const first = [...(product.images ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))[0]?.url ?? product.thumbnail
  const ref = imageRef("produk", productImageName(product, first), first)
  return ref ? photoShareImage(origin, countryCode, ref, `${product.title} · ${STORE_NAME}`) : brandShareImage(origin, countryCode)
}
