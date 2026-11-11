import { buttonVariants, cn } from "@heroui/styles"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import config from "@theme"
import Flag from "@modules/brand/flags"
import SocialLinks from "@modules/brand/social"
import { ProductGrid, type ProductCardData } from "@modules/ds"
import CountBadge from "@modules/layout/components/count-badge"
import MarketSelect from "@modules/layout/components/market-select"
import { marketOptions } from "@modules/layout/components/market-select/options"
import CatalogCard from "@modules/products/components/catalog-card"
import SheetDemo from "./sheet-demo"

export const metadata: Metadata = { title: "Design tokens", robots: { index: false, follow: false } }

const SWATCHES: { name: string; token: keyof typeof config.colors; note: string }[] = [
  { name: "Background", token: "background", note: "page" },
  { name: "Ink", token: "ink", note: "text, primary buttons" },
  { name: "Ink hover", token: "inkHover", note: "primary hover" },
  { name: "Muted", token: "muted", note: "secondary text, 5.3:1" },
  { name: "Border", token: "border", note: "hairlines only" },
  { name: "Control", token: "control", note: "input borders, 3:1+" },
  { name: "Soft", token: "soft", note: "chips, placeholders" },
  { name: "Soft hover", token: "softHover", note: "chip hover" },
]
const TYPE = [
  ["type-display", "Display 56–72 fluid · 600 · -0.03em"],
  ["type-h1", "Heading 1 · 40 · 600 · -0.02em"],
  ["type-h2", "Heading 2 · 28 · 600 · -0.02em"],
  ["type-h3", "Heading 3 · 20 · 600 · -0.01em"],
  ["type-body", "Body 16 / 1.6 · 400. The quick brown fox jumps over the lazy dog, and the stoneware plate goes in the dishwasher."],
  ["type-label", "Label 12 · 500 · uppercase · +0.08em"],
  ["type-price", "Price tnum  $1,234.00  Rp 1.234.000  0123456789"],
] as const

/**
 * /design: the theme's tokens on one page (colours, type scale, radii, buttons, fields, frost surfaces). Shown in
 * development only; set KILN_DESIGN_PAGE=1 to keep it in production.
 */
const DEMO_CARDS: ProductCardData[] = [
  { id: "demo_1", href: "/products/demo-plate", title: "Stoneware Dinner Plate", subtitle: "Tableware", price: { amount: 28, currency: "usd", from: "From" }, options: [{ id: "o1", title: "Size", values: ["22 cm", "27 cm"] }], variants: [{ id: "v1", title: "22 cm", options: { Size: "22 cm" }, price: { amount: 28, currency: "usd" }, inStock: true }, { id: "v2", title: "27 cm", options: { Size: "27 cm" }, price: { amount: 34, currency: "usd" }, inStock: true }] },
  { id: "demo_2", href: "/products/demo-bowl", title: "Ceramic Serving Bowl", subtitle: "Tableware", price: { amount: 46, currency: "usd" }, options: [{ id: "o2", title: "Default", values: ["Default"] }], variants: [{ id: "v3", title: "Default", options: { Default: "Default" }, price: { amount: 46, currency: "usd" }, inStock: true }] },
  { id: "demo_3", href: "/products/demo-throw", title: "Wool Throw", subtitle: "Textiles", price: { amount: 120, currency: "usd", original: 150 }, options: [{ id: "o3", title: "Default", values: ["Default"] }], variants: [{ id: "v4", title: "Default", options: { Default: "Default" }, price: { amount: 120, currency: "usd", original: 150 }, inStock: true }] },
  { id: "demo_4", href: "/products/demo-lamp", title: "Paper Cone Lamp", subtitle: "Lighting", price: { amount: 88, currency: "usd" }, soldOut: "Sold out", options: [{ id: "o4", title: "Default", values: ["Default"] }], variants: [{ id: "v5", title: "Default", options: { Default: "Default" }, price: { amount: 88, currency: "usd" }, inStock: false }] },
]

