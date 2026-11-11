"use client"

import { useParams, usePathname } from "next/navigation"
import { Menu, User } from "lucide-react"
import { useEffect, useState } from "react"

import { marketPath, stripMarketPrefix } from "@lib/util/market"
import Flag from "@modules/brand/flags"
import { SocialIcon, type SocialNetwork } from "@modules/brand/social"
import Link from "@modules/common/components/app-link"
import { Sheet } from "@modules/ds"
import { ICON } from "@modules/ds/icons"
import type { MarketOption } from "../market-select"

export type MobileMenuProps = {
  items: { href: string; label: string }[]
  markets: MarketOption[]
  account: { href: string; label: string }
  social: { key: SocialNetwork; label: string; href: string }[]
  labels: { open: string; close: string; menu: string; market: string }
}

/**
 * Phone menu: a hamburger left of the logo opens a left frost drawer with the categories and nav links, the market
 * list (flag, country, currency), the account link and the social icons. Closes on navigation.
 */
export default function MobileMenu({ items, markets, account, social, labels }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? "/"
  const params = useParams()
  const countryCode = String(params.countryCode ?? "").toLowerCase()
  const page = stripMarketPrefix(pathname)

  useEffect(() => setOpen(false), [pathname])

  const row = "flex h-11 items-center rounded-md px-2 text-base outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus"
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-full outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus md:hidden"
        data-testid="nav-menu-button"
      >
        <Menu {...ICON} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} side="left" label={labels.menu} closeLabel={labels.close}>
        <nav aria-label={labels.menu} className="flex flex-col gap-stack-lg">
          <ul className="-mx-2 flex flex-col">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={row}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {markets.length > 1 && (
            <div className="flex flex-col gap-stack-xs">
              <p className="type-label text-muted">{labels.market}</p>
              <ul className="-mx-2 flex flex-col">
                {markets.map((m) => {
                  const current = m.code === countryCode
                  return (
                    <li key={m.code}>
                      <a href={marketPath(m.code, page)} hrefLang={m.hrefLang} aria-current={current ? "true" : undefined} className={`${row} gap-stack-sm ${current ? "font-medium" : ""}`}>
                        <Flag code={m.code} />
                        <span className="flex-1">{m.country}</span>
                        <span className="type-price text-sm text-muted">{m.currency.toUpperCase()}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          <ul className="-mx-2 flex flex-col border-t border-separator pt-stack-sm">
            <li>
              <Link href={account.href} prefetch={false} className={`${row} gap-stack-sm`}>
                <User {...ICON} />
                {account.label}
              </Link>
            </li>
          </ul>
          {social.length > 0 && (
            <ul className="-mx-2 flex items-center">
              {social.map((n) => (
                <li key={n.key}>
                  <a href={n.href} aria-label={n.label} rel="noopener me" target="_blank" className="inline-flex size-11 items-center justify-center rounded-full outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus">
                    <SocialIcon network={n.key} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </Sheet>
    </>
  )
}
