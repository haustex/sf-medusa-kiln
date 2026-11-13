import { Metadata } from "next"
import { notFound } from "next/navigation"

import { feature } from "@lib/features"
import { getDictionary } from "@lib/i18n/dictionaries"
import { marketPath } from "@lib/util/market"
import { ButtonLink, Page, Stack } from "@modules/ds"
import UnsubscribeForm from "@modules/reviews/unsubscribe-form"

/**
 * Opt-out page for the review-request e-mails, in the shop's own design: point the e-mail template's unsubscribe
 * link at `{storefront}/review/unsubscribe/{signed id}` (the id from the plugin's `unsubscribe_url`) instead of the
 * backend's plain page. One click confirms; the id goes to the plugin through /api/reviews/unsubscribe.
 */
export const dynamic = "force-dynamic"

type Props = { params: Promise<{ countryCode: string; token: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = getDictionary((await props.params).countryCode).reviews
  return { title: t.unsubscribeTitle, robots: { index: false, follow: false, noarchive: true } }
}

export default async function UnsubscribePage(props: Props) {
  if (!(await feature("reviews"))) notFound()
  const { countryCode, token } = await props.params
  const t = getDictionary(countryCode).reviews
  return (
    <Page data-testid="review-unsubscribe">
      <Stack gap="lg" className="content-container mx-auto w-full max-w-2xl">
        <Stack gap="xs">
          <h1 className="type-h1">{t.unsubscribeTitle}</h1>
          <p className="text-muted">{t.unsubscribeIntro}</p>
        </Stack>
        <UnsubscribeForm token={token} labels={{ confirm: t.unsubscribeConfirm, done: t.unsubscribeDone, invalid: t.unsubscribeInvalid }} />
        <ButtonLink href={marketPath(countryCode, "/")} variant="secondary" className="self-start">
          {t.backToStore}
        </ButtonLink>
      </Stack>
    </Page>
  )
}