export default async function DesignPage(props: { params: Promise<{ countryCode: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.KILN_DESIGN_PAGE !== "1") notFound()
  const { countryCode } = await props.params
  const markets = await marketOptions("en-US")
  return (
    <div className="content-container flex flex-col gap-section py-section">
      <header className="flex flex-col gap-stack-sm">
        <p className="type-label text-muted">Kiln · design tokens</p>
        <h1 className="type-h1">{config.brand.name} theme</h1>
        <p className="type-body max-w-2xl text-muted">Every value on this page comes from theme.config.ts and src/styles. Change it there, not in the components.</p>
      </header>

      <section className="flex flex-col gap-stack-md" aria-labelledby="d-colours">
        <h2 id="d-colours" className="type-h2">Colours</h2>
        <ul className="grid grid-cols-2 gap-gutter sm:grid-cols-4">
          {SWATCHES.map((s) => (
            <li key={s.token} className="flex flex-col gap-stack-xs">
              <span className="block aspect-[4/3] rounded-media border border-border" style={{ background: config.colors[s.token] }} />
              <span className="text-sm font-medium">{s.name}</span>
              <span className="type-price text-xs text-muted">{config.colors[s.token].toUpperCase()} · {s.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-stack-md" aria-labelledby="d-type">
        <h2 id="d-type" className="type-h2">Type scale</h2>
        <ul className="flex flex-col gap-stack-lg border-t border-border">
          {TYPE.map(([cls, sample]) => (
            <li key={cls} className="grid gap-stack-xs border-b border-border py-stack-md sm:grid-cols-[10rem_1fr]">
              <code className="type-price text-xs text-muted">.{cls}</code>
              <p className={cls}>{sample}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-stack-md" aria-labelledby="d-controls">
        <h2 id="d-controls" className="type-h2">Controls</h2>
        <div className="flex flex-wrap items-center gap-stack-sm">
          <button className={cn(buttonVariants({ variant: "primary", size: "lg" }), "h-12 px-6")}>Primary</button>
          <button className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-12 px-6")}>Secondary</button>
          <button className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-12 px-6")}>Ghost</button>
          <button className={cn(buttonVariants({ variant: "primary", size: "md" }))}>Primary md</button>
          <button className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>Secondary sm</button>
          <button disabled className={cn(buttonVariants({ variant: "primary", size: "md" }), "opacity-50")}>Disabled</button>
        </div>
        <div className="grid max-w-xl gap-stack-sm sm:grid-cols-2">
          <label className="flex flex-col gap-stack-xs">
            <span className="type-label text-muted">Email</span>
            <input type="email" placeholder="you@example.com" className="h-11 rounded-field border border-field-border bg-field px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-focus" />
          </label>
          <label className="flex flex-col gap-stack-xs">
            <span className="type-label text-muted">Quantity</span>
            <input type="number" defaultValue={1} className="type-price h-11 rounded-field border border-field-border bg-field px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-focus" />
          </label>
        </div>
        <ul className="flex flex-wrap gap-stack-sm">
          {[["control", config.radius.control, "buttons, inputs"], ["media", config.radius.media, "photos, cards, tiles"], ["sheet", config.radius.sheet, "drawers, sheets"]].map(([n, r, note]) => (
            <li key={n} className="flex items-center gap-stack-sm">
              <span className="block size-16 bg-default" style={{ borderRadius: r }} />
              <span className="text-sm">
                <span className="font-medium">radius.{n}</span> <span className="type-price text-muted">{r}</span>
                <br />
                <span className="text-muted">{note}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-stack-md" aria-labelledby="d-card">
        <h2 id="d-card" className="type-h2">Product card</h2>
        <p className="type-body max-w-2xl text-muted">Category chip top-left, wishlist heart top-right, "+" bottom-right: one variant adds to the cart (tick for 1.6 s), several open the quick view, sold out disables it. All three sit outside the link; 44 px targets.</p>
        <ProductGrid>
          {DEMO_CARDS.map((c) => (
            <CatalogCard key={c.id} product={c} countryCode={countryCode} />
          ))}
        </ProductGrid>
      </section>

      <section className="flex flex-col gap-stack-md" aria-labelledby="d-header">
        <h2 id="d-header" className="type-h2">Header parts</h2>
        <div className="flex flex-wrap items-center gap-stack-lg">
          <div className="flex flex-col gap-stack-xs">
            <span className="type-label text-muted">Market select</span>
            <MarketSelect options={markets} label="Country and currency" className="w-fit" />
          </div>
          <div className="flex flex-col gap-stack-xs">
            <span className="type-label text-muted">Count badge (space reserved at 0)</span>
            <div className="flex gap-stack-sm">
              {[0, 3, 120].map((n) => (
                <span key={n} className="relative inline-flex size-11 items-center justify-center rounded-full bg-default">
                  <span className="text-xs text-muted">{n}</span>
                  <CountBadge count={n} />
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-stack-xs">
            <span className="type-label text-muted">Flags (SVG)</span>
            <div className="flex flex-wrap gap-stack-xs">
              {["us", "id", "gb", "de", "fr", "it", "nl", "jp", "sg", "au", "ca", "br"].map((c) => (
                <Flag key={c} code={c} className="h-[18px] w-6" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-stack-xs">
            <span className="type-label text-muted">Social (theme.config.ts)</span>
            <SocialLinks className="-mx-2" />
          </div>
        </div>
        <div className="flex flex-col gap-stack-xs">
          <span className="type-label text-muted">Sheets (ds/sheet.tsx)</span>
          <SheetDemo />
        </div>
      </section>

      <section className="flex flex-col gap-stack-md" aria-labelledby="d-frost">
        <h2 id="d-frost" className="type-h2">Frost</h2>
        <p className="type-body max-w-2xl text-muted">
          Blur only on floating surfaces: sticky header, mega menu, cart drawer, quick view, mobile filter sheet, mobile sticky add-to-cart.
          Opacity {config.frost.alpha}, blur {config.frost.blur}; solid where backdrop-filter is unsupported or reduced transparency is on.
        </p>
        <div className="relative overflow-hidden rounded-media" style={{ background: "linear-gradient(135deg, #2a2724 0%, #8a8178 40%, #f3f0ea 70%, #4a443e 100%)", height: 280 }}>
          <div className="frost absolute inset-x-0 top-0 flex h-16 items-center justify-between border-b border-border px-6">
            <span className="font-semibold tracking-[-0.02em]">{config.brand.name}</span>
            <span className="text-sm">Sticky header</span>
          </div>
          <div className="frost absolute bottom-6 right-6 w-64 rounded-sheet p-4 shadow-lift">
            <p className="type-h3">Cart drawer</p>
            <p className="mt-1 text-sm text-muted">Same surface, radius.sheet, shadow-lift.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
