import { Metadata, Viewport } from "next"
import { notFound } from "next/navigation"

import config from "@theme"
import { getBaseURL } from "@lib/util/env"
import { brandShareImage, ogBase } from "@lib/og/share"
import { MARKET_CODES, getMarket, isMarketCode } from "@lib/util/market"
import { SITE_LIVE } from "@lib/util/site-live"
import { inter } from "styles/fonts"
import "styles/globals.css"

export const viewport: Viewport = {
  themeColor: config.colors.background,
}

export async function generateMetadata(props: { params: Promise<{ countryCode: string }> }): Promise<Metadata> {
  const { countryCode } = await props.params
  const cc = isMarketCode(countryCode) ? countryCode : config.markets.default
  return {
    metadataBase: new URL(getBaseURL()),
    title: { template: `%s | ${config.brand.titleSuffix}`, default: config.brand.name },
    manifest: "/site.webmanifest",
    ...(SITE_LIVE ? {} : { robots: { index: false, follow: false } }),
    openGraph: { ...ogBase(cc), type: "website", images: [brandShareImage(getBaseURL().replace(/\/$/, ""), cc)] },
    twitter: { card: "summary_large_image" },
  }
}

export function generateStaticParams() {
  return MARKET_CODES.map((countryCode) => ({ countryCode }))
}

/** theme.config.ts colours/radii/frost as CSS variables on <html>; src/styles/theme.css maps them onto HeroUI. */
const themeVars = {
  "--k-white": config.colors.background,
  "--k-ink": config.colors.ink,
  "--k-ink-hover": config.colors.inkHover,
  "--k-muted": config.colors.muted,
  "--k-border": config.colors.border,
  "--k-control": config.colors.control,
  "--k-soft": config.colors.soft,
  "--k-soft-hover": config.colors.softHover,
  "--radius": config.radius.control,
  "--field-radius": config.radius.control,
  "--k-radius-media": config.radius.media,
  "--k-radius-sheet": config.radius.sheet,
  "--k-frost-alpha": String(config.frost.alpha),
  "--k-card-icon": config.cardIconColor === "dark" ? config.colors.ink : config.colors.background,
  "--k-card-icon-shadow": config.cardIconColor === "dark" ? "rgb(255 255 255 / 0.8)" : "rgb(0 0 0 / 0.55)",
  "--k-frost-blur": config.frost.blur,
} as React.CSSProperties

/**
 * Root layout. It lives under [countryCode] so `<html lang>` follows the market without making every page dynamic.
 */
export default async function RootLayout(props: { children: React.ReactNode; params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  if (!isMarketCode(countryCode)) {
    notFound()
  }
  const market = getMarket(countryCode)

  return (
    <html lang={market.htmlLang} data-theme="light" className={inter.variable} style={themeVars}>
      <body className="bg-background text-foreground antialiased">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
