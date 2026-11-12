"use client"

import { HttpTypes } from "@medusajs/types"
import { X } from "lucide-react"
import { useId, useState, useTransition } from "react"

import { applyPromotions } from "@lib/data/cart"
import { Button } from "@modules/common/components/ui"
import { ICON } from "@modules/ds/icons"

export type PromoLabels = { label: string; apply: string; remove: string; error: string }

/** Promotion codes on the cart: an input + apply, the applied codes as chips with a remove button. */
export default function PromoCode({ promotions, labels: t }: { promotions: HttpTypes.StoreCartPromotion[]; labels: PromoLabels }) {
  const id = useId()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const codes = promotions.map((p) => p.code).filter((c): c is string => !!c)

  const submit = (next: string[]) => {
    setError(null)
    startTransition(async () => {
      try {
        await applyPromotions(next)
        setCode("")
      } catch (e) {
        console.error("[checkout] promo", e)
        setError(t.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-stack-sm">
      <form
        className="flex gap-stack-sm"
        onSubmit={(e) => {
          e.preventDefault()
          const c = code.trim()
          if (c && !codes.includes(c)) submit([...codes, c])
        }}
      >
        <label htmlFor={id} className="sr-only">
          {t.label}
        </label>
        <input id={id} value={code} onChange={(e) => setCode(e.target.value)} placeholder={t.label} autoComplete="off" className="h-11 min-w-0 flex-1 rounded-[var(--field-radius)] border border-field-border bg-field-background px-4 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-focus" data-testid="discount-input" />
        <Button type="submit" variant="secondary" isLoading={pending} disabled={!code.trim()} className="h-11" data-testid="discount-apply-button">
          {t.apply}
        </Button>
      </form>
      {error && (
        <p className="text-sm text-danger" role="alert" data-testid="discount-error-message">
          {error}
        </p>
      )}
      {promotions.length > 0 && (
        <ul className="flex flex-wrap gap-stack-sm">
          {promotions.map((p) => (
            <li key={p.id} className="inline-flex h-8 items-center gap-1 rounded-full bg-background pl-3 pr-1 text-sm ring-1 ring-separator" data-testid="discount-row">
              <span className="font-medium" data-testid="discount-code">
                {p.code}
              </span>
              {!p.is_automatic && p.code && (
                <button type="button" onClick={() => submit(codes.filter((c) => c !== p.code))} aria-label={`${t.remove} ${p.code}`} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-default" data-testid="remove-discount-button">
                  <X {...ICON} size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
