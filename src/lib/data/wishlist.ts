import "server-only"
import { cookies as nextCookies } from "next/headers"
import { sdk } from "@lib/config"
import { wishlistStore, type Wishlist } from "medusa-reviews-wishlist/sdk"
import { getAuthHeaders } from "./cookies"

/**
 * Wishlist of medusa-reviews-wishlist for the visitor: the customer's (JWT cookie) or the guest one, whose token the
 * plugin hands out on the first add and the storefront keeps in an httpOnly cookie (never in page HTML, never in
 * localStorage). Read only through the no-store routes under /api/wishlist and the dynamic /wishlist page.
 * A guest who logs in keeps the list: the first wishlist read after login merges the guest list into the account
 * (the plugin's /store/wishlist/merge) and drops the cookie.
 */
export const WISHLIST_COOKIE = "_kiln_wishlist"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const store = wishlistStore(sdk)

export const getGuestToken = async () => (await nextCookies()).get(WISHLIST_COOKIE)?.value || null

export const setGuestToken = async (token: string) => {
  const jar = await nextCookies()
  jar.set(WISHLIST_COOKIE, token, { maxAge: COOKIE_MAX_AGE, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" })
}

export const clearGuestToken = async () => {
  const jar = await nextCookies()
  if (jar.get(WISHLIST_COOKIE)) jar.set(WISHLIST_COOKIE, "", { maxAge: -1, path: "/" })
}

/** `{ customer: true }` with the JWT header, else the guest token header (or nothing) */
async function auth(): Promise<{ customer: boolean; headers: Record<string, string>; token: string | null }> {
  const headers = await getAuthHeaders()
  if ("authorization" in headers) return { customer: true, headers: { ...headers }, token: null }
  const token = await getGuestToken()
  return { customer: false, headers: token ? { "x-wishlist-token": token } : {}, token }
}

export type WishlistView = { wishlist: Wishlist | null; customer: boolean; productIds: string[] }

const view = (wishlist: Wishlist | null, customer: boolean): WishlistView => ({
  wishlist,
  customer,
  productIds: Array.from(new Set((wishlist?.items ?? []).map((i) => i.product_id))),
})

/** The visitor's wishlist; a logged-in customer with a leftover guest token gets the two merged first. */
export async function getWishlist(opts: { merge?: boolean } = {}): Promise<WishlistView> {
  const a = await auth()
  try {
    if (a.customer && opts.merge !== false) {
      const guest = await getGuestToken()
      if (guest) {
        const merged = await sdk.client.fetch<{ wishlist: Wishlist }>("/store/wishlist/merge", { method: "POST", body: { token: guest }, headers: a.headers, cache: "no-store" }).catch(() => null)
        await clearGuestToken()
        if (merged?.wishlist) return view(merged.wishlist, true)
      }
    }
    const { wishlist } = await sdk.client.fetch<{ wishlist: Wishlist | null }>("/store/wishlist", { method: "GET", headers: a.headers, cache: "no-store" })
    return view(wishlist, a.customer)
  } catch {
    return view(null, a.customer)
  }
}

/** Adds a product; a guest's first add returns the token, kept in the cookie */
export async function addToWishlist(productId: string, variantId?: string | null): Promise<WishlistView> {
  const a = await auth()
  const res = await sdk.client.fetch<{ wishlist: Wishlist; token?: string }>("/store/wishlist/items", {
    method: "POST",
    body: { product_id: productId, variant_id: variantId ?? null },
    headers: a.headers,
    cache: "no-store",
  })
  if (!a.customer && res.token) await setGuestToken(res.token)
  return view(res.wishlist, a.customer)
}

/** Removes every item of that product (one per variant at most) */
export async function removeFromWishlist(productId: string): Promise<WishlistView> {
  const a = await auth()
  const current = await getWishlist({ merge: false })
  const items = (current.wishlist?.items ?? []).filter((i) => i.product_id === productId)
  let last: Wishlist | null = current.wishlist
  for (const item of items) {
    const res = await sdk.client.fetch<{ wishlist: Wishlist | null }>(`/store/wishlist/items/${encodeURIComponent(item.id)}`, { method: "DELETE", headers: a.headers, cache: "no-store" })
    last = res.wishlist
  }
  return view(last, a.customer)
}

export { store as wishlistApi }
