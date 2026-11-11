"use client"

import { buttonVariants, cn } from "@heroui/styles"
import { useDictionary } from "@lib/i18n/use-dictionary"
import { marketPath } from "@lib/util/market"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams } from "next/navigation"

/**
 * HAUS KAYU 404 inside a market (ID / EN from the URL): title, one sentence, product search, buttons to the home page and
 * all products. The status stays 404 and the page is noindex (metadata of the not-found files).
 */
export default function NotFoundContent() {
  const t = useDictionary().notFound
  const countryCode = (useParams()?.countryCode as string | undefined) ?? "id"
  return (
    <div className="content-container py-section">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-stack-md text-center" data-testid="not-found">
        <p className="type-eyebrow">404</p>
        <h1 className="type-title text-balance">{t.title}</h1>
        <p className="text-muted">{t.body}</p>
        <form action={marketPath(countryCode, "/search")} method="get" role="search" className="mt-stack-sm flex w-full gap-stack-sm">
          <label htmlFor="nf-q" className="sr-only">{t.search}</label>
          <input
            id="nf-q"
            name="q"
            type="search"
            placeholder={t.search}
            className="h-12 min-w-0 flex-1 rounded-[var(--field-radius)] border border-field-border bg-field-background px-4 text-base focus:border-foreground focus:outline-none focus:ring-2 focus:ring-focus"
          />
          <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 shrink-0")}>{t.searchButton}</button>
        </form>
        <div className="flex flex-wrap justify-center gap-stack-sm">
          <LocalizedClientLink href="/" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "h-12 px-6")} data-testid="not-found-home">
            {t.home}
          </LocalizedClientLink>
          <LocalizedClientLink href="/store" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-6")}>
            {t.store}
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
