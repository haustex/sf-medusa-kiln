import { Metadata } from "next"
import { headers } from "next/headers"
import config from "@theme"
import { getDictionary } from "@lib/i18n/dictionaries"
import { getMarket } from "@lib/util/market"
import NotFoundContent from "@modules/common/components/not-found"

export const metadata: Metadata = {
  title: `404 | ${config.brand.name}`,
  robots: { index: false, follow: true },
}

/** 404 inside a market. not-found.tsx gets no params: the market comes from the proxy (header x-kiln-market). */
export default async function NotFound() {
  const { countryCode } = getMarket((await headers()).get("x-kiln-market"))
  return <NotFoundContent countryCode={countryCode} labels={getDictionary(countryCode).notFound} />
}
