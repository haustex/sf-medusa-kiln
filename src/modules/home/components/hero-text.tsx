import { buttonVariants, cn } from "@heroui/styles"
import { ImagePlaceholder, Stack } from "@modules/ds"
import type { Dictionary } from "@lib/i18n/dictionaries"
import Link from "@modules/common/components/app-link"

/**
 * Hero (v3, docs/keputusan.md): clean. White background, Ink copy on the left, one photo (radius lg) on the right;
 * on phones the photo sits above the copy. No panel, no gradient, no blur. The h1 (Inter 700, type-hero) is the LCP
 * element while there is no photo: text in the first HTML chunk. When a real photo exists, render ONE image with
 * `priority` in the photo slot.
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
    <section aria-labelledby="hero-title" className="content-container">
      <div className="grid items-center gap-stack-lg md:grid-cols-[1fr_1.1fr] md:gap-section">
        <Stack gap="lg" className="order-2 md:order-1">
          <Stack gap="md">
            <Stack gap="sm">
              <p className="type-eyebrow text-foreground">{t.heroEyebrow}</p>
              <h1 id="hero-title" className="type-hero max-w-[8.45em]">
                {t.heroTitle}
              </h1>
            </Stack>
            <p className="max-w-md text-base leading-relaxed sm:text-lg">{t.heroBody}</p>
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
        <ImagePlaceholder className="order-1 aspect-[4/3] rounded-media md:order-2 md:aspect-[5/4]" />
      </div>
    </section>
  )
}
