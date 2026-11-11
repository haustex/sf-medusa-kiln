"use client"

import Form from "next/form"

/**
 * Submit a filter form without its empty fields (blank price, the default sort), so the URL only carries real
 * filters. Disabled controls are left out of a submission; they are enabled again right after.
 */
export function submitFilters(form: HTMLFormElement) {
  const muted: (HTMLInputElement | HTMLSelectElement)[] = []
  for (const el of Array.from(form.elements)) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement) || el.disabled || !el.name) continue
    const empty = el.value === "" || (el.name === "sort" && el.value === "created_at")
    if (empty) {
      el.disabled = true
      muted.push(el)
    }
  }
  form.requestSubmit()
  for (const el of muted) el.disabled = false
}

/**
 * The filter form's <form>: a plain GET form (works without JS: Enter / the noscript Apply button) that next/form
 * turns into a client-side navigation. With JS every change submits at once; number fields on blur, so typing a
 * price does not navigate per keystroke. `scroll={false}` keeps the page where it is while the grid updates.
 */
export default function FilterFormShell({ id, action, className, children }: { id: string; action: string; className?: string; children: React.ReactNode }) {
  return (
    <Form
      id={id}
      action={action}
      scroll={false}
      className={className}
      onChange={(e) => {
        const el = e.target as EventTarget | null
        if (el instanceof HTMLInputElement && el.type === "number") return
        submitFilters(e.currentTarget)
      }}
      onBlur={(e) => {
        const el = e.target as EventTarget | null
        if (el instanceof HTMLInputElement && el.type === "number" && el.value !== el.defaultValue) submitFilters(e.currentTarget)
      }}
    >
      {children}
    </Form>
  )
}
