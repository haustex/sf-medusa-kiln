/**
 * lucide-react types every per-icon module (`lucide-react/icons/<name>`) with one shared declaration file that lists
 * only the default export (the client component). Each module also exports `__iconData`, the icon's drawing, which
 * ds/icons `Icon` uses in server components; this augmentation adds it to that shared declaration.
 */
import type {} from "lucide-react"

declare module "lucide-react/icons/search" {
  export const __iconData: { name: string; node: [string, Record<string, string>][] }
}
