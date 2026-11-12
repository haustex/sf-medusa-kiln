import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { StoreCartShippingOption } from "@medusajs/types"
import { getDictionary } from "@lib/i18n/dictionaries"
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
      {process.env.KILN_DEMO_NOTICE === "true" && (
        // Demo deployments (KILN_DEMO_NOTICE=true): a one-line notice above the header
        <p className="bg-foreground px-container-x py-2 text-center text-xs text-background" role="note" data-testid="demo-notice">
          {getDictionary(countryCode).demo.notice}
        </p>
      )}
      <Nav countryCode={countryCode} />
      {customer && cart && <CartMismatchBanner customer={customer} cart={cart} />}
      {cart && <FreeShippingPriceNudge variant="popup" cart={cart} shippingOptions={shippingOptions} />}
      {/* At least one screen tall (minus the header): pages that stream in never push a visible footer down (CLS 0) */}
      <div className="min-h-[calc(100svh-7rem)]">{props.children}</div>
      <Footer countryCode={countryCode} />
    </>
  )
}
