/**
 * Brand and share glyphs: Iconoir (https://iconoir.com, MIT, © Luca Burgio), inlined as is — 24-unit grid, stroke
 * currentColor 1.5, round caps — and drawn at 20 px like the lucide UI icons. See THIRD_PARTY_NOTICES.md.
 * Used by the footer / phone-menu social links (brand/social.tsx), the article share row and the author box.
 */
export type GlyphName =
  | "facebook"
  | "instagram"
  | "x"
  | "pinterest"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "threads"
  | "telegram"
  | "whatsapp"
  | "link"
  | "check"
  | "share"
  | "globe"
  | "mail"

type Path = { d: string; fill?: boolean }

export const GLYPHS: Record<GlyphName, Path[]> = {
  facebook: [
    { d: "M17 2H14C12.6739 2 11.4021 2.52678 10.4645 3.46447C9.52678 4.40215 9 5.67392 9 7V10H6V14H9V22H13V14H16L17 10H13V7C13 6.73478 13.1054 6.48043 13.2929 6.29289C13.4804 6.10536 13.7348 6 14 6H17V2Z" },
  ],
  instagram: [
    { d: "M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" },
    { d: "M3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16Z" },
    { d: "M17.5 6.51L17.51 6.49889" },
  ],
  x: [
    { d: "M16.8198 20.7684L3.75317 3.96836C3.44664 3.57425 3.72749 3 4.22678 3H6.70655C6.8917 3 7.06649 3.08548 7.18016 3.23164L20.2468 20.0316C20.5534 20.4258 20.2725 21 19.7732 21H17.2935C17.1083 21 16.9335 20.9145 16.8198 20.7684Z" },
    { d: "M20 3L4 21" },
  ],
  pinterest: [
    { d: "M8 14.5C5 10 9.46243 6.5 12.5 6.5C15.5376 6.5 18 8.15367 18 12C18 15.0376 16 17 14 17C12 17 11 15 11.5 12" },
    { d: "M12 10L9 21.5" },
    { d: "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" },
  ],
  tiktok: [
    { d: "M21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8Z" },
    { d: "M10 12C8.34315 12 7 13.3431 7 15C7 16.6569 8.34315 18 10 18C11.6569 18 13 16.6569 13 15V6C13.3333 7 14.6 9 17 9" },
  ],
  youtube: [
    { d: "M14 12L10.5 14V10L14 12Z", fill: true },
    { d: "M2 12.7075V11.2924C2 8.39705 2 6.94939 2.90549 6.01792C3.81099 5.08645 5.23656 5.04613 8.08769 4.96549C9.43873 4.92728 10.8188 4.8999 12 4.8999C13.1812 4.8999 14.5613 4.92728 15.9123 4.96549C18.7634 5.04613 20.189 5.08645 21.0945 6.01792C22 6.94939 22 8.39705 22 11.2924V12.7075C22 15.6028 22 17.0505 21.0945 17.9819C20.189 18.9134 18.7635 18.9537 15.9124 19.0344C14.5613 19.0726 13.1812 19.1 12 19.1C10.8188 19.1 9.43867 19.0726 8.0876 19.0344C5.23651 18.9537 3.81097 18.9134 2.90548 17.9819C2 17.0505 2 15.6028 2 12.7075Z" },
  ],
  linkedin: [
    { d: "M21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8Z" },
    { d: "M7 17V13.5V10" },
    { d: "M11 17V13.75M11 10V13.75M11 13.75C11 10 17 10 17 13.75V17" },
    { d: "M7 7.01L7.01 6.99889" },
  ],
  threads: [
    { d: "M9.9141 8.12803C12.4185 6.11437 16.0241 7.18759 16.45 10.5C16.9018 14.014 16 16.8 12.5 16.8C9.24997 16.8 9.34997 14 9.34997 14C9.34997 11 14.5 10.6 17.5 12.1C23 15.6 19 22 13 22C8.02941 22 3.99997 19.5 3.99997 12C3.99997 4.5 8.02941 2 13 2C16.5079 2 19.6715 3.80695 20.8348 7.42085" },
  ],
  telegram: [{ d: "M21 5L2 12.5L9 13.5M21 5L18.5 20L9 13.5M21 5L9 13.5M9 13.5V19L12.2488 15.7229" }],
  whatsapp: [
    { d: "M22 12C22 17.5228 17.5228 22 12 22C10.1786 22 8.47087 21.513 7 20.6622L2 21.5L2.83209 16C2.29689 14.7751 2 13.4222 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" },
    { d: "M12.9604 13.8683L15.0399 13.4624L17 14.2149V16.0385C17 16.6449 16.4783 17.1073 15.8901 16.9783C14.3671 16.6444 11.5997 15.8043 9.67826 13.8683C7.84859 12.0248 7.22267 9.45734 7.01039 8.04128C6.92535 7.47406 7.3737 7 7.94306 7H9.83707L10.572 8.96888L10.1832 11.0701" },
  ],
  link: [
    { d: "M14 11.9976C14 9.5059 11.683 7 8.85714 7C8.52241 7 7.41904 7.00001 7.14286 7.00001C4.30254 7.00001 2 9.23752 2 11.9976C2 14.376 3.70973 16.3664 6 16.8714C6.36756 16.9525 6.75006 16.9952 7.14286 16.9952" },
    { d: "M10 11.9976C10 14.4893 12.317 16.9952 15.1429 16.9952C15.4776 16.9952 16.581 16.9952 16.8571 16.9952C19.6975 16.9952 22 14.7577 22 11.9976C22 9.6192 20.2903 7.62884 18 7.12383C17.6324 7.04278 17.2499 6.99999 16.8571 6.99999" },
  ],
  check: [{ d: "M5 13L9 17L19 7" }],
  share: [
    { d: "M20 13V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V13" },
    { d: "M12 15V3M12 3L8.5 6.5M12 3L15.5 6.5" },
  ],
  globe: [
    { d: "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" },
    { d: "M2.5 12.5L8 14.5L7 18L8 21" },
    { d: "M17 20.5L16.5 18L14 17V13.5L17 12.5L21.5 13" },
    { d: "M19 5.5L18.5 7L15 7.5V10.5L17.5 9.5H19.5L21.5 10.5" },
    { d: "M2.5 10.5L5 8.5L7.5 8L9.5 5L8.5 3" },
  ],
  mail: [
    { d: "M7 9L12 12.5L17 9" },
    { d: "M2 17V7C2 5.89543 2.89543 5 4 5H20C21.1046 5 22 5.89543 22 7V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17Z" },
  ],
}

