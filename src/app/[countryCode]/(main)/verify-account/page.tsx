import { Metadata } from "next"
import { Suspense } from "react"

import { getDictionary } from "@lib/i18n/dictionaries"
import VerifyAccount from "@modules/account/verify"
import { Page } from "@modules/ds"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  return { title: getDictionary((await props.params).countryCode).account.verify.title, robots: { index: false, follow: false } }
}

/** Landing page of the e-mail verification link (?token=): confirms it, then points to sign in */
export default async function VerifyAccountPage(props: Props) {
  const t = getDictionary((await props.params).countryCode).account.verify
  return (
    <Page>
      <div className="content-container">
        <Suspense fallback={<p className="text-muted">{t.verifying}</p>}>
          <VerifyAccount labels={t} />
        </Suspense>
      </div>
    </Page>
  )
}
