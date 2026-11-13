const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/** Hosts that next/image may load from: the Medusa backend and, when set, the media origin (R2/S3 custom domain). */
const hostOf = (url) => {
  try {
    return url ? new URL(url).hostname : null
  } catch {
    return null
  }
}
const IMAGE_HOSTS = [...new Set([hostOf(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL), hostOf(process.env.MEDUSA_BACKEND_URL_INTERNAL), hostOf(process.env.NEXT_PUBLIC_MEDIA_URL), "localhost", "127.0.0.1"].filter(Boolean))]
/**
 * next/image refuses upstream images on loopback / private addresses (SSRF guard) unless told otherwise. A dev
 * backend on localhost or a LAN address is the normal case here, so allow it exactly then; a public backend host
 * keeps the guard.
 */
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\]$|0\.0\.0\.0$)/
const IMAGES_ON_PRIVATE_HOST = [process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL, process.env.MEDUSA_BACKEND_URL_INTERNAL, process.env.NEXT_PUBLIC_MEDIA_URL].some((u) => PRIVATE_HOST.test(hostOf(u) || ""))

/**
 * @type {import('next').NextConfig}
 */
/**
 * Static (ISR) pages: when the site sits behind Cloudflare, the edge keeps the HTML for an hour (the origin stays
 * at s-maxage=60 for browsers/other caches) and tags it, so a deploy or a product change purges exactly these
 * pages (src/app/api/revalidate). Harmless on any other CDN. Only routes that are force-static belong here.
 */
const WORKSPACE_ROOT = process.env.NEXT_WORKSPACE_ROOT ? require("path").resolve(__dirname, process.env.NEXT_WORKSPACE_ROOT) : __dirname

const EDGE_TTL = "max-age=3600, stale-while-revalidate=86400"
const NOT_MARKDOWN = [{ type: "header", key: "accept", value: ".*text/markdown.*" }]
function edgeCacheHeaders() {
  const rule = (source, tags, missing) => ({
    source,
    ...(missing ? { missing } : {}),
    headers: [
      { key: "Cloudflare-CDN-Cache-Control", value: EDGE_TTL },
      { key: "Cache-Tag", value: tags },
    ],
  })
  const info = "(shipping|returns|contact|privacy|terms)"
  return [
    // "" = the default market without prefix, "/:market" = any two-letter market prefix (theme.config.ts markets)
    ...["", "/:market([a-z]{2})"].flatMap((m) => [
      rule(m || "/", "html,home"),
      rule(`${m}/products/:handle([^/.]+)`, "html,pdp,product-:handle", NOT_MARKDOWN),
      rule(`${m}/:page${info}`, "html,info"),
    ]),
    // Blog (api/revalidate purges these tags when an article is published or changed)
    ...["", "/:market([a-z]{2})"].flatMap((m) => [
      rule(`${m}/blog`, "html,blog,blog-list"),
      rule(`${m}/blog/page/:n(\\d+)`, "html,blog,blog-list"),
      rule(`${m}/blog/kategori/:slug([^/.]+)`, "html,blog,blog-list,blog-cat-:slug"),
      rule(`${m}/blog/kategori/:slug([^/.]+)/page/:n(\\d+)`, "html,blog,blog-list,blog-cat-:slug"),
      rule(`${m}/blog/:slug([^/.]+)`, "html,blog,blog-post-:slug"),
    ]),
    // Not pages, but they list the articles: tagged so the same purge reaches them (no edge TTL of their own here)
    { source: "/sitemap.xml", headers: [{ key: "Cache-Tag", value: "sitemap" }] },
    { source: "/:file(llms.txt|llms-full.txt)", headers: [{ key: "Cache-Tag", value: "llms" }] },
  ]
}

/** Same value as theme.config.ts markets.default (next.config.js cannot import the TypeScript config). */
const DEFAULT_MARKET = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

const nextConfig = {
  agentRules: false,
  reactStrictMode: true,
  output: "standalone",
  // Kiln as one package of a monorepo (lockfile above it): NEXT_WORKSPACE_ROOT=../.. points file tracing and
  // Turbopack's root at the workspace, so hoisted dependencies resolve; unset, the theme folder is the root
  outputFileTracingRoot: WORKSPACE_ROOT,
  turbopack: { root: WORKSPACE_ROOT },
  experimental: {
    // Root layout lives under app/[countryCode]; see app/global-not-found.tsx
    globalNotFound: true,
    // Off: the client would learn "/us" = /[countryCode] and then predict that "/shipping", "/blog", … are the
    // home page of a market called "shipping" (those URLs only reach /id/… through the rewrite in proxy.ts),
    // prefetch a segment that does not exist and log a 404 in the console.
    optimisticRouting: false,
  },
  async headers() {
    // Pre-launch: noindex everything until SITE_LIVE=true (src/lib/util/site-live.ts).
    const preLaunch =
      process.env.SITE_LIVE === "true"
        ? []
        : [
            {
              source: "/:path*",
              headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
            },
          ]
    return [
      ...preLaunch,
      {
        source: "/:countryCode/products/:handle",
        headers: [{ key: "Vary", value: "Accept" }],
      },
      ...edgeCacheHeaders(),
      // Per-visitor pages of medusa-reviews-wishlist: the wishlist (cookie-bound) and the magic-link review pages
      // (the address holds the token): never cached at the edge or in the browser, never indexed
      ...["/wishlist", "/:market([a-z]{2})/wishlist", "/review/:path*", "/:market([a-z]{2})/review/:path*"].map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Cloudflare-CDN-Cache-Control", value: "no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      })),
      // Secret article previews (Admin "Pratinjau"): never cached, never indexed, and the address (it holds the
      // token) is not sent along when a link on the page is followed
      ...["/blog/pratinjau/:token", "/:market([a-z]{2})/blog/pratinjau/:token"].map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      })),
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        // The default market has no prefix (proxy.ts rewrites to /<default>/… only for pages)
        { source: "/blog/feed.xml", destination: `/${DEFAULT_MARKET}/blog/feed.xml` },
        {
          source: "/products/:handle([^/.]+).md",
          destination: `/${DEFAULT_MARKET}/products/:handle/markdown`,
        },
        {
          source: "/:countryCode/products/:handle([^/.]+).md",
          destination: "/:countryCode/products/:handle/markdown",
        },
        {
          source: "/:countryCode/products/:handle([^/.]+)",
          has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
          destination: "/:countryCode/products/:handle/markdown",
        },
      ],
    }
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // next/image: AVIF / WebP in responsive widths through /_next/image (sharp), 30-day cache, hosts from the env
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    ...(IMAGES_ON_PRIVATE_HOST ? { dangerouslyAllowLocalIP: true } : {}),
    remotePatterns: IMAGE_HOSTS.flatMap((hostname) => [
      { protocol: "https", hostname },
      { protocol: "http", hostname },
    ]),
  },
}

module.exports = nextConfig
