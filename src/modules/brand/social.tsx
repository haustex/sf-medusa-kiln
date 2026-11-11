import config from "@theme"

/** Social networks supported in theme.config.ts `social`; an empty URL hides the icon. Glyphs are 24×24 paths. */
const NETWORKS: { key: keyof typeof config.social; label: string; path: string }[] = [
  { key: "facebook", label: "Facebook", path: "M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" },
  { key: "instagram", label: "Instagram", path: "M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3c-2.4 0-2.7 0-3.7.1-2.6.1-4.1 1.6-4.2 4.2C4 8.3 4 8.6 4 12s0 3.7.1 4.7c.1 2.6 1.6 4.1 4.2 4.2 1 .1 1.3.1 3.7.1s2.7 0 3.7-.1c2.6-.1 4.1-1.6 4.2-4.2.1-1 .1-1.3.1-4.7s0-3.7-.1-4.7c-.1-2.6-1.6-4.1-4.2-4.2C14.7 3 14.4 3 12 3Zm0 1.6c2.4 0 2.6 0 3.6.1 1.8.1 2.6.9 2.7 2.7.1 1 .1 1.2.1 3.6s0 2.6-.1 3.6c-.1 1.8-.9 2.6-2.7 2.7-1 .1-1.2.1-3.6.1s-2.6 0-3.6-.1c-1.8-.1-2.6-.9-2.7-2.7-.1-1-.1-1.2-.1-3.6s0-2.6.1-3.6c.1-1.8.9-2.6 2.7-2.7 1-.1 1.2-.1 3.6-.1Z" },
  { key: "x", label: "X", path: "M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.2L5.6 21h-3l7.1-8.1L2 3h6.3l4.3 5.7L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" },
  { key: "pinterest", label: "Pinterest", path: "M12 3a9 9 0 0 0-3.3 17.4c-.1-.7-.2-1.9 0-2.7l1.1-4.5s-.3-.5-.3-1.3c0-1.3.7-2.2 1.6-2.2.8 0 1.1.6 1.1 1.3 0 .8-.5 1.9-.7 3-.2.9.4 1.6 1.3 1.6 1.6 0 2.8-1.7 2.8-4.1 0-2.1-1.5-3.6-3.7-3.6-2.5 0-4 1.9-4 3.8 0 .8.3 1.6.7 2 .1.1.1.2.1.3l-.3 1c0 .2-.1.2-.3.1-1.1-.5-1.8-2.1-1.8-3.4 0-2.8 2-5.4 5.9-5.4 3.1 0 5.5 2.2 5.5 5.1 0 3.1-1.9 5.5-4.6 5.5-.9 0-1.8-.5-2.1-1l-.6 2.1c-.2.8-.8 1.8-1.1 2.4A9 9 0 1 0 12 3Z" },
  { key: "tiktok", label: "TikTok", path: "M16.6 3c.2 1.9 1.3 3.1 3.4 3.3v3c-1.2 0-2.3-.4-3.4-1.1v6.3c0 3.2-2.1 5.5-5.2 5.5S6 17.8 6 14.9c0-3 2.4-5.4 5.6-5.2v3.1c-1.4-.2-2.6.5-2.6 2.1 0 1.3.9 2.2 2.2 2.2 1.4 0 2.3-.9 2.3-2.5V3h3.1Z" },
  { key: "youtube", label: "YouTube", path: "M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" },
]

/** The configured networks, in order; nothing when all URLs are empty. */
export function socialLinks() {
  return NETWORKS.filter((n) => config.social[n.key]).map((n) => ({ ...n, href: config.social[n.key] }))
}

export function SocialIcon({ path, className = "size-5" }: { path: string; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d={path} />
    </svg>
  )
}

/** Row of icon links (footer, mobile menu). 44 px targets; `rel="noopener me"` marks them as the brand's own profiles. */
export default function SocialLinks({ className = "", size = "size-5" }: { className?: string; size?: string }) {
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
            <SocialIcon path={n.path} className={size} />
          </a>
        </li>
      ))}
    </ul>
  )
}
