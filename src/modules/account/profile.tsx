"use client"

import { HttpTypes } from "@medusajs/types"
import { useState, useTransition } from "react"

import { updateCustomer } from "@lib/data/customer"
import { type Dictionary } from "@lib/i18n/dictionaries"
import Input from "@modules/common/components/input"
import { Button } from "@modules/common/components/ui"

/**
 * Account → Profile: name and phone as editable rows (Edit opens the fields under the value, Save posts to
 * updateCustomer), the e-mail read-only (Medusa's store API doesn't change it).
 */
type T = Dictionary["account"]

export default function Profile({ customer, labels: t }: { customer: HttpTypes.StoreCustomer; labels: T }) {
  return (
    <div className="flex flex-col divide-y divide-separator rounded-media bg-default px-stack-lg" data-testid="profile-page-wrapper">
      <Row t={t} label={t.name} value={[customer.first_name, customer.last_name].filter(Boolean).join(" ")} testId="account-name-editor" fields={["first_name", "last_name"]}>
        <div className="grid grid-cols-2 gap-gutter">
          <Input label={t.firstName} name="first_name" required defaultValue={customer.first_name ?? ""} autoComplete="given-name" data-testid="first-name-input" />
          <Input label={t.lastName} name="last_name" required defaultValue={customer.last_name ?? ""} autoComplete="family-name" data-testid="last-name-input" />
        </div>
      </Row>
      <div className="flex flex-col gap-stack-xs py-stack-md" data-testid="account-email">
        <span className="text-sm text-muted">{t.email}</span>
        <span className="font-medium [overflow-wrap:anywhere]">{customer.email}</span>
      </div>
      <Row t={t} label={t.phone} value={customer.phone ?? ""} testId="account-phone-editor" fields={["phone"]}>
        <Input label={t.phone} name="phone" type="tel" defaultValue={customer.phone ?? ""} autoComplete="tel" data-testid="phone-input" />
      </Row>
    </div>
  )
}

function Row({ t, label, value, fields, children, testId }: { t: T; label: string; value: string; fields: string[]; children: React.ReactNode; testId: string }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body = Object.fromEntries(fields.map((f) => [f, String(fd.get(f) ?? "").trim()])) as HttpTypes.StoreUpdateCustomer
    setError(false)
    startTransition(async () => {
      try {
        await updateCustomer(body)
        setSaved(true)
        setOpen(false)
      } catch (err) {
        console.error("[account] update customer", err)
        setError(true)
      }
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-stack-sm py-stack-md" data-testid={testId}>
      <div className="flex items-start justify-between gap-stack-md">
        <div className="flex min-w-0 flex-col gap-stack-xs">
          <span className="text-sm text-muted">{label}</span>
          <span className="font-medium [overflow-wrap:anywhere]" data-testid="current-info">
            {value || "–"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setSaved(false)
            setError(false)
            setOpen((o) => !o)
          }}
          className="inline-flex h-11 shrink-0 items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="edit-button"
          data-active={open}
        >
          {open ? t.cancel : t.edit}
        </button>
      </div>
      {saved && !open && (
        <p className="w-fit rounded-full bg-background px-3 py-1 text-xs font-medium" role="status" data-testid="success-message">
          {t.saved}
        </p>
      )}
      {open && (
        <div className="flex flex-col gap-stack-md">
          {children}
          {error && (
            <p className="text-sm text-danger" role="alert" data-testid="error-message">
              {t.error}
            </p>
          )}
          <Button type="submit" isLoading={pending} className="sm:self-end" data-testid="save-button">
            {t.save}
          </Button>
        </div>
      )}
    </form>
  )
}
