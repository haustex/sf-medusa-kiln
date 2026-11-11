import config from "@theme"

/**
 * Social networks supported in theme.config.ts `social`; an empty URL hides the icon.
 * Glyphs: Iconoir (https://iconoir.com, MIT, © Luca Burgio), inlined as is: 24-unit grid, stroke currentColor 1.5,
 * drawn at 20 px like the lucide UI icons. See THIRD_PARTY_NOTICES.md.
 */
export type SocialNetwork = keyof typeof config.social
type Glyph = { key: SocialNetwork; label: string; paths: { d: string; fill?: boolean }[] }

const NETWORKS: Glyph[] = [
  { key: "facebook", label: "Facebook", paths: [
    { d: "M17 2H14C12.6739 2 11.4021 2.52678 10.4645 3.46447C9.52678 4.40215 9 5.67392 9 7V10H6V14H9V22H13V14H16L17 10H13V7C13 6.73478 13.1054 6.48043 13.2929 6.29289C13.4804 6.10536 13.7348 6 14 6H17V2Z" },
  ] },
  { key: "instagram", label: "Instagram", paths: [
    { d: "M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" },
    { d: "M3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16Z" },
    { d: "M17.5 6.51L17.51 6.49889" },
  ] },
  { key: "x", label: "X", paths: [
    { d: "M16.8198 20.7684L3.75317 3.96836C3.44664 3.57425 3.72749 3 4.22678 3H6.70655C6.8917 3 7.06649 3.08548 7.18016 3.23164L20.2468 20.0316C20.5534 20.4258 20.2725 21 19.7732 21H17.2935C17.1083 21 16.9335 20.9145 16.8198 20.7684Z" },
    { d: "M20 3L4 21" },
  ] },
  { key: "pinterest", label: "Pinterest", paths: [
    { d: "M8 14.5C5 10 9.46243 6.5 12.5 6.5C15.5376 6.5 18 8.15367 18 12C18 15.0376 16 17 14 17C12 17 11 15 11.5 12" },
    { d: "M12 10L9 21.5" },
    { d: "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" },
  ] },
  { key: "tiktok", label: "TikTok", paths: [
    { d: "M21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8Z" },
    { d: "M10 12C8.34315 12 7 13.3431 7 15C7 16.6569 8.34315 18 10 18C11.6569 18 13 16.6569 13 15V6C13.3333 7 14.6 9 17 9" },
  ] },
  { key: "youtube", label: "YouTube", paths: [
    { d: "M14 12L10.5 14V10L14 12Z", fill: true },
    { d: "M2 12.7075V11.2924C2 8.39705 2 6.94939 2.90549 6.01792C3.81099 5.08645 5.23656 5.04613 8.08769 4.96549C9.43873 4.92728 10.8188 4.8999 12 4.8999C13.1812 4.8999 14.5613 4.92728 15.9123 4.96549C18.7634 5.04613 20.189 5.08645 21.0945 6.01792C22 6.94939 22 8.39705 22 11.2924V12.7075C22 15.6028 22 17.0505 21.0945 17.9819C20.189 18.9134 18.7635 18.9537 15.9124 19.0344C14.5613 19.0726 13.1812 19.1 12 19.1C10.8188 19.1 9.43867 19.0726 8.0876 19.0344C5.23651 18.9537 3.81097 18.9134 2.90548 17.9819C2 17.0505 2 15.6028 2 12.7075Z" },
  ] },
]

/** The configured networks, in order; nothing when all URLs are empty. */
export function socialLinks() {
  return NETWORKS.filter((n) => config.social[n.key]).map((n) => ({ key: n.key, label: n.label, href: config.social[n.key] }))
}

export function SocialIcon({ network, size = 20, className }: { network: SocialNetwork; size?: number; className?: string }) {
  const glyph = NETWORKS.find((n) => n.key === network)
  if (!glyph) return null
  return (
    <svg aria-hidden="true" focusable={false} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {glyph.paths.map((p) => (
        <path key={p.d} d={p.d} fill={p.fill ? "currentColor" : "none"} />
      ))}
    </svg>
  )
}

/** Row of icon links (footer, phone menu). 44 px targets; `rel="noopener me"` marks them as the brand's own profiles. */
export default function SocialLinks({ className = "" }: { className?: string }) {
  const links = socialLinks()
  if (!links.length) return null
  return (
    <ul className={`flex items-center ${className}`}>
      {links.map((n) => (
        <li key={n.key}>
          <a
            href={n.href}
            aria-label={n.label}
            rel="noopener me"
            target="_blank"
            className="inline-flex size-11 items-center justify-center rounded-full text-foreground outline-none hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus"
          >
            <SocialIcon network={n.key} />
          </a>
        </li>
      ))}
    </ul>
  )
}
