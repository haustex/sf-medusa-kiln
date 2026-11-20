import { getAiChatConfig } from "@lib/data/ai-chat"
import { getRegion } from "@lib/data/regions"
import { feature } from "@lib/features"
import { getDictionary } from "@lib/i18n/dictionaries"
import { getMarket, marketPath } from "@lib/util/market"

import Launcher from "./launcher"

/**
 * The AI assistant (medusa-ai-chat, theme.config.ts features.aiChat): a round glass button bottom right that opens
 * the chat panel. Rendered only when the plugin answers and the Admin switch is on (config cached a minute). The
 * button is server-rendered with a handful of lines of client code; the panel (./panel) is fetched on the first
 * click, so pages that never open it carry none of it.
 */
export default async function AiChat({ countryCode }: { countryCode: string }) {
  if (!(await feature("aiChat"))) return null
  const config = await getAiChatConfig(countryCode)
  if (!config?.enabled) return null
  const market = getMarket(countryCode)
  const region = await getRegion(countryCode).catch(() => null)
  const t = getDictionary(countryCode).aiChat
  return (
    <Launcher
      countryCode={countryCode}
      currencyCode={market.currency}
      regionId={region?.id ?? null}
      pathPrefix={marketPath(countryCode, "")}
      privacyHref={marketPath(countryCode, config.privacy_path) || config.privacy_path}
      config={config}
      labels={t}
    />
  )
}
