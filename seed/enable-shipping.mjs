// Switches calculated shipping (medusa-fulfillment-zone-rate) on for the demo / dev backend through the Admin API:
// links the zone-rate provider to the stock location, creates one calculated shipping option per service of the
// backend's shipping.config.ts (domestic → the "Indonesia" service zone, the others → "United States") and gives
// every demo variant a parcel size (the seed only sets weights; zone-rate refuses a line without dimensions).
// Idempotent; skipped with a note when the backend has no zone-rate provider.
//   MEDUSA_BACKEND_URL=http://127.0.0.1:9710 MEDUSA_ADMIN_EMAIL=admin@kiln.test MEDUSA_ADMIN_PASSWORD=… node seed/enable-shipping.mjs
const BASE = (process.env.MEDUSA_BACKEND_URL || "http://127.0.0.1:9710").replace(/\/$/, "")
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@kiln.test"
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "kiln-dev-password"
const PROVIDER = "zone-rate_zone-rate"
// service id → option name, service zone of the demo seed, description shown under the option
const OPTIONS = [
  {
    service: "domestic",
    zone: "Indonesia",
    name: "Pengiriman reguler",
    description: "Jawa, Bali, Sumatra, Kalimantan, Sulawesi, Maluku, Papua",
  },
  {
    service: "air",
    zone: "United States",
    name: "Air freight",
    description: "Duties paid on delivery",
  },
  {
    service: "sea",
    zone: "United States",
    name: "Sea freight",
    description: "Duties paid on delivery",
  },
]
// parcel sizes in cm (length, width, height) per demo product; the default suits anything else
const SIZES = {
  "stoneware-dinner-plate": [30, 30, 6],
  "ceramic-serving-bowl": [32, 32, 12],
  "ribbed-stoneware-mug": [14, 12, 12],
  "oak-serving-board": [45, 25, 5],
  "walnut-catch-all-tray": [26, 18, 5],
  "tapered-bud-vase": [14, 14, 24],
  "soy-candle": [11, 11, 12],
}
const DEFAULT_SIZE = [30, 25, 15]

const auth = await fetch(`${BASE}/auth/user/emailpass`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
if (!auth.ok) throw new Error(`admin login failed: ${auth.status}`)
const { token } = await auth.json()
const call = async (path, init = {}) => {
  const r = await fetch(BASE + path, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  })
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`)
  return r.json()
}

const { fulfillment_providers } = await call("/admin/fulfillment-providers?limit=100")
if (!fulfillment_providers.some((p) => p.id === PROVIDER)) {
  console.log(`${PROVIDER} not registered (medusa-fulfillment-zone-rate not in medusa-config.ts?) - skipped`)
  process.exit(0)
}

// services the backend's shipping.config.ts declares (public rate card)
const { stock_locations } = await call("/admin/stock-locations?fields=id,name,*fulfillment_providers,*fulfillment_sets.service_zones")
const location = stock_locations[0]
if (!location) throw new Error("no stock location: run the seed first")
if (!(location.fulfillment_providers ?? []).some((p) => p.id === PROVIDER)) {
  await call(`/admin/stock-locations/${location.id}/fulfillment-providers`, {
    method: "POST",
    body: JSON.stringify({ add: [PROVIDER] }),
  })
  console.log(`${location.name}: ${PROVIDER} linked`)
} else console.log(`${location.name}: ${PROVIDER} already linked`)

const zones = (location.fulfillment_sets ?? []).flatMap((s) => s.service_zones ?? [])
// Medusa hands the provider only the cart lines of the option's shipping profile: use the profile the products are in
const { products: sample } = await call("/admin/products?limit=1&fields=id,shipping_profile.id")
const { shipping_profiles } = await call("/admin/shipping-profiles?type=default&limit=1")
const profileId = sample[0]?.shipping_profile?.id ?? shipping_profiles[0]?.id
if (!profileId) throw new Error("no shipping profile found")
const { shipping_options } = await call("/admin/shipping-options?fields=id,name,data,provider_id,shipping_profile_id&limit=100")
for (const o of OPTIONS) {
  const existing = shipping_options.find((s) => s.provider_id === PROVIDER && s.data?.id === o.service)
  if (existing && existing.shipping_profile_id === profileId) {
    console.log(`${o.name}: already there`)
    continue
  }
  if (existing) {
    // Medusa cannot move a calculated option to another profile: recreate it
    await call(`/admin/shipping-options/${existing.id}`, { method: "DELETE" })
    console.log(`${o.name}: removed (wrong shipping profile), recreating`)
  }
  const zone = zones.find((z) => z.name === o.zone)
  if (!zone) {
    console.log(`${o.name}: service zone "${o.zone}" not found - skipped`)
    continue
  }
  await call("/admin/shipping-options", {
    method: "POST",
    body: JSON.stringify({
      name: o.name,
      price_type: "calculated",
      prices: [],
      provider_id: PROVIDER,
      service_zone_id: zone.id,
      shipping_profile_id: profileId,
      type: {
        label: o.name,
        description: o.description,
        code: `zone-rate-${o.service}`,
      },
      data: { id: o.service },
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" },
        { attribute: "is_return", value: "false", operator: "eq" },
      ],
    }),
  })
  console.log(`${o.name} (${o.service}): created`)
}

// parcel sizes
let offset = 0,
  fixed = 0
for (;;) {
  const { products, count } = await call(
    `/admin/products?fields=id,handle,variants.id,variants.length,variants.width,variants.height,variants.weight&limit=50&offset=${offset}`
  )
  for (const p of products) {
    const [length, width, height] = SIZES[p.handle] ?? DEFAULT_SIZE
    for (const v of p.variants ?? []) {
      if (v.length && v.width && v.height && v.weight) continue
      await call(`/admin/products/${p.id}/variants/${v.id}`, {
        method: "POST",
        body: JSON.stringify({
          length,
          width,
          height,
          weight: v.weight || 500,
        }),
      })
      fixed++
    }
  }
  offset += products.length
  if (offset >= count || !products.length) break
}
console.log(`variants given a parcel size: ${fixed}`)
