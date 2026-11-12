import { ChevronLeft, Lock } from "lucide-react"

import { getDictionary } from "@lib/i18n/dictionaries"
import { tx } from "@lib/i18n/localized"
import { getMarket, marketPath } from "@lib/util/market"
import config from "@theme"
import Logo from "@modules/brand/logo"
import Link from "@modules/common/components/app-link"
import { ICON } from "@modules/ds/icons"

/**
 * Checkout chrome: back to the cart, the logo, "secure checkout"; no navigation, no search, no footer columns, so
 * the shopper stays in the flow. A small line of policy links at the bottom.
 */
export default async function CheckoutLayout(props: { children: React.ReactNode; params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const dict = getDictionary(countryCode)
  const t = dict.checkout
  const market = getMarket(countryCode)
  const href = (p: string) => marketPath(countryCode, p)
  const policies = config.brand.footerColumns.flatMap((c) => c.links).filter((l) => /privacy|terms|returns|shipping/.test(l.href))

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="content-container grid h-16 grid-cols-[1fr_auto_1fr] items-center">
        <Link href={href("/cart")} className="-ml-2 inline-flex h-11 w-fit items-center gap-stack-xs rounded-full px-2 text-sm text-muted hover:text-foreground" data-testid="back-to-cart-link">
          <ChevronLeft {...ICON} />
          <span className="hidden sm:inline">{t.backToCart}</span>
          <span className="sm:hidden">{dict.cart.title}</span>
        </Link>
        <Link href={href("/")} aria-label={config.brand.name} className="flex h-11 items-center" data-testid="store-link">
          <Logo size="md" decorative />
        </Link>
        <span className="hidden items-center justify-end gap-stack-xs text-sm text-muted sm:inline-flex">
          <Lock {...ICON} size={16} />
          {t.secure}
        </span>
      </header>
      <main className="flex-1" data-testid="checkout-container">
        {props.children}
      </main>
      {policies.length > 0 && (
        <footer className="content-container flex flex-wrap gap-x-stack-lg gap-y-stack-xs py-stack-lg text-xs text-muted">
          {policies.map((l) => (
            <Link key={l.href} href={href(l.href)} prefetch={false} className="hover:text-foreground">
              {tx(l.label, market.dictionary)}
            </Link>
          ))}
        </footer>
      )}
    </div>
  )
}
