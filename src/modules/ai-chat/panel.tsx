"use client"

import { buttonVariants, cn } from "@heroui/styles"
import { ArrowUp, ThumbsDown, ThumbsUp } from "lucide-react"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"

import { fill } from "@lib/i18n/fill"
import { marketPath } from "@lib/util/market"
import Link from "@modules/common/components/app-link"
import { Sheet } from "@modules/ds"
import { ICON } from "@modules/ds/icons"
import ProductImage from "@modules/ds/product-image"

import { readSse } from "./sse"
import type { AiChatProps, ChatMessage, ProductCard } from "./types"

type Session = { id: string; token: string; countryCode: string }
type Stored = { session: Session | null; messages: ChatMessage[]; turnsLeft: number | null }

const CONSENT_KEY = "kiln_ai_chat_consent"
const STORE_KEY = "kiln_ai_chat"
const MAX_ROWS_PX = 120
let seq = 0

const readStore = (countryCode: string): Stored => {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY)
    if (raw) {
      const s = JSON.parse(raw) as Stored
      // A conversation belongs to one market: the other market starts fresh (language, currency)
      if (!s.session || s.session.countryCode === countryCode) return { ...s, messages: s.messages.map((m) => ({ ...m, pending: false })) }
    }
  } catch {}
  return { session: null, messages: [], turnsLeft: null }
}
const writeStore = (s: Stored) => {
  try {
    window.sessionStorage.setItem(STORE_KEY, JSON.stringify({ ...s, messages: s.messages.slice(-40) }))
  } catch {}
}
const hasConsent = () => {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "1"
  } catch {
    return false
  }
}

const post = (url: string, body: unknown) => fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify(body) })

/**
 * The chat panel (loaded by ./launcher on the first click): a right frost sheet with the consent notice before the
 * first message, the greeting, the streamed answers with product cards and thumbs, the "Chat with our team" link
 * (WhatsApp, with a server-made summary once a conversation exists) and the team's hours. Everything goes through
 * /api/ai-chat/* (app/api/ai-chat). The conversation survives navigation in sessionStorage; consent in localStorage.
 */
