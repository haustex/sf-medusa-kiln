"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { useEffect, useState } from "react"

import { onIdle } from "@lib/util/idle"
import type { SocialNetwork } from "@modules/brand/social"
import { ICON } from "@modules/ds/icons"
import type { MarketOption } from "../market-select"

const Panel = dynamic(() => import("./panel"), { ssr: false })
const load = () => void import("./panel")

export type MobileMenuProps = {
  items: { href: string; label: string }[]
  markets: MarketOption[]
  account: { href: string; label: string }
  social: { key: SocialNetwork; label: string; href: string }[]
  labels: { open: string; close: string; menu: string; market: string }
}

/**
 * Phone menu: a hamburger left of the logo opens a left frost drawer with the categories and nav links, the market
 * list (flag, country, currency), the account link and the social icons (./panel). Closes on navigation. Only the
 * button is hydrated with the page; the drawer's code is fetched when the browser is idle and mounted on the first
 * open (it stays mounted, closed, afterwards).
 */
export default function MobileMenu(props: MobileMenuProps) {
  const { labels } = props
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const pathname = usePathname() ?? "/"

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => onIdle(load, 4000), [])

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLoaded(true)
          setOpen(true)
        }}
        aria-label={labels.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-full outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus md:hidden"
        data-testid="nav-menu-button"
      >
        <Menu {...ICON} />
      </button>
      {loaded && <Panel {...props} open={open} onClose={() => setOpen(false)} />}
    </>
  )
}
