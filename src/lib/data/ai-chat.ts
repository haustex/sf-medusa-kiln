import "server-only"

import { getMarket } from "@lib/util/market"

/** `GET /store/ai-chat/config?lang=` of medusa-ai-chat (what the launcher needs before the first message) */
export type AiChatConfig = {
  enabled: boolean
  over_budget: boolean
  locale: string
  name: string
  greeting: string | null
  whatsapp: string | null
  hours: string | null
  privacy_path: string
  limits: { max_message_chars: number; max_turns: number }
  provider: string
}

const BACKEND = (process.env.MEDUSA_BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")

/**
 * The assistant's public config for a market, in the market's language, cached a minute (the Admin's on/off switch
 * and greeting follow within that). null when the plugin does not answer: the launcher is left out.
 */
export async function getAiChatConfig(countryCode: string): Promise<AiChatConfig | null> {
  const locale = getMarket(countryCode).dictionary
  try {
    const res = await fetch(`${BACKEND}/store/ai-chat/config?lang=${encodeURIComponent(locale)}`, {
      headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
      next: { revalidate: 60, tags: ["ai-chat"] },
    })
    if (!res.ok) return null
    return (await res.json()) as AiChatConfig
  } catch {
    return null
  }
}
