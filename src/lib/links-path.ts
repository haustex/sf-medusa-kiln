import config from "@theme"

/**
 * theme.config.ts `linkInBio`: the page handle served at the bare path and the public URL segment of the
 * link-in-bio pages. The pages are built under /links (src/app/[countryCode]/(links)/links); with another `path`
 * the proxy rewrites the public address onto that route and sends the old /links addresses to the new ones (308).
 * Shared by the proxy (edge), the data layer and the config helpers, so it imports nothing but the config.
 */
const cfg = (config as { linkInBio?: { handle?: string; path?: string } }).linkInBio ?? {}

/** The handle served at `LINKS_PATH` itself; every other page at `LINKS_PATH/{handle}` */
export const MAIN_HANDLE = cfg.handle?.toLowerCase() || "links"
/** The route segment the pages are built under */
export const LINKS_ROUTE = "/links"
const segment = (cfg.path ?? "links").toLowerCase().replace(/^\/+|\/+$/g, "")
/** Public path of the pages, market-less ("/links" unless `linkInBio.path` says otherwise) */
export const LINKS_PATH = /^[a-z0-9][a-z0-9-]*$/.test(segment) ? `/${segment}` : LINKS_ROUTE

/** Public, market-less path of a page: `LINKS_PATH` for the main handle, `LINKS_PATH/{handle}` for the others */
export const linksPath = (handle: string) => (handle === MAIN_HANDLE ? LINKS_PATH : `${LINKS_PATH}/${handle}`)
/** The app route that renders it (what revalidatePath needs) */
export const linksRoutePath = (handle: string) => (handle === MAIN_HANDLE ? LINKS_ROUTE : `${LINKS_ROUTE}/${handle}`)

const under = (path: string, base: string): string | null => (path === base ? "" : path.startsWith(`${base}/`) ? path.slice(base.length) : null)

/** Where a request for the public path is served when `linkInBio.path` is not "links" (null = not a links page) */
export function linksRewrite(marketless: string): string | null {
  if (LINKS_PATH === LINKS_ROUTE) return null
  const rest = under(marketless, LINKS_PATH)
  return rest === null ? null : `${LINKS_ROUTE}${rest}`
}

/** The public address of a request for the internal /links path when `linkInBio.path` is another segment (308) */
export function linksRedirect(marketless: string): string | null {
  if (LINKS_PATH === LINKS_ROUTE) return null
  const rest = under(marketless, LINKS_ROUTE)
  if (rest === null) return null
  const handle = rest.slice(1).split("/")[0] ?? ""
  return handle && handle !== MAIN_HANDLE ? `${LINKS_PATH}${rest}` : LINKS_PATH
}
