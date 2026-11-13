"use server"

import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag, getCartId, removeCartId } from "@lib/data/cookies"
import { marketPath } from "@lib/util/market"
import medusaError from "@lib/util/medusa-error"
import { getUploadToken } from "@modules/manual-transfer/core/api"

import { backendConfig } from "./backend"

/**
 * placeOrder for bank transfers (medusa-payment-manual-transfer): completes the cart and, while the cart id is still
 * known, trades it for the order's upload token, so a guest lands on the payment page with access to it. Logged-in
 * customers need no token. Redirects to /{market}/transfer/{orderId}.
 */
export async function placeManualTransferOrder(): Promise<HttpTypes.StoreCart | undefined> {
  const cartId = await getCartId()
  if (!cartId) throw new Error("No existing cart found when placing an order")
  const authHeaders = await getAuthHeaders()
  const result = await sdk.store.cart
    .complete(cartId, {}, { ...authHeaders })
    .then(async (res) => {
      revalidateTag(await getCacheTag("carts"), { expire: 0 })
      return res
    })
    .catch(medusaError)

  if (result?.type !== "order") return result.cart
  revalidateTag(await getCacheTag("orders"), { expire: 0 })

  // Without a token the page asks the buyer to open the link from the order e-mail
  const token = "authorization" in authHeaders ? null : await getUploadToken(await backendConfig(), cartId).catch(() => null)
  await removeCartId()
  const countryCode = result.order.shipping_address?.country_code?.toLowerCase()
  redirect(marketPath(countryCode, `/transfer/${result.order.id}${token ? `?token=${encodeURIComponent(token)}` : ""}`))
}
