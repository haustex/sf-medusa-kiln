import { buttonVariants, cn } from "@heroui/styles"
import { Stack } from "@modules/ds"
import type { Dictionary } from "@lib/i18n/dictionaries"
import Link from "@modules/common/components/app-link"

/**
 * Hero without slides (no banners in the Admin, no `hero.slides` in theme.config.ts): copy from the dictionary on
 * the page background, nothing else — no photo slot, no placeholder box. The h1 (type-hero) is the LCP element:
 * text in the first HTML chunk.
 */
export default function HeroText({
  t,
  shopHref,
  secondaryHref,
}: {
  t: Dictionary["home"]
  shopHref: string
  secondaryHref: string
}) {
  return (
    <section aria-labelledby="hero-title" className="content-container" data-testid="hero-text">
      <Stack gap="lg" className="max-w-3xl py-stack-md md:py-stack-lg">
        <Stack gap="md">
          <Stack gap="sm">
            <p className="type-eyebrow text-foreground">{t.heroEyebrow}</p>
            <h1 id="hero-title" className="type-hero max-w-[8.45em] text-balance">
              {t.heroTitle}
            </h1>
          </Stack>
          <p className="type-lead max-w-md">{t.heroBody}</p>
        </Stack>
        <Stack direction="row" gap="sm" className="flex-wrap">
          <Link href={shopHref} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "h-12 px-6")}>
            {t.heroCta}
          </Link>
          <Link href={secondaryHref} className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-12 px-6")}>
            {t.heroCtaSecondary}
          </Link>
        </Stack>
      </Stack>
    </section>
  )
}
