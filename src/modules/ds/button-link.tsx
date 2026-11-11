import { buttonVariants, cn } from "@heroui/styles"
import Link from "@modules/common/components/app-link"

type Variant = NonNullable<Parameters<typeof buttonVariants>[0]>

/** A link that looks like a HeroUI Button (server component, no JS). */
export default function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
}: {
  href: string
  variant?: Variant["variant"]
  size?: Variant["size"]
  fullWidth?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size, fullWidth }), className)}>
      {children}
    </Link>
  )
}
