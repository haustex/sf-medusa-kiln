import { ButtonLink, ImagePlaceholder, Stack } from "@modules/ds"
import type { Dictionary } from "@lib/i18n/dictionaries"

/**
 * Made-to-order furniture block (v3: clean). White card with a hairline, Ink copy on the left, photo (radius lg) on
 * the right. No colour band.
 */
export default function CustomCta({
  t,
  href,
  label,
  categoryHref,
}: {
  t: Dictionary["home"]
  href: string
  label: string
  categoryHref: string
}) {
  return (
    <section aria-labelledby="custom-title" className="content-container">
      <div className="grid overflow-hidden rounded-media border border-separator bg-surface md:grid-cols-2">
        <Stack gap="lg" className="justify-center p-inset-banner">
          <Stack gap="md">
            <Stack gap="sm">
              <p className="type-eyebrow">{t.customEyebrow}</p>
              <h2 id="custom-title" className="type-section max-w-[11.5em] text-balance">
                {t.customTitle}
              </h2>
            </Stack>
            <p className="max-w-md text-muted">{t.customBody}</p>
          </Stack>
          <Stack direction="row" gap="sm" className="flex-wrap">
            <ButtonLink href={href} size="lg" className="h-12">
              {label}
            </ButtonLink>
            <ButtonLink href={categoryHref} size="lg" variant="secondary" className="h-12">
              {t.customSecondary}
            </ButtonLink>
          </Stack>
        </Stack>
        <div className="hidden p-inset-banner pl-0 md:block">
          <ImagePlaceholder className="aspect-[4/3] rounded-media" />
        </div>
      </div>
    </section>
  )
}
