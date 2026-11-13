"use client"

import { buttonVariants, cn } from "@heroui/styles"
import { HttpTypes } from "@medusajs/types"
import { unstable_rethrow, useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { useCallback, useEffect, useRef, useState } from "react"

import { placeOrder } from "@lib/data/cart"
import { type DoitPaymentStatus, getDoitPaymentStatus, selectDoitMethod } from "@lib/data/doit"
import { Button } from "@modules/common/components/ui"

import { remaining, rupiah } from "./format"
import { bankNames, type DoitLabels } from "./labels"

const ERROR_RETRY_MS = 10_000

/**
 * "Waiting for payment" panel: QRIS code or VA number, countdown to expires_at, a link to the hosted page, and
 * polling of GET /store/doit/carts/:id/payment. Once doit.id reports the payment as paid it places the order
 * (placeOrder redirects to the confirmation page; if the webhook completed the cart first, Medusa returns that order).
 */
export default function DoitPaymentPanel({ cart, providerId, labels: t, redirectToHosted = false }: { cart: HttpTypes.StoreCart; providerId: string; labels: DoitLabels; redirectToHosted?: boolean }) {
  const router = useRouter()
  const [state, setState] = useState<DoitPaymentStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The latest poll(), for the timer it schedules itself with
  const pollRef = useRef<() => Promise<void>>(async () => {})
  const placing = useRef(false)
  const redirected = useRef(false)

  const finish = useCallback(async () => {
    if (placing.current) return
    placing.current = true
    try {
      await placeOrder(cart.id) // redirects to the confirmation page by throwing
    } catch (e) {
      unstable_rethrow(e)
      placing.current = false
      setError(t.errorGeneric)
    }
  }, [cart.id, t.errorGeneric])

  const poll = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    const res = await getDoitPaymentStatus(cart.id)
    let next: number | null = ERROR_RETRY_MS
    if (res.ok) {
      setState(res.data)
      setError(null)
      next = res.data.poll_after_ms
      if (res.data.next_action === "complete_cart" || res.data.next_action === "view_order") {
        next = null
        void finish()
      }
    } else {
      setError(t.errorGeneric)
      // 429: the backend asks to slow down
      next = res.status === 429 ? ERROR_RETRY_MS * 3 : ERROR_RETRY_MS
    }
    if (next !== null && document.visibilityState === "visible") timer.current = setTimeout(() => void pollRef.current(), next)
  }, [cart.id, finish, t.errorGeneric])
  pollRef.current = poll

  useEffect(() => {
    void poll()
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [poll])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const p = state?.payment
  useEffect(() => {
    if (redirectToHosted && p?.hosted_url && state?.next_action === "wait" && !redirected.current) {
      redirected.current = true
      window.location.assign(p.hosted_url)
    }
  }, [redirectToHosted, p?.hosted_url, state?.next_action])

  const newInvoice = async () => {
    if (!p?.rail) return
    setBusy(true)
    const res = await selectDoitMethod(cart, providerId, { rail: p.rail as "qris" | "va" | "transfer", va_bank: p.va_bank }, window.location.href, { force: true })
    setBusy(false)
    if (!res.ok) {
      setError(res.message || t.errorStart)
      return
    }
    router.refresh()
    void poll()
  }

  if (!state) {
    return (
      <p className="text-sm text-muted" data-testid="doit-panel-loading">
        {error ?? t.loading}
      </p>
    )
  }

  const expiresAt = p?.expires_at ? new Date(p.expires_at).getTime() : null
  const isExpired = expiresAt !== null && expiresAt <= now
  const total = p?.total_amount ?? p?.amount
  const customerFee = p?.fee_payer === "customer" && p.fee_amount ? p.fee_amount : 0
  const done = state.next_action === "complete_cart" || state.next_action === "view_order"
  const retry = state.next_action === "retry"
  const waiting = !done && !retry

  return (
    <div className="flex flex-col gap-stack-lg rounded-media border border-separator bg-background p-stack-md sm:p-stack-lg" data-testid="doit-payment-panel">
      <div className="flex flex-wrap items-center justify-between gap-stack-sm">
        <h3 className="text-lg font-medium">{t.payTitle}</h3>
        {p?.environment === "test" && <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium ring-1 ring-inset ring-control">{t.testMode}</span>}
      </div>

      <div className="flex flex-col gap-stack-xs">
        <p className="text-sm text-muted">{t.totalToPay}</p>
        <p className="type-h2 tabular-nums" data-testid="doit-total">
          {rupiah(total)}
        </p>
        {customerFee > 0 && <p className="text-sm text-muted">{t.includesFee(rupiah(customerFee))}</p>}
      </div>

      {waiting && state.qr_expired && p?.hosted_url && (
        <div className="flex flex-col items-start gap-stack-md rounded-media border border-separator bg-surface p-stack-md" data-testid="doit-qr-expired">
          <p className="max-w-sm text-sm">{t.qrExpired}</p>
          <a href={p.hosted_url} className={cn(buttonVariants({ variant: "primary" }), "h-11 px-5")}>
            {t.continueHosted}
          </a>
        </div>
      )}

      {waiting && p?.qr_content && (
        <div className="flex flex-col items-center gap-stack-sm sm:items-start">
          <div className="rounded-media border border-separator bg-surface p-stack-sm" data-testid="doit-qris">
            <QRCodeSVG value={p.qr_content} size={220} level="M" marginSize={2} title="QRIS" />
          </div>
          <p className="max-w-sm text-center text-sm text-muted sm:text-left">{t.scanQris}</p>
        </div>
      )}

      {waiting && p?.va_number && (
        <div className="flex flex-col gap-stack-sm" data-testid="doit-va">
          <p className="text-sm text-muted">{t.vaNumber(bankNames[p.va_bank ?? ""] ?? (p.va_bank ?? "").toUpperCase())}</p>
          <div className="flex items-center justify-between gap-stack-sm rounded-lg border border-separator bg-surface py-stack-sm pl-stack-md pr-stack-sm">
            <span className="min-w-0 whitespace-nowrap font-mono text-lg tabular-nums sm:text-2xl sm:tracking-wider" data-testid="doit-va-number">
              {p.va_number}
            </span>
            <CopyButton value={p.va_number} labels={t} />
          </div>
          <p className="max-w-sm text-sm text-muted">{t.vaHint}</p>
        </div>
      )}

      <div className="flex flex-col gap-stack-sm border-t border-separator pt-stack-md sm:flex-row sm:items-center sm:justify-between">
        <div className={cn("flex items-center gap-stack-sm text-sm", retry ? "text-danger" : done ? "text-foreground" : "text-muted")} data-testid="doit-status" role="status" aria-live="polite">
          {waiting && (
            <span aria-hidden="true" className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/40 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-foreground" />
            </span>
          )}
          <span>{done ? t.paid : retry ? t.failed : t.waiting}</span>
        </div>
        {waiting && expiresAt !== null && (
          <div className="flex items-baseline gap-stack-sm text-sm" data-testid="doit-countdown">
            <span className="text-muted">{isExpired ? t.expired : t.expiresIn}</span>
            {!isExpired && (
              <span className="font-mono font-medium tabular-nums" suppressHydrationWarning>
                {remaining(expiresAt, now)}
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {(retry || (waiting && p?.hosted_url)) && (
        <div className="flex flex-wrap items-center gap-stack-md">
          {retry && (
            <Button onClick={newInvoice} isLoading={busy} className="h-11 px-5" data-testid="doit-new-invoice">
              {t.newInvoice}
            </Button>
          )}
          {waiting && p?.hosted_url && (
            <a href={p.hosted_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center text-sm underline underline-offset-4 hover:text-muted" data-testid="doit-hosted-link">
              {t.openHosted}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function CopyButton({ value, labels: t }: { value: string; labels: DoitLabels }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Older browsers / plain http: a hidden textarea
      const el = document.createElement("textarea")
      el.value = value
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      el.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="secondary" size="small" onClick={copy} className="h-9 shrink-0 px-4" data-testid="doit-copy-va">
      {copied ? t.copied : t.copy}
    </Button>
  )
}
