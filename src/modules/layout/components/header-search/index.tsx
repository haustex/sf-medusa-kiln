import { buttonVariants, cn, searchFieldVariants } from "@heroui/styles"

type HeaderSearchProps = {
  action: string
  placeholder: string
  label: string
  /** Name of the search landmark; pages with two search forms need different names (axe landmark-unique) */
  formLabel: string
  defaultValue?: string
  /** Visible submit button (search page). */
  submitLabel?: string
  className?: string
}

/**
 * Centered header search (white, soft shadow): HeroUI SearchField styles on a plain GET form.
 * Server component, so the header ships no JS for it and works without JS.
 */
export default function HeaderSearch({ action, placeholder, label, formLabel, defaultValue, submitLabel, className }: HeaderSearchProps) {
  const s = searchFieldVariants({ fullWidth: true })
  return (
    <form role="search" aria-label={formLabel} method="get" action={action} className={cn("w-full", className)}>
      <div className={cn(s.base(), submitLabel && "flex-row items-center gap-stack-sm")}>
        <label
          className={cn(
            s.group(),
            "h-11 border border-control bg-surface shadow-soft md:h-12"
          )}
        >
          <span className="sr-only">{label}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={s.searchIcon()}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            name="q"
            placeholder={placeholder}
            defaultValue={defaultValue}
            autoComplete="off"
            enterKeyHint="search"
            className={s.input()}
          />
        </label>
        {submitLabel && (
          <button type="submit" className={cn(buttonVariants({ variant: "primary" }), "h-11 shrink-0 px-5 md:h-12")}>
            {submitLabel}
          </button>
        )}
      </div>
    </form>
  )
}
