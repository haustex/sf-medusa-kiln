import { formatPrice } from "@modules/ds/price-tag"
import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

const STORE_CURRENCIES = ["idr", "usd"]

/**
 * Starter helper, kept for the remaining starter components. IDR/USD go
 * through the design system's formatPrice so every page reads "Rp185.000" /
 * "$29.00"; other currencies keep the Intl fallback.
 */
export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
}: ConvertToLocaleParams) => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }
  if (STORE_CURRENCIES.includes(currency_code.toLowerCase()) && minimumFractionDigits === undefined && maximumFractionDigits === undefined) {
    return formatPrice(amount, currency_code)
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency_code,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}
