import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

import { sdk } from "@lib/config"
import { placeOrder } from "@lib/data/cart"
import { getAuthHeaders, setCartId } from "@lib/data/cookies"
import { marketPath } from "@lib/util/market"

/**
 * Where Stripe sends the shopper back after a redirect-based payment method (iDEAL, Bancontact, 3-D Secure in
 * a new window). The PaymentIntent in the URL must be the cart's own pending session; succeeded → the cart is
 * completed and the shopper lands on the order confirmation, failed/cancelled → back to the payment step.
 */
export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl
  const cartId = searchParams.get("cart_id")
  const countryCode = searchParams.get("country_code")
  const paymentIntent = searchParams.get("payment_intent")
  const clientSecret = searchParams.get("payment_intent_client_secret")
  const redirectStatus = searchParams.get("redirect_status")
  const to = (path: string) => NextResponse.redirect(`${origin}${marketPath(countryCode, path)}`)

  if (!cartId || !paymentIntent || !clientSecret) return to("/cart")

  const cart = await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${cartId}`, { method: "GET", query: { fields: "id,payment_collection.payment_sessions.data" }, headers: { ...(await getAuthHeaders()) }, cache: "no-store" })
    .then(({ cart }) => cart)
    .catch(() => null)
  const session = cart?.payment_collection?.payment_sessions?.find((s) => s.data?.id === paymentIntent)
  if (!session || session.data?.client_secret !== clientSecret) return to("/cart")

  await setCartId(cartId)
  if (redirectStatus === "failed") return to("/checkout?step=payment&error=payment_failed")

  try {
    await placeOrder(cartId)
  } catch (error) {
    // placeOrder redirects on success by throwing Next's redirect
    if (error && typeof error === "object" && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error
    console.error("[payment-return] place order", error)
  }
  return to("/checkout?step=payment&error=payment_failed")
}
