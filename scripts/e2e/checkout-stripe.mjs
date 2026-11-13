// End-to-end checkout through the storefront with Stripe's Payment Element (test card 4242…), or with Medusa's
// dev provider ("Pay later") to check the harness without Stripe keys.
//
//   node scripts/e2e/checkout-stripe.mjs                 # Stripe: expects pp_stripe_stripe on the region
//   node scripts/e2e/checkout-stripe.mjs --provider dev  # pp_system_default, no card
//   --card 4000002500003155 --expect 3ds                 # 3-D Secure challenge (test button "Complete")
//   --card 4000000000000002 --expect decline             # declined: error shown, no order, still on /checkout
//
// Environment (defaults in brackets):
//   KILN_URL                 storefront [http://localhost:9720]
//   MEDUSA_BACKEND_URL       backend, for the final order check [http://127.0.0.1:9710]
//   MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD   optional: enables Stripe on the region when it is not yet, and
//                            reads the order's payment status at the end
//   KILN_E2E_MARKET          market prefix-less code [us]      KILN_E2E_PRODUCT  product handle [oak-serving-board]
//   PUPPETEER_DIR            a folder whose node_modules holds puppeteer (otherwise `import("puppeteer")`)
//   KILN_E2E_SHOTS           folder for screenshots (optional)       KILN_E2E_HEADFUL=1 shows the browser
//
// Before a Stripe run: STRIPE_API_KEY in the backend (restart), NEXT_PUBLIC_STRIPE_KEY in the storefront (restart),
// the provider enabled on the region (Admin → Settings → Regions, or the admin credentials above).
import { createRequire } from "node:module"
import path from "node:path"

const arg = (name, def) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : def }
const PROVIDER = arg("--provider", "stripe") === "dev" ? "pp_system_default" : "pp_stripe_stripe"
const CARD = arg("--card", "4242424242424242").replace(/\s+/g, "")
/** success (default) | 3ds (a challenge frame appears, confirm it) | decline (the card is refused) */
const EXPECT = arg("--expect", "success")
const BASE = (process.env.KILN_URL || "http://localhost:9720").replace(/\/$/, "")
const BACKEND = (process.env.MEDUSA_BACKEND_URL || "http://127.0.0.1:9710").replace(/\/$/, "")
const MARKET = process.env.KILN_E2E_MARKET || "us"
const PRODUCT = process.env.KILN_E2E_PRODUCT || "oak-serving-board"
const SHOTS = process.env.KILN_E2E_SHOTS
const ADMIN = process.env.MEDUSA_ADMIN_EMAIL && process.env.MEDUSA_ADMIN_PASSWORD ? { email: process.env.MEDUSA_ADMIN_EMAIL, password: process.env.MEDUSA_ADMIN_PASSWORD } : null

let puppeteer
try {
  puppeteer = process.env.PUPPETEER_DIR ? createRequire(path.join(process.env.PUPPETEER_DIR, "package.json"))("puppeteer") : (await import("puppeteer")).default
} catch {
  console.error("puppeteer not found: `pnpm add -D puppeteer` in the theme, or set PUPPETEER_DIR to a folder that has it in node_modules")
  process.exit(2)
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.log("•", ...a)
const fail = (msg) => { console.error("✗", msg); process.exitCode = 1 }

// Storefront market prefix: the default market has none (theme.config.ts markets.routing)
/** "" when the market is the unprefixed default (its /xx URL answers with a redirect), else "/xx" (no trailing slash: Next would redirect that too) */
const marketPrefix = async () => {
  const res = await fetch(`${BASE}/${MARKET}`, { redirect: "manual" })
  const to = res.headers.get("location") || ""
  return (res.status === 308 || res.status === 307) && !new URL(to, BASE).pathname.startsWith(`/${MARKET}`) ? "" : `/${MARKET}`
}

const admin = ADMIN
  ? await (async () => {
      const res = await fetch(`${BACKEND}/auth/user/emailpass`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ADMIN) })
      if (!res.ok) { fail(`admin login failed (${res.status})`); return null }
      const { token } = await res.json()
      const call = async (p, init = {}) => { const r = await fetch(`${BACKEND}${p}`, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers || {}) } }); if (!r.ok) throw new Error(`${init.method || "GET"} ${p} → ${r.status} ${(await r.text()).slice(0, 200)}`); return r.json() }
      return { call }
    })()
  : null

