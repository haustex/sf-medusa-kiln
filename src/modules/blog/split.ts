import type { BlogBlock } from "@lib/data/blog"

const textLength = (html: string) => html.replace(/<[^>]+>/g, "").trim().length
const weight = (b: BlogBlock) => (b.type === "html" ? textLength(b.html) : b.type === "faq" ? b.items.reduce((n, f) => n + f.q.length + f.a.length, 0) : 200)

/**
 * Where the "From the shop" band goes: before the h2 nearest to the middle of the article (by text length); with no
 * h2, before the paragraph nearest to the middle. Returns the blocks before and after that point; `after` is empty
 * when the article is too short to split (the band then follows the text).
 */
export function splitForShop(blocks: BlogBlock[]): { before: BlogBlock[]; after: BlogBlock[] } {
  const total = blocks.reduce((n, b) => n + weight(b), 0)
  const target = total / 2
  if (total < 600) return { before: blocks, after: [] }

  type Cut = { block: number; offset: number; distance: number }
  const find = (re: RegExp): Cut | null => {
    let best: Cut | null = null
    let done = 0
    blocks.forEach((b, i) => {
      if (b.type === "html") {
        for (const m of Array.from(b.html.matchAll(re))) {
          const at = done + textLength(b.html.slice(0, m.index))
          if (at === 0) continue // the article's first heading
          const distance = Math.abs(at - target)
          if (!best || distance < best.distance) best = { block: i, offset: m.index, distance }
        }
      }
      done += weight(b)
    })
    return best
  }
  const cut = find(/<h2[\s>]/g) ?? find(/<p[\s>]/g)
  if (!cut) return { before: blocks, after: [] }
  const b = blocks[cut.block] as Extract<BlogBlock, { type: "html" }>
  const head = b.html.slice(0, cut.offset).trim()
  const tail = b.html.slice(cut.offset).trim()
  const before = [...blocks.slice(0, cut.block), ...(head ? [{ type: "html" as const, html: head }] : [])]
  const after = [...(tail ? [{ type: "html" as const, html: tail }] : []), ...blocks.slice(cut.block + 1)]
  return after.length ? { before, after } : { before: blocks, after: [] }
}
