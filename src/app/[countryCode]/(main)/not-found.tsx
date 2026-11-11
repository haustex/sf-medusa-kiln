import { Metadata } from "next"
import config from "@theme"
import NotFoundContent from "@modules/common/components/not-found"

export const metadata: Metadata = {
  title: `404 | ${config.brand.name}`,
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return <NotFoundContent />
}
