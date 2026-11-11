# Kiln — tema storefront Medusa (Next.js) open source

Status: **riset + rencana + mockup** (11 Nov 2026). Belum dibangun; menunggu OK Anto.

## 1. Nama dan repo

Usulan nama **Kiln** (tempat bakar keramik/kayu: netral, pendek, cocok untuk toko produk buatan tangan).
Cek 11 Nov 2026: `haustex/kiln` kosong, tidak ada repo Medusa bernama "kiln" di GitHub, npm `kiln` sudah dipakai paket
lain (tidak masalah: tema ini bukan paket npm, tapi **template repo**). Cadangan kalau tidak suka: **Linen**, **Slate**
(keduanya juga kosong di `haustex/`).

- Repo: `haustex/kiln` (GitHub *template repository*, MIT). Mengikuti pola nama repo plugin kita tidak wajib
  (`pg-`, `fs-`, dst. itu untuk paket npm); kalau mau konsisten: `haustex/sf-medusa-kiln`.
- Demo brand: **Nord Atelier** (fiktif, netral; produk contoh: talenan, tray, mangkuk, keramik, tekstil, furnitur
  kecil dari "pembuat" fiktif). Demo live = hauskayu.com (tema yang sama dengan brand asli).
- Kredit: README "Built by Haus Kayu" + satu baris di footer default (`theme.config.ts` → `credit: false` mematikan).

## 2. Arah desain (ringkasan keputusan)

- **Pola** dari Faire: grid lega, header dengan kotak cari dominan + baris navigasi kategori, hero editorial, blok
  "cerita pembuat", jurnal. Dibuat lebih bersih: tanpa warna aksen, tanpa panel/gradien, satu keluarga font.
  Tidak ada aset/visual Faire yang dipakai; semua desain orisinal.
- **Tipografi** Inter variable, self-host, subset Latin, axis `opsz` dipakai (Display untuk heading besar):
  display 56–72 fluid (`clamp`), h1 40, h2 28, h3 20, body 16/1.6, label 12 uppercase +0.08em, harga `tabular-nums`.
  Berat 600 heading, 500 UI, 400 body. Tracking −0.025em (display) / −0.02em (h1, h2) / −0.01em (h3).
  Fallback metrik (Roboto/Arial dengan `size-adjust`) seperti hauskayu supaya CLS 0 saat swap.
- **Warna** `#FFFFFF` + `#0C0C0C` + abu netral (`muted #6B6B6B`, `border #E5E5E5`, `control #8A8A8A`, `soft #F5F5F5`,
  `soft-hover #EBEBEB`, `ink-hover #2B2B2B`). Tanpa aksen. Status (danger/success) hanya untuk form/sistem.
  Semua kontras teks ≥ 4,5:1, border kontrol ≥ 3:1 (tabel kontras ikut dari hauskayu `/_design`).
- **Token** di `theme.config.ts` (brand, logo, warna, radius, font, kredit, fitur) → diekspor sebagai CSS variable
  (`--k-*`) + dipetakan ke variabel HeroUI v3 (`--background`, `--accent`, …) dan `@theme` Tailwind v4. Ganti brand =
  edit satu file + taruh logo.
- **Blur** hanya di permukaan melayang: header sticky, mega menu, cart drawer, quick view, filter sheet (HP), bar
  add-to-cart sticky (HP). `backdrop-filter` di dalam `@supports`, fallback putih solid; `prefers-reduced-transparency`
  → solid; teks di atas blur hanya Ink (putih 80–88%: Ink ≥ 14:1 bahkan di atas foto hitam). Chip di atas foto: putih
  90% solid tanpa blur.
- **Bentuk**: tombol/input radius 8px, foto/kartu/tile 12px, sheet 16px atas. Gerak 200ms, mati di
  `prefers-reduced-motion`. Header desktop "mengecil" lewat sticky `top` negatif (CLS 0), header HP fixed 56px dengan
  baris cari + chip kategori yang sembunyi saat scroll turun (hanya `transform`).
- **Target**: PSI mobile ≥ 95, CLS 0, A11y 100 di home/PLP/PDP/blog. Cara: RSC/ISR, `next/image` ukuran eksplisit,
  preload gambar LCP per halaman, prefetch selektif, JS klien minimal (island per komponen interaktif), font 1 file
  ±40 KB.

Mockup: `docs/mockups/*.png` (sumber HTML statis di `docs/mockups/src/`, token yang sama).

| Halaman | Desktop 1440 | HP 390 |
| --- | --- | --- |
| Home | `home-desktop.png` | `home-mobile.png` |
| PLP (kategori + filter) | `plp-desktop.png` | `plp-mobile.png`, `plp-mobile-filter-sheet.png` (sheet blur) |
| PDP | `pdp-desktop.png` | `pdp-mobile.png`, `pdp-mobile-fold.png` (bar add-to-cart blur) |

## 3. Stack dan struktur

