import { retrieveCustomer } from "@lib/data/customer"
import { feature } from "@lib/features"
import { getDictionary } from "@lib/i18n/dictionaries"
import Auth from "@modules/account/auth"
import AccountNav from "@modules/account/nav"
import { Page } from "@modules/ds"

/**
 * /account/*: signed out → the sign in / register card instead of the page (the pages themselves render nothing
 * without a customer); signed in → account navigation (pill row on phones, sidebar from lg) beside the page.
 */
export default async function AccountLayout(props: { children: React.ReactNode; params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const [customer, reviews] = await Promise.all([retrieveCustomer().catch(() => null), feature("reviews")])
  const dict = getDictionary(countryCode)
  const t = dict.account

  return (
    <Page data-testid="account-page">
      {customer ? (
        <div className="content-container grid grid-cols-1 gap-stack-lg lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-section">
          <AccountNav email={customer.email} reviews={reviews} labels={t} />
          <div className="min-w-0">{props.children}</div>
        </div>
      ) : (
        <div className="content-container">
          <div className="mx-auto w-full max-w-md rounded-media bg-default p-stack-lg">
            <Auth labels={{ account: t, emailInvalid: dict.checkout.emailInvalid }} />
          </div>
          <span className="sr-only">{t.login.title}</span>
        </div>
      )}
    </Page>
  )
}
