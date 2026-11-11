import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getDictionary } from "@lib/i18n/dictionaries"
import { getMarket, marketPath } from "@lib/util/market"
import config from "@theme"
import Logo from "@modules/brand/logo"
import { socialLinks } from "@modules/brand/social"
import CartLink from "@modules/layout/components/cart-button/cart-link"
import CartButton from "@modules/layout/components/cart-button"
import CategoryMenu from "@modules/layout/components/category-menu"
import HeaderScroll from "@modules/layout/components/header-scroll"
import HeaderSearch from "@modules/layout/components/header-search"
import MarketSelect from "@modules/layout/components/market-select"
import { marketOptions } from "@modules/layout/components/market-select/options"
import MobileMenu from "@modules/layout/components/mobile-menu"
import WishlistLink from "@modules/layout/components/wishlist-link"
import Link from "@modules/common/components/app-link"

/**
 * Header: logo left, search centred on the page (middle column of a 1fr/640px/1fr grid), market switch + wishlist +
 * account + cart right; category row below from md. Server-rendered static HTML; the counts (cart, wishlist) and the
 * two menus are the only JS.
 *
 * Frost surface (white alpha + blur, hairline; text Ink only). Sticky from md at a negative top, so its extra top
 * padding (--header-tuck) scrolls away: it gets a little smaller without moving the page (CLS 0). A paint-only
 * shadow follows the scroll (.site-header in globals.css).
 *
 * Phones: fixed, with an in-flow spacer of the same constant height (108px; 116px from sm): a top row (menu button,
 * logo, search icon, wishlist, account, cart) and the search row, which slides up behind the top row while scrolling
 * down and comes back when scrolling up (HeaderScroll toggles data-collapsed; transform only, CLS 0). The categories
 * live in the phone menu drawer.
 */
export default async function Nav({ countryCode }: { countryCode: string }) {
  const t = getDictionary(countryCode)
  const market = getMarket(countryCode)
  const href = (p: string) => marketPath(countryCode, p)
  const [categories, markets] = await Promise.all([
    listCategories({ fields: "id,name,handle,parent_category_id,rank", limit: 20 }, countryCode).catch(() => []),
    marketOptions(market.locale),
  ])
  const topLevel = categories.filter((c) => !c.parent_category_id).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  const menuItems = [
    { href: href("/store"), label: t.nav.allProducts },
    ...topLevel.map((c) => ({ href: href(`/categories/${c.handle}`), label: c.name })),
    ...config.brand.navLinks.map((l) => ({ href: href(l.href), label: l.label })),
  ]

  const search = <HeaderSearch action={href("/search")} placeholder={t.nav.search} label={t.nav.searchLabel} formLabel={t.nav.searchRegion} />

  return (
    <>
    <div aria-hidden="true" className="h-[108px] sm:h-[116px] md:hidden" />
    <header
      id="site-header"
      className="site-header max-md:pointer-events-none max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-40 md:sticky md:inset-x-0 md:top-[calc(-1*var(--header-tuck))] md:z-40 md:border-b md:border-separator md:frost"
    >
      <div className="header-top relative z-10 max-md:pointer-events-auto max-md:border-b max-md:border-transparent max-md:frost">
      <div className="content-container grid h-14 grid-cols-[1fr_auto] items-center gap-stack-md sm:h-16 md:h-[calc(4.5rem+var(--header-tuck))] md:pt-[var(--header-tuck)] md:grid-cols-[1fr_minmax(0,640px)_1fr] md:gap-stack-lg">
        <div className="flex items-center gap-1">
          <MobileMenu
            items={menuItems}
            markets={markets}
            account={{ href: href("/account"), label: t.nav.account }}
            social={socialLinks()}
            labels={{ open: t.nav.openMenu, close: t.nav.closeMenu, menu: t.nav.menu, market: t.nav.market }}
          />
          <Link
            href={href("/")}
            aria-label={config.brand.name}
            className="-ml-1 flex h-11 w-fit shrink-0 items-center px-1"
            data-testid="nav-store-link"
          >
            <Logo size="sm" decorative />
          </Link>
        </div>

        <div className="hidden md:block">{search}</div>

        <nav aria-label={t.nav.account} className="-mr-2 flex items-center justify-self-end">
          {/* Phones: reveals the search row and focuses it (HeaderScroll); without JS the search page */}
          <Link
            href={href("/search")}
            aria-label={t.nav.searchLabel}
            data-search-toggle
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-default/60 md:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
              <circle cx="11" cy="11" r="6.75" stroke="currentColor" strokeWidth="1.5" />
              <path d="m20 20-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>
          <MarketSelect options={markets} label={t.nav.market} className="hidden md:block" />
          <WishlistLink href={href("/wishlist")} label={t.nav.wishlist} />
          <Link
            href={href("/account")}
            aria-label={t.nav.account}
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-default/60"
            data-testid="nav-account-link"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
              <circle cx="12" cy="8.5" r="3.75" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4.75 20c.9-3.6 3.8-5.5 7.25-5.5s6.35 1.9 7.25 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>
          <Suspense fallback={<CartLink initialCount={null} label={t.nav.cart} />}>
            <CartButton label={t.nav.cart} />
          </Suspense>
        </nav>
      </div>
      </div>

      <div data-header-secondary className="header-secondary max-md:pointer-events-auto max-md:border-b max-md:border-separator max-md:frost">
        <div className="content-container h-[3.25rem] pb-stack-sm md:hidden">{search}</div>
        <div className="hidden md:block">
          <CategoryMenu label={t.nav.menu} items={menuItems} />
        </div>
      </div>
    </header>
    <HeaderScroll id="site-header" />
    </>
  )
}