/** Human names of the networks (aria-labels, tooltips); the same in every language */
export const GLYPH_LABELS: Partial<Record<GlyphName, string>> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  pinterest: "Pinterest",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  threads: "Threads",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
}

/** The network a profile URL belongs to (author `same_as`, schema.org sameAs); "globe" for anything else */
export function glyphForUrl(url: string): GlyphName {
  let host = ""
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return "globe"
  }
  const is = (...domains: string[]) => domains.some((d) => host === d || host.endsWith(`.${d}`))
  if (is("instagram.com")) return "instagram"
  if (is("facebook.com", "fb.com", "fb.me")) return "facebook"
  if (is("x.com", "twitter.com")) return "x"
  if (is("pinterest.com", "pin.it")) return "pinterest"
  if (is("tiktok.com")) return "tiktok"
  if (is("youtube.com", "youtu.be")) return "youtube"
  if (is("linkedin.com")) return "linkedin"
  if (is("threads.net", "threads.com")) return "threads"
  if (is("t.me", "telegram.me", "telegram.org")) return "telegram"
  if (is("wa.me", "whatsapp.com")) return "whatsapp"
  return "globe"
}

export function Glyph({ name, size = 20, className }: { name: GlyphName; size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" focusable={false} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {GLYPHS[name].map((p) => (
        <path key={p.d} d={p.d} fill={p.fill ? "currentColor" : "none"} />
      ))}
    </svg>
  )
}
