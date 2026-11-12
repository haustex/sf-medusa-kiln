"use client"

import { useParams } from "next/navigation"
import { Fragment, useActionState, useState } from "react"

import { login, signup } from "@lib/data/customer"
import { fill } from "@lib/i18n/fill"
import { type Dictionary } from "@lib/i18n/dictionaries"
import { marketPath } from "@lib/util/market"
import config from "@theme"
import Input from "@modules/common/components/input"
import Link from "@modules/common/components/app-link"
import { Button } from "@modules/common/components/ui"

/**
 * Sign in / create account in one card (one toggles to the other). Both post to the customer server actions; on
 * success the action revalidates the customer and the account layout re-renders signed in. When the backend
 * requires e-mail verification the action says so and the card shows where the link went.
 */
type Labels = { account: Dictionary["account"]; /** title of the e-mail field's validity hint */ emailInvalid: string }

export default function Auth({ labels }: { labels: Labels }) {
  const [view, setView] = useState<"login" | "register">("login")
  return view === "login" ? <LoginForm labels={labels} onRegister={() => setView("register")} /> : <RegisterForm labels={labels} onLogin={() => setView("login")} />
}

function Message({ children, testId }: { children: React.ReactNode; testId: string }) {
  return (
    <p className="rounded-md bg-background p-stack-md text-sm" role="status" data-testid={testId}>
      {children}
    </p>
  )
}

function LoginForm({ labels, onRegister }: { labels: Labels; onRegister: () => void }) {
  const t = labels.account
  const [message, formAction, pending] = useActionState(login, null)
  return (
    <div className="flex flex-col gap-stack-lg" data-testid="login-page">
      <div className="flex flex-col gap-stack-xs">
        <h1 className="type-h2">{t.login.title}</h1>
        <p className="text-sm text-muted">{t.login.intro}</p>
      </div>
      {message?.state === "verification_required" && <Message testId="login-verification-message">{fill(t.login.verify, { email: message.email })}</Message>}
      <form action={formAction} className="flex flex-col gap-stack-md">
        <div className="flex flex-col gap-stack-sm">
          <Input label={t.email} name="email" type="email" title={labels.emailInvalid} autoComplete="email" required data-testid="email-input" />
          <Input label={t.password} name="password" type="password" autoComplete="current-password" required data-testid="password-input" toggleLabels={{ show: t.showPassword, hide: t.hidePassword }} />
        </div>
        {message?.state === "error" && (
          <p className="text-sm text-danger" role="alert" data-testid="login-error-message">
            {t.login.failed}
          </p>
        )}
        <Button type="submit" size="large" isLoading={pending} data-testid="sign-in-button">
          {t.login.submit}
        </Button>
      </form>
      <p className="text-center text-sm text-muted">
        {t.login.noAccount}{" "}
        <button type="button" onClick={onRegister} className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4" data-testid="register-button">
          {t.login.register}
        </button>
      </p>
    </div>
  )
}

function RegisterForm({ labels, onLogin }: { labels: Labels; onLogin: () => void }) {
  const t = labels.account
  const { countryCode } = useParams() as { countryCode: string }
  const [message, formAction, pending] = useActionState(signup, null)
  const link = (href: string, label: string) => (
    <Link href={marketPath(countryCode, href)} prefetch={false} className="font-medium text-foreground underline underline-offset-4">
      {label}
    </Link>
  )
  const consent = fill(t.register.consent, { brand: config.brand.name })
    .split(/(\{terms\}|\{privacy\})/)
    .map((part, i) => <Fragment key={i}>{part === "{terms}" ? link("/terms", t.register.terms) : part === "{privacy}" ? link("/privacy", t.register.privacy) : part}</Fragment>)

  return (
    <div className="flex flex-col gap-stack-lg" data-testid="register-page">
      <div className="flex flex-col gap-stack-xs">
        <h1 className="type-h2">{t.register.title}</h1>
        <p className="text-sm text-muted">{t.register.intro}</p>
      </div>
      {message?.state === "verification_required" && <Message testId="register-verification-message">{fill(t.register.verify, { email: message.email })}</Message>}
      <form action={formAction} className="flex flex-col gap-stack-md">
        <div className="flex flex-col gap-stack-sm">
          <div className="grid grid-cols-2 gap-stack-sm">
            <Input label={t.firstName} name="first_name" required autoComplete="given-name" data-testid="first-name-input" />
            <Input label={t.lastName} name="last_name" required autoComplete="family-name" data-testid="last-name-input" />
          </div>
          <Input label={t.email} name="email" required type="email" title={labels.emailInvalid} autoComplete="email" data-testid="email-input" />
          <Input label={t.phone} name="phone" type="tel" autoComplete="tel" data-testid="phone-input" />
          <Input label={t.password} name="password" required minLength={8} type="password" autoComplete="new-password" data-testid="password-input" toggleLabels={{ show: t.showPassword, hide: t.hidePassword }} />
        </div>
        {message?.state === "error" && (
          <p className="text-sm text-danger" role="alert" data-testid="register-error">
            {t.register.failed}
          </p>
        )}
        <p className="text-xs text-muted">{consent}</p>
        <Button type="submit" size="large" isLoading={pending} data-testid="register-submit">
          {t.register.submit}
        </Button>
      </form>
      <p className="text-center text-sm text-muted">
        {t.register.haveAccount}{" "}
        <button type="button" onClick={onLogin} className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4">
          {t.register.login}
        </button>
      </p>
    </div>
  )
}
