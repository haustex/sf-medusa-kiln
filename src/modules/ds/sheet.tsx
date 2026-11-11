"use client"

import { cn } from "@heroui/styles"
import { useEffect, useRef } from "react"

/**
 * Floating sheet on a native <dialog> (focus trap, Escape, backdrop and inert page for free; no overlay library).
 * Frost surface (theme.config.ts `frost`), radius.sheet on the open edges.
 *   side "left"/"right": full-height drawer (phone menu, cart drawer)
 *   side "bottom": bottom sheet on phones that becomes a centred dialog from sm (quick view, filters)
 *   side "center": centred dialog everywhere
 * Rendered only while open, so closed sheets cost nothing. `label` names the dialog for screen readers.
 */
export default function Sheet({
  open,
  onClose,
  side = "right",
  label,
  title,
  closeLabel = "Close",
  className,
  children,
}: {
  open: boolean
  onClose: () => void
  side?: "left" | "right" | "bottom" | "center"
  label: string
  title?: React.ReactNode
  closeLabel?: string
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    if (!dialog.open) dialog.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
      if (dialog.open) dialog.close()
    }
  }, [open])

  if (!open) return null
  return (
    <dialog
      ref={ref}
      aria-label={title ? undefined : label}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={cn(
        "k-sheet frost fixed m-0 max-h-none max-w-none bg-transparent p-0 text-foreground shadow-lift backdrop:bg-foreground/40 open:flex open:flex-col",
        side === "left" && "inset-y-0 left-0 h-dvh w-[min(22rem,88vw)] rounded-r-sheet",
        side === "right" && "inset-y-0 right-0 left-auto h-dvh w-[min(26rem,92vw)] rounded-l-sheet",
        side === "bottom" && "inset-x-0 bottom-0 top-auto max-h-[92dvh] w-full rounded-t-sheet sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[90dvh] sm:w-[min(44rem,92vw)] sm:rounded-sheet",
        side === "center" && "inset-0 m-auto h-fit max-h-[90dvh] w-[min(36rem,92vw)] rounded-sheet",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-stack-md border-b border-separator px-stack-lg py-stack-sm">
        {title ? <h2 className="type-h3">{title}</h2> : <span />}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-full outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-stack-lg py-stack-md">{children}</div>
    </dialog>
  )
}
