import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getDictionary } from "@lib/i18n/dictionaries"
import { marketPath } from "@lib/util/market"
import config from "@theme"
import Logo from "@modules/brand/logo"
import CartLink from "@modules/layout/components/cart-button/cart-link"
import CartButton from "@modules/layout/components/cart-button"
import CategoryMenu from "@modules/layout/components/category-menu"
import HeaderScroll from "@modules/layout/components/header-scroll"
import HeaderSearch from "@modules/layout/components/header-search"
import Link from "@modules/common/components/app-link"

/**
 * Header: wordmark left, search centered on the page (middle column of a 1fr/640px/1fr grid, so it is centered to
 * the full width), account + cart right; category row below (scrolls on phones). Server-rendered; cart count is
 * the only JS.
 *
 * v3 (docs/keputusan.md "Blur v3"): white 80% + blur + hairline, the only blur on the site; text Ink only. Sticky from md up at a negative top, so its
 * extra top padding (--header-tuck) scrolls away: it gets a little smaller without moving the page (CLS 0). A
 * paint-only shadow follows the scroll (.site-header in globals.css).
 *
 * Phones: fixed, with an in-flow spacer of the same constant height (154px; 162px from sm). The search + category
 * rows ([data-header-secondary]) slide up behind the top row while scrolling down and come back when scrolling up
 * (HeaderScroll toggles data-collapsed; transform only, CLS 0). Collapsed: 56px (wordmark, search icon, account,
 * cart). Row heights are explicit so the spacer always matches.
 */
export default async function Nav({ countryCode }: { countryCode: string }) {
  const t = getDictionary(countryCode)
  const href = (p: string) => marketPath(countryCode, p)
  const categories = await listCategories({ fields: "id,name,handle,parent_category_id,rank", limit: 20 }, countryCode).catch(() => [])
  const topLevel = categories.filter((c) => !c.parent_category_id).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  const search = <HeaderSearch action={href("/search")} placeholder={t.nav.search} label={t.nav.searchLabel} formLabel={t.nav.searchRegion} />

  return (
    <>
    <div aria-hidden="true" className="h-[154px] sm:h-[162px] md:hidden" />
    <header
      id="site-header"
      className="site-header max-md:pointer-events-none max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-40 md:sticky md:inset-x-0 md:top-[calc(-1*var(--header-tuck))] md:z-40 md:border-b md:border-separator md:frost-header"
    >
      <div className="header-top relative z-10 max-md:pointer-events-auto max-md:border-b max-md:border-transparent max-md:frost-header">
      <div className="content-container grid h-14 grid-cols-[1fr_auto] items-center gap-stack-md sm:h-16 md:h-[calc(4.5rem+var(--header-tuck))] md:pt-[var(--header-tuck)] md:grid-cols-[1fr_minmax(0,640px)_1fr] md:gap-stack-lg">
        <Link
          href={href("/")}
          aria-label={config.brand.name}
          className="-ml-1 flex h-11 w-fit shrink-0 items-center px-1"
          data-testid="nav-store-link"
        >
          <Logo size="sm" decorative />
        </Link>

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
          <Link
            href={href("/wishlist")}
            aria-label={t.nav.wishlist}
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-default/60"
            data-testid="nav-wishlist-link"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
              <path d="M12 20.3 4.9 13.6a4.6 4.6 0 0 1 0-6.6 4.7 4.7 0 0 1 6.6 0l.5.5.5-.5a4.7 4.7 0 0 1 6.6 0 4.6 4.6 0 0 1 0 6.6L12 20.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </Link>
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

      <div data-header-secondary className="header-secondary max-md:pointer-events-auto max-md:border-b max-md:border-separator max-md:frost-header">
        <div className="content-container h-[3.25rem] pb-stack-sm md:hidden">{search}</div>
        <CategoryMenu
          label={t.nav.menu}
          items={[
            { href: href("/store"), label: t.nav.allProducts },
            ...topLevel.map((c) => ({ href: href(`/categories/${c.handle}`), label: c.name })),
            ...config.brand.navLinks.map((l) => ({ href: href(l.href), label: l.label })),
          ]}
        />
      </div>
    </header>
    <HeaderScroll id="site-header" />
    </>
  )
}
