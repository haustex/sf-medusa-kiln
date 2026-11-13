import config from "@theme"

import { imageHash, type ImageKind, type ImageRef } from "./image-name"

/**
 * Responsive images from the backend's /static (File Module "local"), resized + encoded with sharp (src/app/img/…):
 *   /img/{products|blog}/{name}-{width}-{hash}.{avif|webp|jpg}   (segments: theme.config.ts images.segments)
 *   e.g. /img/products/oak-board-1-800-a3f9c2.avif, /img/blog/caring-for-oak-1280-0b71e4.jpg
 * Name from the product handle / article slug + photo position (lib/util/image-name.ts), hash = 6 hex of the
 * /static file name (a replaced photo gets a new URL: immutable caching stays right). The extension matches the
 * Content-Type, and the format is part of the URL, so Cloudflare (which ignores Vary) caches each format separately;
 * <picture> lets the browser pick. Old URLs (/img/{format}/{width}/{file}) answer 301 to these.
 */
export const IMAGE_WIDTHS = [320, 480, 640, 828, 1080, 1280, 1600] as const
export type ImageFormat = "avif" | "webp" | "jpeg"
export const IMAGE_FORMATS: ImageFormat[] = ["avif", "webp", "jpeg"]
export const FORMAT_EXT: Record<ImageFormat, string> = { avif: "avif", webp: "webp", jpeg: "jpg" }
export type { ImageKind, ImageRef }

const BACKEND = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(/\/$/, "")
/** Cloudflare R2 custom domain the File Module serves public files from (medusa-storage-r2); "" = not configured */
const MEDIA = (process.env.NEXT_PUBLIC_MEDIA_URL || "").replace(/\/+$/, "")

/**
 * Path of one of our own images inside the File Module's storage, else null (shown as is): `<backend>/static/<path>`
 * (File Module "local") or `<media host>/<path>` (a bucket with a public domain). The path may have folders
 * (`demo/plate.jpg`, an upload prefix); the hash in the clean URL is computed from this whole path.
 */
export function staticFile(src: string | null | undefined): string | null {
  if (!src) return null
  let m: RegExpMatchArray | null = null
  if (MEDIA && src.startsWith(`${MEDIA}/`)) m = src.slice(MEDIA.length + 1).match(/^([^?#]+)$/)
  else {
    m = src.match(/^(?:https?:\/\/[^/]+)?\/static\/([^?#]+)$/)
    if (m && /^https?:\/\//.test(src) && BACKEND && !src.startsWith(`${BACKEND}/static/`) && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(src)) return null
  }
  if (!m) return null
  const file = safeDecode(m[1])
  if (!file || file.split("/").some((seg) => !seg || seg === "." || seg === "..")) return null
  return file
}

function safeDecode(s: string): string | null {
  try {
    return decodeURIComponent(s)
  } catch {
    return null
  }
}

/** theme.config.ts `images.route`: false = every image is shown as is (the backend's URL, next/image) */
const ROUTE = config.images.route

/** URL segment of each kind (theme.config.ts `images.segments`): /img/{segment}/… and /og/{market}/{segment}/… */
export const KIND_SEGMENT: Record<ImageKind, string> = { produk: config.images.segments.product, blog: config.images.segments.blog }
export const kindFromSegment = (segment: string): ImageKind | null => (Object.keys(KIND_SEGMENT) as ImageKind[]).find((k) => KIND_SEGMENT[k] === segment) ?? null

/** A clean-URL reference for one of our backend's images, else null (external images are shown as is) */
export function imageRef(kind: ImageKind, name: string, src: string | null | undefined): ImageRef | null {
  if (!ROUTE) return null
  const file = staticFile(src)
  return file ? { kind, name, file } : null
}

export const imageUrl = (ref: ImageRef, format: ImageFormat, width: number) =>
  `/img/${KIND_SEGMENT[ref.kind]}/${ref.name}-${width}-${imageHash(ref.file)}.${FORMAT_EXT[format]}`

export const imageSrcSet = (ref: ImageRef, format: ImageFormat, max = 1600) =>
  IMAGE_WIDTHS.filter((w) => w <= max)
    .map((w) => `${imageUrl(ref, format, w)} ${w}w`)
    .join(", ")

/** Absolute JPEG URL for structured data, sitemaps and feeds */
export const imageJpeg = (origin: string, ref: ImageRef, width = 1280) => `${origin}${imageUrl(ref, "jpeg", width)}`

/** /img/{kind}/{name}-{width}-{hash}.{ext} → its parts, or null */
export function parseImagePath(segment: string, last: string) {
  const kind = kindFromSegment(segment)
  if (!kind) return null
  const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)-(\d{3,4})-([0-9a-f]{6})\.(avif|webp|jpg)$/.exec(last)
  if (!m) return null
  const width = Number(m[2])
  if (!(IMAGE_WIDTHS as readonly number[]).includes(width)) return null
  const format = (Object.keys(FORMAT_EXT) as ImageFormat[]).find((f) => FORMAT_EXT[f] === m[4])!
  return { kind, name: m[1], width, hash: m[3], format }
}
