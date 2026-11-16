/**
 * Hosts next/image may optimise (the same list next.config.js builds its remotePatterns from: the backend, the
 * media origin, loopback). An image from any other host is embedded as it is, never sent through /_next/image.
 */
export const IMAGE_HOSTS = new Set(
  [process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL, process.env.MEDUSA_BACKEND_URL_INTERNAL, process.env.NEXT_PUBLIC_MEDIA_URL]
    .map((u) => {
      try {
        return u ? new URL(u).hostname : ""
      } catch {
        return ""
      }
    })
    .concat(["localhost", "127.0.0.1"])
    .filter(Boolean)
)

/** The hostname of an absolute http(s) URL, "" for a relative path (served by this app: always optimisable) or garbage */
export const httpHost = (src: string): string | null => {
  if (src.startsWith("/") && !src.startsWith("//")) return ""
  try {
    const u = new URL(src)
    return u.protocol === "http:" || u.protocol === "https:" ? u.hostname : null
  } catch {
    return null
  }
}

/** next/image may optimise this source: a local path or an allowed host */
export const optimisable = (src: string): boolean => {
  const host = httpHost(src)
  return host === "" || (host !== null && IMAGE_HOSTS.has(host))
}