Next 16 (App Router, `output: standalone`) + Tailwind v4 + HeroUI v3 (`@heroui/react`, `@heroui/styles`) +
`@medusajs/js-sdk` 2.22 — persis hauskayu. Node 22. pnpm (satu app, bukan monorepo).

```
kiln/
  theme.config.ts            brand, logo, warna, radius, font, kredit, fitur opsional
  src/app/[countryCode]/     (main) home, store, categories, collections, products, search, cart, wishlist,
                             blog, account, order, info pages, 404; (checkout)
  src/app/api/               revalidate, og image, health
  src/styles/                globals.css (@theme), theme.css (token → HeroUI), fonts
  src/ds/                    design system (lihat §4)
  src/modules/               home, layout, products, store, cart, checkout, account, blog, reviews, wishlist, search
  src/lib/                   data (SDK), i18n, seo, util, features.ts (deteksi plugin)
  demo/                      seed Nord Atelier (produk, kategori, pembuat, artikel), gambar placeholder
  docs/                      rencana, mockups, screenshots, kustomisasi (EN+ID)
```

## 4. Komponen yang diekstrak dari hauskayu

Sumber: `~/hauskayu/apps/storefront`. "Bawa" = disalin lalu dibersihkan dari hal spesifik Haus Kayu (nama, market
`id`/`us` hard-coded, doit/manual-transfer/zone-rate, custom quote, Metricool). Baris `Ubah` menyebut perubahan utama.

| Dari hauskayu | Ke Kiln | Bawa / Ubah |
| --- | --- | --- |
| `styles/theme.css`, `globals.css` (`@theme`, utility `type-*`, `frost-header`, spacing scale) | `src/styles/` | Bawa. Ubah: token dari `theme.config.ts`; `type-*` disesuaikan ke skala §2; `frost` jadi utility umum untuk 6 permukaan |
| `styles/fonts.ts` + `inter-latin-opsz-wght.woff2` + `scripts/fonts/build-fonts.sh` | sama | Bawa apa adanya (OFL). Ubah: nama CSS var, dokumentasi ganti font |
| `modules/ds/*` (Badge, Breadcrumb, ButtonLink, Carousel, CategoryTile, EyebrowLink, Placeholder, PriceTag, ProductCard, ProductGrid, ProductImage, Section, SectionHeader, Stack/Page, Stars, ImagePreload) | `src/ds/` | Bawa semua. Ubah: CategoryTile → foto + label di bawah (tanpa warna per kategori); ProductCard tambah baris pembuat (opsional, dari metadata/koleksi); Stars jadi 1 bintang + angka |
| `modules/layout` (nav, header-scroll, header-search, category-menu, side-menu, cart-button, cart-dropdown, country-select, language-select, footer) | `modules/layout` | Bawa. Ubah: `us-banner` → `market-banner` generik; mega menu kategori (level 2) baru; cart-dropdown → cart drawer (blur) |
| `modules/home` (hero, value-props) | `modules/home` | Bawa hero + value-props. Baru: `maker-story`, `journal-latest`, `newsletter` (opsional, slot) |
| `modules/products` (image-gallery, product-actions + mobile-actions, option-select, product-price, product-tabs/accordion, related-products, thumbnail) + `templates/product-info` | `modules/products` | Bawa. Ubah: galeri thumbnail 5 kolom + carousel HP dengan dots; spesifikasi dari metadata; quick view (blur) baru; buang `QuoteCta`/custom |
| `modules/store` (listing, refinement-list, options-picker, sort, pagination) | `modules/store` | Bawa. Ubah: sidebar filter desktop + filter sheet HP (blur); filter harga/atribut dari Meilisearch facets kalau ada, kalau tidak dari Medusa (kategori, koleksi, sort) |
| `modules/cart`, `modules/checkout` (address, shipping, payment, summary, discount) | sama | Bawa. Ubah: provider pembayaran = Stripe (starter) + slot provider lain; doit/manual-transfer jadi contoh di docs, bukan kode |
| `modules/account` (login, register, overview, profile, addresses, orders, order detail, reviews tab) | sama | Bawa. Ubah: buang `penawaran`; tab ulasan hanya kalau reviews aktif |
| `modules/order` (confirmed, detail, status, items) | sama | Bawa minus transfer-actions |
| `modules/blog` (listing, article, post-card, featured-post, post-body, toc, share, youtube, product-embed, cover, blog-nav) + `lib/data/blog.ts` + `lib/seo/blog*.ts` | sama | Bawa (butuh `medusa-blog-seo`). Ubah: segmen URL dari config (`/blog`, `/journal`), kategori `kategori` → `category` dengan i18n |
| `modules/reviews` (form, account-forms, request-items, unsubscribe) + `modules/wishlist` (heart, grid) + `lib/data/reviews.ts`, `wishlist.ts` | sama | Bawa (butuh `medusa-reviews-wishlist`). Ubah: semua di belakang `features.reviews` / `features.wishlist` |
| `modules/search` + `lib/data/search.ts` (Meilisearch → fallback `/store/products?q=`) | sama | Bawa. Sudah punya fallback native |
| `lib/data/*` (cart, products, categories, collections, customer, orders, regions, cookies, fulfillment, payment) | `lib/data` | Bawa; buang doit/adyen/manual-transfer/zone-rate/custom-dp/onboarding |
| `lib/seo/*` (jsonld, organization, commerce, info-pages, llms, merchant-feed) + `app/feeds`, `llms.txt`, `og` | sama | Bawa. Ubah: isi organisasi dari `theme.config.ts`; merchant feed opsional |
| `lib/i18n` (dictionaries `id`/`en`) | `lib/i18n` | Bawa. Ubah: bahasa per market dari config; `en` default, `id` disertakan |
| `lib/util/*` (image-url, image-name, get-product-price, inventory, market, friendly-error, …) | `lib/util` | Bawa; buang `category-colors`, `id-provinces`, `custom-dp*`, `lead-time` (jadi metadata umum) |
| `modules/skeletons` | sama | Bawa |
| `app/[countryCode]` routing + middleware (tanpa prefix untuk market default, 308 untuk `/id/…`) | sama | Bawa; market default dari config |
| `modules/manual-transfer`, `zone-rate-tracking`, `custom`, `analytics` (Metricool), `brand`, `policies` HK | — | **Tidak dibawa** (analytics → slot `<Analytics />` kosong; policies → halaman info generik dari Markdown) |

