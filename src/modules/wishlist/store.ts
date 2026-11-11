"use client"

import { useSyncExternalStore } from "react"

/**
 * Client-side wishlist state shared by every heart on the page (no provider): the product ids of the visitor's
 * wishlist, loaded once from /api/wishlist (private, no-store) the first time a heart mounts, toggled through
 * POST /api/wishlist. Pages without a heart make no request. Server components never see this state, so static
 * HTML is identical for every visitor (an unfilled heart) and the edge can cache it.
 */
export const WISHLIST_UPDATED_EVENT = "kiln:wishlist-updated"

type State = { ids: Set<string>; loaded: boolean; count: number }
let state: State = { ids: new Set(), loaded: false, count: 0 }
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()
const emit = () => {
  listeners.forEach((l) => l())
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT, { detail: { count: state.count } }))
}
const set = (ids: string[]) => {
  state = { ids: new Set(ids), loaded: true, count: ids.length }
  emit()
}

export function loadWishlist(force = false): Promise<void> {
  if (state.loaded && !force) return Promise.resolve()
  if (loading) return loading
  loading = fetch("/api/wishlist", { cache: "no-store", credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { ids?: string[] } | null) => set(data?.ids ?? []))
    .catch(() => {
      state = { ...state, loaded: true }
      emit()
    })
    .finally(() => (loading = null))
  return loading
}

export async function toggleWishlist(productId: string, variantId?: string | null): Promise<boolean> {
  const wanted = !state.ids.has(productId)
  // optimistic
  const before = state
  const next = new Set(state.ids)
  if (wanted) next.add(productId)
  else next.delete(productId)
  set(Array.from(next))
  try {
    const r = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ product_id: productId, variant_id: variantId ?? null, action: wanted ? "add" : "remove" }),
    })
    if (!r.ok) throw new Error(String(r.status))
    const data = (await r.json()) as { ids?: string[] }
    set(data.ids ?? [])
    return wanted
  } catch {
    state = before
    emit()
    throw new Error("wishlist")
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const snapshot = () => state
const serverSnapshot = () => EMPTY
const EMPTY: State = { ids: new Set(), loaded: false, count: 0 }

/** The shared state; mounting a consumer triggers the first load */
export function useWishlistState(): State {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot)
}
