import { Metadata } from "next"
import { headers } from "next/headers"

import { retrieveTransfer } from "@lib/manual-transfer/backend"
import { getMarket, marketPath } from "@lib/util/market"
import ProofUpload from "@modules/manual-transfer/components/proof-upload"
import TransferNotFound from "@modules/manual-transfer/core/components/transfer-not-found"
import TransferView from "@modules/manual-transfer/core/components/transfer-view"
import { labelsFor, pickLocale } from "@modules/manual-transfer/core/labels"
import { kilnTransferTheme } from "@modules/manual-transfer/kiln-theme"

type Props = { params: Promise<{ countryCode: string; orderId: string }>; searchParams: Promise<{ token?: string; lang?: string }> }

export const dynamic = "force-dynamic"

export async function generateMetadata(props: Props): Promise<Metadata> {
  const [{ countryCode }, { lang }] = await Promise.all([props.params, props.searchParams])
  // The URL carries the guest's upload token: never indexed, never sent as a referrer
  return { title: labelsFor(pickLocale([lang, getMarket(countryCode).htmlLang])).title, robots: { index: false, follow: false }, referrer: "no-referrer" }
}

/**
 * /{market}/transfer/{orderId}?token=… (medusa-payment-manual-transfer): the page the order e-mail links to
 * (plugin option notifications.paymentUrl "https://shop.example.com/transfer/{order_id}?token={token}"; the market
 * proxy adds the prefix) and where "Place order" lands. Status, amount, bank details, deadline, invoice, proof
 * upload. Without the plugin on the backend, or for anyone without access, "not found".
 */
export default async function TransferPage(props: Props) {
  const [{ countryCode, orderId }, { token, lang }] = await Promise.all([props.params, props.searchParams])
  const locale = pickLocale([lang, getMarket(countryCode).htmlLang, (await headers()).get("accept-language")])
  const transfer = await retrieveTransfer(orderId, token ?? null)
  if (!transfer) return <TransferNotFound locale={locale} homeHref={marketPath(countryCode, "/store")} theme={kilnTransferTheme} />

  const api = `/api/manual-transfer/${encodeURIComponent(transfer.order_id)}`
  const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : ""
  return <TransferView transfer={transfer} token={token ?? null} locale={locale} uploadUrl={`${api}/proofs`} invoiceUrl={`${api}/invoice?locale=${locale}${tokenQuery}`} Upload={ProofUpload} theme={kilnTransferTheme} />
}
