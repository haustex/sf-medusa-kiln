import { revalidatePath, revalidateTag } from "next/cache"
import { timingSafeEqual } from "node:crypto"
import { after, NextRequest, NextResponse } from "next/server"

/**
 * Called by the backend after catalog changes (src/subscribers/storefront-revalidate.ts):
 * 1. marks every ISR page stale, 2. renders the affected pages here so the
 * origin holds the new HTML, 3. purges those pages from Cloudflare by Cache-Tag
 * (next.config.js). Without step 2 Cloudflare could refetch the old HTML from
 * the ISR cache and keep it for an hour.
 *
 * POST { handles?: string[], all?: boolean }  header x-revalidate-secret
 *
 * Blog (backend src/subscribers/blog-revalidate.ts), when an article is published, changed or taken down:
 * POST { blog: { slugs?: string[], categories?: string[], all?: boolean } }
 * Same three steps for the article pages, the blog listings, the RSS feeds, the sitemap and llms.txt. The catalogue
 * pages are left alone (their HTML does not change with an article).
 */
export const dynamic = "force-dynamic"

const ORIGIN = `http://127.0.0.1:${process.env.PORT || 8000}`
const HANDLE = /^[a-z0-9][a-z0-9-]{0,200}$/

function authorized(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  const got = req.headers.get("x-revalidate-secret")
  if (!secret || !got) return false
  const a = new Uint8Array(Buffer.from(secret)), b = new Uint8Array(Buffer.from(got))
  return a.length === b.length && timingSafeEqual(a, b)
}

const PUBLIC_ORIGIN = (process.env.NEXT_PUBLIC_BASE_URL || "https://hauskayu.com").replace(/\/$/, "")

/** AVIF/WebP variants referenced by the pages, fetched through Cloudflare so the edge and the disk cache hold them. */
async function warmImages(paths: string[]) {
  const urls = new Set<string>()
  for (const p of paths) {
    const html = await fetch(ORIGIN + p, { cache: "no-store" }).then((r) => r.text()).catch(() => "")
    for (const u of html.match(/\/img\/(?:avif|webp)\/\d+\/[^\s",]+/g) ?? []) urls.add(u)
  }
  for (const u of Array.from(urls).slice(0, 300)) {
    await fetch(PUBLIC_ORIGIN + u, { headers: { "user-agent": "hauskayu-revalidate" } }).then((r) => r.arrayBuffer()).catch(() => null)
  }
}

async function warm(paths: string[]) {
  // Twice: the first visit after revalidatePath may still be answered from the
  // old entry while the page re-renders.
  for (let round = 0; round < 2; round++) {
    await Promise.all(
      paths.map((p) =>
        fetch(ORIGIN + p, { headers: { "user-agent": "hauskayu-revalidate" }, cache: "no-store" })
          .then((r) => r.arrayBuffer())
          .catch(() => null)
      )
    )
  }
}

async function purge(tags: string[]) {
  const token = process.env.CF_API_TOKEN, zone = process.env.CF_ZONE_ID
  if (!token || !zone) return "skipped"
  // CF_API_BASE: tests only (a local stand-in that records the purge); never set in production
  const api = (process.env.CF_API_BASE || "https://api.cloudflare.com").replace(/\/$/, "")
  const res = await fetch(`${api}/client/v4/zones/${zone}/purge_cache`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ tags }),
  })
  const json = (await res.json().catch(() => ({}))) as { success?: boolean }
  return json.success ? "purged" : `failed (${res.status})`
}

const slugs = (v: unknown, max: number) =>
  Array.isArray(v) ? Array.from(new Set(v.filter((h): h is string => typeof h === "string" && HANDLE.test(h)))).slice(0, max) : []

async function revalidateBlog(blog: { slugs?: unknown; categories?: unknown; all?: unknown }) {
  const posts = slugs(blog.slugs, 25)
  const categories = slugs(blog.categories, 25)
  // Blog fetches are tagged "blog" (lib/data/blog.ts), and so is every page, feed and sitemap rendered from them.
  // { expire: 0 }: the next render waits for fresh data instead of answering the old page once more.
  revalidateTag("blog", { expire: 0 })
  // and the article URLs by path: a "not found" answer cached just before the article went public must go as well
  for (const s of posts) for (const market of ["id", "us"]) revalidatePath(`/${market}/blog/${s}`)
  const both = (p: string) => [p, `/us${p}`]
  const paths = [...both("/blog"), ...categories.flatMap((c) => both(`/blog/kategori/${c}`)), ...posts.flatMap((s) => both(`/blog/${s}`))]
  await warm(paths)
  const tags =
    blog.all === true
      ? ["blog", "sitemap", "llms"]
      : ["blog-list", "blog-feed", "sitemap", "llms", ...posts.map((s) => `blog-post-${s}`)]
  const cloudflare = await purge(tags)
  after(() => warmImages(paths))
  return NextResponse.json({ revalidated: paths, tags, cloudflare })
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ message: "Not found" }, { status: 404 })
  const body = (await req.json().catch(() => ({}))) as { handles?: unknown; all?: unknown; blog?: unknown }
  if (body.blog && typeof body.blog === "object") return revalidateBlog(body.blog as Record<string, unknown>)
  const handles = Array.isArray(body.handles)
    ? Array.from(new Set(body.handles.filter((h): h is string => typeof h === "string" && HANDLE.test(h)))).slice(0, 25)
    : []
  const all = body.all === true || handles.length === 0

  revalidatePath("/", "layout")
  const paths = ["/", "/us", ...handles.flatMap((h) => [`/products/${h}`, `/us/products/${h}`])]
  await warm(paths)
  const tags = all ? ["html"] : ["home", ...handles.map((h) => `product-${h}`)]
  const cloudflare = await purge(tags)
  // after the response: encode + cache the product images (can take a minute for AVIF)
  after(() => warmImages(paths.filter((p) => p.includes("/products/"))))
  return NextResponse.json({ revalidated: paths, tags, cloudflare })
}