## 5. Integrasi opsional (nyala otomatis, mati rapi)

`src/lib/features.ts` memutuskan sekali saat build/start, hasilnya di-cache:

| Fitur | Deteksi | Kalau mati |
| --- | --- | --- |
| Ulasan + wishlist (`medusa-reviews-wishlist`) | `GET /store/reviews/ratings?product_id=…` jawab 200 (bukan 404) | Tanpa bintang, tanpa hati, tanpa tab ulasan/wishlist, link footer hilang |
| Blog (`medusa-blog-seo`) | `GET /store/blog-seo/settings` 200 | Route `/blog` 404, blok jurnal di home dan link nav hilang, sitemap tanpa blog |
| Gambar R2 (`medusa-storage-r2`) | `NEXT_PUBLIC_MEDIA_URL` terisi | `next/image` pakai origin backend; `remotePatterns` dari env |
| Meilisearch | `MEILISEARCH_HOST` + key | `/store/products?q=`; filter PLP hanya kategori/koleksi/sort |
| Pembayaran | provider dari `/store/payment-providers` region | Stripe kalau ada key; provider lain lewat slot `payment/providers/<id>.tsx` |

Override manual lewat env (`KILN_FEATURE_REVIEWS=off`), supaya deteksi bisa dimatikan tanpa mencopot plugin.

## 6. Yang perlu dibuat baru

Mega menu kategori (desktop, blur), cart drawer (blur, ganti dropdown), quick view (blur), filter sheet HP (blur),
bar add-to-cart sticky HP (blur, sudah ada versi solid di HK), blok cerita pembuat, halaman pembuat (koleksi/metadata),
newsletter slot, halaman 404 bergaya, seed demo Nord Atelier (produk, kategori, pembuat, 6 artikel, gambar
placeholder netral tanpa teks), `theme.config.ts` + `docs/customize.md`, screenshot README.

## 7. Tahapan setelah OK

1. **Scaffold** (Next 16 + Tailwind v4 + HeroUI, `theme.config.ts`, token, font, layout header/footer, i18n, routing
   market) + CI (lint, typecheck, build). Repo `haustex/kiln` dibuat Anto (template, MIT), deploy key seperti plugin.
2. **Home, PLP, PDP** sesuai mockup, dengan data Medusa asli (backend uji lokal di port 9700+, plugin kita terpasang).
3. **Cart drawer, checkout (Stripe), akun, order, wishlist, search**.
4. **Blog, ulasan** di belakang `features`; mode mati diuji (plugin dicopot).
5. **Demo seed + screenshot + README EN/ID + docs/customize.md**; Lighthouse lokal (home/PLP/PDP/blog) sampai target.
6. Rilis: tag `v0.1.0`, GitHub Release, "Use this template". Lalu hauskayu migrasi memakai tema ini (proyek terpisah).

## 8. Pertanyaan buat Anto

1. Nama: **Kiln** oke? Repo `haustex/kiln` atau `haustex/sf-medusa-kiln`?
2. Checkout default pakai Stripe (bawaan starter) + slot provider lain; doit/manual-transfer cukup di docs. Setuju?
3. Routing market tanpa prefix untuk market default (seperti hauskayu) dipertahankan sebagai default tema?
4. Mockup: ada yang mau diubah sebelum dibangun (hero, tile kategori foto + label di bawah, kartu dengan nama
   pembuat, sidebar filter desktop, galeri PDP)?
