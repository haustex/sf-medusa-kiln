import "server-only"
import type { ImageKind } from "@lib/util/image-name"

/**
 * Backend lookup behind the clean image URLs (backend src/api/store/hk/images): which /static file a
 * {kind, name, hash} stands for, and the clean name of an old /static file name (301s).
 */
/** `src`: the file's URL as stored in the database (…/static/<file> or <media host>/<file>) */
export type ImageEntry = { kind: ImageKind; slug: string; name: string; file: string; src?: string }

const BACKEND = process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const MEDIA = (process.env.NEXT_PUBLIC_MEDIA_URL || "").replace(/\/+$/, "")

/**
 * Where the server fetches the original photo for /img and /og: files still in the backend's /static over the
 * internal backend URL, files in R2 from the media host. Only those two origins, never an arbitrary `src`.
 */
export function sourceUrl(entry: Pick<ImageEntry, "file" | "src">): string {
  const file = encodeURIComponent(entry.file)
  if (MEDIA && entry.src && entry.src.startsWith(`${MEDIA}/`)) return `${MEDIA}/${file}`
  return `${BACKEND}/static/${file}`
}
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

async function lookup(params: Record<string, string>): Promise<ImageEntry[]> {
  const r = await fetch(`${BACKEND}/store/hk/images?${new URLSearchParams(params)}`, {
    headers: { "x-publishable-api-key": KEY },
    cache: "no-store",
  }).catch(() => null)
  if (!r?.ok) return []
  return ((await r.json().catch(() => null))?.images ?? []) as ImageEntry[]
}

/**
 * The photo a clean URL points at. `exact`: the name in the URL is the photo's name (or the bare slug, used where the
 * position is unknown: cart, orders). Otherwise the product/article was renamed: `entry` holds the current name.
 */
export async function resolveImage(kind: ImageKind, name: string, hash: string) {
  const found = await lookup({ kind, hash })
  const exact = found.find((e) => e.name === name || e.slug === name)
  if (exact) return { entry: exact, exact: true }
  return found.length === 1 ? { entry: found[0], exact: false } : null
}

/** Where an old /static file name is used now (product or article), for the 301 of its old URLs */
export async function locateFile(file: string): Promise<ImageEntry | null> {
  return (await lookup({ file }))[0] ?? null
}
