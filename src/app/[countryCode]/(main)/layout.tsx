import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export default async function PageLayout(props: { children: React.ReactNode; params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer()
  const cart = await retrieveCart()
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()
    shippingOptions = shipping_options
  }

  return (
    <>
      <Nav countryCode={countryCode} />
      {customer && cart && <CartMismatchBanner customer={customer} cart={cart} />}
      {cart && <FreeShippingPriceNudge variant="popup" cart={cart} shippingOptions={shippingOptions} />}
      {/* At least one screen tall (minus the header): pages that stream in never push a visible footer down (CLS 0) */}
      <div className="min-h-[calc(100svh-7rem)]">{props.children}</div>
      <Footer countryCode={countryCode} />
    </>
  )
}
