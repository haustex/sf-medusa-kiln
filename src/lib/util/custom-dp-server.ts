import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { CUSTOM_DP_ENABLED, CUSTOM_DP_PREVIEW, PREVIEW_COOKIE } from "./custom-dp"

/**
 * Who may see the custom/DP pages (/custom, /penawaran). On: everyone in Indonesia. Preview: only a browser with a
 * valid preview cookie (HK_PREVIEW_SECRET, same value and format as apps/backend/src/lib/custom-dp/preview.ts);
 * the token is passed on to the client so its calls to the backend carry it (header x-hk-preview).
 * Pages that call this render per request (cookies), so Cloudflare never caches them.
 */

export function verifyPreviewToken(token: string | undefined | null, now = new Date()) {
  const secret = process.env.HK_PREVIEW_SECRET
  if (!secret || !token || token.length > 200) return false
  const m = /^(\d{10})\.([\w-]{43})$/.exec(token)
  if (!m) return false
  const exp = Number(m[1])
  if (exp * 1000 < now.getTime()) return false
  const a = new Uint8Array(Buffer.from(createHmac("sha256", secret).update(`hk-preview:${exp}`).digest("base64url")))
  const b = new Uint8Array(Buffer.from(m[2]))
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function customDpAccess(countryCode: string): Promise<{ active: boolean; preview: string | null }> {
  if (countryCode === "us") return { active: false, preview: null }
  if (CUSTOM_DP_ENABLED) return { active: true, preview: null }
  if (!CUSTOM_DP_PREVIEW) return { active: false, preview: null }
  const token = (await cookies()).get(PREVIEW_COOKIE)?.value ?? null
  return verifyPreviewToken(token) ? { active: true, preview: token } : { active: false, preview: null }
}

/** Headers for backend calls from these pages */
export const previewHeaders = (preview: string | null): Record<string, string> => (preview ? { "x-hk-preview": preview } : {})
