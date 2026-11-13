"use client"

import { useRouter } from "next/navigation"

import ProofUpload, { type ProofUploadProps } from "@modules/manual-transfer/core/components/proof-upload"

/** The plugin's upload form; afterwards the page reloads its data (status, proofs) */
export default function RefreshingProofUpload(props: ProofUploadProps) {
  const router = useRouter()
  return <ProofUpload {...props} onUploaded={() => router.refresh()} />
}
