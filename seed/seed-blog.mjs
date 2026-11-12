// Seeds demo articles into medusa-blog-seo through the Admin API (the home page's "From the Journal" block and the
// /blog pages): two categories, one author (photo, bio, profiles: the "Written by" box), four posts in English +
// Indonesian, three of them tagged "pilihan" (editor's picks), covers uploaded from seed/images. Idempotent: posts
// whose title already exists get their text and linked products refreshed (and the demo author when they have none).
//   MEDUSA_BACKEND_URL=http://127.0.0.1:9710 MEDUSA_ADMIN_EMAIL=admin@kiln.test MEDUSA_ADMIN_PASSWORD=… node seed/seed-blog.mjs
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const BACKEND = (process.env.MEDUSA_BACKEND_URL || "http://127.0.0.1:9710").replace(/\/$/, "")
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@kiln.test"
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "kiln-dev-password"
const images = join(dirname(fileURLToPath(import.meta.url)), "images")

const CATEGORIES = [
  { key: "care", en: { name: "Care", slug: "care", description: "Keeping wood, linen and stoneware in good shape." }, id: { name: "Perawatan", slug: "perawatan", description: "Menjaga kayu, linen, dan stoneware tetap awet." } },
  { key: "makers", en: { name: "Makers", slug: "makers", description: "The workshops behind the pieces." }, id: { name: "Pembuat", slug: "pembuat", description: "Bengkel-bengkel di balik setiap barang." } },
]

// Fictional; the profile links point at the networks' home pages
const AUTHOR = {
  name: "Nadia Tjipto",
  slug: "nadia-tjipto",
  type: "person",
  avatar: "author-nadia",
  url: "https://example.com",
  same_as: ["https://www.instagram.com/", "https://www.threads.net/", "https://www.linkedin.com/"],
  translations: {
    en: { job_title: "Founder, Tilde Goods", bio: "Nadia started Tilde Goods after ten years of sourcing for hotels. She writes about the makers behind the pieces and how to keep them for a long time." },
    id: { job_title: "Pendiri Tilde Goods", bio: "Nadia memulai Tilde Goods setelah sepuluh tahun mencari barang untuk hotel. Ia menulis tentang para pembuat di balik setiap barang dan cara merawatnya supaya awet." },
  },
}

const p = (...xs) => xs.map((x) => `<p>${x}</p>`).join("\n")

