"use client"

import { buttonVariants, cn } from "@heroui/styles"
import { useParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { CART_OPEN_EVENT, CART_UPDATED_EVENT } from "@lib/util/cart-events"
import { marketPath } from "@lib/util/market"
import CartLine, { type CartLineLabels } from "@modules/cart/components/cart-line"
import type { CartDrawerData } from "@modules/cart/components/cart-line/data"
import Link from "@modules/common/components/app-link"
import { Sheet } from "@modules/ds"
import { formatPrice } from "@modules/ds/price-tag"

export type CartDrawerLabels = CartLineLabels & {
  title: string
  close: string
  empty: string
  emptyCta: string
  subtotal: string
  shippingLater: string
  checkout: string
  viewCart: string
  loading: string
}

/**
 * The cart drawer itself: a right frost sheet (ds/Sheet on a native <dialog>) that opens from the header's cart
 * button and after every add to cart (CART_OPEN_EVENT, lib/util/cart-events.ts). The cart is read in the browser
 * from /api/cart (fresh, never cached: the pages that open it are static) and re-read on CART_UPDATED_EVENT, so the
 * lines, the subtotal and the header count stay in step after each change. Closes on navigation.
 *
 * Loaded by index.tsx on the first CART_OPEN_EVENT (`openOnMount`: that event has already fired when this mounts),
 * so none of this is parsed or hydrated with the page.
 */
export default function CartDrawerPanel({ labels: t, openOnMount = false }: { labels: CartDrawerLabels; openOnMount?: boolean }) {
  const { countryCode } = useParams() as { countryCode: string }
  const pathname = usePathname()
  // The path the drawer was opened on: it is open only while the page is still that one (closes on navigation)
  const [openPath, setOpenPath] = useState<string | null>(openOnMount ? pathname : null)
  const open = openPath !== null && openPath === pathname
  const [data, setData] = useState<CartDrawerData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    return fetch("/api/cart", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<CartDrawerData>) : null))
      .then((d) => d && setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Mounted by index.tsx in answer to an open event that has already fired: read the cart (after this commit)
    if (openOnMount) queueMicrotask(load)
    const onOpen = () => {
      setOpenPath(window.location.pathname)
      void load()
    }
    window.addEventListener(CART_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(CART_OPEN_EVENT, onOpen)
  }, [load, openOnMount])

  // While open, every cart change (a line here, a "+" on the page behind) re-reads the cart
  useEffect(() => {
    if (!open) return
    const onUpdate = () => void load()
    window.addEventListener(CART_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate)
  }, [open, load])

  const close = () => setOpenPath(null)
  const href = (p: string) => marketPath(countryCode, p)
  const items = data?.items ?? []
  const count = data?.count ?? 0

  return (
    <Sheet
      open={open}
      onClose={close}
      side="right"
      label={t.title}
      title={
        <>
          {t.title}
          {count > 0 && <span className="text-muted"> ({count})</span>}
        </>
      }
      closeLabel={t.close}
      className="k-cart-drawer"
      footer={
        items.length > 0 && data ? (
          <div className="flex flex-col gap-stack-md">
            <dl className="flex flex-col gap-stack-xs text-sm">
              <div className="flex items-baseline justify-between gap-stack-md">
                <dt className="font-medium">{t.subtotal}</dt>
                <dd className="type-price text-lg font-medium" data-testid="cart-drawer-subtotal">
                  {formatPrice(data.subtotal, data.currency)}
                </dd>
              </div>
              <p className="text-muted">{t.shippingLater}</p>
            </dl>
            <div className="flex flex-col gap-stack-sm">
              <Link href={href("/checkout")} className={cn(buttonVariants({ variant: "primary", size: "lg", fullWidth: true }), "h-12")} data-testid="cart-drawer-checkout">
                {t.checkout}
              </Link>
              <Link href={href("/cart")} className={cn(buttonVariants({ variant: "secondary", size: "lg", fullWidth: true }), "h-12")} data-testid="cart-drawer-view">
                {t.viewCart}
              </Link>
            </div>
          </div>
        ) : undefined
      }
    >
      <div aria-busy={loading} data-testid="cart-drawer">
        {data && items.length === 0 ? (
          <div className="flex flex-col items-start gap-stack-md py-stack-lg" data-testid="cart-drawer-empty">
            <p className="text-muted">{t.empty}</p>
            <Link href={href("/store")} onClick={close} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "h-12 px-6")}>
              {t.emptyCta}
            </Link>
          </div>
        ) : !data ? (
          <p className="py-stack-lg text-sm text-muted" role="status">
            {t.loading}
          </p>
        ) : (
          <ul className="divide-y divide-separator">
            {items.map((item) => (
              <CartLine key={item.id} item={item} currency={data.currency} labels={t} compact onClose={close} />
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  )
}