// 1. The region must have the provider (enable it through the Admin API when credentials are given)
try {
  if (admin) {
    const { regions } = await admin.call(`/admin/regions?fields=id,name,countries.iso_2,payment_providers.id`)
    const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === MARKET))
    if (!region) fail(`no region with country ${MARKET}`)
    else {
      const ids = region.payment_providers.map((p) => p.id)
      log(`region ${region.name}: providers ${ids.join(", ") || "none"}`)
      if (!ids.includes(PROVIDER)) {
        const { payment_providers } = await admin.call(`/admin/payments/payment-providers?is_enabled=true&limit=100`)
        if (!payment_providers.some((p) => p.id === PROVIDER)) fail(`${PROVIDER} is not registered in the backend${PROVIDER === "pp_stripe_stripe" ? " (STRIPE_API_KEY missing? restart the backend after setting it)" : ""}; registered: ${payment_providers.map((p) => p.id).join(", ")}`)
        else {
          await admin.call(`/admin/regions/${region.id}`, { method: "POST", body: JSON.stringify({ payment_providers: [...new Set([...ids, PROVIDER])] }) })
          log(`enabled ${PROVIDER} on ${region.name}`)
        }
      }
    }
  } else log("no admin credentials: assuming the provider is already enabled on the region")
} catch (e) {
  fail(`region check: ${e.message}`)
}
if (process.exitCode) process.exit()

const prefix = await marketPrefix()
const browser = await puppeteer.launch({ headless: process.env.KILN_E2E_HEADFUL ? false : true, args: ["--no-sandbox", "--disable-gpu"] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const issues = []
page.on("pageerror", (e) => issues.push(`pageerror: ${e.message.slice(0, 200)}`))
// the Stripe publishable key the storefront passes to the client (RSC payload or HTML); only compared, never printed
let seenPk = ""
page.on("response", (r) => { const ct = r.headers()["content-type"] || ""; if (/text\/x-component|text\/html/.test(ct) && /checkout/.test(r.url())) r.text().then((t) => { const m = t.match(/pk_(test|live)_[A-Za-z0-9]+/); if (m) seenPk = m[0] }).catch(() => {}) })
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") issues.push(`console.${m.type()}: ${m.text().slice(0, 200)}`) })
page.on("response", (r) => { if (r.status() >= 400) issues.push(`${r.status()} ${r.url().slice(0, 120)}`) })
// Stripe API traffic (method, path, status), printed when a run fails: shows whether confirmPayment was attempted
const stripeCalls = []
page.on("response", (r) => { const u = new URL(r.url()); if (u.hostname === "api.stripe.com") stripeCalls.push(`${r.request().method()} ${u.pathname.replace(/pi_[A-Za-z0-9]+/, "pi_…")} ${r.status()}`) })
const goto = async (p) => { await page.goto(`${BASE}${p}`, { waitUntil: "networkidle0", timeout: 120000 }); await wait(300) }
const untilPath = (re, ms = 60000) => page.waitForFunction((s) => new RegExp(s).test(location.pathname + location.search), { timeout: ms }, re.source)
const type = async (sel, v) => { await page.click(sel, { clickCount: 3 }); await page.type(sel, v) }
const shot = async (name) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }) }
const t0 = Date.now()
const stamp = `${Date.now().toString(36)}`

