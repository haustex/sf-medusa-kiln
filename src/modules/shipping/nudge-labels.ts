import { getDictionary } from "@lib/i18n/dictionaries"

import type { NudgeLabels } from "./components/free-shipping-price-nudge"

/** Labels of the free-shipping nudge (layout popup, cart page) */
export const nudgeLabels = (countryCode: string): NudgeLabels => {
  const t = getDictionary(countryCode).cart
  return {
    unlocked: t.freeShippingUnlocked,
    away: t.freeShippingAway,
    progress: t.freeShippingProgress,
    dismiss: t.dismiss,
    viewCart: t.viewCart,
  }
}
