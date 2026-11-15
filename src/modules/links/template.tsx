import { __iconData as arrowUpRight } from "lucide-react/icons/arrow-up-right"
import { __iconData as layers } from "lucide-react/icons/layers"
import { __iconData as mail } from "lucide-react/icons/mail"
import { __iconData as newspaper } from "lucide-react/icons/newspaper"
import { __iconData as phone } from "lucide-react/icons/phone"
import { __iconData as shoppingBag } from "lucide-react/icons/shopping-bag"
import { __iconData as tag } from "lucide-react/icons/tag"
import { __iconData as ticketPercent } from "lucide-react/icons/ticket-percent"
import { getImageProps } from "next/image"
import type { CSSProperties } from "react"

import { type LinksItem, type LinksPage, type LinksTheme, itemHref } from "@lib/data/links"
import { getDictionary } from "@lib/i18n/dictionaries"
import { fill } from "@lib/i18n/fill"
import { marketPath } from "@lib/util/market"
import config from "@theme"
import { Glyph, GLYPH_LABELS, type GlyphName } from "@modules/brand/glyphs"
import Logo from "@modules/brand/logo"
import { formatPrice } from "@modules/ds"
import { Icon, type IconData } from "@modules/ds/icons"

import CopyCode, { CopyCodeScript } from "./copy-code"

/**
 * One link-in-bio page (medusa-link-in-bio): avatar, name, bio, social icons, the items in the admin's order.
 * Server component with no client component at all: the promo-code copy button is a 300-byte inline script (only
 * when the page has a promo code), the footer links are plain <a>. Every item is a plain <a> to /l/{key} (the plugin
 * counts the click and redirects), so the destination never has to be known here. The page's own colours and shape
 * (plugin "theme") come in as CSS variables; Kiln's typography stays.
 */

/** Plugin social networks → brand glyphs (modules/brand/glyphs.tsx); marketplaces and unknown ones get the link glyph */
const SOCIAL_GLYPH: Record<string, GlyphName> = {
  instagram: "instagram", tiktok: "tiktok", facebook: "facebook", x: "x", youtube: "youtube", pinterest: "pinterest", linkedin: "linkedin", threads: "threads", whatsapp: "whatsapp", telegram: "telegram", email: "mail", website: "globe",
}
const SOCIAL_LABEL: Record<string, string> = { shopee: "Shopee", tokopedia: "Tokopedia", etsy: "Etsy", email: "E-mail", website: "Website" }

const TYPE_ICON: Partial<Record<LinksItem["type"], IconData>> = { link: arrowUpRight, collection: layers, category: tag, promo: ticketPercent, post: newspaper }

const RADIUS: Record<LinksTheme["radius"], string> = { none: "rounded-none", sm: "rounded-sm", md: "rounded-control", full: "rounded-full" }
const BUTTON: Record<LinksTheme["button"], string> = {
  solid: "border-transparent bg-(--lib-accent) text-(--lib-on-accent) hover:opacity-90",
  outline: "border-(--lib-accent) hover:bg-(--lib-accent)/8",
  soft: "border-transparent bg-(--lib-accent)/8 hover:bg-(--lib-accent)/14",
}

/** Hosts next/image may optimise (next.config.js IMAGE_HOSTS); anything else is embedded as it is */
const IMAGE_HOSTS = new Set(
  [process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL, process.env.MEDUSA_BACKEND_URL_INTERNAL, process.env.NEXT_PUBLIC_MEDIA_URL]
    .map((u) => {
      try {
        return u ? new URL(u).hostname : ""
      } catch {
        return ""
      }
    })
    .concat(["localhost", "127.0.0.1"])
    .filter(Boolean)
)

/** Readable text colour on the accent (WCAG relative luminance of the hex) */
function onColor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return "#ffffff"
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#0c0c0c" : "#ffffff"
}

