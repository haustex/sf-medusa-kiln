import { ButtonLink } from "@modules/ds"

export function NoOrders({ title, hint, shop, href }: { title: string; hint: string; shop: string; href: string }) {
  return (
    <div className="flex flex-col items-start gap-stack-md rounded-media bg-default p-stack-lg" data-testid="no-orders-container">
      <div className="flex flex-col gap-stack-xs">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      <ButtonLink href={href}>{shop}</ButtonLink>
    </div>
  )
}
