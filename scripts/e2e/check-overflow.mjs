#!/usr/bin/env node
// Horizontal overflow check on phone widths. Opens a set of pages of a running storefront in every market at
// 320/360/375/390/412px and fails when document.scrollWidth > clientWidth (the page can be dragged sideways),
// printing the elements that stick out past the right edge. Pages: home, first category, first product, cart and
// checkout (after adding that product), /about, /contact, /link, blog index and first article. Pages that answer
// 404 (feature off) are skipped. Playwright: `pnpm exec playwright install chromium` once, or CHROME_PATH.
//
//   node scripts/e2e/check-overflow.mjs http://localhost:9720 [--widths 320,360,375,390,412] [--prefixes ,us]
//        [--paths /,/about] [--no-cart] [--json report.json]
import fs from "node:fs"
import { chromium } from "playwright"

const args = process.argv.slice(2)
const base = (args.find((a) => !a.startsWith("--")) || "").replace(/\/$/, "")
if (!base) { console.error("usage: check-overflow.mjs <base-url> [options]"); process.exit(2) }
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def }
const WIDTHS = opt("widths", "320,360,375,390,412").split(",").map(Number)
const PREFIXES = opt("prefixes", ",us").split(",").map((p) => (p && !p.startsWith("/") ? `/${p}` : p))
const PATHS = opt("paths", "") ? opt("paths").split(",") : null
const WITH_CART = !args.includes("--no-cart")
const JSON_OUT = opt("json", "")

const fetchHtml = async (path) => {
  const r = await fetch(base + path, { redirect: "follow" }).catch(() => null)
  return r && r.ok ? await r.text() : ""
}
const firstHref = (html, re) => { const m = html.match(re); return m ? m[1] : null }

