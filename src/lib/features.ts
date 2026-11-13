import "server-only"

import config from "@theme"

/**
 * Optional integrations (docs/rencana.md §5): reviews + wishlist (medusa-reviews-wishlist), blog (medusa-blog-seo),
 * Meilisearch (the `/store/meilisearch/products` route) and tracking (medusa-fulfillment-zone-rate). Each one is probed once per server process: a 404
 * from the backend means the plugin is not installed and the feature switches off cleanly (no links, no sections,
 * the routes answer 404). Anything else, including a backend that is down for a moment, keeps it on — the data
 * functions already degrade on their own — and a failed probe is retried on the next call.
 *
 * Override per feature: `KILN_FEATURE_REVIEWS=off` (or `on`) in the environment beats theme.config.ts
 * `features`, which is "auto" by default.
 */
export type Feature = keyof typeof config.features

const PROBES: Record<Feature, string> = {
  reviews: "/store/reviews/ratings?product_id=prod_kiln_probe",
  wishlist: "/store/wishlist",
  blog: "/store/blog-seo/settings",
  search: "/store/meilisearch/products?query=kiln&limit=1",
  tracking: "/store/zone-rate/services?currency=usd",
}

const BACKEND = (process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")

const cache = new Map<Feature, Promise<boolean>>()

function setting(name: Feature): "auto" | "on" | "off" {
  const env = process.env[`KILN_FEATURE_${name.toUpperCase()}`]?.toLowerCase()
  if (env === "on" || env === "off") return env
  return config.features[name]
}

async function probe(name: Feature): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND}${PROBES[name]}`, {
      headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    return res.status !== 404
  } catch {
    cache.delete(name) // not an answer: ask again next time
    return true
  }
}

/** Whether `name` is available; cached per process after the first probe */
export function feature(name: Feature): Promise<boolean> {
  const mode = setting(name)
  if (mode !== "auto") return Promise.resolve(mode === "on")
  let p = cache.get(name)
  if (!p) {
    p = probe(name)
    cache.set(name, p)
  }
  return p
}

export async function features(): Promise<Record<Feature, boolean>> {
  const names = Object.keys(config.features) as Feature[]
  const values = await Promise.all(names.map((n) => feature(n)))
  return Object.fromEntries(names.map((n, i) => [n, values[i]])) as Record<Feature, boolean>
}

/** Config links that belong to a feature that is off (the blog's "Journal" in the nav and footer) */
export const linkEnabled = (href: string, f: Record<Feature, boolean>) => (href.startsWith("/blog") ? f.blog : href.startsWith("/wishlist") ? f.wishlist : href === "/track" || href.startsWith("/track/") ? f.tracking : true)
