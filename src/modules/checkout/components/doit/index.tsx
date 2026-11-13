"use client"

import { HttpTypes } from "@medusajs/types"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { type DoitChoice, selectDoitMethod } from "@lib/data/doit"
import { Button } from "@modules/common/components/ui"

import { type DoitLabels } from "./labels"
import DoitPaymentPanel from "./payment-panel"
import DoitRailPicker from "./rail-picker"

export { doitLabels, isDoit, type DoitLabels } from "./labels"

const sameChoice = (session: HttpTypes.StorePaymentSession | undefined, choice: DoitChoice | null) =>
  !!session && !!choice && session.data?.status === "pending" && (session.data?.requested_rail ?? session.data?.rail) === choice.rail && (choice.rail === "qris" || choice.rail === "any" || session.data?.va_bank === choice.va_bank)

/**
 * The body of the doit.id option at checkout: the method picker, then "Pay" creates the invoice (payment session
 * with the choice) and the waiting panel takes over: QR / VA number, countdown, polling; the order is placed when
 * doit.id reports the payment. Picking another method shows "Switch method" instead of the panel.
 */
export function DoitOption({ cart, providerId, notReady, labels: t, onError, redirectToHosted = process.env.NEXT_PUBLIC_DOIT_REDIRECT_TO_HOSTED === "true" }: { cart: HttpTypes.StoreCart; providerId: string; notReady: boolean; labels: DoitLabels; onError: (m: string | null) => void; redirectToHosted?: boolean }) {
  const pathname = usePathname()
  const session = cart.payment_collection?.payment_sessions?.find((s) => s.provider_id === providerId && s.status === "pending")
  const [choice, setChoice] = useState<DoitChoice | null>(() => (session?.data?.status === "pending" ? { rail: (session.data.requested_rail ?? session.data.rail) as DoitChoice["rail"], va_bank: (session.data.va_bank as string | null) ?? null } : null))
  const [busy, setBusy] = useState(false)

  const pay = async () => {
    if (!choice) return
    setBusy(true)
    onError(null)
    // New doit.id invoice only when the method changed; back here after the hosted page
    const res = await selectDoitMethod(cart, providerId, choice, `${window.location.origin}${pathname}?step=payment`)
    setBusy(false)
    if (!res.ok) onError(res.message || t.errorStart)
  }

  const invoiceOpen = !notReady && sameChoice(session, choice)
  return (
    <div className="flex flex-col gap-stack-md">
      <DoitRailPicker cartId={cart.id} value={choice} onChange={setChoice} labels={t} />
      {invoiceOpen ? (
        <DoitPaymentPanel cart={cart} providerId={providerId} labels={t} redirectToHosted={redirectToHosted} />
      ) : (
        <Button type="button" size="large" disabled={notReady || !choice} isLoading={busy} onClick={pay} data-testid="submit-order-button">
          {session?.data?.status === "pending" ? t.switchButton : t.payButton}
        </Button>
      )}
    </div>
  )
}