/** A square picture at `size` CSS px (2× pixels), lazy unless `eager`; empty when the URL is not http(s) */
function Picture({ src, alt, size, eager, className }: { src: string; alt: string; size: number; eager?: boolean; className?: string }) {
  let host = ""
  try {
    const u = new URL(src)
    if (u.protocol !== "https:" && u.protocol !== "http:") return null
    host = u.hostname
  } catch {
    return null
  }
  const loading = { loading: eager ? ("eager" as const) : ("lazy" as const), fetchPriority: eager ? ("high" as const) : undefined, decoding: "async" as const }
  if (!IMAGE_HOSTS.has(host)) {
    // eslint-disable-next-line @next/next/no-img-element -- a host next/image is not configured for
    return <img src={src} alt={alt} width={size} height={size} {...loading} className={className} />
  }
  const { props } = getImageProps({ src, alt, width: size * 2, height: size * 2, sizes: `${size}px`, quality: 80 })
  // eslint-disable-next-line @next/next/no-img-element -- next/image's own props, rendered without its client wrapper
  return <img {...props} alt={alt} width={size} height={size} {...loading} className={className} />
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

export default function LinksTemplate({ countryCode, page }: { countryCode: string; page: LinksPage }) {
  const t = getDictionary(countryCode).links
  const theme = page.theme
  const vars = { "--lib-bg": theme.background, "--lib-fg": theme.text, "--lib-accent": theme.accent, "--lib-on-accent": onColor(theme.accent) } as CSSProperties
  const radius = RADIUS[theme.radius] ?? RADIUS.md
  const row = `flex min-h-14 w-full items-center gap-3 border px-4 py-3 text-left transition-[background-color,opacity] outline-none focus-visible:ring-2 focus-visible:ring-(--lib-accent) ${radius} ${BUTTON[theme.button] ?? BUTTON.solid}`
  const thumbRadius = theme.radius === "full" ? "rounded-full" : theme.radius === "none" ? "rounded-none" : "rounded-sm"
  // a promo code needs no link; anything else without a destination (deleted product, missing storefront URL) is skipped
  const items = page.items.filter((i) => i.type === "header" || i.type === "divider" || (i.type === "promo" && i.promo) || i.href)
  const hasPromo = items.some((i) => i.type === "promo" && i.promo)
  const shop = marketPath(countryCode, "/")

  return (
    <div style={vars} className="min-h-svh bg-(--lib-bg) text-(--lib-fg)" data-testid="links-page">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center px-4 pb-10 pt-10 sm:pt-16">
        <header className="flex flex-col items-center text-center">
          {page.avatar ? (
            <Picture src={page.avatar} alt={fill(t.avatarAlt, { name: page.title })} size={96} eager className="size-24 rounded-full object-cover" />
          ) : (
            <span aria-hidden="true" className="flex size-24 items-center justify-center rounded-full bg-(--lib-accent) text-2xl font-semibold text-(--lib-on-accent)">
              {initials(page.title) || "·"}
            </span>
          )}
          <h1 className="mt-4 text-xl font-semibold tracking-[-0.01em]">{page.title}</h1>
          {page.bio && <p className="mt-1.5 max-w-[32em] text-balance text-sm leading-6 opacity-75">{page.bio}</p>}
        </header>

        {page.socials.length > 0 && (
          <ul aria-label={t.socials} className="mt-4 flex flex-wrap justify-center" data-testid="links-socials">
            {page.socials.map((s) => {
              const glyph = SOCIAL_GLYPH[s.network] ?? "link"
              const label = GLYPH_LABELS[glyph] && SOCIAL_GLYPH[s.network] ? GLYPH_LABELS[glyph]! : SOCIAL_LABEL[s.network] ?? s.network
              return (
                <li key={`${s.network}-${s.url}`}>
                  <a href={s.url} aria-label={label} rel="noopener me" target="_blank" className="inline-flex size-11 items-center justify-center rounded-full outline-none hover:bg-(--lib-fg)/8 focus-visible:ring-2 focus-visible:ring-(--lib-accent)">
                    <Glyph name={glyph} size={22} />
                  </a>
                </li>
              )
            })}
          </ul>
        )}

        {items.length > 0 && (
          <ul aria-label={t.items} className="mt-8 flex w-full flex-col gap-3" data-testid="links-items">
            {items.map((item) => {
              if (item.type === "header") {
                return (
                  <li key={item.id} className="pt-3">
                    <h2 className="text-center text-xs font-medium uppercase tracking-[0.08em] opacity-60">{item.label}</h2>
                  </li>
                )
              }
              if (item.type === "divider") {
                return (
                  <li key={item.id} role="separator" className="py-1">
                    <hr className="border-(--lib-fg)/15" />
                  </li>
                )
              }
              const href = item.href ? itemHref(item, countryCode) : null
              const featured = item.style === "featured"
              const size = featured ? 72 : 44
              const picture = item.image ?? item.product?.thumbnail ?? item.collection?.thumbnail ?? item.category?.thumbnail ?? item.post?.cover ?? null
              const icon = item.type === "whatsapp" ? null : item.type === "contact" ? (item.contact?.kind === "tel" ? phone : mail) : TYPE_ICON[item.type]
              const price = item.product?.price
              const soldOut = item.product ? !item.product.in_stock : false
              const lead = picture ? (
                <Picture src={picture} alt="" size={size} className={`shrink-0 object-cover ${thumbRadius}`} />
              ) : item.type === "whatsapp" ? (
                <Glyph name="whatsapp" size={22} className="shrink-0 opacity-80" />
              ) : icon ? (
                <Icon icon={icon} className="shrink-0 opacity-80" />
              ) : null
              const text = (
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={featured ? "font-medium" : "text-sm font-medium"}>{item.label}</span>
                  {item.note && <span className="truncate text-xs opacity-70">{item.note}</span>}
                  {item.product && (
                    <span className="text-xs opacity-80" data-testid="links-price">
                      {soldOut ? t.outOfStock : price ? formatPrice(price.amount, price.currency_code) : null}
                      {!soldOut && price?.original_amount != null && price.original_amount > price.amount && <s className="ml-1.5 opacity-60">{formatPrice(price.original_amount, price.currency_code)}</s>}
                    </span>
                  )}
                </span>
              )
              if (item.type === "promo" && item.promo) {
                return (
                  <li key={item.id} className={`${row} cursor-default hover:opacity-100`} data-testid="links-item" data-type="promo">
                    {lead}
                    {href && item.url ? (
                      <a href={href} rel="noopener" className="flex min-w-0 flex-1 outline-none hover:underline underline-offset-4">
                        {text}
                      </a>
                    ) : (
                      text
                    )}
                    <CopyCode code={item.promo.code} labels={{ copy: t.copy, copied: t.copied }} className={`flex shrink-0 flex-col items-end gap-0.5 border px-3 py-1.5 text-sm outline-none hover:bg-(--lib-fg)/8 focus-visible:ring-2 focus-visible:ring-(--lib-accent) ${thumbRadius} border-current/30`} />
                  </li>
                )
              }
              return (
                <li key={item.id}>
                  <a href={href ?? undefined} rel="noopener" className={row} data-testid="links-item" data-type={item.type} aria-label={item.type === "product" && soldOut ? `${item.label} (${t.outOfStock})` : undefined}>
                    {lead}
                    {text}
                    {item.type === "product" && <Icon icon={shoppingBag} size={18} className="shrink-0 opacity-70" />}
                  </a>
                </li>
              )
            })}
          </ul>
        )}

        <footer className="mt-12 flex flex-col items-center gap-2 text-xs opacity-70">
          <a href={shop} aria-label={config.brand.name} className="inline-flex min-h-11 items-center gap-2 hover:opacity-100" data-testid="links-shop-link">
            <Logo size="sm" decorative className="text-(--lib-fg)" />
          </a>
          <a href={shop} className="hover:underline underline-offset-4">
            {t.visitShop}
          </a>
        </footer>
        {hasPromo && <CopyCodeScript />}
      </div>
    </div>
  )
}
