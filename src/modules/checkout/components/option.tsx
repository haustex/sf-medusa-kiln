import { cn } from "@heroui/styles"

/**
 * One choice in a radio list (delivery option, payment method): a native radio, a label with an optional hint,
 * a value on the right, and room for content below (the card form) outside the label, so its own controls
 * never toggle the radio.
 */
export default function Option({ name, value, checked, onChange, title, hint, trailing, disabled, children, testId }: { name: string; value: string; checked: boolean; onChange: (value: string) => void; title: React.ReactNode; hint?: React.ReactNode; trailing?: React.ReactNode; disabled?: boolean; children?: React.ReactNode; testId?: string }) {
  return (
    <div className={cn("flex flex-col rounded-media ring-1 ring-inset transition-shadow", checked ? "ring-2 ring-foreground" : "ring-separator hover:ring-control", disabled && "opacity-60")} data-testid={testId} data-checked={checked || undefined}>
      <label className={cn("flex items-start gap-stack-md p-stack-md", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
        <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={() => onChange(value)} className="mt-0.5 size-5 shrink-0 accent-foreground" />
        <span className="flex min-w-0 flex-1 flex-col gap-stack-xs">
          <span className="font-medium">{title}</span>
          {hint && <span className="text-sm text-muted">{hint}</span>}
        </span>
        {trailing && <span className="shrink-0 tabular-nums">{trailing}</span>}
      </label>
      {checked && children && <div className="px-stack-md pb-stack-md">{children}</div>}
    </div>
  )
}
