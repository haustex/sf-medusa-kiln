#!/usr/bin/env node
// hreflang audit of a running storefront (production, a preview, or `next start`): crawls sitemap.xml plus the
// pages linked from the home page of every market, fetches each URL and every hreflang target it names, and checks
//   - 200, indexable pages: hreflang present, absolute URLs, self-referencing (the canonical is one of the links),
//     reciprocal (every target lists the same set), x-default = the `--x-default` language's URL (else self),
//     the canonical is the page's own URL, and sitemap.xml carries the same xhtml:link set as the <head>;
//   - noindex, redirecting and 404 pages: no hreflang of their own and no other page points at them.
// Read-only GETs, a few at a time. Exit code 1 when anything fails.
//
//   node scripts/seo/check-hreflang.mjs https://example.com [--x-default id-ID] [--prefixes us,id] [--max 500]
//        [--concurrency 4] [--seeds /custom,/link] [--json report.json] [--user u --pass p]
import fs from "node:fs"

const args = process.argv.slice(2)
const base = (args.find((a) => !a.startsWith("--")) || "").replace(/\/$/, "")
if (!base) { console.error("usage: check-hreflang.mjs <base-url> [options]"); process.exit(2) }
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def }
const X_DEFAULT_LANG = opt("x-default", "id-ID")
const PREFIXES = opt("prefixes", "us,id").split(",").filter(Boolean)
const MAX = Number(opt("max", 500))
const CONCURRENCY = Number(opt("concurrency", 4))
const SEEDS = opt("seeds", "").split(",").filter(Boolean)
const JSON_OUT = opt("json", "")
const AUTH = opt("user", "") && opt("pass", "") ? { authorization: "Basic " + Buffer.from(`${opt("user")}:${opt("pass")}`).toString("base64") } : {}
const origin = new URL(base).origin
const SKIP = /^\/(?:[a-z]{2}\/)?(?:account|cart|checkout|wishlist|order|transfer|track|lacak|review|verify-account|penawaran|api|_next|l|img|og)(?:\/|$)/

