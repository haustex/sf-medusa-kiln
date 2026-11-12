// End-to-end checkout through the storefront with Stripe's Payment Element (test card 4242…), or with Medusa's
// dev provider ("Pay later") to check the harness without Stripe keys.
//
//   node scripts/e2e/checkout-stripe.mjs                 # Stripe: expects pp_stripe_stripe on the region
//   node scripts/e2e/checkout-stripe.mjs --provider dev  # pp_system_default, no card
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
const marketPrefix = async () => {
  const res = await fetch(`${BASE}/${MARKET}/`, { redirect: "manual" })
  return res.status === 308 || res.status === 307 ? "" : `/${MARKET}`
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
page.on("response", (r) => { if (r.status() >= 400 && !/stripe\.com/.test(r.url())) issues.push(`${r.status()} ${r.url().slice(0, 120)}`) })
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
    for (let i = 0; i < 40 && !frame; i++) {
      for (const f of page.frames()) {
        if (await f.$("input[name=number]").catch(() => null)) { frame = f; break }
        if (await f.$("#card-tab, [data-testid=card-tab]").catch(() => null)) { await f.click("#card-tab, [data-testid=card-tab]").catch(() => {}); }
      }
      if (!frame) await wait(500)
    }
    if (!frame) throw new Error("Stripe Payment Element: card number field not found (is the card method enabled in the Stripe dashboard?)")
    await frame.type("input[name=number]", "4242424242424242", { delay: 20 })
    await frame.type("input[name=expiry]", "1234", { delay: 20 })
    await frame.type("input[name=cvc]", "123", { delay: 20 })
    const postal = await frame.$("input[name=postalCode]")
    if (postal) await frame.type("input[name=postalCode]", "97201", { delay: 20 })
    const country = await frame.$("select[name=country]")
    if (country) await frame.select("select[name=country]", "US").catch(() => {})
    log("card filled")
    await shot("card-filled")
  }

  // 6. Place the order
  await page.waitForFunction(() => !document.querySelector("[data-testid=submit-order-button]")?.disabled, { timeout: 60000 })
  await page.click("[data-testid=submit-order-button]")
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
  await shot("failed")
} finally {
  await browser.close()
}
if (issues.length) log("console / network issues:", issues.join(" | "))
console.log(process.exitCode ? "FAILED" : `OK in ${Math.round((Date.now() - t0) / 1000)} s`)
