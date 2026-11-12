"use client"

import { HttpTypes } from "@medusajs/types"
import { Plus } from "lucide-react"
import { useActionState, useEffect, useState, useTransition } from "react"

import { addCustomerAddress, deleteCustomerAddress, updateCustomerAddress } from "@lib/data/customer"
import { type Dictionary } from "@lib/i18n/dictionaries"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { Button } from "@modules/common/components/ui"
import { Sheet } from "@modules/ds"
import { ICON } from "@modules/ds/icons"

type Address = HttpTypes.StoreCustomerAddress
type T = Dictionary["account"]
type FormState = { success: boolean; error: string | null }
const INITIAL: FormState = { success: false, error: null }

/**
 * Account → Addresses: the saved addresses as cards (edit / remove) and a "new address" tile; the form opens in a
 * centred sheet and posts to the customer address server actions.
 */
export default function AddressBook({ addresses, region, labels: t }: { addresses: Address[]; region: HttpTypes.StoreRegion; labels: T }) {
  const [editing, setEditing] = useState<Address | "new" | null>(null)
  const [pending, startTransition] = useTransition()
  const [removeError, setRemoveError] = useState<string | null>(null)

  const remove = (id: string) => {
    setRemoveError(null)
    startTransition(async () => {
      try {
        await deleteCustomerAddress(id)
      } catch (e) {
        console.error("[account] delete address", e)
        setRemoveError(t.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-stack-md">
      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2">
        <button type="button" onClick={() => setEditing("new")} className="flex min-h-40 flex-col justify-between rounded-media border border-dashed border-control p-stack-md text-left transition-colors hover:border-foreground" data-testid="add-address-button">
          <span className="font-medium">{t.newAddress}</span>
          <Plus {...ICON} />
        </button>
        {addresses.map((a) => (
          <div key={a.id} className="flex min-h-40 flex-col justify-between gap-stack-md rounded-media bg-default p-stack-md" data-testid="address-container">
            <div className="flex flex-col gap-stack-xs text-sm">
              <span className="font-medium" data-testid="address-name">
                {[a.first_name, a.last_name].filter(Boolean).join(" ")}
              </span>
              {a.company && <span data-testid="address-company">{a.company}</span>}
              <span data-testid="address-address">{[a.address_1, a.address_2].filter(Boolean).join(", ")}</span>
              <span data-testid="address-postal-city">{[a.postal_code, a.city, a.province].filter(Boolean).join(" ")}</span>
              <span data-testid="address-country">{a.country_code?.toUpperCase()}</span>
              {a.phone && <span className="text-muted">{a.phone}</span>}
            </div>
            <div className="flex gap-stack-md text-sm">
              <button type="button" onClick={() => setEditing(a)} className="inline-flex h-9 items-center font-medium underline-offset-4 hover:underline" data-testid="address-edit-button">
                {t.edit}
              </button>
              <button type="button" onClick={() => remove(a.id)} disabled={pending} className="inline-flex h-9 items-center text-muted underline-offset-4 hover:text-foreground hover:underline" data-testid="address-delete-button">
                {t.remove}
              </button>
            </div>
          </div>
        ))}
      </div>
      {removeError && (
        <p className="text-sm text-danger" role="alert">
          {removeError}
        </p>
      )}
      {editing && <AddressSheet key={editing === "new" ? "new" : editing.id} t={t} address={editing === "new" ? null : editing} region={region} onClose={() => setEditing(null)} />}
    </div>
  )
}

function AddressSheet({ t, address, region, onClose }: { t: T; address: Address | null; region: HttpTypes.StoreRegion; onClose: () => void }) {
  const action = address ? updateCustomerAddress : addCustomerAddress
  const [state, formAction, pending] = useActionState(action, address ? { ...INITIAL, addressId: address.id } : INITIAL)
  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])
  const countries = (region.countries ?? []).map((c) => ({ value: c.iso_2 ?? "", label: c.display_name ?? "" }))

  return (
    <Sheet open onClose={onClose} side="center" label={address ? t.editAddress : t.addAddress} title={address ? t.editAddress : t.addAddress} closeLabel={t.cancel}>
      <form action={formAction} className="flex flex-col gap-stack-md" data-testid="address-form">
        {address && <input type="hidden" name="addressId" value={address.id} />}
        <div className="grid grid-cols-2 gap-gutter">
          <Input label={t.firstName} name="first_name" required autoComplete="given-name" defaultValue={address?.first_name ?? ""} data-testid="first-name-input" />
          <Input label={t.lastName} name="last_name" required autoComplete="family-name" defaultValue={address?.last_name ?? ""} data-testid="last-name-input" />
          <div className="col-span-2">
            <Input label={t.company} name="company" autoComplete="organization" defaultValue={address?.company ?? ""} data-testid="company-input" />
          </div>
          <div className="col-span-2">
            <Input label={t.address} name="address_1" required autoComplete="address-line1" defaultValue={address?.address_1 ?? ""} data-testid="address-1-input" />
          </div>
          <div className="col-span-2">
            <Input label={t.address2} name="address_2" autoComplete="address-line2" defaultValue={address?.address_2 ?? ""} data-testid="address-2-input" />
          </div>
          <Input label={t.postalCode} name="postal_code" required autoComplete="postal-code" defaultValue={address?.postal_code ?? ""} data-testid="postal-code-input" />
          <Input label={t.city} name="city" required autoComplete="address-level2" defaultValue={address?.city ?? ""} data-testid="city-input" />
          <Input label={t.province} name="province" autoComplete="address-level1" defaultValue={address?.province ?? ""} data-testid="state-input" />
          <NativeSelect name="country_code" placeholder={t.country} aria-label={t.country} autoComplete="country" required defaultValue={address?.country_code ?? (countries.length === 1 ? countries[0].value : "")} data-testid="country-select">
            {countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
          <div className="col-span-2">
            <Input label={t.phone} name="phone" type="tel" autoComplete="tel" defaultValue={address?.phone ?? ""} data-testid="phone-input" />
          </div>
        </div>
        {state.error && (
          <p className="text-sm text-danger" role="alert" data-testid="address-error">
            {t.error}
          </p>
        )}
        <div className="flex justify-end gap-stack-sm">
          <Button type="button" variant="secondary" onClick={onClose} data-testid="cancel-button">
            {t.cancel}
          </Button>
          <Button type="submit" isLoading={pending} data-testid="save-button">
            {t.save}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
