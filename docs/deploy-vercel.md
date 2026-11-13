# Deploying the storefront on Vercel

Kiln is a plain Next.js app (`output: "standalone"` is ignored on Vercel, no `vercel.json` needed). Deploy the
Medusa backend first: Vercel renders the static pages at build time and needs a reachable API.

## 1. Backend

Any Medusa 2.x host works. The demo runs it on a VPS behind Caddy with its own Postgres/Redis
(`kiln-demo/` in the Haus Kayu repo is a reference compose). What the storefront needs from it:

- a publishable API key with the sales channel attached (the seed prints it),
- `STORE_CORS` / `AUTH_CORS` including the storefront origins (custom domain **and** the `*.vercel.app` production alias),
- `/static` reachable publicly when the local file provider is used (`FILE_BACKEND_URL`),
- Stripe enabled on the regions when `NEXT_PUBLIC_STRIPE_KEY` is set.

## 2. Vercel project

1. **Add New → Project**, import the repository. Framework is detected as Next.js; keep Root Directory `./` and the
   default build command (Vercel reads `packageManager` and uses pnpm).
2. **Environment Variables** (Production and Preview) before the first deploy:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_…` from the backend |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://api.example.com` |
| `MEDUSA_BACKEND_URL_INTERNAL` | same as above (no private network on Vercel) |
| `NEXT_PUBLIC_BASE_URL` | `https://shop.example.com` (the canonical origin) |
| `NEXT_PUBLIC_STRIPE_KEY` | `pk_test_…` / `pk_live_…`, optional |
| `REVALIDATE_SECRET` | random, shared with the backend's revalidate subscriber |
| `SITE_LIVE` | `true` for a real shop; `false` keeps robots/sitemap off and adds `noindex` |
| `KILN_DEMO_NOTICE` | `true` only for a demo (banner "no real orders") |

3. **Deploy**, then **Settings → Domains** and add the custom domain. Vercel shows the CNAME target; create the
   record at your DNS provider. With Cloudflare, leave the record **DNS only** (grey cloud): Vercel terminates TLS
   itself and a proxied record would double-proxy.
4. Optional: **Settings → Functions → Region** close to the backend (the ISR renders fetch the API server-side).

## Notes

- Image hosts for `next/image` are derived from the backend URLs (`next.config.js`), nothing to add.
- `/api/revalidate` works on Vercel (`revalidatePath`/`revalidateTag`); the "warm the origin" step and the
  Cloudflare purge are skipped there (no local origin, no `CF_API_TOKEN`). Pages re-render on the next request.
- Preview deployments get random URLs: they render, but login and checkout need those origins in the backend CORS.
