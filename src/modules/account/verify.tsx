"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { confirmEmailVerification } from "@lib/data/customer"
import { type Dictionary } from "@lib/i18n/dictionaries"
import { marketPath } from "@lib/util/market"
import { ButtonLink } from "@modules/ds"

type State = "verifying" | "success" | "error"

/** Confirms the single-use token once (guarded against Strict Mode's double effect) and shows the result */
export default function VerifyAccount({ labels: t }: { labels: Dictionary["account"]["verify"] }) {
  const token = useSearchParams().get("token")
  const { countryCode } = useParams() as { countryCode: string }
  const [state, setState] = useState<State>("verifying")
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (!token) {
      queueMicrotask(() => setState("error"))
      return
    }
    confirmEmailVerification(token).then(({ success }) => setState(success ? "success" : "error"))
  }, [token])

  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-stack-md rounded-media bg-default p-stack-lg" data-testid="verify-account-page" data-state={state}>
      <h1 className="type-h2">{t.title}</h1>
      <p className="text-sm text-muted">{state === "verifying" ? t.verifying : state === "success" ? t.success : t.failed}</p>
      {state !== "verifying" && <ButtonLink href={marketPath(countryCode, "/account")}>{t.signIn}</ButtonLink>}
    </div>
  )
}
