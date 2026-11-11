"use client"

import { useState } from "react"

import { Sheet } from "@modules/ds"

/** Buttons that open each Sheet side (the /design page only). */
export default function SheetDemo() {
  const [side, setSide] = useState<"left" | "right" | "bottom" | "center" | null>(null)
  return (
    <div className="flex flex-wrap gap-stack-sm">
      {(["left", "right", "bottom", "center"] as const).map((s) => (
        <button key={s} type="button" onClick={() => setSide(s)} className="h-11 rounded-md border border-control px-4 text-sm font-medium hover:border-foreground">
          Sheet {s}
        </button>
      ))}
      {side && (
        <Sheet open onClose={() => setSide(null)} side={side} label={`Sheet ${side}`} title={`Sheet ${side}`}>
          <p className="type-body text-muted">Frost surface on a native dialog: focus trap, Escape, backdrop click. Radius.sheet on the open edges, shadow-lift.</p>
        </Sheet>
      )}
    </div>
  )
}
