import { Metadata } from "next"
import { notFound } from "next/navigation"

import config from "@theme"
import { getReviewRequest } from "@lib/data/reviews"
import { feature } from "@lib/features"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { getMarket, marketPath } from "@lib/util/market"
import { ButtonLink, Page, Stack } from "@modules/ds"
import RequestItems from "@modules/reviews/request-items"

/**
 * The magic link of the review-request e-mail (medusa-reviews-wishlist, `review_requests.link_url` =
 * `{storefront}/review/{token}`): the open items of the order, one form each. Opening never consumes the link; it
 * stays valid until every item has a review or it expires. Per visitor: never indexed, never cached (next.config.js
 * headers, robots.ts). 404 without the plugin.
 */
export const dynamic = "force-dynamic"

type Props = { params: Promise<{ countryCode: string; token: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = getDictionary((await props.params).countryCode).reviews
  return { title: t.title, robots: { index: false, follow: false, noarchive: true } }
}

const TOKEN = /^[A-Za-z0-9_-]{16,128}$/

export default async function ReviewRequestPage(props: Props) {
  if (!(await feature("reviews"))) notFound()
  const { countryCode, token } = await props.params
  const t = getDictionary(countryCode).reviews
  const market = getMarket(countryCode)
  const info = TOKEN.test(token) ? await getReviewRequest(token) : null

  if (!info) {
    return (
      <Page data-testid="review-request-invalid">
        <Stack gap="md" className="content-container mx-auto w-full max-w-2xl">
          <h1 className="type-h1">{t.requestInvalidTitle}</h1>
          <p className="text-muted">{t.requestInvalid}</p>
          <ButtonLink href={marketPath(countryCode, "/store")} variant="secondary" className="self-start">
            {t.backToStore}
          </ButtonLink>
        </Stack>
      </Page>
    )
  }

  const expires = info.expires_at ? new Intl.DateTimeFormat(market.locale, { dateStyle: "long", timeZone: config.brand.timeZone }).format(new Date(info.expires_at)) : null
  const remaining = info.remaining_items ?? 0
  return (
    <Page data-testid="review-request">
      <Stack gap="lg" className="content-container mx-auto w-full max-w-2xl">
        <Stack gap="xs">
          <h1 className="type-h1">{fill(t.requestTitle, { n: String(info.order.display_id ?? "") })}</h1>
          <p className="text-muted">{info.items.length ? t.requestIntro : remaining ? t.requestPending : t.requestAllDone}</p>
          {expires && info.items.length > 0 && <p className="text-sm text-muted">{fill(t.requestExpires, { date: expires })}</p>}
        </Stack>
        {info.items.length > 0 && <RequestItems items={info.items} token={token} t={t} />}
        {info.items.length > 0 && remaining > 0 && <p className="text-sm text-muted">{fill(t.remainingItems, { n: remaining })}</p>}
        {!info.items.length && (
          <ButtonLink href={marketPath(countryCode, "/store")} variant="secondary" className="self-start">
            {t.backToStore}
          </ButtonLink>
        )}
      </Stack>
    </Page>
  )
}
