import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { getDictionary } from "@lib/i18n/dictionaries"
import Profile from "@modules/account/profile"
import { Stack } from "@modules/ds"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  return { title: getDictionary((await props.params).countryCode).account.profile, robots: { index: false, follow: false } }
}

export default async function ProfilePage(props: Props) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  if (!customer) return null
  const t = getDictionary(countryCode).account
  return (
    <Stack gap="section-head">
      <Stack gap="xs">
        <h1 className="type-h1">{t.profile}</h1>
        <p className="text-muted">{t.profileIntro}</p>
      </Stack>
      <Profile customer={customer} />
    </Stack>
  )
}
