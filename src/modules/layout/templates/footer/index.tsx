import config from "@theme"
import { listCategories } from "@lib/data/categories"
import { getDictionary } from "@lib/i18n/dictionaries"
import Logo from "@modules/brand/logo"
import SocialLinks from "@modules/brand/social"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Footer: logo + tagline, "Shop" (categories), the columns from theme.config.ts; bottom row = "© {year} {brand} ·
 * Theme Kiln by Haus Kayu" (credit optional) and the social icons from theme.config.ts (empty URLs hidden).
 */
export default async function Footer({ countryCode }: { countryCode: string }) {
  const t = getDictionary(countryCode)
  const categories = await listCategories({ fields: "id,name,handle,parent_category_id", limit: 20 }, countryCode).catch(() => [])
  const topLevel = categories.filter((c) => !c.parent_category_id).slice(0, 6)

  return (
    <footer className="mt-section border-t border-separator bg-surface">
      <div className="content-container grid gap-x-gutter gap-y-section py-section sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-stack-md">
          <LocalizedClientLink prefetch={false} href="/" aria-label={config.brand.name} className="w-fit">
            <Logo size="md" decorative />
          </LocalizedClientLink>
          <p className="max-w-sm text-sm text-muted">
            {config.brand.tagline} {config.brand.footerText}
          </p>
        </div>

        <div className="flex flex-col gap-stack-md text-sm">
          <span className="type-eyebrow">{t.footer.shop}</span>
          <ul className="flex flex-col gap-stack-sm" data-testid="footer-categories">
            {topLevel.map((c) => (
              <li key={c.id}>
                <LocalizedClientLink prefetch={false} href={`/categories/${c.handle}`} className="hover:underline underline-offset-4">
                  {c.name}
                </LocalizedClientLink>
              </li>
            ))}
            <li>
              <LocalizedClientLink prefetch={false} href="/store" className="hover:underline underline-offset-4">
                {t.nav.allProducts}
              </LocalizedClientLink>
            </li>
          </ul>
        </div>

        {config.brand.footerColumns.map((col) => (
          <div key={col.title} className="flex flex-col gap-stack-md text-sm">
            <span className="type-eyebrow">{col.title}</span>
            <ul className="flex flex-col gap-stack-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink prefetch={false} href={l.href} className="hover:underline underline-offset-4">
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-separator">
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
          <SocialLinks className="-mx-2 -my-2" />
        </div>
      </div>
    </footer>
  )
}
