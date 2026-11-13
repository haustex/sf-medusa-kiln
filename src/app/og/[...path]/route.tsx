import { ImageResponse } from "next/og"
import sharp from "sharp"

import { getCategoryByHandle } from "@lib/data/categories"
import { locateFile, resolveImage, sourceUrl, type ImageEntry } from "@lib/data/image-lookup"
import { getDictionary } from "@lib/i18n/dictionaries"
import { INTER_400, INTER_600 } from "@lib/og/inter-fonts"
import { OG_SIZE } from "@lib/og/share"
import { imageHash } from "@lib/util/image-name"
import { KIND_SEGMENT, kindFromSegment } from "@lib/util/image-url"
import { isMarketCode } from "@lib/util/market"
import config from "@theme"

/**
 * Share images, see lib/og/share.ts for the layout rules.
 *   GET /og/{id|us}/brand.png · /og/{id|us}/c/{handle…}.png · /og/{id|us}/{products|blog}/{name}-{hash}.jpg
 *   old /og/{id|us}/p/{file}.jpg and /og/{id|us}/w/{file}.jpg -> 301 to the clean URL
 * Only our own categories and photos our backend knows (no remote URLs, no text from the URL is drawn).
 */
export const dynamic = "force-dynamic"

const INK = "#0c0c0c"
const MUTED = "#6b6b6b"

const SAFE = /^[A-Za-z0-9._-]+$/
const MAX_INPUT = 25 * 1024 * 1024

const cacheHeaders = (type: string, length?: number) => ({
  "Content-Type": type,
  "Cache-Control": "public, max-age=86400",
  "Cloudflare-CDN-Cache-Control": "max-age=604800",
  "Cache-Tag": "og",
  ...(length ? { "Content-Length": String(length) } : {}),
})
const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } })

/** Brand line for the share images: ink mark + name in Inter 600 (theme.config.ts); no SVG asset needed */
const wordmark = (width: number) => (
  <div style={{ display: "flex", alignItems: "center", gap: Math.round(width / 26), color: INK, fontSize: Math.round(width / 9), fontWeight: 600, letterSpacing: "-0.02em" }}>
    <div style={{ width: Math.round(width / 10), height: Math.round(width / 10), borderRadius: Math.round(width / 50), background: INK }} />
    {config.brand.name}
  </div>
)

function card(children: React.ReactNode) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          fontFamily: "Inter",
          color: INK,
        }}
      >
        {children}
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: INTER_400, weight: 400, style: "normal" },
        { name: "Inter", data: INTER_600, weight: 600, style: "normal" },
      ],
      headers: cacheHeaders("image/png"),
    }
  )
}

/** Wordmark + tagline, both inside the centred 630px square */
function brand(countryCode: string) {
  const t = getDictionary(countryCode)
  return card(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 560 }}>
      {wordmark(520)}
      <div style={{ marginTop: 40, fontSize: 30, lineHeight: 1.35, color: MUTED, textAlign: "center", display: "flex" }}>
        {t.footer.tagline}
      </div>
    </div>
  )
}

/** Small wordmark, category name, a short ink bar */
function category(name: string, color: string) {
  return card(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 560 }}>
      {wordmark(260)}
      <div
        style={{
          marginTop: 48,
          fontSize: 72,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {name}
      </div>
      <div style={{ marginTop: 36, width: 120, height: 12, borderRadius: 6, background: color, display: "flex" }} />
    </div>
  )
}

