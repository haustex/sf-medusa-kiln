"use client"

import { cn } from "@heroui/styles"
import { useMemo, useState, useTransition } from "react"

import { addToCart } from "@lib/data/cart"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { cleanSlug } from "@lib/util/image-name"
import Link from "@modules/common/components/app-link"
import { Badge, PriceTag, ProductImage, Sheet, type ProductCardData } from "@modules/ds"

export type QuickViewLabels = {
  quickView: string
  /** "Choose {option}" */
  chooseOption: string
  addToCart: string
  adding: string
  added: string
  addError: string
  unavailable: string
  soldOut: string
  viewDetails: string
  close: string
}

/**
 * Quick view for a multi-variant product: photo, title, price of the chosen variant, one radio group per option,
 * add to cart. Bottom sheet on phones, centred dialog from sm (ds/sheet). The data comes with the card (no fetch).
 */
export default function QuickView({ product, countryCode, labels, onClose }: { product: ProductCardData; countryCode: string; labels: QuickViewLabels; onClose: () => void }) {
  const options = product.options ?? []
  const variants = product.variants ?? []
  const [chosen, setChosen] = useState<Record<string, string>>(() =>
    variants.length === 1 ? variants[0].options : Object.fromEntries(options.filter((o) => o.values.length === 1).map((o) => [o.title, o.values[0]]))
  )
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)

  const variant = useMemo(() => {
    if (options.some((o) => !chosen[o.title])) return null
    return variants.find((v) => options.every((o) => v.options[o.title] === chosen[o.title])) ?? null
  }, [chosen, options, variants])
  const complete = options.every((o) => chosen[o.title])
  const price = variant?.price ?? product.price ?? null
  const canAdd = !!variant && variant.inStock && !pending

  /** Is `value` for `option` still possible given the other chosen options, and in stock? */
  const available = (option: string, value: string) =>
    variants.some((v) => v.options[option] === value && v.inStock && options.every((o) => o.title === option || !chosen[o.title] || v.options[o.title] === chosen[o.title]))

  const add = () => {
    if (!variant) return
    start(async () => {
      try {
        await addToCart({ variantId: variant.id, quantity: 1, countryCode })
        notifyCartUpdated()
        setMessage({ kind: "ok", text: labels.added })
        setTimeout(onClose, 900)
      } catch {
        setMessage({ kind: "error", text: labels.addError })
      }
    })
  }

  return (
    <Sheet open onClose={onClose} side="bottom" label={labels.quickView} title={labels.quickView} closeLabel={labels.close}>
      <div className="grid gap-stack-lg sm:grid-cols-[minmax(0,14rem)_1fr]">
        <div className="relative overflow-hidden rounded-media">
          <ProductImage src={product.image} name={product.imageName ?? cleanSlug(product.href.split("/").pop() ?? "")} alt={product.title} sizes="(min-width: 640px) 14rem, 90vw" />
          {product.subtitle && (
            <div className="absolute left-stack-sm top-stack-sm">
              <Badge overPhoto>{product.subtitle}</Badge>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-stack-md">
          <div className="flex flex-col gap-stack-xs">
            <h3 className="type-h3">{product.title}</h3>
            {price && <PriceTag amount={price.amount} currency={price.currency} original={price.original} from={variant ? undefined : product.price?.from} size="md" />}
          </div>
          {options.map((o) => (
            <fieldset key={o.id} className="flex flex-col gap-stack-xs">
              <legend className="type-label mb-stack-xs text-muted">{labels.chooseOption.replace("{option}", o.title)}</legend>
              <div className="flex flex-wrap gap-stack-xs">
                {o.values.map((value) => {
                  const selected = chosen[o.title] === value
                  const ok = available(o.title, value)
                  return (
                    <label
                      key={value}
                      className={cn(
                        "inline-flex h-11 cursor-pointer items-center rounded-md border px-3.5 text-sm outline-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus has-[:focus-visible]:ring-offset-2",
                        selected ? "border-foreground bg-foreground text-background" : "border-control bg-surface hover:border-foreground",
                        !ok && !selected && "border-dashed text-muted"
                      )}
                    >
                      <input type="radio" name={`qv-${o.id}`} value={value} checked={selected} onChange={() => setChosen((c) => ({ ...c, [o.title]: value }))} className="sr-only" />
                      {value}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ))}
          <div className="flex flex-col gap-stack-sm">
            <button
              type="button"
              onClick={add}
              disabled={!canAdd}
              aria-busy={pending || undefined}
              className="button button--primary h-12 w-full rounded-md bg-accent px-6 text-base font-medium text-accent-foreground outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="quick-view-add"
            >
              {pending ? labels.adding : complete && variant && !variant.inStock ? labels.soldOut : complete && !variant ? labels.unavailable : labels.addToCart}
            </button>
            <p role="status" aria-live="polite" className={cn("min-h-5 text-sm", message?.kind === "error" ? "text-danger" : "text-muted")}>
              {message?.text ?? ""}
            </p>
            <Link href={product.href} className="w-fit text-sm underline underline-offset-4 hover:no-underline">
              {labels.viewDetails}
            </Link>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
