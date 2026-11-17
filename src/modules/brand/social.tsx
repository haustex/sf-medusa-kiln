import { Glyph, type GlyphName } from "./glyphs"
import { socialLinks, socialRel, type SocialNetwork } from "@lib/social"

export { socialLinks, type SocialNetwork } from "@lib/social"

export function SocialIcon({ network, size = 20, className }: { network: SocialNetwork; size?: number; className?: string }) {
  return <Glyph name={network as GlyphName} size={size} className={className} />
}

/** Row of icon links (footer bottom row, phone menu). 44 px targets; `rel="me"` marks the brand's own profiles. */
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
            rel={socialRel(n)}
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

/** The same links as text (footer "Social" column): network names, no icons */
export function SocialTextLinks({ className = "" }: { className?: string }) {
  const links = socialLinks()
  if (!links.length) return null
  return (
    <ul className={`flex flex-col gap-stack-sm ${className}`} data-testid="footer-social">
      {links.map((n) => (
        <li key={n.key}>
          <a href={n.href} rel={socialRel(n)} target="_blank" className="hover:underline underline-offset-4">
            {n.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
