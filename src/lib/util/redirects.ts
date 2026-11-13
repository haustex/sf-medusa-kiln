import config from "@theme"

/**
 * theme.config.ts `redirects`: old addresses answered with a 308 in the same market. Patterns are matched on the
 * path without the market prefix; `:name` is one segment, `:name*` everything that follows.
 *   { from: "/account/orders/details/:id", to: "/account/orders/:id" }
 *   { from: "/produk/:rest*", to: "/products/:rest*" }
 */
type Rule = { names: string[]; re: RegExp; to: string }

const RULES: Rule[] = (config.redirects ?? []).map(({ from, to }) => {
  const names: string[] = []
  const pattern = from
    .split("/")
    .map((seg) => {
      const m = seg.match(/^:([A-Za-z_][A-Za-z0-9_]*)(\*)?$/)
      if (!m) return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      names.push(m[1])
      return m[2] ? "(.+)" : "([^/]+)"
    })
    .join("/")
  return { names, re: new RegExp(`^${pattern}/?$`), to }
})

/** The redirect target for a market-less path, or null when no rule matches */
export function redirectFor(path: string): string | null {
  for (const { names, re, to } of RULES) {
    const m = path.match(re)
    if (!m) continue
    let out = to
    names.forEach((n, i) => {
      out = out.replace(new RegExp(`:${n}\\*?`, "g"), m[i + 1])
    })
    return out
  }
  return null
}
