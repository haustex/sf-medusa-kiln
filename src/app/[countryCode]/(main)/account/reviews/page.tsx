import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { listMyReviews, reviewEligibility, type EligibilityItem } from "@lib/data/reviews"
import { feature } from "@lib/features"
import { fill, getDictionary } from "@lib/i18n/dictionaries"
import { getMarket, marketPath } from "@lib/util/market"
import config from "@theme"
import { ReviewForms } from "@modules/account/review-form"
import Link from "@modules/common/components/app-link"
import { Stack, Stars } from "@modules/ds"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  return { title: getDictionary((await props.params).countryCode).reviews.mine, robots: { index: false, follow: false } }
}

/** Account → Reviews: items of shipped orders that can be reviewed (one form each) and the reviews written */
export default async function ReviewsPage(props: Props) {
  if (!(await feature("reviews"))) notFound()
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  if (!customer) return null
  const t = getDictionary(countryCode).reviews
  const locale = getMarket(countryCode).locale
  const [orders, mine] = await Promise.all([listOrders(50, 0, undefined, { fresh: true }).catch(() => []), listMyReviews()])
  // Only orders with something shipped can have reviewable items (the plugin's trigger is "shipped")
  const candidates = (orders ?? []).filter((o) => o.status !== "canceled" && !["not_fulfilled", "fulfilled", "partially_fulfilled"].includes(String(o.fulfillment_status)))
  const eligibility = await Promise.all(candidates.map(async (o) => ({ order: o, items: await reviewEligibility(o.id) })))
  const open = eligibility.flatMap(({ order, items }) => items.filter((i) => i.reviewable).map((item: EligibilityItem) => ({ orderId: order.id, displayId: order.display_id as number, item })))
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso))

  return (
    <Stack gap="section" data-testid="reviews-page-wrapper">
      <Stack gap="xs">
        <h1 className="type-h1">{t.mine}</h1>
        <p className="text-muted">{t.mineIntro}</p>
      </Stack>
      <section className="flex flex-col gap-section-head" aria-labelledby="to-review">
        <Stack gap="xs">
          <h2 id="to-review" className="type-h2">
            {t.toReview}
          </h2>
          <p className="text-sm text-muted">{t.toReviewHint}</p>
        </Stack>
        {open.length ? (
          <ReviewForms items={open} t={t} />
        ) : (
          <p className="rounded-media bg-default p-stack-md text-sm text-muted" data-testid="none-to-review">
            {t.noneToReview}
          </p>
        )}
      </section>
      <section className="flex flex-col gap-section-head" aria-labelledby="my-reviews">
        <h2 id="my-reviews" className="type-h2">
          {t.mine}
        </h2>
        {mine.length ? (
          <ul className="flex flex-col gap-stack-sm" data-testid="my-reviews">
            {mine.map((r) => (
              <li key={r.id} className="flex flex-col gap-stack-sm rounded-media bg-default p-stack-md" data-testid="my-review" data-status={r.status}>
                <div className="flex flex-wrap items-center justify-between gap-stack-sm">
                  <Stars value={r.rating} label={fill(t.starsLabel, { n: r.rating })} />
                  <span className={r.status === "approved" ? "inline-flex h-7 items-center rounded-full bg-foreground px-3 text-xs font-medium text-background" : "inline-flex h-7 items-center rounded-full px-3 text-xs font-medium ring-1 ring-inset ring-control"}>{t.status[r.status] ?? r.status}</span>
                </div>
                {r.title && <p className="font-medium">{r.title}</p>}
                <p className="whitespace-pre-line text-sm">{r.body}</p>
                <p className="text-sm text-muted">
                  {date(r.created_at)} ·{" "}
                  <Link href={marketPath(countryCode, `/account/orders/${r.order_id}`)} prefetch={false} className="underline underline-offset-4">
                    {t.viewOrder}
                  </Link>
                </p>
                {r.reply && (
                  <blockquote className="flex flex-col gap-stack-xs rounded-md bg-background p-stack-md text-sm">
                    <p className="font-medium">{fill(t.storeReply, { brand: config.brand.name })}</p>
                    <p className="whitespace-pre-line">{r.reply.body}</p>
                  </blockquote>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted" data-testid="no-reviews-written">
            {t.noneWritten}
          </p>
        )}
      </section>
    </Stack>
  )
}
