"use client"

import { HttpTypes } from "@medusajs/types"
import { useActionState, useState } from "react"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { Button } from "@modules/common/components/ui"

export type AddressLabels = {
  email: string
  emailInvalid: string
  firstName: string
  lastName: string
  address: string
  apartment: string
  city: string
  province: string
  postalCode: string
  country: string
  phone: string
  sameBilling: string
  billingAddress: string
  savedAddresses: string
  newAddress: string
  continueDelivery: string
  errorAddress: string
}

type Address = Partial<HttpTypes.StoreCartAddress>
type Fields = Record<string, string>

const SHIPPING_KEYS = ["first_name", "last_name", "address_1", "address_2", "city", "province", "postal_code", "country_code", "phone"] as const

const fromAddress = (prefix: string, a?: Address | null, fallbackCountry = ""): Fields =>
  Object.fromEntries(SHIPPING_KEYS.map((k) => [`${prefix}.${k}`, (a?.[k] as string | null | undefined) ?? (k === "country_code" ? fallbackCountry : "")]))

/**
 * Contact + shipping address (+ billing when not the same). A plain form posted to the setAddresses server action
 * (works without JavaScript); the inputs are controlled only so a saved address can fill them in.
 */
export default function AddressForm({ cart, customer, market, labels: t }: { cart: HttpTypes.StoreCart; customer: HttpTypes.StoreCustomer | null; market: string; labels: AddressLabels }) {
  const countries = (cart.region?.countries ?? []).map((c) => ({ value: c.iso_2 ?? "", label: c.display_name ?? c.iso_2 ?? "" }))
  const defaultCountry = countries.length === 1 ? countries[0].value : ""
  const [shipping, setShipping] = useState<Fields>(() => fromAddress("shipping_address", cart.shipping_address, defaultCountry))
  const [email, setEmail] = useState(cart.email ?? customer?.email ?? "")
  const [sameBilling, setSameBilling] = useState(() => !cart.billing_address || !cart.shipping_address || compareAddresses(cart.shipping_address, cart.billing_address))
  const [billing, setBilling] = useState<Fields>(() => fromAddress("billing_address", cart.billing_address, defaultCountry))
  const [message, formAction, pending] = useActionState(setAddresses, null)

  const saved = (customer?.addresses ?? []).filter((a) => countries.some((c) => c.value === a.country_code))
  const current = Object.fromEntries(Object.entries(shipping).map(([k, v]) => [k.replace("shipping_address.", ""), v])) as unknown as HttpTypes.StoreCartAddress
  const selectedSaved = saved.find((a) => compareAddresses(a, current))?.id ?? ""
  const pickSaved = (id: string) => {
    const a = saved.find((s) => s.id === id)
    if (a) setShipping(fromAddress("shipping_address", a as Address, defaultCountry))
  }

  const bind = (fields: Fields, set: (f: Fields) => void) => (name: string) => ({
    name,
    value: fields[name] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set({ ...fields, [name]: e.target.value }),
  })
  const s = bind(shipping, setShipping)
  const b = bind(billing, setBilling)

  const addressFields = (prefix: "shipping_address" | "billing_address", f: ReturnType<typeof bind>, testPrefix: string) => (
    <div className="grid grid-cols-2 gap-gutter">
      <Input label={t.firstName} autoComplete="given-name" required {...f(`${prefix}.first_name`)} data-testid={`${testPrefix}-first-name-input`} />
      <Input label={t.lastName} autoComplete="family-name" required {...f(`${prefix}.last_name`)} data-testid={`${testPrefix}-last-name-input`} />
      <div className="col-span-2">
        <Input label={t.address} autoComplete="address-line1" required {...f(`${prefix}.address_1`)} data-testid={`${testPrefix}-address-input`} />
      </div>
      <div className="col-span-2">
        <Input label={t.apartment} autoComplete="address-line2" {...f(`${prefix}.address_2`)} data-testid={`${testPrefix}-address-2-input`} />
      </div>
      <Input label={t.city} autoComplete="address-level2" required {...f(`${prefix}.city`)} data-testid={`${testPrefix}-city-input`} />
      <Input label={t.province} autoComplete="address-level1" {...f(`${prefix}.province`)} data-testid={`${testPrefix}-province-input`} />
      <Input label={t.postalCode} autoComplete="postal-code" required {...f(`${prefix}.postal_code`)} data-testid={`${testPrefix}-postal-code-input`} />
      <NativeSelect placeholder={t.country} aria-label={t.country} autoComplete="country" required {...f(`${prefix}.country_code`)} data-testid={`${testPrefix}-country-select`}>
        {countries.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </NativeSelect>
      <div className="col-span-2">
        <Input label={t.phone} type="tel" autoComplete="tel" {...f(`${prefix}.phone`)} data-testid={`${testPrefix}-phone-input`} />
      </div>
    </div>
  )

  return (
    <form action={formAction} className="flex flex-col gap-stack-lg" data-testid="address-form">
      <Input label={t.email} name="email" type="email" title={t.emailInvalid} autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="shipping-email-input" />

      {saved.length > 0 && (
        <NativeSelect placeholder={t.newAddress} aria-label={t.savedAddresses} value={selectedSaved} onChange={(e) => pickSaved(e.target.value)} data-testid="shipping-address-select">
          {saved.map((a) => (
            <option key={a.id} value={a.id}>
              {[a.first_name, a.last_name].filter(Boolean).join(" ")} · {a.address_1}, {a.city}
            </option>
          ))}
        </NativeSelect>
      )}

      {addressFields("shipping_address", s, "shipping")}

      {/* In its own div: the floating-label rule (globals.css, `input ~ label`) must not reach this label */}
      <div>
        <label className="flex cursor-pointer items-center gap-stack-sm text-sm">
          <input type="checkbox" name="same_as_billing" checked={sameBilling} onChange={(e) => setSameBilling(e.target.checked)} className="k-check" data-testid="billing-address-checkbox" />
          {t.sameBilling}
        </label>
      </div>

      {!sameBilling && (
        <div className="flex flex-col gap-stack-md">
          <h3 className="font-medium">{t.billingAddress}</h3>
          {addressFields("billing_address", b, "billing")}
        </div>
      )}

      {message && (
        <p className="text-sm text-danger" role="alert" data-testid="address-error-message">
          {t.errorAddress}
        </p>
      )}
      <Button type="submit" size="large" isLoading={pending} className="sm:self-start sm:px-8" data-testid="submit-address-button">
        {t.continueDelivery}
      </Button>
      {/* Last on purpose, see the note above the checkbox */}
      <input type="hidden" name="market" value={market} />
    </form>
  )
}
