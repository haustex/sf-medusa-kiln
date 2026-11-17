import config from "@theme"

/**
 * The networks theme.config.ts `social` may list, in the order they are shown when the config gives no other
 * (Object order of `social` wins). WhatsApp is a chat line, not a profile: no `rel="me"` and not in the
 * Organization `sameAs`.
 */
export const SOCIAL_NETWORKS = ["instagram", "threads", "facebook", "tiktok", "pinterest", "x", "linkedin", "youtube", "whatsapp"] as const
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]

export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  threads: "Threads",
  facebook: "Facebook",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
}

const NOT_A_PROFILE: SocialNetwork[] = ["whatsapp"]

export type SocialLink = { key: SocialNetwork; label: string; href: string; profile: boolean }

type Urls = Partial<Record<string, string>>

const entries = (urls: Urls | undefined): SocialLink[] =>
  Object.keys(urls ?? {})
    .filter((k): k is SocialNetwork => (SOCIAL_NETWORKS as readonly string[]).includes(k) && !!urls?.[k])
    .map((key) => ({ key, label: SOCIAL_LABELS[key], href: urls?.[key] as string, profile: !NOT_A_PROFILE.includes(key) }))

/** The networks shown (theme.config.ts social.footer: footer, phone menu, author box) in the config's order */
export function socialLinks(): SocialLink[] {
  return entries(config.social.footer as Urls)
}

/**
 * Every profile of the brand for schema.org `sameAs` and `<link rel="me">`: the shown ones (no chat lines) plus
 * social.sameAs, the profiles that are not shown.
 */
export function sameAsUrls(): string[] {
  const shown = socialLinks().filter((l) => l.profile).map((l) => l.href)
  const hidden = entries(config.social.sameAs as Urls).filter((l) => l.profile).map((l) => l.href)
  return Array.from(new Set([...shown, ...hidden]))
}

/** `rel` of a link to the network: `me` marks the brand's own profile */
export const socialRel = (l: Pick<SocialLink, "profile">) => (l.profile ? "me noopener" : "noopener")