const POSTS = [
  {
    category: "care",
    cover: "oak-serving-board",
    tags: ["pilihan", "wood"],
    featured: true,
    // the products shown in the "From the shop" band (by handle); the first one is also embedded in the text
    products: ["oak-serving-board", "walnut-catch-all-tray", "ceramic-serving-bowl", "stoneware-dinner-plate"],
    en: {
      title: "How to oil an oak board so it lasts for years",
      excerpt: "Five minutes a month keeps a cutting board from drying out, cracking or taking on smells. Here is the routine the workshop uses.",
      body: (pid) => `<h2>Why oil at all</h2>${p("Oak is dense and forgiving, but it still loses moisture every time it is washed. A thin coat of food-safe oil fills the grain so water cannot.", "Mineral oil or a board butter (oil plus beeswax) both work. Avoid olive oil: it goes rancid.")}
<h2>What you need</h2><ul><li>Food-safe mineral oil or board butter</li><li>A lint-free cloth (an old tea towel is perfect)</li><li>220-grit sandpaper, only for boards that feel rough</li></ul>
<blockquote><p>A board that drinks the oil in a minute was thirsty. Give it a second coat.</p><p>Pak Tjipto, who has made our boards since 2016</p></blockquote>
<h2>The routine</h2>${p("Wash the board with warm water and a little soap, dry it standing on its edge, and leave it overnight.")}<div data-product-id="${pid}"></div>${p("Pour a spoonful of oil on the surface and spread it with a cloth, edges and hanging hole included. Let it soak for an hour, then wipe off what is left.")}<ol><li>Wash and dry overnight</li><li>Oil, wait an hour</li><li>Wipe off the excess</li></ol>
<h2>Oils compared</h2><table><thead><tr><th>Oil</th><th>Finish</th><th>How often</th></tr></thead><tbody><tr><td>Mineral oil</td><td>Matte, soaks in</td><td>Monthly</td></tr><tr><td>Board butter</td><td>Soft sheen, water beads</td><td>Every 2 months</td></tr><tr><td>Tung oil</td><td>Hard, amber</td><td>Twice a year</td></tr></tbody></table>
<h2>When to sand</h2>${p("If the surface feels rough or has deep knife marks, sand it lightly with 220 grit before oiling. The board will look new again. The <a href=\"/products/oak-serving-board\">oak serving board</a> in the shop arrives already oiled.")}
<h2>Common questions</h2><h3>Can I use coconut oil?</h3>${p("Only refined (fractionated) coconut oil: it stays liquid and does not go rancid. Virgin coconut oil can.")}<h3>How often should I oil a new board?</h3>${p("Weekly for the first month, then monthly. New wood drinks more.")}`,
    },
    id: {
      title: "Cara meminyaki talenan kayu ek supaya awet bertahun-tahun",
      excerpt: "Lima menit sebulan mencegah talenan kering, retak, atau bau. Ini rutinitas yang dipakai bengkel kami.",
      body: (pid) => `<h2>Kenapa perlu diminyaki</h2>${p("Kayu ek padat dan tahan banting, tapi tetap kehilangan kelembapan setiap kali dicuci. Lapisan tipis minyak food-grade mengisi serat supaya air tidak masuk.", "Mineral oil atau board butter (minyak plus lilin lebah) sama-sama bisa. Hindari minyak zaitun: bisa tengik.")}
<h2>Yang dibutuhkan</h2><ul><li>Mineral oil food-grade atau board butter</li><li>Kain bebas serat (lap dapur lama juga bisa)</li><li>Amplas grit 220, hanya untuk talenan yang terasa kasar</li></ul>
<blockquote><p>Talenan yang menyerap minyak dalam semenit berarti haus. Beri lapisan kedua.</p><p>Pak Tjipto, pembuat talenan kami sejak 2016</p></blockquote>
<h2>Rutinitasnya</h2>${p("Cuci talenan dengan air hangat dan sedikit sabun, keringkan dengan posisi berdiri, diamkan semalam.")}<div data-product-id="${pid}"></div>${p("Tuang satu sendok minyak ke permukaan dan ratakan dengan kain, termasuk sisi dan lubang gantung. Biarkan meresap satu jam, lalu lap sisanya.")}<ol><li>Cuci, keringkan semalam</li><li>Minyaki, tunggu satu jam</li><li>Lap sisanya</li></ol>
<h2>Perbandingan minyak</h2><table><thead><tr><th>Minyak</th><th>Hasil</th><th>Seberapa sering</th></tr></thead><tbody><tr><td>Mineral oil</td><td>Doff, meresap</td><td>Sebulan sekali</td></tr><tr><td>Board butter</td><td>Sedikit kilap, air menggelinding</td><td>Dua bulan sekali</td></tr><tr><td>Minyak tung</td><td>Keras, kekuningan</td><td>Dua kali setahun</td></tr></tbody></table>
<h2>Kapan perlu diamplas</h2>${p("Kalau permukaan terasa kasar atau bekas pisaunya dalam, amplas tipis dengan grit 220 sebelum diminyaki. Talenan akan terlihat baru lagi. <a href=\"/products/oak-serving-board\">Talenan kayu ek</a> di toko sudah diminyaki saat tiba.")}
<h2>Pertanyaan umum</h2><h3>Boleh pakai minyak kelapa?</h3>${p("Hanya minyak kelapa olahan (fractionated): tetap cair dan tidak tengik. Minyak kelapa murni bisa tengik.")}<h3>Seberapa sering talenan baru diminyaki?</h3>${p("Seminggu sekali di bulan pertama, lalu sebulan sekali. Kayu baru lebih haus.")}`,
    },
  },
  {
    category: "makers",
    cover: "paper-cone-lamp",
    tags: ["pilihan", "makers"],
    en: {
      title: "A morning at Tjipto Workshop",
      excerpt: "Three generations of woodworkers in Jepara, one turned lamp base at a time. We spent a morning watching how the Paper Cone Lamp is made.",
      body: `${p("The workshop opens at six, before the heat. By seven the lathe is running and the first oak blanks of the day are turning into lamp bases.", "Every base is turned by hand to the same drawing, then sanded through four grits and finished with oil. The paper shade is folded on a table next door.")}<h2>Why oak and paper</h2>${p("Oak takes a clean, even finish and does not warp with the seasons. Washi paper diffuses light without a yellow cast.")}<h2>What takes the time</h2>${p("Drying. A fresh blank rests for weeks before it is turned, otherwise the base would crack as it dries in a warm room.")}`,
    },
    id: {
      title: "Satu pagi di Bengkel Tjipto",
      excerpt: "Tiga generasi perajin kayu di Jepara, satu kaki lampu bubut setiap saat. Kami menghabiskan satu pagi melihat Paper Cone Lamp dibuat.",
      body: `${p("Bengkel buka jam enam, sebelum panas. Jam tujuh mesin bubut sudah berputar dan balok kayu ek pertama hari itu mulai menjadi kaki lampu.", "Setiap kaki lampu dibubut tangan mengikuti gambar yang sama, diamplas empat tahap, lalu difinishing dengan minyak. Kap kertasnya dilipat di meja sebelah.")}<h2>Kenapa kayu ek dan kertas</h2>${p("Kayu ek menerima finishing yang rata dan bersih, dan tidak melengkung mengikuti musim. Kertas washi menyebarkan cahaya tanpa semburat kuning.")}<h2>Yang makan waktu</h2>${p("Pengeringan. Balok segar diistirahatkan berminggu-minggu sebelum dibubut, kalau tidak kaki lampunya retak saat mengering di ruangan hangat.")}`,
    },
  },
  {
    category: "care",
    cover: "wool-throw",
    tags: ["pilihan", "textiles"],
    en: {
      title: "Washing linen and lambswool without ruining them",
      excerpt: "Linen gets softer with every wash; wool does not forgive a hot cycle. The short version of our care labels.",
      body: `<h2>Linen</h2>${p("Machine wash warm, tumble dry low, take it out while slightly damp and shake it. Creases are part of the look; iron only if you must.")}<h2>Lambswool</h2>${p("Hand wash cold with wool detergent, press out the water in a towel, dry flat. Never wring, never tumble. Between washes, air it outside for an afternoon.")}<h2>Storing</h2>${p("Fold rather than hang, and keep wool with a cedar block: moths dislike the scent and nothing is sprayed on the fabric.")}`,
    },
    id: {
      title: "Mencuci linen dan wol tanpa merusaknya",
      excerpt: "Linen makin lembut setiap dicuci; wol tidak memaafkan siklus panas. Versi singkat dari label perawatan kami.",
      body: `<h2>Linen</h2>${p("Cuci mesin air hangat, keringkan mesin suhu rendah, angkat selagi agak lembap lalu kibaskan. Kusut adalah bagian dari tampilannya; setrika hanya kalau perlu.")}<h2>Wol</h2>${p("Cuci tangan air dingin dengan deterjen wol, peras dengan handuk, keringkan mendatar. Jangan diperas puntir, jangan mesin pengering. Di antara pencucian, angin-anginkan di luar satu sore.")}<h2>Menyimpan</h2>${p("Lipat, jangan digantung, dan simpan wol bersama balok kayu cedar: ngengat tidak suka aromanya dan tidak ada yang disemprotkan ke kain.")}`,
    },
  },
  {
    category: "makers",
    cover: "seagrass-basket",
    tags: ["makers"],
    en: {
      title: "Rumah Anyam: baskets woven to fold flat",
      excerpt: "A seagrass basket that holds its shape when full and folds flat for shipping. The weave that makes both possible.",
      body: `${p("Most woven baskets are rigid. The ones from Rumah Anyam use a looser twill at the base, so the sides collapse inwards for the box and spring back once unpacked.", "The seagrass is harvested in the dry season, dried in the shade for two weeks and twisted into rope before weaving.")}<h2>Caring for seagrass</h2>${p("Keep it dry. If it gets wet, let it air dry fully before storing anything in it again.")}`,
    },
    id: {
      title: "Rumah Anyam: keranjang anyaman yang bisa dilipat rata",
      excerpt: "Keranjang seagrass yang tetap berbentuk saat penuh dan bisa dilipat rata untuk pengiriman. Anyaman yang membuat keduanya mungkin.",
      body: `${p("Kebanyakan keranjang anyaman kaku. Keranjang Rumah Anyam memakai anyaman kepar yang lebih longgar di dasar, jadi sisinya bisa melipat ke dalam untuk dus dan kembali membuka setelah dibongkar.", "Seagrass dipanen di musim kemarau, dijemur di tempat teduh dua minggu, lalu dipilin jadi tali sebelum dianyam.")}<h2>Merawat seagrass</h2>${p("Jaga tetap kering. Kalau basah, angin-anginkan sampai benar-benar kering sebelum diisi lagi.")}`,
    },
  },
]

