// Gives the demo / dev backend one link-in-bio page (medusa-link-in-bio) for Kiln's /links: handle "links" in en + id
// with social icons, a heading, two products, a promo code, an external link and WhatsApp. Idempotent: a page with
// that handle and items is left alone.
//   MEDUSA_BACKEND_URL=http://127.0.0.1:9710 MEDUSA_ADMIN_EMAIL=admin@kiln.test MEDUSA_ADMIN_PASSWORD=… node seed/enable-links.mjs
const BASE = (process.env.MEDUSA_BACKEND_URL || "http://127.0.0.1:9710").replace(/\/$/, "")
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@kiln.test"
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "kiln-dev-password"
const HANDLE = process.env.LINKS_HANDLE || "links"
const auth = await fetch(`${BASE}/auth/user/emailpass`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) })
if (!auth.ok) throw new Error(`admin login failed: ${auth.status}`)
const { token } = await auth.json()
const call = async (path, init = {}) => {
  const r = await fetch(BASE + path, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers || {}) } })
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`)
  return r.json()
}
const probe = await fetch(`${BASE}/admin/link-in-bio/config`, { headers: { authorization: `Bearer ${token}` } })
if (probe.status === 404) {
  console.log("medusa-link-in-bio is not installed on this backend: nothing to do")
  process.exit(0)
}
const { pages } = await call("/admin/link-in-bio/pages")
let page = pages.find((p) => p.handle === HANDLE)
if (page && (await call(`/admin/link-in-bio/pages/${page.id}/items`)).items.length) {
  console.log(`page "${HANDLE}" exists with items: nothing to do`)
  process.exit(0)
}
if (!page) page = (await call("/admin/link-in-bio/pages", {
  method: "POST",
  body: JSON.stringify({
    handle: HANDLE,
    name: "Kiln demo",
    locales: ["en", "id"],
    published: true,
    socials: [
      { network: "instagram", url: "https://www.instagram.com/" },
      { network: "tiktok", url: "https://www.tiktok.com/" },
      { network: "youtube", url: "https://www.youtube.com/" },
    ],
    translations: {
      en: { title: "Kiln", bio: "Small-batch objects for the home, made by independent makers.", seo_title: "Kiln · links", seo_description: "Everything from Kiln in one place: new arrivals, the journal and where to find us." },
      id: { title: "Kiln", bio: "Benda rumah produksi kecil, dibuat perajin independen.", seo_title: "Kiln · link", seo_description: "Semua tentang Kiln di satu tempat: produk baru, jurnal, dan cara menghubungi kami." },
    },
  }),
})).page
console.log(`page: ${page.id} (${HANDLE})`)
const { products } = await call("/admin/products?limit=2&status[]=published&fields=id,title")
const items = [
  { type: "header", translations: { en: { label: "Shop" }, id: { label: "Belanja" } } },
  ...products.map((p, i) => ({ type: "product", target: { product_id: p.id }, style: i === 0 ? "featured" : "normal", translations: { en: { label: p.title }, id: { label: p.title } } })),
  { type: "promo", target: { code: "HELLO10" }, translations: { en: { label: "10% off your first order", note: "Use the code at checkout" }, id: { label: "Diskon 10% pesanan pertama", note: "Pakai kode saat checkout" } } },
  { type: "header", translations: { en: { label: "Elsewhere" }, id: { label: "Lainnya" } } },
  { type: "link", target: { url: "https://www.youtube.com/" }, translations: { en: { label: "Studio tour on YouTube" }, id: { label: "Tur studio di YouTube" } } },
  { type: "whatsapp", target: { phone: "+6281234567890" }, translations: { en: { label: "Chat with us", note: "WhatsApp, 9–17 WIB" }, id: { label: "Chat dengan kami", note: "WhatsApp, 9–17 WIB" } } },
]
for (const item of items) {
  const { item: created } = await call(`/admin/link-in-bio/pages/${page.id}/items`, { method: "POST", body: JSON.stringify(item) })
  console.log(`  item ${created.type} ${created.key}`)
}
console.log(`done: ${BASE.includes("9710") ? "http://localhost:9720" : "<storefront>"}/links`)
