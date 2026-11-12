# Developing Kiln

Two processes on this machine, both bound to the loopback interface only:

| What | Folder | Port | Log / pid |
| --- | --- | --- | --- |
| Medusa backend (dev store, demo data) | `~/themes/kiln-backend` (not in git) | `127.0.0.1:9710` | `.state/server.log`, `.state/server.pid` |
| Storefront (`next dev`) | `~/themes/kiln` | `127.0.0.1:9720` | `.trash/dev.log`, `.trash/dev.pid` |

The backend reads its environment from `~/themes/kiln-backend/.env` (Postgres `rw-spike-pg` on `127.0.0.1:55436`,
database `kiln_dev`). Every medusa command goes through `scripts/guard.mjs`, which refuses anything that is not
the spike database / ports 9700+ (the same machine runs the production store). Admin login: `admin@kiln.test` /
`kiln-dev-password` (admin UI only when started with `KILN_ADMIN=1`; the admin API is always on).

Node tools are in `~/.local/lib/node/bin`; every command below starts by putting them on `PATH`.

## Start

Backend:

```bash
export PATH=~/.local/lib/node/bin:$PATH
cd ~/themes/kiln-backend && set -a && . ./.env && set +a && mkdir -p .state && \
  (setsid node scripts/guard.mjs ./node_modules/.bin/medusa develop > .state/server.log 2>&1 & echo $! > .state/server.pid)
```

Storefront:

```bash
export PATH=~/.local/lib/node/bin:$PATH
cd ~/themes/kiln && mkdir -p .trash && (setsid pnpm dev > .trash/dev.log 2>&1 & echo $! > .trash/dev.pid)
```

`setsid` puts each server in its own process group, so the stop commands can kill the whole tree (pnpm → sh →
next → next-server) with one signal. The backend takes ~20 s to come up, the storefront ~10 s.

## Check

```bash
curl -s -o /dev/null -w "backend %{http_code}\n" http://127.0.0.1:9710/health
curl -s -o /dev/null -w "storefront %{http_code}\n" http://127.0.0.1:9720/
```

Both should print 200. Open the store at <http://127.0.0.1:9720/> (also <http://localhost:9720/>).

## Stop

```bash
kill -- -$(cat ~/themes/kiln-backend/.state/server.pid)
kill -- -$(cat ~/themes/kiln/.trash/dev.pid)
```

If a pid file is stale, find the processes with `pgrep -af "medusa develop|next dev"` (ignore the hauskayu ones) and
`kill -- -<pgid>` using the PGID from `ps -o pid,pgid,cmd -p <pid>`.

## Restart the storefront with a clean fetch cache

`next dev` keeps a Data Cache on disk; after changing products in the backend, move it aside before starting:

```bash
kill -- -$(cat ~/themes/kiln/.trash/dev.pid); sleep 3
mv ~/themes/kiln/.next/dev/cache/fetch-cache ~/themes/kiln/.trash/fetch-cache-$(date +%s)
```

then run the storefront start command again.

## Demo content

The catalogue comes from `seed/seed-kiln.ts` (see its header). Two more generators:

```bash
export PATH=~/.local/lib/node/bin:$PATH
cd ~/themes/kiln
node seed/demo-hero.mjs    # hero banners → public/hero (theme.config.ts hero.slides)
node seed/seed-blog.mjs    # 4 demo articles + 1 author into medusa-blog-seo via the Admin API (needs the backend up)
```

`seed-blog.mjs` reads `MEDUSA_BACKEND_URL`, `MEDUSA_ADMIN_EMAIL`, `MEDUSA_ADMIN_PASSWORD` (defaults: the dev backend above)
and skips articles that already exist.

## Payments

The dev backend has only Medusa's `pp_system_default` provider ("Pay later (test)" at checkout: no payment,
the order is created). Stripe is wired in and switches on with keys:

1. Backend: put `STRIPE_API_KEY=sk_test_…` (and `STRIPE_WEBHOOK_SECRET` once a webhook points at
   `/hooks/payment/stripe_stripe`) in `~/themes/kiln-backend/.env`, restart it, then enable the provider on the
   region in Admin → Settings → Regions (start the backend with `KILN_ADMIN=1` for the UI).
2. Storefront: `NEXT_PUBLIC_STRIPE_KEY=pk_test_…` in `.env`, restart.

Checkout then shows "Card" with Stripe's Payment Element (card, wallets and any redirect method enabled in the
Stripe dashboard); redirect methods come back through `/api/payment-return`. Test card: 4242 4242 4242 4242.

## Checks before a commit

```bash
export PATH=~/.local/lib/node/bin:$PATH
cd ~/themes/kiln && pnpm exec tsc --noEmit && pnpm exec eslint src
```
