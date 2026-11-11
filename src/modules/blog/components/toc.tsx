import { TocItem } from "../types"

/**
 * Table of contents, built on the server from the article's h2 headings (long articles only).
 * One element, two looks (blog.css): a Soft box above the text below xl, a sticky list in the left margin from xl.
 * Plain anchor links: no JS, nothing moves after load.
 */
export default function Toc({ items, title }: { items: TocItem[]; title: string }) {
  if (items.length < 3) return null
  return (
    <nav aria-labelledby="toc-title" className="blog-toc">
      <p id="toc-title" className="type-eyebrow">
        {title}
      </p>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