/** First product photo, 630×630 in the centre (1:1 photos are never cropped), white sides; small wordmark on the left */
async function product(entry: ImageEntry) {
  const upstream = await fetch(sourceUrl(entry), { cache: "no-store" }).catch(() => null)
  if (!upstream?.ok || Number(upstream.headers.get("content-length") ?? 0) > MAX_INPUT) return null
  const input = Buffer.from(await upstream.arrayBuffer())
  if (input.length > MAX_INPUT) return null
  try {
    const photo = await sharp(input, { limitInputPixels: 50_000_000, failOn: "error" })
      .rotate()
      .resize(630, 630, { fit: "cover", position: "centre" })
      .flatten({ background: "#ffffff" })
      .toBuffer()
    // small brand line: ink square + name (system sans in librsvg; the text is only a share-image caption)
    const markH = 28
    const name = config.brand.name.replace(/[<>&"]/g, "")
    const mark = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="${markH}"><rect width="${markH}" height="${markH}" rx="5" fill="${INK}"/><text x="${markH + 12}" y="${markH - 7}" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="600" font-size="22" letter-spacing="-0.4" fill="${INK}">${name}</text></svg>`
    )
    return await sharp({ create: { ...OG_SIZE, channels: 3, background: "#ffffff" } })
      .composite([
        { input: photo, left: (OG_SIZE.width - 630) / 2, top: 0 },
        { input: mark, left: 48, top: OG_SIZE.height - markH - 48 },
      ])
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toBuffer()
  } catch {
    return null
  }
}

/** Wide blog cover (uploaded at 1200×630 or larger): fills the image, cropped from the centre when the ratio differs */
async function wide(entry: ImageEntry) {
  const upstream = await fetch(sourceUrl(entry), { cache: "no-store" }).catch(() => null)
  if (!upstream?.ok || Number(upstream.headers.get("content-length") ?? 0) > MAX_INPUT) return null
  const input = Buffer.from(await upstream.arrayBuffer())
  if (input.length > MAX_INPUT) return null
  try {
    return await sharp(input, { limitInputPixels: 50_000_000, failOn: "error" })
      .rotate()
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover", position: "centre" })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toBuffer()
  } catch {
    return null
  }
}

const ogPath = (cc: string, e: ImageEntry) => `/og/${cc}/${KIND_SEGMENT[e.kind]}/${e.name}-${imageHash(e.file)}.jpg`
const moved = (req: Request, path: string) =>
  new Response(null, { status: 301, headers: { Location: path + new URL(req.url).search, "Cache-Control": "public, max-age=86400", "Cache-Tag": "og" } })

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const [cc, kind, ...rest] = (await params).path
  if (!cc || !isMarketCode(cc)) return notFound()

  if (kind === "brand.png" && rest.length === 0) return brand(cc)

  if (kind === "c" && rest.length > 0 && rest[rest.length - 1].endsWith(".png")) {
    const handle = [...rest.slice(0, -1), rest[rest.length - 1].slice(0, -4)].map((h) => decodeURIComponent(h))
    if (handle.some((h) => !SAFE.test(h))) return notFound()
    const c = await getCategoryByHandle(handle, cc).catch(() => null)
    if (!c) return notFound()
    return category(c.name, INK)
  }

  // photo: the wide layout for an article's wide cover ({slug}-lebar), the square one for everything else
  const photoKind = kind ? kindFromSegment(kind) : null
  if (photoKind && rest.length === 1) {
    const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([0-9a-f]{6})\.jpg$/.exec(rest[0])
    if (!m) return notFound()
    const found = await resolveImage(photoKind, m[1], m[2])
    if (!found) return brand(cc)
    if (!found.exact) return moved(req, ogPath(cc, found.entry))
    const e = found.entry
    const out = e.kind === "blog" && e.name === `${e.slug}-lebar` ? await wide(e) : await product(e)
    if (!out) return brand(cc)
    return new Response(new Uint8Array(out), { headers: cacheHeaders("image/jpeg", out.length) })
  }

  // old URLs with the /static file name
  if ((kind === "p" || kind === "w") && rest.length === 1 && rest[0].endsWith(".jpg")) {
    const file = decodeURIComponent(rest[0].slice(0, -4))
    if (!SAFE.test(file) || file === "." || file === "..") return notFound()
    const entry = await locateFile(file)
    return entry ? moved(req, ogPath(cc, entry)) : brand(cc)
  }

  return notFound()
}