try {
  // 2. Product → cart → checkout
  await goto(`${prefix}/products/${PRODUCT}`)
  await page.waitForSelector("[data-testid=add-product-button]", { timeout: 30000 })
  await page.evaluate(() => document.querySelector("[data-testid=add-product-button]").click())
  await page.waitForSelector("dialog[open] [data-testid=cart-drawer-checkout]", { timeout: 20000 })
  await wait(300)
  await page.evaluate(() => document.querySelector("[data-testid=cart-drawer-checkout]").click())
  await untilPath(/\/checkout/)
  await page.waitForSelector("[data-testid=address-form]", { timeout: 30000 })
  log("checkout opened")

  // 3. Address (US test address; Stripe's test mode accepts any)
  await type("[data-testid=shipping-email-input]", `e2e-${stamp}@example.com`)
  await type("[data-testid=shipping-first-name-input]", "Ada")
  await type("[data-testid=shipping-last-name-input]", "Lovelace")
  await type("[data-testid=shipping-address-input]", "12 Maple St")
  await type("[data-testid=shipping-city-input]", "Portland")
  await type("[data-testid=shipping-province-input]", "OR")
  await type("[data-testid=shipping-postal-code-input]", "97201")
  await page.select("[data-testid=shipping-country-select]", MARKET)
  await type("[data-testid=shipping-phone-input]", "+1 555 0100")
  await page.click("[data-testid=submit-address-button]")
  await untilPath(/step=delivery/)
  await page.waitForSelector("[data-testid=delivery-option-radio] input", { timeout: 30000 })
  log("address saved")

  // 4. Delivery: first option
  await (await page.$("[data-testid=delivery-option-radio] input")).click()
  await page.waitForFunction(() => !document.querySelector("[data-testid=submit-delivery-option-button]")?.disabled, { timeout: 30000 })
  await page.click("[data-testid=submit-delivery-option-button]")
  await untilPath(/step=payment/)
  await page.waitForSelector("[data-testid=payment-step]", { timeout: 30000 })
  await wait(500)
  const providers = await page.evaluate(() => [...document.querySelectorAll("[data-testid^=payment-option-]")].map((o) => o.dataset.testid.replace("payment-option-", "")))
  log(`payment step: providers ${providers.join(", ")}`)
  if (!providers.includes(PROVIDER)) throw new Error(`${PROVIDER} not offered at checkout`)
  if (providers.length > 1) {
    await page.click(`[data-testid=payment-option-${PROVIDER}] input, [data-testid=payment-option-${PROVIDER}]`)
    await wait(500)
  }
  await shot("payment-step")

  // 5. Stripe: fill the Payment Element (iframe) with the test card
  if (PROVIDER === "pp_stripe_stripe") {
    const missing = await page.evaluate(() => document.querySelector("[data-testid=payment-step] .text-danger")?.textContent || null)
    if (missing) throw new Error(`storefront says: ${missing}`)
    await page.waitForSelector("iframe[name^=__privateStripeFrame], iframe[title*='payment input']", { timeout: 60000 })
    // Stripe mounts several frames; the Payment Element is the one with the card number field
    let frame = null
    for (let i = 0; i < 90 && !frame; i++) {
      for (const f of page.frames()) {
        // Stripe swaps its loader frame for the real one while we look: a detached frame throws synchronously
        try {
          if (await f.$("input[name=number]")) { frame = f; break }
          if (await f.$("#card-tab, [data-testid=card-tab]")) await f.click("#card-tab, [data-testid=card-tab]")
        } catch { /* detached or navigating frame: look again */ }
      }
      if (!frame) await wait(500)
    }
    if (!frame) {
      const frames = page.frames().map((f) => f.url().replace(/\?.*$/, "").slice(0, 90)).filter((u) => u && u !== "about:blank")
      const step = await page.evaluate(() => document.querySelector("[data-testid=payment-step]")?.innerText.replace(/\s+/g, " ").slice(0, 300) || null)
      const dom = await page.evaluate(() => {
        const opt = document.querySelector("[data-testid=payment-option-pp_stripe_stripe]")
        const el = opt?.closest("label, li, div")
        const iframes = [...document.querySelectorAll("[data-testid=payment-step] iframe")].map((f) => `${new URL(f.src).pathname.split("/").pop().slice(0, 30)} ${f.offsetWidth}x${f.offsetHeight}`)
        return { optionChecked: opt?.querySelector("input")?.checked ?? opt?.checked ?? null, stripeElementDivs: document.querySelectorAll("[data-testid=payment-step] .StripeElement, [data-testid=payment-step] .__PrivateStripeElement").length, iframes, hydrated: !!document.querySelector("[data-testid=payment-step]")?.closest("[data-reactroot], body") && typeof window.__next_f !== "undefined", optionHtmlTail: el ? el.innerHTML.replace(/\s+/g, " ").slice(-400) : null }
      })
      console.log("  dom:", JSON.stringify(dom))
      // Which key the page gave Stripe.js, never printed: shape (prefix, length) and whether it equals NEXT_PUBLIC_STRIPE_KEY of
      // this shell. Stripe's controller frame carries the key in its URL hash (apiKey=…); the RSC payload may carry it too.
      const apiKey = page.frames().map((f) => decodeURIComponent(f.url()).match(/[?&#]apiKey=([^&]*)/)?.[1]).find(Boolean)
      if (apiKey !== undefined) console.log(`  Stripe.js initialised with key: ${apiKey.length ? `${apiKey.slice(0, 3)}… (${apiKey.length} chars)` : "EMPTY string"}`)
      const pk = seenPk || apiKey || (await page.content()).match(/pk_(test|live)_[A-Za-z0-9]+/)?.[0] || ""
      const pkInfo = pk ? `pk_${pk.split("_")[1]} (${pk.length} chars${process.env.NEXT_PUBLIC_STRIPE_KEY ? pk === process.env.NEXT_PUBLIC_STRIPE_KEY ? ", same as NEXT_PUBLIC_STRIPE_KEY here" : ", DIFFERENT from NEXT_PUBLIC_STRIPE_KEY here" : ""})` : "none in the page"
      throw new Error(`Stripe Payment Element: card number field not found (is the card method enabled in the Stripe dashboard?)\n  frames: ${frames.join(" | ")}\n  publishable key in page: ${pkInfo}\n  payment step text: ${step}`)
    }
    await frame.type("input[name=number]", CARD, { delay: 20 })
    await frame.type("input[name=expiry]", "1234", { delay: 20 })
    await frame.type("input[name=cvc]", "123", { delay: 20 })
    // country first (the postal field depends on it), then the postal code once it has appeared
    const country = await frame.$("select[name=country]")
    if (country) await frame.select("select[name=country]", MARKET.toUpperCase()).catch(() => {})
    const postal = await frame.waitForSelector("input[name=postalCode], input[autocomplete='postal-code']", { timeout: 8000 }).catch(() => null)
    if (postal) await postal.type(MARKET === "us" ? "97201" : "10110", { delay: 20 })
    // the Element reports "complete" only after its own validation ran; give it a moment and blur
    await wait(800)
    await page.keyboard.press("Tab")
    // layout check: the Payment Element must get the option's full width (a narrow frame stacks every field)
    const widths = await page.evaluate(() => {
      const f = [...document.querySelectorAll("iframe[name^=__privateStripeFrame]")].find((i) => i.getBoundingClientRect().height > 100)
      if (!f) return null
      const chain = []
      for (let el = f; el && chain.length < 6; el = el.parentElement) chain.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 2).join(".") : ""}=${Math.round(el.getBoundingClientRect().width)}`)
      return chain.join(" < ")
    })
    log(`card filled; payment element width: ${widths ?? "frame not found"}`)
    await shot("card-filled")
  }

  // 6. Place the order
  await page.waitForFunction(() => !document.querySelector("[data-testid=submit-order-button]")?.disabled, { timeout: 60000 })
  if (process.env.KILN_E2E_DEBUG_CLICK) {
    // slow-motion click: where the button is at each pointer phase, what has focus, what the Element says
    const rect = () => page.evaluate(() => { const r = document.querySelector("[data-testid=submit-order-button]").getBoundingClientRect(); return `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}` })
    const active = () => page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}${a.name ? "[" + a.name.slice(0, 24) + "]" : ""}${a.dataset?.testid ? "#" + a.dataset.testid : ""}` : "none" })
    const msgs = async () => { const out = []; for (const f of page.frames()) { const t = await f.evaluate(() => [...document.querySelectorAll("[role=alert], .p-FieldError, .p-Error")].map((e) => e.textContent.trim()).filter(Boolean).join(" | ")).catch(() => ""); if (t) out.push(t.slice(0, 80)) } return out.join(" || ") || "none" }
    const box = await page.$eval("[data-testid=submit-order-button]", (b) => { b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })
    log(`before: rect=${await rect()} active=${await active()} msgs=${await msgs()}`)
    await page.mouse.move(box.x, box.y); await wait(300)
    log(`after move: rect=${await rect()} active=${await active()} msgs=${await msgs()}`)
    await page.mouse.down(); await wait(300)
    log(`after down: rect=${await rect()} active=${await active()} msgs=${await msgs()}`)
    await page.mouse.up(); await wait(1500)
    log(`after up: rect=${await rect()} active=${await active()} msgs=${await msgs()} stripe=${stripeCalls.filter((c) => /confirm/.test(c)).join(",") || "no confirm"}`)
  } else {
    await page.click("[data-testid=submit-order-button]")
  }
  await wait(4000)
  await shot("after-click")
  if (PROVIDER === "pp_stripe_stripe" && !stripeCalls.some((c) => /confirm/.test(c))) {
    // no confirm call after the first click: what does the Payment Element show, and does a DOM click behave differently?
    const inner = []
    for (const f of page.frames()) { const t = await f.evaluate(() => [...document.querySelectorAll("[role=alert], .p-FieldError, .p-Error")].map((e) => e.textContent.trim()).filter(Boolean).join(" | ")).catch(() => ""); if (t) inner.push(t.slice(0, 200)) }
    log(`no confirm call 4 s after the click; element messages: ${inner.join(" || ") || "none"}; page alert: ${await page.evaluate(() => document.querySelector("[role=alert]")?.textContent?.trim() || "none")}`)
  }
  log(`after click: ${await page.evaluate(() => { const b = document.querySelector("[data-testid=submit-order-button]"); return b ? `button ${b.disabled ? "disabled" : "enabled"} busy=${b.getAttribute("aria-busy") || b.dataset.loading || "no"} text="${b.textContent.trim().slice(0, 30)}"` : "button gone" })}; stripe calls so far: ${stripeCalls.length}`)
  if (EXPECT === "decline") {
    // 6b. Declined: Stripe's message appears, nothing is placed
    await page.waitForSelector("[data-testid=payment-error-message]", { timeout: 60000 })
    const msg = await page.$eval("[data-testid=payment-error-message]", (el) => el.textContent?.trim())
    await wait(1500)
    const path = await page.evaluate(() => location.pathname)
    if (/\/order\//.test(path)) throw new Error(`declined card still reached ${path}`)
    log(`declined as expected: "${msg}" (still on ${path})`)
    await shot("declined")
    if (admin) {
      const cartId = await page.evaluate(() => document.cookie.match(/_medusa_cart_id=([^;]+)/)?.[1] ?? null)
      const { orders } = await admin.call(`/admin/orders?fields=id,display_id&limit=1&order=-created_at`)
      log(`backend: newest order is #${orders[0]?.display_id ?? "none"}${cartId ? "" : " (cart cookie is httpOnly, not compared)"}`)
    }
    console.log(`OK in ${Math.round((Date.now() - t0) / 1000)} s`)
    await browser.close()
    process.exit(0)
  }
  if (EXPECT === "3ds") {
    // 6c. 3-D Secure: Stripe opens the challenge in nested iframes; the test page has a "Complete authentication" button
    let button = null
    for (let i = 0; i < 120 && !button; i++) {
      for (const f of page.frames()) {
        button = await f.$("#test-source-authorize-3ds").catch(() => null)
        if (button) break
      }
      if (!button) await wait(500)
    }
    if (!button) throw new Error("3-D Secure challenge frame not found")
    await shot("3ds-challenge")
    await button.click()
    log("3-D Secure challenge completed")
  }
  await untilPath(/\/order\/.+\/confirmed/, 120000)
  await page.waitForSelector("[data-testid=order-complete-container]", { timeout: 30000 })
  const done = await page.evaluate(() => ({ path: location.pathname, id: document.querySelector("[data-testid=order-id]")?.textContent, total: document.querySelector("[data-testid=cart-total]")?.textContent, payment: document.querySelector("[data-testid=payment-method]")?.textContent }))
  log(`order confirmed: ${done.id} · ${done.total} · ${done.payment} (${done.path})`)
  await shot("order-confirmed")

  // 7. Backend view of the payment (admin credentials)
  if (admin) {
    const orderId = done.path.match(/\/order\/([^/]+)\//)?.[1]
    const { order } = await admin.call(`/admin/orders/${orderId}?fields=id,display_id,payment_status,payment_collections.status,payment_collections.payments.provider_id,payment_collections.payments.captured_at`)
    const pays = order.payment_collections?.flatMap((c) => c.payments ?? []) ?? []
    log(`backend: order #${order.display_id} payment_status=${order.payment_status} payments=${pays.map((p) => `${p.provider_id}${p.captured_at ? " captured" : " authorized"}`).join(", ") || "none"}`)
    if (PROVIDER === "pp_stripe_stripe" && !pays.some((p) => p.provider_id === "pp_stripe_stripe")) fail("no Stripe payment on the order")
  }
} catch (e) {
  fail(e.message)
  // what the payment step holds at that moment: its buttons (visibility, disabled) and any alert
  const state = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.opacity !== "0" }
    const buttons = [...document.querySelectorAll("[data-testid=payment-step] button")].map((b) => `${b.dataset.testid || b.textContent.trim().slice(0, 20)}: ${b.disabled ? "disabled" : "enabled"}, ${vis(b) ? "visible" : "hidden"}`)
    return { url: location.pathname + location.search, buttons, alert: document.querySelector("[role=alert]")?.textContent?.trim().slice(0, 200) || null }
  }).catch(() => null)
  if (state) log("state at failure:", JSON.stringify(state))
  if (stripeCalls.length) log("stripe api calls:", stripeCalls.join(" | "))
  await shot("failed")
} finally {
  await browser.close()
}
if (issues.length) log("console / network issues:", issues.join(" | "))
console.log(process.exitCode ? "FAILED" : `OK in ${Math.round((Date.now() - t0) / 1000)} s`)
