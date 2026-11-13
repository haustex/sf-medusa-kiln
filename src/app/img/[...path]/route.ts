import sharp, { type Sharp } from "sharp"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import config from "@theme"

import { type ImageEntry, locateFile, resolveImage, sourceUrl } from "@lib/data/image-lookup"
import { IMAGE_FORMATS, IMAGE_WIDTHS, imageUrl, parseImagePath, type ImageFormat } from "@lib/util/image-url"

/**
 * GET /img/{products|blog}/{name}-{width}-{hash}.{avif|webp|jpg} (lib/util/image-url.ts): a photo from the backend's
 * files, resized to `width` (never enlarged), EXIF rotation applied, metadata stripped, Content-Type matching the
 * extension. Immutable: the hash changes with the file.
 *   renamed product/article (old slug in the URL)  -> 301 to the current name
 *   old URL /img/{avif|webp|jpeg}/{width}/{file}   -> 301 to the clean URL (404 when no page uses the file any more)
 * Only files the index knows as product/article photos (lib/data/image-lookup.ts); no remote URLs (not an open proxy).
 * Off with theme.config.ts `images.route: false` (everything 404s; nothing links here then).
 */
export const dynamic = "force-dynamic"

sharp.concurrency(1)
sharp.cache({ memory: 64, items: 20 })

const MAX_INPUT = 25 * 1024 * 1024
const SAFE = /^[A-Za-z0-9._-]+$/

const ENCODE: Record<ImageFormat, (s: Sharp) => Sharp> = {
  avif: (s) => s.avif({ quality: 50, effort: 4 }),
  webp: (s) => s.webp({ quality: 72, effort: 4 }),
  jpeg: (s) => s.jpeg({ quality: 75, mozjpeg: true, progressive: true }),
}

/** Encoded images on the server's disk: an edge miss never re-encodes (AVIF takes seconds). */
const CACHE_DIR = process.env.IMG_CACHE_DIR || "/tmp/kiln-img"

function headers(format: ImageFormat, length: number) {
  return {
    "Content-Type": `image/${format}`,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Cloudflare-CDN-Cache-Control": "max-age=31536000, immutable",
    "Cache-Tag": "img",
    "Content-Length": String(length),
  }
}

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60", "Cache-Tag": "img" } })
const moved = (location: string) => new Response(null, { status: 301, headers: { Location: location, "Cache-Control": "public, max-age=86400", "Cache-Tag": "img" } })

async function encode(entry: ImageEntry, format: ImageFormat, w: number): Promise<Buffer | null> {
  const cached = path.join(CACHE_DIR, `${format}-${w}-${entry.file.replaceAll("/", "__")}`)
  const hit = await readFile(cached).catch(() => null)
  if (hit) return hit
  const upstream = await fetch(sourceUrl(entry), { cache: "no-store" }).catch(() => null)
  if (!upstream?.ok) return null
  if (Number(upstream.headers.get("content-length") ?? 0) > MAX_INPUT) return null
  const input = Buffer.from(await upstream.arrayBuffer())
  if (input.length > MAX_INPUT) return null
  try {
    const out = await ENCODE[format](sharp(input, { limitInputPixels: 50_000_000, failOn: "error" }).rotate().resize({ width: w, withoutEnlargement: true })).toBuffer()
    await mkdir(CACHE_DIR, { recursive: true })
      .then(() => writeFile(`${cached}.tmp`, out))
      .then(() => rename(`${cached}.tmp`, cached))
      .catch(() => {})
    return out
  } catch {
    return null
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!config.images.route) return notFound()
  const parts = (await params).path

  // clean URL
  if (parts.length === 2) {
    const p = parseImagePath(parts[0], parts[1])
    if (!p) return notFound()
    const found = await resolveImage(p.kind, p.name, p.hash)
    if (!found) return notFound()
    if (!found.exact) return moved(imageUrl(found.entry, p.format, p.width))
    const out = await encode(found.entry, p.format, p.width)
    return out ? new Response(new Uint8Array(out), { headers: headers(p.format, out.length) }) : notFound()
  }

  // old URL: /img/{format}/{width}/{file}
  if (parts.length === 3) {
    const [format, width, file] = parts
    const w = Number(width)
    if (!IMAGE_FORMATS.includes(format as ImageFormat) || !(IMAGE_WIDTHS as readonly number[]).includes(w)) return notFound()
    if (!SAFE.test(file) || file === "." || file === "..") return notFound()
    const entry = await locateFile(file)
    return entry ? moved(imageUrl(entry, format as ImageFormat, w)) : notFound()
  }

  return notFound()
}
