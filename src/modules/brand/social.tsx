import config from "@theme"

import { Glyph, GLYPH_LABELS, type GlyphName } from "./glyphs"

/** Social networks supported in theme.config.ts `social`; an empty URL hides the icon. Glyphs: brand/glyphs.tsx (Iconoir). */
export type SocialNetwork = keyof typeof config.social

const ORDER: SocialNetwork[] = ["facebook", "instagram", "x", "pinterest", "tiktok", "youtube"]

/** The configured networks, in order; nothing when all URLs are empty. */
export function socialLinks() {
  return ORDER.filter((key) => config.social[key]).map((key) => ({ key, label: GLYPH_LABELS[key as GlyphName] ?? key, href: config.social[key] }))
}

export function SocialIcon({ network, size = 20, className }: { network: SocialNetwork; size?: number; className?: string }) {
  return <Glyph name={network as GlyphName} size={size} className={className} />
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
