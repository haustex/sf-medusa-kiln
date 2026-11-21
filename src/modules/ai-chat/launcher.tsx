"use client"

import { cn } from "@heroui/styles"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

import type { AiChatProps } from "./types"

const Panel = dynamic(() => import("./panel"), { ssr: false })
const load = () => void import("./panel")

/**
 * The round glass button bottom right. It stacks above whatever carries `data-k-dock` (the market banner, the
 * product page's phone sticky bar) by summing their visible heights into --k-dock, re-measured on the `k:dock`
 * event those elements dispatch and on resize. On a market with the banner (`waitForDock`) the button stays
 * invisible until the banner has decided whether it shows (its `k:dock`, sent before paint), so the button appears
 * once, in its final place, instead of jumping up when the banner comes in (that jump was a layout shift). The
 * panel's code is fetched on hover/focus and on the first click; nothing of it is part of the page load.
 */
export default function Launcher(props: AiChatProps) {
  const [open, setOpen] = useState(false)
  const [armed, setArmed] = useState(false)
  const [shown, setShown] = useState(!props.waitForDock)

  useEffect(() => {
    const root = document.documentElement
    const measure = () => {
      let px = 0
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-k-dock]"))) {
        if (el.inert || el.getAttribute("aria-hidden") === "true" || !el.offsetHeight) continue
        px += el.offsetHeight + 8
      }
      if (px) root.style.setProperty("--k-dock", `${px}px`)
      else root.style.removeProperty("--k-dock")
    }
    const onDock = () => {
      measure()
      setShown(true)
    }
    measure()
    window.addEventListener("k:dock", onDock)
    window.addEventListener("resize", measure)
    return () => {
      window.removeEventListener("k:dock", onDock)
      window.removeEventListener("resize", measure)
      root.style.removeProperty("--k-dock")
    }
  }, [])

  const openPanel = () => {
    setArmed(true)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        onPointerEnter={load}
        onFocus={load}
        aria-label={props.labels.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid="ai-chat-launcher"
        className={cn("glass fixed right-4 z-50 inline-flex size-14 items-center justify-center rounded-full shadow-lift outline-none focus-visible:ring-2 focus-visible:ring-focus sm:right-6", !shown && "invisible")}
        style={{ bottom: "calc(1rem + var(--k-dock, 0px) + env(safe-area-inset-bottom, 0px))" }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12.5c0 3.9-3.6 7-8 7-1 0-2-.2-2.9-.5L4 20.5l1.1-3.6A6.5 6.5 0 0 1 4 12.5c0-3.9 3.6-7 8-7s8 3.1 8 7Z" />
          <path d="M9 11.5h.01M12 11.5h.01M15 11.5h.01" strokeWidth="2.2" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 rounded-full bg-foreground px-1.5 text-xs font-semibold leading-[1.25rem] text-background">{props.labels.badge}</span>
      </button>
      {armed && <Panel {...props} open={open} onClose={() => setOpen(false)} />}
    </>
  )
}
