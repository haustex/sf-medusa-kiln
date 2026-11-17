import "server-only"
import { sdk } from "@lib/config"
import { reviewsStore, type EligibilityItem, type OwnReview, type Rating, type RequestInfo, type StoreReview } from "medusa-reviews-wishlist/sdk"
import { feature } from "@lib/features"
import { getAuthHeaders } from "./cookies"

export type { Rating, StoreReview, OwnReview, RequestInfo, EligibilityItem }

/** Reviews shown on the product page before "Show more" (also the ones in the JSON-LD) */
export const PDP_REVIEWS = 10

const store = reviewsStore(sdk)

/**
 * Public, approved data of medusa-reviews-wishlist, fetched fresh at render time (no fetch cache): the product
 * pages are static (ISR) and re-rendered by /api/revalidate when a review is approved, rejected, deleted or
 * replied to (backend src/subscribers/reviews-revalidate.ts).
 */
export async function getProductRating(productId: string): Promise<Rating | null> {
  if (!(await feature("reviews"))) return null
  try {
    const { ratings } = await store.ratings(productId)
    return ratings[0] ?? null
  } catch {
    return null
  }
}

/** Ratings of a list of products in one request; products without reviews have count 0 */
export async function getProductRatings(productIds: string[]): Promise<Map<string, Rating>> {
  const ids = Array.from(new Set(productIds.filter(Boolean)))
  if (!ids.length || !(await feature("reviews"))) return new Map()
  try {
    const { ratings } = await store.ratings(ids)
    return new Map(ratings.map((r) => [r.product_id, r]))
  } catch {
    return new Map()
  }
}

/** Card rating: only when the product has reviews */
export const cardRating = (r: Rating | undefined | null) => (r && r.count > 0 ? { average: r.average, count: r.count } : undefined)

export type ReviewOrder = "newest" | "oldest" | "highest" | "lowest"
export type ReviewListOptions = { limit?: number; offset?: number; order?: ReviewOrder; rating?: number; withImages?: boolean }

/**
 * A page of approved reviews. `rating` filters one star value (the count follows the filter); `withImages` keeps
 * only the reviews of the page that have photos (the plugin filters after paging, so the count stays the total).
 */
export async function listProductReviews(productId: string, opts: ReviewListOptions = {}) {
  const empty = { reviews: [] as StoreReview[], count: 0, limit: opts.limit ?? PDP_REVIEWS, offset: opts.offset ?? 0 }
  if (!(await feature("reviews"))) return empty
  try {
    return await store.list({ product_id: productId, limit: opts.limit ?? PDP_REVIEWS, offset: opts.offset ?? 0, order: opts.order ?? "newest", ...(opts.rating ? { rating: opts.rating } : {}), ...(opts.withImages ? { with_images: true } : {}) })
  } catch {
    return empty
  }
}

export type ReviewPhoto = { id: string; url: string; reviewId: string; name: string }

/** Photos of the newest reviews with pictures (first `max`), for the strip on the product page */
export async function listReviewPhotos(productId: string, max = 12): Promise<ReviewPhoto[]> {
  const { reviews } = await listProductReviews(productId, { limit: 50, withImages: true })
  return reviews.flatMap((r) => r.images.map((img) => ({ id: img.id, url: img.url, reviewId: r.id, name: r.display_name }))).slice(0, max)
}

/** The order behind a magic link (never consumes it); null when invalid, used or expired */
export async function getReviewRequest(token: string): Promise<RequestInfo | null> {
  if (!(await feature("reviews"))) return null
  try {
    return await sdk.client.fetch<RequestInfo>(`/store/reviews/requests/${encodeURIComponent(token)}`, { method: "GET", cache: "no-store" })
  } catch {
    return null
  }
}

/** The logged-in customer's own reviews, every status (plugin route) */
export async function listMyReviews(): Promise<OwnReview[]> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return []
  if (!(await feature("reviews"))) return []
  try {
    const { reviews } = await sdk.client.fetch<{ reviews: OwnReview[] }>("/store/customers/me/reviews", { method: "GET", headers, cache: "no-store" })
    return reviews
  } catch {
    return []
  }
}

/** Which items of one of the customer's orders can be reviewed right now */
export async function reviewEligibility(orderId: string): Promise<EligibilityItem[]> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return []
  if (!(await feature("reviews"))) return []
  try {
    const { items } = await sdk.client.fetch<{ items: EligibilityItem[] }>("/store/reviews/eligibility", { method: "GET", query: { order_id: orderId }, headers, cache: "no-store" })
    return items
  } catch {
    return []
  }
}
