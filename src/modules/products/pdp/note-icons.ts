import { __iconData as badgeCheck } from "lucide-react/icons/badge-check"
import { __iconData as check } from "lucide-react/icons/check"
import { __iconData as clock } from "lucide-react/icons/clock"
import { __iconData as gift } from "lucide-react/icons/gift"
import { __iconData as hammer } from "lucide-react/icons/hammer"
import { __iconData as hand } from "lucide-react/icons/hand"
import { __iconData as leaf } from "lucide-react/icons/leaf"
import { __iconData as pkg } from "lucide-react/icons/package"
import { __iconData as ruler } from "lucide-react/icons/ruler"
import { __iconData as shieldCheck } from "lucide-react/icons/shield-check"
import { __iconData as sparkles } from "lucide-react/icons/sparkles"
import { __iconData as trees } from "lucide-react/icons/trees"
import { __iconData as truck } from "lucide-react/icons/truck"
import { __iconData as undo2 } from "lucide-react/icons/undo-2"

import type { NoteIcon } from "@lib/notes"
import type { IconData } from "@modules/ds/icons"

/** The icons theme.config.ts `product.notes` may name (lib/notes.ts), as plain SVG data for server components */
export const NOTE_ICON_DATA: Record<NoteIcon, IconData> = {
  check,
  truck,
  package: pkg,
  hand,
  ruler,
  undo: undo2,
  shield: shieldCheck,
  leaf,
  trees,
  gift,
  clock,
  sparkles,
  badge: badgeCheck,
  hammer,
}
