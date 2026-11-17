import config from "@theme"
import { listCategories } from "@lib/data/categories"
import { shownCategories } from "@lib/util/categories"
import { features, linkEnabled } from "@lib/features"
import { getDictionary } from "@lib/i18n/dictionaries"
import { tx } from "@lib/i18n/localized"
import { getMarket } from "@lib/util/market"
import { trackingPath } from "@lib/util/tracking-path"
import Logo from "@modules/brand/logo"
import SocialLinks, { SocialTextLinks } from "@modules/brand/social"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const linkClass = "hover:underline underline-offset-4"

/** First footer column: the logo + tagline, or the QR code with heading and subtitle (theme.config.ts footer.brand) */
function Brand({ lang }: { lang: "id" | "en" }) {
  const b = config.footer.brand
  if (b.qr) {
    const size = b.qr.size ?? 112
    return (
      <div className="flex flex-col gap-stack-md" data-testid="footer-brand">
        <LocalizedClientLink prefetch={false} href={b.qr.href} className="w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {/* eslint-disable-next-line @next/next/no-img-element -- a small SVG from public/, fixed box (CLS 0) */}
          <img src={b.qr.src} width={size} height={size} alt={tx(b.qr.alt, lang)} loading="lazy" decoding="async" className="block rounded-md" style={{ width: size, height: size }} />
        </LocalizedClientLink>
        <div className="flex flex-col gap-stack-xs">
          {b.heading && <p className="font-medium tracking-[0.12em]">{b.heading}</p>}
          {b.subtitle && <p className="max-w-xs text-sm text-muted">{tx(b.subtitle, lang)}</p>}
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-stack-md" data-testid="footer-brand">
      <LocalizedClientLink prefetch={false} href="/" aria-label={config.brand.name} className="w-fit">
        <Logo size="md" decorative />
      </LocalizedClientLink>
      <p className="max-w-sm text-sm text-muted">
        {tx(config.brand.tagline, lang)} {tx(config.brand.footerText, lang)}
      </p>
    </div>
  )
}

/**
 * Footer. Desktop: the brand column (logo + tagline, or a QR code with heading and subtitle), the "Shop" column
 * (categories, optional), the columns from theme.config.ts brand.footerColumns and, optionally, a text column of the
 * social profiles. Phones: the brand block full width, then the columns two by two. Bottom row: "© {year} {brand} ·
 * Theme Kiln by Haus Kayu" (credit optional) and, when there is no social column, the social icons.
 */
export default async function Footer({ countryCode }: { countryCode: string }) {
  const t = getDictionary(countryCode)
  const lang = getMarket(countryCode).dictionary
  const f = await features()
  const shop = config.footer.shop
  const categories = shop ? await listCategories({ fields: "id,name,handle,parent_category_id", limit: 20 }, countryCode).catch(() => []) : []
  const topLevel = shownCategories(categories.filter((c) => !c.parent_category_id)).slice(0, 6)
  const socialColumn = config.footer.social
  const columns = config.brand.footerColumns.length + (shop ? 1 : 0) + (socialColumn ? 1 : 0)

  return (
    <footer className="mt-section bg-surface">
      <div className="content-container grid grid-cols-2 gap-x-gutter gap-y-section py-section lg:gap-x-section" style={{ ["--footer-columns" as string]: columns }} data-testid="footer">
        <style>{`@media (min-width: 1024px) { [data-testid="footer"] { grid-template-columns: 1.4fr repeat(var(--footer-columns), 1fr); } }`}</style>
        <div className="col-span-2 lg:col-span-1">
          <Brand lang={lang} />
        </div>

        {shop && (
          <div className="flex flex-col gap-stack-md text-sm">
            <span className="type-eyebrow">{t.footer.shop}</span>
            <ul className="flex flex-col gap-stack-sm" data-testid="footer-categories">
              {topLevel.map((c) => (
                <li key={c.id}>
                  <LocalizedClientLink prefetch={false} href={`/categories/${c.handle}`} className={linkClass}>
                    {c.name}
                  </LocalizedClientLink>
                </li>
              ))}
              <li>
                <LocalizedClientLink prefetch={false} href="/store" className={linkClass}>
                  {t.nav.allProducts}
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
        )}

        {config.brand.footerColumns.map((col) => (
          <div key={tx(col.title, "en")} className="flex flex-col gap-stack-md text-sm">
            <span className="type-eyebrow">{tx(col.title, lang)}</span>
            <ul className="flex flex-col gap-stack-sm">
              {col.links.filter((l) => linkEnabled(l.href, f)).map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink prefetch={false} href={l.href === "/track" ? trackingPath(countryCode) : l.href} className={linkClass}>
                    {tx(l.label, lang)}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {socialColumn && (
          <div className="flex flex-col gap-stack-md text-sm">
            <span className="type-eyebrow">{tx(socialColumn.title, lang)}</span>
            <SocialTextLinks />
          </div>
        )}
      </div>

      <div>
        <div className="content-container flex flex-col gap-stack-sm py-stack-lg text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {config.brand.name}
            {config.brand.credit && (
              <>
                {" · "}
                {t.footer.theme}{" "}
                <a href="https://github.com/haustex/sf-medusa-kiln" className="text-foreground underline-offset-4 hover:underline" rel="noopener">
                  Kiln
                </a>{" "}
                {t.footer.by} Haus Kayu
              </>
            )}
          </p>
          {!socialColumn && <SocialLinks className="-mx-2 -my-2" />}
        </div>
      </div>
    </footer>
  )
}
