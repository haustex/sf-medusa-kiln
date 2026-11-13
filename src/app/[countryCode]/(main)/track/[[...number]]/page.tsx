import { Metadata } from "next"
import { notFound } from "next/navigation"

import { feature } from "@lib/features"
import { trackingLocale } from "@lib/util/tracking-path"
import { LABELS } from "@modules/tracking/core/labels"
import { TrackingPage } from "@modules/tracking/tracking-page"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ countryCode: string; number?: string[] }>
  searchParams: Promise<{ number?: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return {
    title: LABELS[trackingLocale(countryCode)].title,
    robots: { index: false, follow: false },
  }
}

/** /track[/number] inside the app; the public address per language is lib/util/tracking-path.ts (proxy rewrite) */
export default async function Page(props: Props) {
  if (!(await feature("tracking"))) notFound()
  const [{ countryCode, number }, { number: query }] = await Promise.all([props.params, props.searchParams])
  return <TrackingPage countryCode={countryCode} number={number?.[0]} query={query} />
}
