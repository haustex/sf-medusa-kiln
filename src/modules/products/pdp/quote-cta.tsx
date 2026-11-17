import { buttonVariants, cn } from "@heroui/styles"

import { formatPrice } from "@modules/ds/price-tag"

/**
 * Products sold by quote (theme.config.ts product.quote): "Request a quote" where the buy box would be, the same
 * primary button, the lowest variant price as "from". Server-rendered, no JavaScript, no layout shift.
 */
export default function QuoteCta({ href, external = false, fromAmount, currency, notes, labels }: { href: string; /** Absolute URL (WhatsApp, a form elsewhere): opens in a new tab */ external?: boolean; fromAmount: number | null; currency: string; /** Rows under the note (<li>: theme.config.ts product.notes, rendered by ProductNotes) */ notes?: React.ReactNode; labels: { requestQuote: string; requestQuoteNote: string; from: string } }) {
  return (
    <div className="flex flex-col gap-stack-md" data-testid="quote-cta">
      {fromAmount !== null && (
        <p className="flex flex-wrap items-baseline gap-x-stack-sm text-2xl tabular-nums tracking-tight">
          <span className="text-base text-muted">{labels.from}</span>
          <span className="font-medium">{formatPrice(fromAmount, currency)}</span>
        </p>
      )}
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "h-12 w-full")} data-testid="quote-cta-button">
        {labels.requestQuote}
      </a>
      <p className="text-sm text-muted">{labels.requestQuoteNote}</p>
      {notes && <ul className="flex flex-col gap-stack-sm text-sm">{notes}</ul>}
    </div>
  )
}
