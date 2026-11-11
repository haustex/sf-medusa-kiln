"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"

export const retrieveOrder = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("orders")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: "GET",
      query: {
        fields:
          "*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product",
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
}

/**
 * `fresh`: skip the per-visitor fetch cache (tag `orders-<cache id>`). Akun → Ulasan uses it: a claimed guest order
 * (transfer accepted from the e-mail link, maybe in another browser) must show up without waiting for a revalidation
 * that only the accepting browser triggers.
 */
export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, unknown>,
  opts: { fresh?: boolean } = {}
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = opts.fresh ? {} : {
    ...(await getCacheOptions("orders")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderListResponse>(`/store/orders`, {
      method: "GET",
      query: {
        limit,
        offset,
        order: "-created_at",
        fields: "*items,+items.metadata,*items.variant,*items.product",
        ...filters,
      },
      headers,
      next,
      cache: opts.fresh ? "no-store" : "force-cache",
    })
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))
}

export const createTransferRequest = async (
  state: {
    success: boolean
    error: string | null
    order: HttpTypes.StoreOrder | null
  },
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}> => {
  const id = formData.get("order_id") as string

  if (!id) {
    return { success: false, error: "Order ID is required", order: null }
  }

  const headers = await getAuthHeaders()

  return await sdk.store.order
    .requestTransfer(
      id,
      {},
      {
        fields: "id, email",
      },
      headers
    )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .acceptTransfer(id, { token }, {}, headers)
    .then(async ({ order }) => {
      // the order list of this browser is cached per visitor: the claimed order must appear in Akun → Pesanan
      const tag = await getCacheTag("orders")
      if (tag) revalidateTag(tag, { expire: 0 })
      return { success: true, error: null, order }
    })
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .declineTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

/** Claim a guest order: order number + the order's e-mail (backend: /store/hk/order-claims). */
type ClaimState = {
  success: boolean
  error: string | null
  order: { display_id: number; email: string } | null
  values?: { display_id: string; email: string }
}
export const claimGuestOrder = async (_state: ClaimState, formData: FormData): Promise<ClaimState> => {
  const display_id = String(formData.get("display_id") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const values = { display_id, email }
  if (!display_id || !email) return { success: false, error: "missing", order: null, values }
  const headers = await getAuthHeaders()
  return sdk.client
    .fetch<{ order: { display_id: number; email: string } }>("/store/hk/order-claims", {
      method: "POST",
      headers,
      body: { display_id, email },
    })
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err: Error) => ({ success: false, error: err.message, order: null, values }))
}
