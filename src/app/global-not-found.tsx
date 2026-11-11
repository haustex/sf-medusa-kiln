import { Metadata, Viewport } from "next"
import config from "@theme"
import { headers } from "next/headers"
import Link from "@modules/common/components/app-link"

import { getDictionary } from "@lib/i18n/dictionaries"
import { marketPath } from "@lib/util/market"
import Logo from "@modules/brand/logo"
import { inter } from "styles/fonts"
import "styles/globals.css"

export const viewport: Viewport = {
  // White (page background); same as the manifest theme_color
  themeColor: "#FFFFFF",
}

export const metadata: Metadata = {
  title: `404 | ${config.brand.name}`,
  // public/site.webmanifest (icons: public/android-chrome-192x192.png, -512x512.png)
  manifest: "/site.webmanifest",
  description: "Halaman tidak ditemukan. Page not found.",
  robots: { index: false, follow: true },
}

/**
 * 404 for URLs that match no route (the root layout lives under app/[countryCode]). The market comes from the proxy
 * (header x-kiln-market: "us" → English, else Indonesian); same content as modules/common/components/not-found.
 */
export default async function GlobalNotFound() {
  const market = (await headers()).get("x-kiln-market") === "us" ? "us" : "id"
  const t = getDictionary(market).notFound
  const btn = "inline-flex h-12 items-center justify-center rounded-[var(--radius)] px-6 text-base font-medium"
  return (
    <html lang={market === "us" ? "en" : "id"} data-theme="light" className={inter.variable}>
      <body className="bg-background text-foreground antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-stack-md px-6 text-center" data-testid="not-found">
          <Link href={marketPath(market)} aria-label={config.brand.name}>
            <Logo size="lg" />
          </Link>
          <p className="type-eyebrow mt-stack-md">404</p>
          <h1 className="type-title text-balance">{t.title}</h1>
          <p className="max-w-md text-muted">{t.body}</p>
          <form action={marketPath(market, "/search")} method="get" role="search" className="flex w-full max-w-md gap-2">
            <label htmlFor="nf-q" className="sr-only">{t.search}</label>
            <input
              id="nf-q"
              name="q"
              type="search"
              placeholder={t.search}
              className="h-12 min-w-0 flex-1 rounded-[var(--field-radius)] border border-field-border bg-field-background px-4 text-base focus:border-foreground focus:outline-none"
            />
            <button type="submit" className={`${btn} shrink-0 border border-control bg-surface`}>{t.searchButton}</button>
          </form>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href={marketPath(market)} className={`${btn} bg-foreground text-surface`}>{t.home}</Link>
            <Link href={marketPath(market, "/store")} className={`${btn} border border-control bg-surface`}>{t.store}</Link>
          </div>
        </main>
      </body>
    </html>
  )
}