/** The pages of one market, discovered from its home, store and blog pages */
async function discover(prefix) {
  if (PATHS) return PATHS.map((p) => ({ type: p === "/" ? "home" : p.replace(/^\//, ""), path: prefix + (p === "/" ? "" : p) || "/" }))
  const home = await fetchHtml(prefix || "/")
  const store = await fetchHtml(`${prefix}/store`)
  const blog = await fetchHtml(`${prefix}/blog`)
  const esc = prefix.replace(/\//g, "\\/")
  const pages = [
    { type: "home", path: prefix || "/" },
    { type: "category", path: firstHref(home + store, new RegExp(`href="(${esc}\\/categories\\/[^"?#]+)"`)) },
    { type: "product", path: firstHref(store + home, new RegExp(`href="(${esc}\\/products\\/[^"?#]+)"`)) },
    { type: "about", path: `${prefix}/about` },
    { type: "contact", path: `${prefix}/contact` },
    { type: "link", path: `${prefix}/link` },
    { type: "blog", path: `${prefix}/blog` },
    { type: "article", path: firstHref(blog, new RegExp(`href="(${esc}\\/blog\\/(?!kategori\\/|category\\/|page\\/|feed)[^"?#]+)"`)) },
  ]
  return pages.filter((p) => p.path)
}

const MEASURE = () => {
  const doc = document.documentElement
  const cw = doc.clientWidth, sw = Math.max(doc.scrollWidth, document.body.scrollWidth)
  const items = []
  if (sw > cw) {
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.right <= cw + 1) continue
      const cs = getComputedStyle(el)
      if (cs.position === "fixed" || cs.visibility === "hidden") continue
      if ([...el.children].some((c) => c.getBoundingClientRect().right >= r.right - 1)) continue
      let p = el, inScroller = false
      while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") { inScroller = true; break } p = p.parentElement }
      if (inScroller) continue
      const id = el.getAttribute("data-testid") ? `[data-testid=${el.getAttribute("data-testid")}]` : ""
      // nowrap text and explicit min-widths are the usual root causes; everything else merely follows the wide page
      const cause = cs.whiteSpace === "nowrap" || cs.whiteSpace === "pre" ? "nowrap" : cs.minWidth && cs.minWidth !== "0px" && cs.minWidth !== "auto" ? `min-width ${cs.minWidth}` : ""
      items.push({ cause, text: `${el.tagName.toLowerCase()}${id}.${String(el.className && typeof el.className === "string" ? el.className : "").split(" ").slice(0, 3).join(".")} right=${Math.round(r.right)} w=${Math.round(r.width)} "${(el.textContent || "").trim().slice(0, 40)}"` })
    }
  }
  const causes = items.filter((i) => i.cause).map((i) => `${i.text} (${i.cause})`)
  const rest = items.filter((i) => !i.cause).map((i) => i.text)
  return { cw, sw, items: [...causes.slice(0, 6), ...rest.slice(0, Math.max(0, 6 - causes.length))] }
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] })
const results = []
for (const prefix of PREFIXES) {
  const pages = await discover(prefix)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: prefix ? "en-US" : "id-ID" })
  const page = await context.newPage()
  page.setDefaultNavigationTimeout(60000)
  // one cart per market: add the first product, then cart and checkout have content
  const product = pages.find((p) => p.type === "product")
  if (WITH_CART && product) {
    await page.goto(base + product.path, { waitUntil: "load" })
    const button = page.locator("[data-testid=add-product-button]").first()
    if ((await button.count()) && (await button.isEnabled())) {
      await Promise.all([page.waitForResponse((r) => /\/store\/carts/.test(r.url()) && r.request().method() === "POST", { timeout: 20000 }).catch(() => null), button.click()])
      await page.waitForTimeout(800)
      pages.push({ type: "cart", path: `${prefix}/cart` }, { type: "checkout", path: `${prefix}/checkout` })
    }
  }
  for (const p of pages) {
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 844 })
      const res = await page.goto(base + p.path, { waitUntil: "load" }).catch(() => null)
      const status = res ? res.status() : 0
      if (status === 404 || status === 0) { results.push({ market: prefix || "/", type: p.type, path: p.path, width: w, status, skipped: true }); break }
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(400)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(200)
      const m = await page.evaluate(MEASURE)
      results.push({ market: prefix || "/", type: p.type, path: p.path, width: w, status, url: page.url(), cw: m.cw, sw: m.sw, over: m.sw - m.cw, items: m.items })
    }
  }
  await context.close()
}
await browser.close()

const fails = results.filter((r) => !r.skipped && r.over > 0)
const types = [...new Set(results.map((r) => r.type))]
const pad = (s, n) => String(s).padEnd(n)
console.log(`base ${base} | widths ${WIDTHS.join("/")} | markets ${PREFIXES.map((p) => p || "/").join(", ")} | ${results.filter((r) => !r.skipped).length} page loads`)
console.log()
console.log(pad("type", 10) + PREFIXES.map((p) => pad(p || "/", 8)).join("") + "widest overflow")
for (const t of types) {
  const row = results.filter((r) => r.type === t)
  const cells = PREFIXES.map((p) => { const rs = row.filter((r) => r.market === (p || "/")); if (!rs.length) return pad("-", 8); if (rs.every((r) => r.skipped)) return pad("skip", 8); const bad = rs.filter((r) => r.over > 0).length; return pad(bad ? `FAIL ${bad}` : "ok", 8) })
  const worst = row.filter((r) => !r.skipped).sort((a, b) => b.over - a.over)[0]
  console.log(pad(t, 10) + cells.join("") + (worst && worst.over > 0 ? `+${worst.over}px at ${worst.width} (${worst.path})` : ""))
}
if (fails.length) {
  console.log(`\n${fails.length} failing page load(s):`)
  for (const f of fails) { console.log(`- ${f.width}px ${f.path}: scrollWidth ${f.sw} > ${f.cw}`); for (const i of f.items) console.log(`    ${i}`) }
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ base, widths: WIDTHS, results }, null, 2))
process.exit(fails.length ? 1 : 0)
