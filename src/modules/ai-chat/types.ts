import type { AiChatConfig } from "@lib/data/ai-chat"
import type { Dictionary } from "@lib/i18n/dictionaries"

export type AiChatLabels = Dictionary["aiChat"]

export type AiChatProps = {
  countryCode: string
  currencyCode: string
  /** The market's Medusa region (prices); the plugin resolves it from the country when null */
  regionId: string | null
  /** "" on the default market, "/us" elsewhere */
  pathPrefix: string
  privacyHref: string
  config: AiChatConfig
  labels: AiChatLabels
}

export type ProductCard = { handle: string; title: string; url: string; thumbnail: string | null; price: string | null; in_stock: boolean | null }

export type StreamEvent =
  | { type: "start"; message_id: string }
  | { type: "delta"; text: string }
  | { type: "products"; items: ProductCard[] }
  | { type: "handoff"; url: string; reason: string }
  | { type: "notice"; code: string }
  | { type: "done"; message_id: string; turns_left: number; handoff: boolean }
  | { type: "error"; code: string }

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  products?: ProductCard[]
  handoff?: { url: string }
  feedback?: 1 | -1
  error?: string
  /** True while the answer streams in */
  pending?: boolean
}
