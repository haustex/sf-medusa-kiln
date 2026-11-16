import config from "@theme"
import { tx } from "@lib/i18n/localized"
import { getMarket, marketPath } from "@lib/util/market"
import { ButtonLink, Stack } from "@modules/ds"
import Image from "next/image"

/**
 * Optional banner from theme.config.ts (`home.promo`): a white card with a hairline, ink copy and one or two
 * buttons; with `image` a 4:3 photo on the right from md, without it the copy takes the whole card (no empty
 * placeholder). Server component, no JavaScript.
 */
export default function Promo({ countryCode }: { countryCode: string }) {
  const promo = config.home.promo
  if (!promo) return null
  const lang = getMarket(countryCode).dictionary
  const link = (href: string) => (/^https?:\/\//.test(href) ? href : marketPath(countryCode, href))
  return (
    <section aria-labelledby="promo-title" className="content-container" data-testid="home-promo">
      <div className={`grid overflow-hidden rounded-media border border-separator bg-background ${promo.image ? "md:grid-cols-2" : ""}`}>
        <Stack gap="lg" className="justify-center p-stack-lg lg:p-section">
          <Stack gap="md">
            <Stack gap="sm">
              {promo.eyebrow && <p className="type-eyebrow text-muted">{tx(promo.eyebrow, lang)}</p>}
              <h2 id="promo-title" className="type-h2 max-w-[11.5em] text-balance">
                {tx(promo.title, lang)}
              </h2>
            </Stack>
            {promo.body && <p className="max-w-md text-muted">{tx(promo.body, lang)}</p>}
          </Stack>
          <Stack direction="row" gap="sm" className="flex-wrap">
            <ButtonLink href={link(promo.cta.href)} size="lg">
              {tx(promo.cta.label, lang)}
            </ButtonLink>
            {promo.secondary && (
              <ButtonLink href={link(promo.secondary.href)} size="lg" variant="secondary">
                {tx(promo.secondary.label, lang)}
              </ButtonLink>
            )}
          </Stack>
        </Stack>
        {promo.image && (
          <div className="hidden p-stack-lg pl-0 md:block lg:p-section lg:pl-0">
            <Image src={promo.image.src} alt={promo.image.alt ? tx(promo.image.alt, lang) : ""} width={1200} height={900} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-media object-cover" />
          </div>
        )}
      </div>
    </section>
  )
}
