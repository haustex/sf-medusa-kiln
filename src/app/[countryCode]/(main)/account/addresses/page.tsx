import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"
import { getDictionary } from "@lib/i18n/dictionaries"
import AddressBook from "@modules/account/address-book"
import { Stack } from "@modules/ds"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  return { title: getDictionary((await props.params).countryCode).account.addresses, robots: { index: false, follow: false } }
}

export default async function AddressesPage(props: Props) {
  const { countryCode } = await props.params
  const [customer, region] = await Promise.all([retrieveCustomer().catch(() => null), getRegion(countryCode).catch(() => null)])
  if (!customer || !region) return null
  const t = getDictionary(countryCode).account
  return (
    <Stack gap="section-head" data-testid="addresses-page-wrapper">
      <Stack gap="xs">
        <h1 className="type-h1">{t.addresses}</h1>
        <p className="text-muted">{t.addressesIntro}</p>
      </Stack>
      <AddressBook addresses={customer.addresses ?? []} region={region} />
    </Stack>
  )
}
