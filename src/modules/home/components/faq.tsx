import { cn } from "@heroui/styles"
import { Minus, Plus } from "lucide-react"

import config from "@theme"
import type { Dictionary } from "@lib/i18n/dictionaries"
import { tx } from "@lib/i18n/localized"
import { faqPage, JsonLd } from "@lib/seo/jsonld"
import Link from "@modules/common/components/app-link"
import { ICON } from "@modules/ds/icons"

export type FaqItem = { q: string; a: string }

/** The FAQ of theme.config.ts (`faq.items`) in one language */
export const faqItems = (lang: "id" | "en"): FaqItem[] =>
  config.faq.items.map((f) => ({ q: tx(f.q, lang).trim(), a: tx(f.a, lang).trim() })).filter((f) => f.q && f.a)

/**
 * Accordion list on native <details>/<summary>: works without JS, keyboard and screen-reader friendly. Plus turns
 * into Minus when open; the body slides open (::details-content transition in globals.css, none with reduced
 * motion). Hairlines only between the items.
 */
export function FaqList({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-separator", className)} data-testid="faq-list">
      {items.map((f) => (
        <li key={f.q}>
          <details className="k-details group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-stack-md py-stack-md text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden="true" className="relative size-5 shrink-0">
                <Plus {...ICON} className="absolute inset-0 transition-opacity group-open:opacity-0" />
                <Minus {...ICON} className="absolute inset-0 opacity-0 transition-opacity group-open:opacity-100" />
              </span>
            </summary>
            <div className="pb-stack-lg text-sm leading-relaxed text-muted sm:text-base">{f.a}</div>
          </details>
        </li>
      ))}
    </ul>
  )
}

/**
 * Home page FAQ: title + one line + "Contact us" on the left, the accordion on the right (one column on phones),
 * questions and answers from theme.config.ts per language. Hidden when the list is empty. The FAQPage JSON-LD is
 * rendered through <JsonLd>, i.e. only with SITE_LIVE=true.
 */
export default function Faq({ lang, t, contactHref, url }: { lang: "id" | "en"; t: Dictionary["home"]; contactHref: string; url: string }) {
  const items = faqItems(lang)
  if (!items.length) return null
  return (
    <section aria-labelledby="faq-title" className="content-container" data-testid="faq">
      <JsonLd data={faqPage(items, url)} />
      <div className="grid gap-stack-lg lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-section">
        <div className="flex flex-col gap-stack-md lg:sticky lg:top-36 lg:self-start">
          <h2 id="faq-title" className="type-h2">
            {t.faqTitle}
          </h2>
          <p className="max-w-md text-sm text-muted sm:text-base">{t.faqIntro}</p>
          <Link href={contactHref} className="w-fit text-sm font-medium underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-focus">
            {t.faqContact}
          </Link>
        </div>
        <FaqList items={items} />
      </div>
    </section>
  )
}
