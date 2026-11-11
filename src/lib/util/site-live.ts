/**
 * Pre-launch switch. `SITE_LIVE=true` (deploy/.env) opens the site to search
 * engines and AI crawlers; anything else keeps it closed:
 * robots.txt disallows everything, every response carries
 * `X-Robots-Tag: noindex, nofollow`, and sitemap.xml / llms.txt are empty.
 *
 * Read at build time (next.config headers, static routes), so flipping it
 * needs a rebuild: `cd deploy && ./deploy.sh`.
 */
export const SITE_LIVE = process.env.SITE_LIVE === "true"
