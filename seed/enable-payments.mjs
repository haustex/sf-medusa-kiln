// Switches the two payment plugins on for the demo / dev backend through the Admin API: enables
// pp_manual-transfer_manual-transfer on every region and pp_doit_doit on the IDR regions (when the backend has them
// registered), and gives medusa-payment-manual-transfer one active demo bank account per currency. Idempotent.
//   MEDUSA_BACKEND_URL=http://127.0.0.1:9710 MEDUSA_ADMIN_EMAIL=admin@kiln.test MEDUSA_ADMIN_PASSWORD=… node seed/enable-payments.mjs
const BASE = (process.env.MEDUSA_BACKEND_URL || "http://127.0.0.1:9710").replace(/\/$/, "")
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@kiln.test"
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "kiln-dev-password"
const MT = "pp_manual-transfer_manual-transfer", DOIT = "pp_doit_doit"
const auth = await fetch(`${BASE}/auth/user/emailpass`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) })
if (!auth.ok) throw new Error(`admin login failed: ${auth.status}`)
const { token } = await auth.json()
const call = async (path, init = {}) => {
  const r = await fetch(BASE + path, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers || {}) } })
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`)
  return r.json()
}
const { payment_providers } = await call("/admin/payments/payment-providers?is_enabled=true&limit=100")
console.log("registered:", payment_providers.map((p) => p.id).join(", "))
const { regions } = await call("/admin/regions?fields=id,name,currency_code,payment_providers.id")
for (const region of regions) {
  const ids = region.payment_providers.map((p) => p.id)
  const want = [MT, ...(region.currency_code === "idr" ? [DOIT] : [])].filter((id) => payment_providers.some((p) => p.id === id) && !ids.includes(id))
  if (!want.length) { console.log(`${region.name} (${region.currency_code}): nothing to add`); continue }
  await call(`/admin/regions/${region.id}`, { method: "POST", body: JSON.stringify({ payment_providers: [...ids, ...want] }) })
  console.log(`${region.name}: enabled ${want.join(", ")}`)
}
const existing = payment_providers.some((p) => p.id === MT) ? await call("/admin/manual-transfer/accounts") : null
if (existing) {
  const accounts = existing.accounts ?? []
  console.log("accounts:", accounts.length)
  const currencies = [...new Set(regions.map((r) => r.currency_code))]
  for (const cur of currencies) {
    if (accounts.some((a) => a.currency_code === cur)) continue
    const body = cur === "idr"
      ? { label: "Bank utama", bank_name: "Bank Central Asia", account_holder: "PT Kiln Demo", account_number: "1234567890", currency_code: "idr", is_active: true, rank: 0 }
      : { label: `Main account (${cur.toUpperCase()})`, bank_name: "Demo Bank", account_holder: "Kiln Demo Ltd", account_number: "0011223344", swift_code: "DEMOGB2L", bank_address: "1 Demo Street, London", currency_code: cur, is_active: true, rank: 0 }
    const res = await call("/admin/manual-transfer/accounts", { method: "POST", body: JSON.stringify(body) })
    console.log(`account created for ${cur}:`, JSON.stringify(res).slice(0, 160))
  }
}
