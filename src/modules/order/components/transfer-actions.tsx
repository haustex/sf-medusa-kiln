"use client"

import { useState } from "react"

import { acceptTransferRequest, declineTransferRequest } from "@lib/data/orders"
import { fill } from "@lib/i18n/fill"
import { Button } from "@modules/common/components/ui"

type Result = "accepted" | "declined" | "error" | null
export type TransferActionLabels = { accept: string; decline: string; accepted: string; declined: string; error: string }

/** Accept / decline buttons for a Medusa order transfer request (server actions, POST: never on the GET of the link) */
export default function TransferActions({ id, token, n, labels: t }: { id: string; token: string; n: string; labels: TransferActionLabels }) {
  const [pending, setPending] = useState<"accept" | "decline" | null>(null)
  const [result, setResult] = useState<Result>(null)

  const run = async (kind: "accept" | "decline") => {
    setPending(kind)
    const { success } = await (kind === "accept" ? acceptTransferRequest(id, token) : declineTransferRequest(id, token))
    setResult(success ? (kind === "accept" ? "accepted" : "declined") : "error")
    setPending(null)
  }

  if (result === "accepted" || result === "declined") {
    return (
      <p className="rounded-md bg-default px-3 py-2 text-sm" role="status" data-testid="transfer-result">
        {result === "accepted" ? fill(t.accepted, { n }) : t.declined}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-stack-sm">
      <div className="flex flex-wrap gap-stack-sm">
        <Button onClick={() => run("accept")} isLoading={pending === "accept"} disabled={!!pending} data-testid="transfer-accept">
          {t.accept}
        </Button>
        <Button variant="secondary" onClick={() => run("decline")} isLoading={pending === "decline"} disabled={!!pending} data-testid="transfer-decline">
          {t.decline}
        </Button>
      </div>
      {result === "error" && (
        <p className="text-sm text-danger" role="alert">
          {t.error}
        </p>
      )}
    </div>
  )
}
