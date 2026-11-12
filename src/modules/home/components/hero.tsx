import { getHeroSlides, heroAutoplay } from "@lib/hero"
import type { Dictionary } from "@lib/i18n/dictionaries"

import HeroSlider from "./hero-slider"
import HeroText from "./hero-text"

/**
 * Home hero: the promo slider from theme.config.ts (`hero.slides`, read through lib/hero.ts). With no active slide
 * the plain text hero (copy from the dictionary) takes its place, so a fresh install never shows an empty box.
 */
export default async function Hero({ countryCode, t, shopHref, secondaryHref }: { countryCode: string; t: Dictionary["home"]; shopHref: string; secondaryHref: string }) {
  const slides = await getHeroSlides(countryCode)
  if (!slides.length) return <HeroText t={t} shopHref={shopHref} secondaryHref={secondaryHref} />
  return <HeroSlider slides={slides} autoplay={heroAutoplay()} labels={t.slider} />
}