const norm = (u) => { const x = new URL(u, origin); x.hash = ""; return x.pathname === "/" && !x.search ? x.origin : x.href.replace(/\/$/, "") }
const marketless = (u) => { const p = new URL(u).pathname.replace(/\/$/, ""); const m = p.match(/^\/([a-z]{2})(?=\/|$)/); return m && PREFIXES.includes(m[1]) ? p.slice(m[0].length) || "/" : p || "/" }
const typeOf = (u) => {
  const p = marketless(u)
  if (p === "/") return "home"
  if (/^\/store(?:\/|$)/.test(p)) return "store"
  if (/^\/categories\//.test(p)) return "category"
  if (/^\/(collections|makers)(?:\/|$)/.test(p)) return "collection"
  if (/^\/products\//.test(p)) return "product"
  if (/^\/blog\/(?:kategori|category)\//.test(p)) return "blog-category"
  if (/^\/blog(?:\/page\/\d+)?$/.test(p)) return "blog-index"
  if (/^\/blog\/feed\.xml$/.test(p)) return "feed"
  if (/^\/blog\//.test(p)) return "blog-article"
  if (/^\/custom(?:\/|$)/.test(p)) return "custom"
  if (/^\/links?(?:\/|$)/.test(p)) return "link"
  if (/^\/search/.test(p)) return "search"
  if (/^\/[a-z0-9-]+$/.test(p)) return "page"
  return "other"
}

const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}=["']([^"']*)["']`, "i")); return m ? m[1].replace(/&amp;/g, "&") : null }
function parseHead(html) {
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [html.slice(0, 200000)])[0]
  const links = [...head.matchAll(/<link\s[^>]*>/gi)].map((m) => m[0])
  const canonical = links.filter((l) => /rel=["']canonical["']/i.test(l)).map((l) => attr(l, "href"))
  const hreflang = {}
  for (const l of links) if (/rel=["']alternate["']/i.test(l) && attr(l, "hreflang")) hreflang[attr(l, "hreflang")] = attr(l, "href")
  const robots = [...head.matchAll(/<meta\s[^>]*name=["']robots["'][^>]*>/gi)].map((m) => attr(m[0], "content") || "").join(",")
  const anchors = [...html.matchAll(/<a\s[^>]*href=["']([^"'#?]+)[^"']*["']/gi)].map((m) => m[1])
  return { canonical, hreflang, robots, anchors }
}

const pages = new Map() // url -> record
const queue = []
const enqueue = (u, why) => { const n = norm(u); if (!pages.has(n) && new URL(n).origin === origin && pages.size + queue.length < MAX) { queue.push(n); pages.set(n, { url: n, why }) } }

async function fetchOne(u) {
  const rec = pages.get(u)
  try {
    const r = await fetch(u, { redirect: "manual", headers: { "user-agent": "kiln-hreflang-check/1.0", accept: "text/html,application/xml;q=0.9,*/*;q=0.5", ...AUTH } })
    rec.status = r.status
    rec.location = r.headers.get("location")
    const xr = r.headers.get("x-robots-tag") || ""
    const ct = r.headers.get("content-type") || ""
    const body = r.status === 200 && /html/.test(ct) ? await r.text() : ""
    const head = body ? parseHead(body) : { canonical: [], hreflang: {}, robots: "", anchors: [] }
    Object.assign(rec, head, { noindex: /noindex/i.test(xr) || /noindex/i.test(head.robots), html: !!body })
    rec.type = typeOf(u)
    rec.indexable = r.status === 200 && rec.html && !rec.noindex
    for (const h of Object.values(rec.hreflang)) if (/^https?:\/\//.test(h)) enqueue(h, `hreflang of ${u}`)
    if (rec.type === "home") for (const a of head.anchors) if (a.startsWith("/") && !SKIP.test(a)) enqueue(a, `linked from ${u}`)
  } catch (e) {
    rec.status = 0; rec.error = String(e.message || e); rec.type = typeOf(u); rec.indexable = false; rec.hreflang = {}; rec.canonical = []
  }
}

async function drain() {
  const workers = Array.from({ length: CONCURRENCY }, async () => { while (queue.length) await fetchOne(queue.shift()) })
  await Promise.all(workers)
}

// 1. sitemap.xml
const sitemap = new Map() // loc -> { [hreflang]: href }
let sitemapStatus = 0
try {
  const r = await fetch(`${base}/sitemap.xml`, { headers: { "user-agent": "kiln-hreflang-check/1.0", ...AUTH } })
  sitemapStatus = r.status
  const xml = r.status === 200 ? await r.text() : ""
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1]
    if (!loc) continue
    const alt = {}
    for (const l of m[1].matchAll(/<xhtml:link\s[^>]*>/g)) if (/rel="alternate"/.test(l[0])) alt[attr(l[0], "hreflang")] = attr(l[0], "href")
    sitemap.set(norm(loc), alt)
  }
} catch (e) { console.error(`sitemap.xml: ${e.message}`) }

// 2. crawl: sitemap URLs, the home page of every market prefix, extra seeds, then every hreflang target found
for (const loc of sitemap.keys()) enqueue(loc, "sitemap")
enqueue("/", "seed")
for (const p of PREFIXES) enqueue(`/${p}`, "seed")
for (const s of ["/store", "/search", "/blog", "/custom", "/link", "/links", ...SEEDS]) { enqueue(s, "seed"); for (const p of PREFIXES) enqueue(`/${p}${s}`, "seed") }
while (queue.length) await drain()

// 3. checks
const same = (a, b) => { const ka = Object.keys(a).sort(), kb = Object.keys(b).sort(); return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]) }
const pointedAt = new Map() // url -> [by]
for (const rec of pages.values()) for (const [lang, h] of Object.entries(rec.hreflang)) { if (lang === "x-default") continue; const n = norm(h); pointedAt.set(n, [...(pointedAt.get(n) || []), rec.url]) }
const results = []
for (const rec of pages.values()) {
  const fails = [], warns = []
  const langs = Object.keys(rec.hreflang)
  const self = rec.canonical[0]
  if (rec.status === 0) fails.push(`fetch error: ${rec.error}`)
  else if (rec.indexable) {
    if (!langs.length) fails.push("no hreflang")
    if (rec.canonical.length !== 1) fails.push(`canonical count ${rec.canonical.length}`)
    else {
      if (!/^https?:\/\//.test(self)) fails.push(`canonical not absolute: ${self}`)
      if (norm(self) !== rec.url) fails.push(`canonical ${self} ≠ url`)
      if (langs.length && !Object.entries(rec.hreflang).some(([l, h]) => l !== "x-default" && h === self)) fails.push(`no self-reference equal to canonical ${self}`)
    }
    for (const [l, h] of Object.entries(rec.hreflang)) {
      if (!/^https:\/\/|^http:\/\//.test(h)) fails.push(`${l}: not absolute (${h})`)
      else if (new URL(h).origin !== origin) fails.push(`${l}: other origin (${h})`)
    }
    if (langs.length) {
      if (!rec.hreflang["x-default"]) fails.push("x-default missing")
      else {
        const want = rec.hreflang[X_DEFAULT_LANG] ?? self
        if (rec.hreflang["x-default"] !== want) fails.push(`x-default ${rec.hreflang["x-default"]} ≠ ${want}`)
      }
      for (const [l, h] of Object.entries(rec.hreflang)) {
        if (l === "x-default" || h === self) continue
        const t = pages.get(norm(h))
        if (!t) fails.push(`${l}: target not fetched (${h})`)
        else if (t.status !== 200) fails.push(`${l}: target ${h} → ${t.status}${t.location ? " " + t.location : ""}`)
        else if (!t.indexable) fails.push(`${l}: target ${h} is noindex`)
        else if (!same(t.hreflang, rec.hreflang)) fails.push(`${l}: target ${h} lists a different set (${JSON.stringify(t.hreflang)})`)
        else if (t.canonical[0] !== h) fails.push(`${l}: target canonical ${t.canonical[0]} ≠ ${h}`)
      }
    }
    const sm = sitemap.get(rec.url)
    if (sm) { if (!same(sm, rec.hreflang)) fails.push(`sitemap alternates differ: ${JSON.stringify(sm)}`) }
    else if (sitemap.size && !["search", "other"].includes(rec.type) && !/\/page\/\d+$/.test(rec.url)) warns.push("not in sitemap")
  } else {
    if (langs.length) fails.push(`${rec.status}${rec.noindex ? " noindex" : ""} page carries hreflang`)
    if (pointedAt.has(rec.url)) fails.push(`pointed at by ${pointedAt.get(rec.url).length} page(s) although ${rec.status}${rec.noindex ? " noindex" : ""}${rec.location ? " → " + rec.location : ""}`)
    if (sitemap.has(rec.url)) fails.push(`in sitemap although ${rec.status}${rec.noindex ? " noindex" : ""}`)
  }
  results.push({ url: rec.url, type: rec.type, status: rec.status, indexable: !!rec.indexable, hreflang: rec.hreflang, canonical: self ?? null, inSitemap: sitemap.has(rec.url), fails, warns })
}

// 4. report
const byType = new Map()
for (const r of results) {
  const t = byType.get(r.type) || { type: r.type, pages: 0, indexable: 0, withHreflang: 0, ok: 0, fail: 0, warn: 0 }
  t.pages++; if (r.indexable) t.indexable++; if (Object.keys(r.hreflang).length) t.withHreflang++; if (r.fails.length) t.fail++; else t.ok++; if (r.warns.length) t.warn++
  byType.set(r.type, t)
}
const order = ["home", "store", "category", "collection", "product", "blog-index", "blog-category", "blog-article", "custom", "link", "page", "search", "feed", "other"]
const rows = [...byType.values()].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
const pad = (s, n) => String(s).padEnd(n)
console.log(`base ${base} | sitemap.xml ${sitemapStatus} with ${sitemap.size} URLs | ${results.length} URLs fetched | x-default must be ${X_DEFAULT_LANG}\n`)
console.log(`${pad("type", 14)} ${pad("pages", 6)} ${pad("index", 6)} ${pad("hreflang", 9)} ${pad("ok", 4)} ${pad("fail", 5)} warn`)
for (const t of rows) console.log(`${pad(t.type, 14)} ${pad(t.pages, 6)} ${pad(t.indexable, 6)} ${pad(t.withHreflang, 9)} ${pad(t.ok, 4)} ${pad(t.fail, 5)} ${t.warn}`)
const failed = results.filter((r) => r.fails.length)
const warned = results.filter((r) => r.warns.length && !r.fails.length)
if (failed.length) { console.log(`\n${failed.length} URL(s) failed:`); for (const r of failed) console.log(`- ${r.url} [${r.type}, ${r.status}${r.indexable ? "" : ", not indexable"}]\n    ${r.fails.join("\n    ")}`) }
if (warned.length) { console.log(`\n${warned.length} warning(s):`); for (const r of warned.slice(0, 40)) console.log(`- ${r.url} [${r.type}]: ${r.warns.join("; ")}`) }
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ base, sitemapStatus, sitemapUrls: sitemap.size, xDefault: X_DEFAULT_LANG, summary: rows, results }, null, 1))
process.exit(failed.length ? 1 : 0)
