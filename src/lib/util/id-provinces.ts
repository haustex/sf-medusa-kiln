/**
 * The 38 Indonesian provinces (ISO 3166-2:ID). The checkout stores the code as
 * the address province, which the shipping plugin (medusa-fulfillment-zone-rate)
 * maps to a zone; it also accepts names and abbreviations for older addresses.
 */
export const ID_PROVINCES: { code: string; name: string }[] = [
  { code: "ID-AC", name: "Aceh" },
  { code: "ID-SU", name: "Sumatera Utara" },
  { code: "ID-SB", name: "Sumatera Barat" },
  { code: "ID-RI", name: "Riau" },
  { code: "ID-KR", name: "Kepulauan Riau" },
  { code: "ID-JA", name: "Jambi" },
  { code: "ID-SS", name: "Sumatera Selatan" },
  { code: "ID-BB", name: "Kepulauan Bangka Belitung" },
  { code: "ID-BE", name: "Bengkulu" },
  { code: "ID-LA", name: "Lampung" },
  { code: "ID-JK", name: "DKI Jakarta" },
  { code: "ID-JB", name: "Jawa Barat" },
  { code: "ID-JT", name: "Jawa Tengah" },
  { code: "ID-YO", name: "DI Yogyakarta" },
  { code: "ID-JI", name: "Jawa Timur" },
  { code: "ID-BT", name: "Banten" },
  { code: "ID-BA", name: "Bali" },
  { code: "ID-NB", name: "Nusa Tenggara Barat" },
  { code: "ID-NT", name: "Nusa Tenggara Timur" },
  { code: "ID-KB", name: "Kalimantan Barat" },
  { code: "ID-KT", name: "Kalimantan Tengah" },
  { code: "ID-KS", name: "Kalimantan Selatan" },
  { code: "ID-KI", name: "Kalimantan Timur" },
  { code: "ID-KU", name: "Kalimantan Utara" },
  { code: "ID-SA", name: "Sulawesi Utara" },
  { code: "ID-GO", name: "Gorontalo" },
  { code: "ID-ST", name: "Sulawesi Tengah" },
  { code: "ID-SR", name: "Sulawesi Barat" },
  { code: "ID-SN", name: "Sulawesi Selatan" },
  { code: "ID-SG", name: "Sulawesi Tenggara" },
  { code: "ID-MA", name: "Maluku" },
  { code: "ID-MU", name: "Maluku Utara" },
  { code: "ID-PA", name: "Papua" },
  { code: "ID-PB", name: "Papua Barat" },
  { code: "ID-PD", name: "Papua Barat Daya" },
  { code: "ID-PT", name: "Papua Tengah" },
  { code: "ID-PE", name: "Papua Pegunungan" },
  { code: "ID-PS", name: "Papua Selatan" },
]

/** A stored province (code or exact name, any case) → its code, else "" */
export function provinceCode(value: string | null | undefined): string {
  const v = (value ?? "").trim().toLowerCase()
  if (!v) return ""
  const hit = ID_PROVINCES.find((p) => p.code.toLowerCase() === v || p.name.toLowerCase() === v)
  return hit?.code ?? ""
}

export function provinceName(value: string | null | undefined): string | null {
  const code = provinceCode(value)
  return ID_PROVINCES.find((p) => p.code === code)?.name ?? (value || null)
}
