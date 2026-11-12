# Kiln storefront (Next.js, output: "standalone"). Build context: this folder.
# Static pages are rendered at build time against MEDUSA_BACKEND_URL_INTERNAL, so build with the backend
# reachable (e.g. `docker build --network host …` when it listens on 127.0.0.1).
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@10.11.1 --activate
WORKDIR /app

FROM base AS build
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
ARG NEXT_PUBLIC_BASE_URL=http://localhost:8000
ARG MEDUSA_BACKEND_URL_INTERNAL=http://127.0.0.1:9000
ARG NEXT_PUBLIC_MEDIA_URL=
ARG NEXT_PUBLIC_STRIPE_KEY=
ARG SITE_LIVE=false
ARG KILN_DEMO_NOTICE=false
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY} \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=${NEXT_PUBLIC_MEDUSA_BACKEND_URL} \
    NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL} \
    MEDUSA_BACKEND_URL_INTERNAL=${MEDUSA_BACKEND_URL_INTERNAL} \
    NEXT_PUBLIC_MEDIA_URL=${NEXT_PUBLIC_MEDIA_URL} \
    NEXT_PUBLIC_STRIPE_KEY=${NEXT_PUBLIC_STRIPE_KEY} \
    SITE_LIVE=${SITE_LIVE} \
    KILN_DEMO_NOTICE=${KILN_DEMO_NOTICE} \
    NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-bookworm-slim AS runtime
# The same switches as the build: robots, sitemap, llms.txt and the noindex header are decided at build time; the
# demo notice is read again at request time.
ARG SITE_LIVE=false
ARG KILN_DEMO_NOTICE=false
ARG NEXT_PUBLIC_MEDIA_URL=
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    SITE_LIVE=${SITE_LIVE} \
    KILN_DEMO_NOTICE=${KILN_DEMO_NOTICE} \
    NEXT_PUBLIC_MEDIA_URL=${NEXT_PUBLIC_MEDIA_URL} \
    HOSTNAME=localhost \
    NODE_OPTIONS=--dns-result-order=ipv4first \
    PORT=8000
# HOSTNAME=localhost: Next normalises 127.x to "localhost" in the proxy; another origin turns the market rewrites
# into HTTP proxying. ipv4first binds "localhost" to 127.0.0.1.
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 8000
CMD ["node", "server.js"]
