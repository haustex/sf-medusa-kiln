import { Fragment } from "react"

import { tx } from "@lib/i18n/localized"
import { noteOf, type ProductNote } from "@lib/notes"
import { marketPath } from "@lib/util/market"
import Link from "@modules/common/components/app-link"
import { Icon, type IconData } from "@modules/ds/icons"
import { NOTE_ICON_DATA } from "./note-icons"

/** One row of the list under the buy button (shipping & policies): a line icon, then the text */
export function NoteRow({ icon, children, ...rest }: { icon: IconData; children: React.ReactNode } & React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li className="flex items-start gap-stack-sm" {...rest}>
      <Icon icon={icon} size={18} className="mt-px shrink-0" />
      <span className="min-w-0">{children}</span>
    </li>
  )
}

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g
const noteLink = "underline decoration-dotted underline-offset-4 hover:decoration-solid"

/** `[label](href)` in a note → links: market-relative paths get the market prefix, absolute URLs open in a new tab */
export function noteText(text: string, countryCode: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let last = 0
  for (const m of Array.from(text.matchAll(LINK))) {
    const [whole, label, href] = m
    if (m.index! > last) parts.push(text.slice(last, m.index))
    const external = /^https?:\/\//.test(href)
    parts.push(
      external ? (
        <a key={m.index} href={href} target="_blank" rel="noopener noreferrer" className={noteLink}>
          {label}
        </a>
      ) : (
        <Link key={m.index} href={href.startsWith("/") ? marketPath(countryCode, href) : href} className={noteLink}>
          {label}
        </Link>
      )
    )
    last = m.index! + whole.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 ? parts[0] : parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)
}

/** The theme's product.notes as rows (lib/notes.ts), rendered on the server; BuyBox / QuoteCta put them under the button */
export default function ProductNotes({ notes, countryCode, lang }: { notes: ProductNote[]; countryCode: string; lang: string }) {
  return (
    <>
      {notes.map((n, i) => {
        const { icon, text } = noteOf(n)
        const s = tx(text, lang)
        return s ? (
          <NoteRow key={i} icon={NOTE_ICON_DATA[icon] ?? NOTE_ICON_DATA.check}>
            {noteText(s, countryCode)}
          </NoteRow>
        ) : null
      })}
    </>
  )
}
