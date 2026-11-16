import "server-only"

import config, { type HeroSlideConfig } from "@theme"
import { sdk } from "@lib/config"
import { feature } from "@lib/features"
import { getDictionary } from "@lib/i18n/dictionaries"
import { tx } from "@lib/i18n/localized"
import { optimisable } from "@lib/util/image-hosts"
import { getMarket, marketPath } from "@lib/util/market"
import { getImageProps } from "next/image"

/**
 * Hero slides for one market, already in its language, with market-relative links resolved. This is the only
 * place the components read slides from. Two sources, in this order:
 *
 * 1. medusa-hero-banners (`features.banners`, probed at start): the banners an admin switched on in Medusa's
 *    Admin, placement `hero.placement`, fetched with the tag "hero" so the plugin's `revalidate` hook
 *    (POST /api/revalidate { hero_banners }) re-renders the home page at once; the page also re-renders every 60 s.
 * 2. theme.config.ts `hero.slides` when the plugin is not installed (or answers with an error).
 *
 * A slide without images is a text panel (dark, copy centred). Scheduling (`start` / `end`, or the plugin's
 * schedule) is evaluated when the page renders.
 */
export type HeroFocus = { x: number; y: number }
export type HeroSlide = {
  id: string
  title: string
  subtitle: string | null
  cta: string
  /** null = no button (plugin banners may have no link) */
  href: string | null
  /** An optional second, outlined button */
  secondary: { href: string; label: string } | null
  alt: string
  /** null = text panel */
  image: { desktop: string; mobile: string } | null
  /** Focal point per viewport image (percent), null = centre */
  focus: { desktop: HeroFocus | null; mobile: HeroFocus | null }
  /** next/image markup for both photos (AVIF / WebP, responsive), computed here so the client slider needs no next/image */
  picture: { desktop: PictureProps; mobile: PictureProps } | null
}

export type PictureProps = { src: string; srcSet?: string }

export const HERO_TAG = "hero"

/** 12:5 desktop (e.g. 1920×800) and 4:5 phone (e.g. 840×1050) photos, full width; a host next/image is not configured for is embedded as it is */
const picture = (src: string, width: number, height: number): PictureProps => {
  if (!optimisable(src)) return { src }
  const { props } = getImageProps({ src, alt: "", width, height, sizes: "100vw" })
  return { src: props.src, srcSet: props.srcSet }
}
const pictures = (image: HeroSlide["image"]): HeroSlide["picture"] => (image ? { desktop: picture(image.desktop, 1920, 800), mobile: picture(image.mobile, 840, 1050) } : null)

const isActive = (s: HeroSlideConfig, now: number) => (!s.start || Date.parse(s.start) <= now) && (!s.end || Date.parse(s.end) > now)
const resolveHref = (countryCode: string, href: string | null | undefined): string | null => (!href ? null : /^https?:\/\//.test(href) ? href : marketPath(countryCode, href))

function fromConfig(countryCode: string): HeroSlide[] {
  const lang = getMarket(countryCode).dictionary
  const now = Date.now()
  return config.hero.slides
    .filter((s) => isActive(s, now))
    .map((s) => {
      const image = s.image?.desktop || s.image?.mobile ? { desktop: s.image.desktop || s.image.mobile, mobile: s.image.mobile || s.image.desktop } : null
      return {
        id: s.id,
        title: tx(s.title, lang),
        subtitle: s.subtitle ? tx(s.subtitle, lang) : null,
        cta: tx(s.cta, lang),
        href: resolveHref(countryCode, s.href),
        secondary: s.secondary ? { href: resolveHref(countryCode, s.secondary.href)!, label: tx(s.secondary.cta, lang) } : null,
        alt: s.alt ? tx(s.alt, lang) : "",
        image,
        focus: { desktop: null, mobile: null },
        picture: pictures(image),
      }
    })
}

/** One banner as medusa-hero-banners' Store API returns it */
type StoreBanner = {
  id: string
  title: string
  subtitle: string | null
  cta: string | null
  href: string | null
  secondary: { href: string; cta: string } | null
  image: { desktop: string | null; mobile: string | null }
  focus: { desktop: HeroFocus | null; mobile: HeroFocus | null }
  alt: string | null
}

async function fromPlugin(countryCode: string): Promise<HeroSlide[] | null> {
  const market = getMarket(countryCode)
  try {
    const { banners } = await sdk.client.fetch<{ banners: StoreBanner[] }>("/store/hero-banners", {
      query: { placement: config.hero.placement, locale: market.locale },
      cache: "force-cache",
      next: { tags: [HERO_TAG] },
    })
    const fallbackCta = getDictionary(countryCode).home.heroCta
    return banners.map((b) => {
      const desktop = b.image?.desktop || b.image?.mobile || null
      const mobile = b.image?.mobile || b.image?.desktop || null
      const image = desktop && mobile ? { desktop, mobile } : null
      return {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || null,
        cta: b.cta || fallbackCta,
        href: resolveHref(countryCode, b.href),
        secondary: b.secondary ? { href: resolveHref(countryCode, b.secondary.href)!, label: b.secondary.cta } : null,
        alt: b.alt ?? "",
        image,
        focus: { desktop: b.image?.desktop ? b.focus?.desktop ?? null : b.focus?.mobile ?? null, mobile: b.image?.mobile ? b.focus?.mobile ?? null : b.focus?.desktop ?? null },
        picture: pictures(image),
      }
    })
  } catch {
    return null
  }
}

export async function getHeroSlides(countryCode: string): Promise<HeroSlide[]> {
  if (await feature("banners")) {
    const slides = await fromPlugin(countryCode)
    if (slides) return slides
  }
  return fromConfig(countryCode)
}

/** Autoplay interval in ms, or false */
export const heroAutoplay = (): number | false => (typeof config.hero.autoplay === "number" && config.hero.autoplay >= 2000 ? config.hero.autoplay : false)