export default function Panel({ open, onClose, countryCode, currencyCode, regionId, pathPrefix, privacyHref, config, labels: t }: AiChatProps & { open: boolean; onClose: () => void }) {
  const [consent, setConsent] = useState(hasConsent)
  const [store, setStore] = useState<Stored>(() => readStore(countryCode))
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState<string | null>(config.over_budget ? t.overBudget : null)
  const [notice, setNotice] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { session, messages, turnsLeft } = store

  useEffect(() => writeStore(store), [store])
  useEffect(() => {
    // The Sheet's body scrolls, not this list: scroll the sentinel under the last bubble into view
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages, open, consent, blocked])
  useEffect(() => {
    if (open && consent && !blocked) inputRef.current?.focus()
  }, [open, consent, blocked])

  const update = useCallback((fn: (s: Stored) => Stored) => setStore((s) => fn(s)), [])
  const patch = (id: string, fn: (m: ChatMessage) => ChatMessage) => update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === id ? fn(m) : m)) }))

  const accept = () => {
    try {
      window.localStorage.setItem(CONSENT_KEY, "1")
    } catch {}
    setConsent(true)
  }

  const createSession = async (): Promise<Session> => {
    const res = await post("/api/ai-chat/sessions", { locale: config.locale, country_code: countryCode, region_id: regionId ?? undefined, currency_code: currencyCode, path_prefix: pathPrefix, page: window.location.pathname, consent: true })
    if (res.status === 429) throw new Error("rate_limited")
    if (!res.ok) throw new Error("disabled")
    const { session: s } = (await res.json()) as { session: { id: string; token: string; turns_left: number } }
    const created = { id: s.id, token: s.token, countryCode }
    update((st) => ({ ...st, session: created, turnsLeft: s.turns_left }))
    return created
  }

  const send = async (retry = false) => {
    const text = input.trim()
    if (!text || busy || blocked) return
    setNotice(null)
    setInput("")
    if (inputRef.current) inputRef.current.style.height = ""
    const n = ++seq
    const userId = `u${n}`
    const draftId = `a${n}`
    update((s) => ({ ...s, messages: [...s.messages, { id: userId, role: "user", text }, { id: draftId, role: "assistant", text: "", pending: true }] }))
    setBusy(true)
    const rollback = (message: string) => {
      update((s) => ({ ...s, messages: s.messages.filter((m) => m.id !== userId && m.id !== draftId) }))
      setInput(text)
      setNotice(message)
    }
    try {
      const s = session ?? (await createSession())
      const res = await post(`/api/ai-chat/sessions/${s.id}/messages`, { token: s.token, message: text, page: window.location.pathname })
      if (res.status === 429) return rollback(t.rateLimited)
      if (res.status === 404 && !retry) {
        // The conversation expired on the server (retention, redeploy): start a new one with the same question
        update((st) => ({ ...st, session: null, messages: st.messages.filter((m) => m.id !== userId && m.id !== draftId) }))
        setInput(text)
        setBusy(false)
        return send(true)
      }
      if (!res.ok || !res.body) return patch(draftId, (m) => ({ ...m, pending: false, error: t.failed }))
      for await (const ev of readSse(res.body)) {
        if (ev.type === "delta") patch(draftId, (m) => ({ ...m, text: m.text + ev.text }))
        else if (ev.type === "products") patch(draftId, (m) => ({ ...m, products: ev.items }))
        else if (ev.type === "handoff") patch(draftId, (m) => ({ ...m, handoff: { url: ev.url } }))
        else if (ev.type === "done") {
          update((st) => ({ ...st, turnsLeft: ev.turns_left, messages: st.messages.map((m) => (m.id === draftId ? { ...m, id: ev.message_id, pending: false } : m)) }))
          if (ev.turns_left <= 0) setBlocked(t.turnsExhausted)
        } else if (ev.type === "error") {
          if (ev.code === "over_budget") setBlocked(t.overBudget)
          else if (ev.code === "turns_exhausted") setBlocked(t.turnsExhausted)
          else if (ev.code === "message_too_long") return rollback(t.failed)
          patch(draftId, (m) => ({ ...m, pending: false, error: m.text ? undefined : ev.code === "over_budget" ? t.overBudget : ev.code === "turns_exhausted" ? t.turnsExhausted : t.failed }))
        }
      }
      patch(draftId, (m) => ({ ...m, pending: false }))
    } catch (e) {
      const code = (e as Error).message
      if (code === "rate_limited") return rollback(t.rateLimited)
      if (code === "disabled") return rollback(t.overBudget)
      patch(draftId, (m) => ({ ...m, pending: false, error: m.text ? undefined : t.failed }))
    } finally {
      setBusy(false)
    }
  }

  const feedback = async (m: ChatMessage, value: 1 | -1) => {
    if (!session) return
    const next = m.feedback === value ? 0 : value
    patch(m.id, (x) => ({ ...x, feedback: next === 0 ? undefined : next }))
    await post(`/api/ai-chat/messages/${m.id}/feedback`, { token: session.token, session_id: session.id, value: next }).catch(() => null)
  }

  const whatsappHref = config.whatsapp ? `https://wa.me/${config.whatsapp}` : null
  const toTeam = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!session || !whatsappHref) return
    e.preventDefault()
    // Opened synchronously (popup blockers), pointed at the summary link once the server has composed it
    const w = window.open("about:blank", "_blank", "noopener")
    let url = whatsappHref
    try {
      const res = await post(`/api/ai-chat/sessions/${session.id}/handoff`, { token: session.token })
      if (res.ok) url = ((await res.json()) as { handoff: { url: string } }).handoff.url
    } catch {}
    if (w) w.location.href = url
    else window.location.href = url
  }

  const reset = () => {
    setStore({ session: null, messages: [], turnsLeft: null })
    setBlocked(config.over_budget ? t.overBudget : null)
    setNotice(null)
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send()
    }
  }
  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = ""
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_PX)}px`
  }

  const consentText = t.consentBody.split(/(\{processor\}|\{privacy\})/).map((part, i) => {
    if (part === "{processor}") return <Fragment key={i}>{config.provider === "anthropic" ? t.processorAnthropic : t.processorGeneric}</Fragment>
    if (part === "{privacy}")
      return (
        <Link key={i} href={privacyHref} className="underline underline-offset-4" prefetch={false}>
          {t.privacy}
        </Link>
      )
    return <Fragment key={i}>{part}</Fragment>
  })

  const footer = (
    <div className="flex flex-col gap-stack-sm" data-testid="ai-chat-footer">
      {whatsappHref && (
        <div>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={toTeam} className="glass inline-flex h-11 w-full items-center justify-center gap-2 rounded-button px-5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus" data-testid="ai-chat-cs">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3.4 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.4.3-.7.3-1.2.2-1.4l-.5-.3-1.8-.9c-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1-.3-.1-1.1-.4-2.2-1.3-.8-.7-1.3-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5.3-.5v-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5Z" />
            </svg>
            {t.cs}
          </a>
          {config.hours && <p className="mt-stack-xs text-center text-xs text-muted">{fill(t.csHours, { hours: config.hours })}</p>}
        </div>
      )}
      {consent && !blocked && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
          className="flex items-end gap-stack-sm"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              grow(e.target)
            }}
            onKeyDown={onKey}
            rows={1}
            maxLength={config.limits.max_message_chars}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            disabled={busy}
            data-testid="ai-chat-input"
            className="field-radius min-h-11 flex-1 resize-none rounded-(--radius) border border-separator bg-background px-3 py-2.5 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus sm:text-sm"
          />
          <button type="submit" disabled={busy || !input.trim()} aria-label={t.send} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "size-11 shrink-0 rounded-full p-0")} data-testid="ai-chat-send">
            <ArrowUp {...ICON} />
          </button>
        </form>
      )}
      {notice && (
        <p role="status" className="text-xs text-muted">
          {notice}
        </p>
      )}
      <p className="text-xs text-muted">{t.disclaimer}</p>
    </div>
  )

  return (
    <Sheet open={open} onClose={onClose} side="right" label={config.name} title={<span className="inline-flex items-center gap-stack-sm">{config.name}<span className="rounded-full bg-foreground px-1.5 text-xs font-semibold leading-[1.25rem] text-background">{t.badge}</span></span>} closeLabel={t.close} footer={footer} className="k-ai-chat">
      <div className="flex h-full flex-col gap-stack-sm" data-testid="ai-chat-messages">
        {!consent ? (
          <div className="flex flex-col gap-stack-sm rounded-media border border-separator p-stack-md" data-testid="ai-chat-consent">
            <h3 className="type-h3">{t.consentTitle}</h3>
            <p className="text-sm text-muted">{consentText}</p>
            <button type="button" onClick={accept} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-stack-sm h-11 self-start px-6")} data-testid="ai-chat-start">
              {t.start}
            </button>
          </div>
        ) : (
          <>
            {config.greeting && <Bubble role="assistant" text={config.greeting} />}
            {messages.map((m) => (
              <Fragment key={m.id}>
                <Bubble role={m.role} text={m.text} pending={m.pending} error={m.error}>
                  {m.products?.length ? <Products items={m.products} countryCode={countryCode} label={t.products} soldOut={t.soldOut} /> : null}
                  {m.handoff && whatsappHref && (
                    <div className="mt-stack-sm">
                      <a href={m.handoff.url} target="_blank" rel="noopener noreferrer" className="glass inline-flex h-10 items-center gap-stack-sm rounded-button px-4 text-sm font-medium" data-testid="ai-chat-handoff">
                        {t.handoff}
                      </a>
                      <p className="mt-stack-xs text-xs text-muted">{t.handoffNote}</p>
                    </div>
                  )}
                </Bubble>
                {m.role === "assistant" && !m.pending && !m.error && m.text && !m.id.startsWith("a") && (
                  <div className="-mt-1 flex items-center gap-stack-xs pl-1" aria-live="polite">
                    <button type="button" onClick={() => feedback(m, 1)} aria-label={t.helpful} aria-pressed={m.feedback === 1} className={cn("inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-default/60", m.feedback === 1 && "text-foreground")}>
                      <ThumbsUp {...ICON} size={16} />
                    </button>
                    <button type="button" onClick={() => feedback(m, -1)} aria-label={t.notHelpful} aria-pressed={m.feedback === -1} className={cn("inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-default/60", m.feedback === -1 && "text-foreground")}>
                      <ThumbsDown {...ICON} size={16} />
                    </button>
                    {m.feedback && <span className="text-xs text-muted">{t.thanks}</span>}
                  </div>
                )}
              </Fragment>
            ))}
            {blocked && (
              <div className="rounded-media bg-default p-stack-sm text-sm" role="status" data-testid="ai-chat-blocked">
                {blocked}
              </div>
            )}
            {(messages.length > 0 || blocked) && (
              <div className="mt-auto flex items-center justify-between pt-stack-sm text-xs text-muted">
                <span>{turnsLeft !== null && !blocked ? fill(t.turnsLeft, { n: turnsLeft }) : ""}</span>
                <button type="button" onClick={reset} className="underline underline-offset-4 hover:text-foreground">
                  {t.newChat}
                </button>
              </div>
            )}
          </>
        )}
        <div ref={endRef} aria-hidden="true" />
      </div>
    </Sheet>
  )
}

function Bubble({ role, text, pending, error, children }: { role: "user" | "assistant"; text: string; pending?: boolean; error?: string; children?: React.ReactNode }) {
  const mine = role === "user"
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")} data-testid={`ai-chat-${role}`}>
      <div className={cn("max-w-[88%] rounded-media px-3 py-2 text-sm leading-relaxed", mine ? "bg-foreground text-background" : "bg-default text-foreground")}>
        {text && <p className="whitespace-pre-wrap break-words">{text}</p>}
        {pending && !text && (
          <span className="inline-flex gap-1 py-1" aria-label="…">
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
          </span>
        )}
        {error && <p className="text-muted">{error}</p>}
        {children}
      </div>
    </div>
  )
}

function Products({ items, countryCode, label, soldOut }: { items: ProductCard[]; countryCode: string; label: string; soldOut: string }) {
  return (
    <div className="mt-stack-sm" data-testid="ai-chat-products">
      <p className="mb-stack-xs text-xs text-muted">{label}</p>
      <ul className="flex flex-col gap-stack-sm">
        {items.map((p) => (
          <li key={p.handle}>
            <Link href={marketPath(countryCode, `/products/${p.handle}`)} prefetch={false} className="flex items-center gap-stack-md rounded-media border border-separator bg-background p-1.5 hover:bg-default/40">
              <ProductImage src={p.thumbnail} name={p.handle} alt="" sizes="56px" className="size-14 shrink-0 rounded-media" />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-sm font-medium">{p.title}</span>
                <span className="block text-xs text-muted">
                  {p.price}
                  {p.in_stock === false ? ` · ${soldOut}` : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
