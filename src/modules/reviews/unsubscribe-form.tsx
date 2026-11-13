"use client"

import { useState } from "react"

import { Button } from "@modules/common/components/ui"

/** One click confirms the opt-out (a mail scanner that prefetches the link unsubscribes nobody) */
export default function UnsubscribeForm({ token, labels }: { token: string; labels: { confirm: string; done: string; invalid: string } }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "invalid">("idle")
  const go = async () => {
    setState("busy")
    try {
      const r = await fetch("/api/reviews/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) })
      const data = (await r.json().catch(() => ({}))) as { unsubscribed?: boolean }
      setState(data.unsubscribed ? "done" : "invalid")
    } catch {
      setState("invalid")
    }
  }
  if (state === "done") {
    return (
      <p className="rounded-media bg-default p-stack-md text-sm" role="status" data-testid="unsubscribe-done">
        {labels.done}
      </p>
    )
  }
  if (state === "invalid") {
    return (
      <p className="text-sm text-danger" role="alert" data-testid="unsubscribe-invalid">
        {labels.invalid}
      </p>
    )
  }
  return (
    <Button type="button" onClick={go} isLoading={state === "busy"} className="self-start" data-testid="unsubscribe-confirm">
      {labels.confirm}
    </Button>
  )
}
