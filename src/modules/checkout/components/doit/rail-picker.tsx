"use client"

import { cn } from "@heroui/styles"
import { useEffect, useState } from "react"

import { type DoitChoice, type DoitMethod, listDoitMethods } from "@lib/data/doit"

import { rupiah } from "./format"
import { bankNames, type DoitLabels } from "./labels"

const keyOf = (c: { rail: string; va_bank?: string | null; bank?: string | null }) => `${c.rail}:${c.va_bank ?? c.bank ?? ""}`

/** Lists the methods doit.id has active for this store (QRIS, VA banks, transfer banks) with the fee for this cart, and reports the choice */
export default function DoitRailPicker({ cartId, value, onChange, labels: t }: { cartId: string; value: DoitChoice | null; onChange: (choice: DoitChoice) => void; labels: DoitLabels }) {
  const [methods, setMethods] = useState<DoitMethod[] | null>(null)
  // "unavailable": doit.id answered without a method list (the store's default rail is used); "error": the backend
  // refused (doit.id not configured, cart problem) and there is nothing to pay with
  const [unavailable, setUnavailable] = useState<false | "fallback" | "error">(false)

  useEffect(() => {
    let active = true
    listDoitMethods(cartId).then((res) => {
      if (!active) return
      if (!res.ok || res.data.source !== "doit" || !res.data.methods.length) {
        setUnavailable(res.ok ? "fallback" : "error")
        setMethods([])
        if (res.ok && !value) onChange({ rail: res.data.default.rail, va_bank: res.data.default.va_bank })
        return
      }
      setMethods(res.data.methods)
      if (!value) {
        const preferred = res.data.methods.find((m) => m.within_limits !== false && keyOf(m) === keyOf(res.data.default)) ?? res.data.methods.find((m) => m.within_limits !== false) ?? res.data.methods[0]
        onChange({ rail: preferred.rail, va_bank: preferred.bank })
      }
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId])

  if (methods === null) return <p className="text-sm text-muted">{t.loading}</p>
  if (unavailable) return <p className={unavailable === "error" ? "text-sm text-danger" : "text-sm text-muted"} role={unavailable === "error" ? "alert" : undefined} data-testid="doit-methods-unavailable">{unavailable === "error" ? t.methodsError : t.methodsUnavailable}</p>

  const groups = [
    { title: t.qris, items: methods.filter((m) => m.rail === "qris") },
    { title: t.va, items: methods.filter((m) => m.rail === "va") },
    { title: t.transfer, items: methods.filter((m) => m.rail === "transfer") },
  ].filter((g) => g.items.length)

  return (
    <div className="flex flex-col gap-stack-md" data-testid="doit-rail-picker">
      <p className="font-medium">{t.chooseMethod}</p>
      {groups.map((group) => (
        <fieldset key={group.title} className="flex flex-col">
          {/* QRIS is a single option that already says "QRIS" */}
          {group.items[0].rail !== "qris" && <legend className="mb-stack-sm text-sm text-muted">{group.title}</legend>}
          <div className="grid grid-cols-1 gap-stack-sm sm:grid-cols-2">
            {group.items.map((m) => {
              const selected = value ? keyOf(value) === keyOf(m) : false
              const disabled = m.within_limits === false
              const customerFee = m.fee_payer === "customer" && m.fee_amount ? m.fee_amount : 0
              const fee = disabled ? t.outsideLimit(m.limit) : customerFee ? t.feeByCustomer(rupiah(customerFee)) : t.noFee
              return (
                <label
                  key={m.code}
                  className={cn(
                    "flex min-h-14 items-center justify-between gap-stack-sm rounded-lg bg-surface px-stack-md py-stack-sm ring-1 ring-inset transition-shadow has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:ring-control",
                    selected ? "ring-2 ring-foreground" : "ring-separator"
                  )}
                  data-testid={`doit-method-${m.code}`}
                >
                  <span className="flex items-center gap-stack-sm">
                    <input type="radio" name="doit-method" className="size-4 shrink-0 accent-foreground" checked={selected} disabled={disabled} onChange={() => onChange({ rail: m.rail, va_bank: m.bank })} />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{m.rail === "qris" ? t.qris : (bankNames[m.bank ?? ""] ?? m.label)}</span>
                      {m.rail === "qris" && <span className="text-xs text-muted">{t.qrisHint}</span>}
                    </span>
                  </span>
                  <span className="flex flex-col items-end whitespace-nowrap text-xs text-muted">
                    <span>{fee}</span>
                    {!disabled && customerFee > 0 && m.total_amount !== null && <span className="text-foreground">{t.totalWithFee(rupiah(m.total_amount))}</span>}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}
      <p className="text-xs text-muted">{t.feeNote}</p>
    </div>
  )
}
