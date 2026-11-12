"use client"

import { cn } from "@heroui/styles"
import { useParams, usePathname } from "next/navigation"

import { signout } from "@lib/data/customer"
import { useDictionary } from "@lib/i18n/use-dictionary"
import { marketPath, stripMarketPrefix } from "@lib/util/market"
import Link from "@modules/common/components/app-link"

/** Account navigation: a scrolling pill row on phones, a sidebar list from lg. The current page has aria-current. */
export default function AccountNav({ email }: { email: string }) {
  const t = useDictionary().account
  const { countryCode } = useParams() as { countryCode: string }
  const route = stripMarketPrefix(usePathname() ?? "")
  const items = [
    { href: "/account", label: t.overview, testId: "overview-link" },
    { href: "/account/orders", label: t.orders, testId: "orders-link" },
    { href: "/account/reviews", label: t.reviews, testId: "reviews-link" },
    { href: "/account/addresses", label: t.addresses, testId: "addresses-link" },
    { href: "/account/profile", label: t.profile, testId: "profile-link" },
  ]
  const active = (href: string) => (href === "/account" ? route === "/account" : route.startsWith(href))
  const pill = "inline-flex h-11 items-center whitespace-nowrap rounded-full px-4 text-sm ring-1 ring-inset outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus lg:w-full lg:rounded-lg lg:px-3 lg:text-base lg:ring-0"

  return (
    <nav aria-label={t.title} className="flex flex-col gap-stack-md" data-testid="account-nav">
      <div className="hidden flex-col gap-stack-xs lg:flex">
        <span className="type-h3">{t.title}</span>
        <span className="truncate text-sm text-muted">{email}</span>
      </div>
      <ul className="no-scrollbar -mx-container-x flex gap-stack-sm overflow-x-auto px-container-x lg:mx-0 lg:flex-col lg:gap-0 lg:px-0">
        {items.map((i) => (
          <li key={i.href} className="shrink-0">
            <Link href={marketPath(countryCode, i.href)} prefetch={false} aria-current={active(i.href) ? "page" : undefined} data-testid={i.testId} className={cn(pill, active(i.href) ? "bg-foreground text-background ring-foreground lg:bg-default lg:font-medium lg:text-foreground" : "ring-separator hover:ring-control lg:text-muted lg:hover:bg-default lg:hover:text-foreground")}>
              {i.label}
            </Link>
          </li>
        ))}
        <li className="shrink-0 lg:mt-stack-sm lg:border-t lg:border-separator lg:pt-stack-sm">
          <button type="button" onClick={() => signout(countryCode)} data-testid="logout-button" className={cn(pill, "text-muted ring-separator hover:text-foreground lg:hover:bg-default")}>
            {t.logout}
          </button>
        </li>
      </ul>
    </nav>
  )
}
