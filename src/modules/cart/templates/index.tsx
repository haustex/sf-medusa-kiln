import { HttpTypes } from "@medusajs/types"

import { getDictionary } from "@lib/i18n/dictionaries"
import { removedItems } from "@lib/util/cart-notice"
import { marketPath } from "@lib/util/market"
import CartLine from "@modules/cart/components/cart-line"
import { toCartLine } from "@modules/cart/components/cart-line/data"
import RemovedNotice from "@modules/cart/components/removed-notice"
import { ButtonLink, Page, Section, Stack } from "@modules/ds"

import Summary from "./summary"

/** Cart page: lines on the left, sticky summary card on the right (desktop); one column on phones. */
export default function CartTemplate({ cart, customer, countryCode }: { cart: HttpTypes.StoreCart | null; customer: HttpTypes.StoreCustomer | null; countryCode: string }) {
  const dict = getDictionary(countryCode)
  const t = dict.cart
  const href = (p: string) => marketPath(countryCode, p)
  const items = [...(cart?.items ?? [])].sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1)).map(toCartLine)
  const count = items.reduce((n, i) => n + i.quantity, 0)
  const removed = removedItems(cart)
  const lineLabels = { quantity: t.quantity, decrease: dict.product.decrease, increase: dict.product.increase, remove: t.remove, each: t.each, removeFailed: t.removeFailed, updateFailed: t.updateFailed }

  return (
    <Page data-testid="cart-container">
      <Stack gap="section-head" className="content-container">
        <h1 className="type-h1">
          {t.title}
          {count > 0 && <span className="text-muted"> ({count})</span>}
        </h1>

        {removed.length > 0 && <RemovedNotice titles={removed} message={t.removedUnavailable} />}

        {cart && items.length ? (
          <div className="grid items-start gap-section lg:grid-cols-[minmax(0,1fr)_380px]">
            <Section id="cart-items" title={t.items} titleHidden contained={false}>
              {!customer && (
                <div className="flex flex-wrap items-center justify-between gap-stack-md rounded-media bg-default p-stack-md">
                  <div className="flex flex-col gap-stack-xs">
                    <p className="font-medium">{t.signInTitle}</p>
                    <p className="text-sm text-muted">{t.signInBody}</p>
                  </div>
                  <ButtonLink href={href("/account")} variant="secondary" size="sm" className="h-9 px-4">
                    {t.signIn}
                  </ButtonLink>
                </div>
              )}
              <ul className="divide-y divide-separator">
                {items.map((item) => (
                  <CartLine key={item.id} item={item} currency={cart.currency_code} labels={lineLabels} />
                ))}
              </ul>
            </Section>

            <aside className="lg:sticky lg:top-36">
              <Summary cart={cart} title={t.summary} checkoutLabel={t.checkout} continueLabel={t.continue} checkoutHref={href("/checkout")} storeHref={href("/store")} />
            </aside>
          </div>
        ) : (
          <Stack gap="lg" className="w-full items-start rounded-media bg-default p-inset-banner" data-testid="empty-cart-message">
            <Stack gap="xs">
              <p className="type-h3">{t.empty}</p>
              <p className="text-muted">{t.emptyBody}</p>
            </Stack>
            <ButtonLink href={href("/store")} size="lg" className="h-12 px-6">
              {t.emptyCta}
            </ButtonLink>
          </Stack>
        )}
      </Stack>
    </Page>
  )
}
