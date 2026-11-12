import config, { type HeroSlideConfig } from "@theme"
import { tx } from "@lib/i18n/localized"
import { getMarket, marketPath } from "@lib/util/market"

/**
 * Hero slides for one market, already in its language, with market-relative links resolved. This is the only
 * place the components read slides from: today the source is theme.config.ts (`hero.slides`); a Medusa Admin
 * source (e.g. a "banners" module) only has to return the same `HeroSlide` shape here.
 *
 * Scheduling (`start` / `end`) is evaluated when the page renders; the home page is static and re-rendered every
 * 60 s (ISR), so a slide appears or disappears within a minute of its dates.
 */
export type HeroSlide = {
  id: string
  title: string
  subtitle: string | null
  cta: string
  href: string
  alt: string
  image: { desktop: string; mobile: string }
}

const isActive = (s: HeroSlideConfig, now: number) => (!s.start || Date.parse(s.start) <= now) && (!s.end || Date.parse(s.end) > now)

export async function getHeroSlides(countryCode: string): Promise<HeroSlide[]> {
  const lang = getMarket(countryCode).dictionary
  const now = Date.now()
  return config.hero.slides
    .filter((s) => isActive(s, now))
    .map((s) => ({
      id: s.id,
      title: tx(s.title, lang),
      subtitle: s.subtitle ? tx(s.subtitle, lang) : null,
      cta: tx(s.cta, lang),
      href: /^https?:\/\//.test(s.href) ? s.href : marketPath(countryCode, s.href),
      alt: s.alt ? tx(s.alt, lang) : "",
      image: s.image,
    }))
}

/** Autoplay interval in ms, or false */
export const heroAutoplay = (): number | false => (typeof config.hero.autoplay === "number" && config.hero.autoplay >= 2000 ? config.hero.autoplay : false)
