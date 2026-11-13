import { buttonVariants, cn } from "@heroui/styles"

import type { ThemeOverrides } from "@modules/manual-transfer/core/theme"

/**
 * Kiln's look for the bank-transfer page (HeroUI styles + the spacing tokens), passed through the plugin's own
 * `theme` prop: core/ (copied from medusa-payment-manual-transfer, src/storefront) stays untouched, so a plugin
 * update is a plain re-copy. Only class names: logic and markup are the plugin's.
 */
export const kilnTransferTheme: ThemeOverrides = {
  page: "pt-stack-md pb-section",
  inner: "content-container flex w-full max-w-3xl flex-col gap-stack-md",
  card: "flex flex-col rounded-media border border-separator bg-surface p-stack-md sm:p-stack-lg",
  title: "type-h1",
  heading: "type-h3",
  text: "text-base text-foreground",
  subtle: "text-base text-muted",
  small: "text-sm text-muted",
  muted: "text-xs text-muted",
  error: "text-sm text-danger",
  amount: "text-3xl font-medium tracking-tight tabular-nums sm:text-4xl",
  row: "flex flex-col gap-stack-xs border-b border-separator py-stack-sm last:border-b-0 sm:flex-row sm:items-center sm:gap-stack-md",
  rowLabel: "shrink-0 text-sm text-muted sm:w-44",
  rowValue: "min-w-0 font-medium text-foreground [overflow-wrap:anywhere]",
  mono: "font-mono tracking-wide tabular-nums",
  notice: "rounded-lg bg-warning/20 px-stack-md py-stack-sm",
  noticeText: "text-sm text-warning-foreground",
  link: "inline-flex min-h-11 items-center gap-stack-sm font-medium underline underline-offset-4 hover:text-muted",
  button: cn(buttonVariants({ variant: "primary" }), "h-11 gap-stack-sm px-5"),
  copyButton: cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 shrink-0 gap-1 px-3"),
  fileInput:
    "text-sm text-muted file:mr-stack-sm file:h-9 file:cursor-pointer file:rounded-[var(--radius)] file:border file:border-solid file:border-border file:bg-surface file:px-4 file:text-sm file:font-medium file:text-foreground hover:file:border-foreground",
  textarea:
    "w-full rounded-[var(--field-radius)] border border-field-border bg-field-background px-stack-md py-stack-sm text-base placeholder:text-field-placeholder focus:border-foreground focus:outline-none focus:ring-2 focus:ring-focus sm:text-sm",
  success: "rounded-lg bg-default p-stack-md",
  badge: "inline-flex h-7 items-center rounded-full px-3 text-xs font-medium",
  badgeTone: {
    green: "bg-foreground text-background",
    orange: "ring-1 ring-inset ring-control",
    red: "ring-1 ring-inset ring-danger text-danger",
    grey: "bg-background ring-1 ring-inset ring-separator",
    blue: "ring-1 ring-inset ring-control",
  },
}
