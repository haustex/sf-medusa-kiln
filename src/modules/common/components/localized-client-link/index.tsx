"use client"
import { marketPath } from "@lib/util/market"

import Link from "@modules/common/components/app-link"
import { useParams } from "next/navigation"
import React from "react"

/**
 * Use this component to create a Next.js `<Link />` that persists the current country code in the url,
 * without having to explicitly pass it as a prop.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  const { countryCode } = useParams()

  return (
    <Link href={marketPath(countryCode as string, href)} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
