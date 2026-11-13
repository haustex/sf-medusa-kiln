import { Metadata } from "next"

import { retrieveOrder } from "@lib/data/orders"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import TransferActions from "@modules/order/components/transfer-actions"

export const metadata: Metadata = { robots: { index: false, follow: false } }

/**
 * Medusa order transfer: the link in the e-mail sent to the order's address when an account asks to take over a
 * guest order. Nothing happens on GET: the owner accepts or declines with a button (POST), so link scanners in
 * mail clients cannot accept it.
 */
export default async function OrderTransferPage({ params }: { params: Promise<{ countryCode: string; id: string; token: string }> }) {
  const { countryCode, id, token } = await params
  const t = getDictionary(countryCode).order
  const order = await retrieveOrder(id).catch(() => null)
  const n = order?.display_id ? String(order.display_id) : "–"
  return (
    <div className="content-container flex justify-center py-section">
      <div className="flex w-full max-w-lg flex-col gap-stack-md">
        <h1 className="type-h1 text-balance">{fill(t.transferTitle, { n })}</h1>
        <p className="text-muted">{t.transferBody}</p>
        <TransferActions id={id} token={token} n={n} labels={{ accept: t.transferAccept, decline: t.transferDecline, accepted: t.transferAccepted, declined: t.transferDeclined, error: t.transferError }} />
      </div>
    </div>
  )
}
