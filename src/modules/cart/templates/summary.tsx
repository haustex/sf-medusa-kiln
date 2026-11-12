import { buttonVariants, cn } from "@heroui/styles"
import { HttpTypes } from "@medusajs/types"

import CartTotals from "@modules/common/components/cart-totals"
import Link from "@modules/common/components/app-link"

/** Where checkout resumes: address first, then delivery, then payment (same logic as the starter) */
export function checkoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) return "address"
  if (cart?.shipping_methods?.length === 0) return "delivery"
  return "payment"
}

/** Summary card: totals, checkout CTA, continue shopping. Promotion codes are entered at checkout. */
export default function Summary({ cart, title, checkoutLabel, continueLabel, checkoutHref, storeHref }: { cart: HttpTypes.StoreCart; title: string; checkoutLabel: string; continueLabel: string; checkoutHref: string; storeHref: string }) {
  return (
    <section aria-labelledby="summary-title" className="flex flex-col gap-stack-lg rounded-media bg-default p-stack-lg">
      <h2 id="summary-title" className="type-h3">
        {title}
      </h2>
      <CartTotals totals={cart} />
      <div className="flex flex-col gap-stack-sm">
        <Link href={checkoutHref} className={cn(buttonVariants({ variant: "primary", size: "lg", fullWidth: true }), "h-12")} data-testid="checkout-button">
          {checkoutLabel}
        </Link>
        <Link href={storeHref} className={cn(buttonVariants({ variant: "ghost", fullWidth: true }), "h-11")}>
          {continueLabel}
        </Link>
      </div>
    </section>
  )
}
