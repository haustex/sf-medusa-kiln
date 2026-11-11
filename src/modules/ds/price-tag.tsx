import { cn } from "@heroui/styles"

/** Locale per currency (not per market): IDR always reads "Rp185.000", USD "$74.00". */
const FORMAT: Record<string, { locale: string; fraction: number }> = {
  idr: { locale: "id-ID", fraction: 0 },
  usd: { locale: "en-US", fraction: 2 },
}

/** Medusa stores whole units (Rp185000, $74), not cents. */
export function formatPrice(amount: number, currency: string) {
  const code = currency.toLowerCase()
  const f = FORMAT[code] ?? { locale: "en-US", fraction: 2 }
  return new Intl.NumberFormat(f.locale, {
    style: "currency",
    currency: code.toUpperCase(),
    minimumFractionDigits: f.fraction,
    maximumFractionDigits: f.fraction,
  })
    .format(amount)
    .replace(/\u00a0/g, "") // "Rp 185.000" (NBSP) → "Rp185.000"
}

type PriceTagProps = {
  amount: number
  currency: string
  /** Price before discount; shown struck through when higher than `amount`. */
  original?: number | null
  /** "from" prefix for products whose variants have different prices. */
  from?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl tracking-tight",
}

/**
 * Price in IDR or USD. Each market has its own price list (no conversion);
 * pass the region's amount and currency as returned by Medusa.
 */
export default function PriceTag({ amount, currency, original, from, size = "md", className }: PriceTagProps) {
  const onSale = typeof original === "number" && original > amount
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-stack-sm tabular-nums", sizes[size], className)}>
      {from && <span className="text-muted text-[0.85em]">{from}</span>}
      <span className={cn("font-medium", onSale && "text-danger")}>{formatPrice(amount, currency)}</span>
      {onSale && (
        <s className="text-muted text-[0.85em]">
          <span className="sr-only">Harga awal </span>
          {formatPrice(original!, currency)}
        </s>
      )}
    </p>
  )
}
