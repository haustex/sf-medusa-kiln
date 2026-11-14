"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

import { CART_OPEN_EVENT } from "@lib/util/cart-events"
import { onIdle } from "@lib/util/idle"
import type { CartDrawerLabels } from "./drawer"

export type { CartDrawerLabels } from "./drawer"

const Panel = dynamic(() => import("./drawer"), { ssr: false })
const load = () => void import("./drawer")

/**
 * Cart drawer mount: nothing but a listener until the first CART_OPEN_EVENT (header cart button, any add to cart),
 * then the drawer (./drawer) is loaded and opened. Its code is fetched when the browser is idle, so the first open
 * does not wait for it; it is never part of the page's hydration (every page carries the header).
 */
export default function CartDrawer({ labels }: { labels: CartDrawerLabels }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (armed) return
    const onOpen = () => setArmed(true)
    window.addEventListener(CART_OPEN_EVENT, onOpen)
    const cancel = onIdle(load, 4000)
    return () => {
      window.removeEventListener(CART_OPEN_EVENT, onOpen)
      cancel()
    }
  }, [armed])

  return armed ? <Panel labels={labels} openOnMount /> : null
}