let token = ""
async function api(method, path, body) {
  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 300)}`)
  return json
}

token = (await api("POST", "/auth/user/emailpass", { email: EMAIL, password: PASSWORD })).token

// locales: English + Indonesian, English default
await api("POST", "/admin/blog-seo/settings", { locales: [{ code: "en", name: "English" }, { code: "id", name: "Bahasa Indonesia" }], default_locale: "en", fallback: "default" })

// categories (by English slug)
const existing = (await api("GET", "/admin/blog-seo/categories?limit=100")).categories ?? []
// Admin rows carry translations keyed by locale
const slugOf = (c) => c.translations?.en?.slug
const categoryIds = {}
for (const c of CATEGORIES) {
  const found = existing.find((x) => slugOf(x) === c.en.slug)
  categoryIds[c.key] = found ? found.id : (await api("POST", "/admin/blog-seo/categories", { translations: { en: c.en, id: c.id } })).category.id
}

// author (by slug); existing posts without one get it
const authors = (await api("GET", "/admin/blog-seo/authors")).authors ?? []
let author = authors.find((a) => a.slug === AUTHOR.slug)
if (!author) {
  const jpg = readFileSync(join(images, `${AUTHOR.avatar}.jpg`))
  const upload = await api("POST", "/admin/blog-seo/uploads", { filename: `${AUTHOR.avatar}.jpg`, data: `data:image/jpeg;base64,${jpg.toString("base64")}`, kind: "avatar" })
  author = (await api("POST", "/admin/blog-seo/authors", { ...AUTHOR, avatar: upload.file.url })).author
}

// products linked to the posts (by handle; the demo catalogue from seed-kiln.ts)
const catalogue = (await api("GET", "/admin/products?limit=100&fields=id,handle")).products ?? []
const productId = (handle) => catalogue.find((x) => x.handle === handle)?.id
const productIds = (post) => (post.products ?? []).map(productId).filter(Boolean)
const translation = (post, locale, ids) => {
  const t = post[locale]
  return { ...t, body: typeof t.body === "function" ? t.body(ids[0] ?? "") : t.body, tags: post.tags, cover_alt: t.title }
}

const posts = (await api("GET", "/admin/blog-seo/posts?limit=100")).posts ?? []
const byTitle = (title) => posts.find((x) => Object.values(x.translations ?? {}).some((t) => t.title === title))
for (const x of posts) if (!x.author_id) await api("POST", `/admin/blog-seo/posts/${x.id}`, { author_id: author.id })

let created = 0
for (const post of POSTS) {
  const ids = productIds(post)
  const existing = byTitle(post.en.title)
  if (existing) {
    // demo content: keep the text and linked products current (the slug stays, the title does not change)
    await api("POST", `/admin/blog-seo/posts/${existing.id}`, { translations: { en: translation(post, "en", ids), id: translation(post, "id", ids) }, product_ids: ids })
    continue
  }
  const jpg = readFileSync(join(images, `${post.cover}.jpg`))
  const upload = await api("POST", "/admin/blog-seo/uploads", { filename: `${post.cover}.jpg`, data: `data:image/jpeg;base64,${jpg.toString("base64")}`, kind: "cover" })
  const body = {
    translations: { en: translation(post, "en", ids), id: translation(post, "id", ids) },
    cover: upload.file.url,
    author_id: author.id,
    category_id: categoryIds[post.category],
    featured: !!post.featured,
    product_ids: ids,
  }
  const { post: row } = await api("POST", "/admin/blog-seo/posts", body)
  await api("POST", `/admin/blog-seo/posts/${row.id}/publish`, {})
  created++
}
console.log(`seed-blog: ${Object.keys(categoryIds).length} categories, 1 author, ${created} posts created (${POSTS.length - created} already there)`)
