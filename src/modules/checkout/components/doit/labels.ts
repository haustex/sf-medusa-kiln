/**
 * Shopper-facing texts of the doit.id checkout (medusa-payment-doit), in Indonesian and English. Edit or translate
 * freely; nothing else in these components hard-codes copy. Picked by the market's language.
 */
const id = {
  methodTitle: "QRIS / Virtual Account",
  methodHint: "Bayar lewat e-wallet, m-banking, atau virtual account (doit.id).",
  chooseMethod: "Pilih cara bayar",
  qris: "QRIS",
  qrisHint: "Semua e-wallet dan m-banking",
  va: "Virtual Account",
  transfer: "Transfer bank",
  feeByCustomer: (fee: string) => `+ biaya ${fee}`,
  noFee: "Tanpa biaya tambahan",
  totalWithFee: (total: string) => `Total ${total}`,
  outsideLimit: (limit: string | null) => (limit ? `Tidak tersedia: ${limit}` : "Tidak tersedia untuk nominal ini"),
  feeNote: "Biaya layanan ditetapkan doit.id per metode. Total yang dibayar tampil sebelum kamu memilih.",
  methodsUnavailable: "Daftar metode tidak bisa dimuat. Metode bawaan toko akan dipakai.",
  methodsError: "Metode pembayaran ini belum tersedia saat ini. Pilih metode lain.",
  loading: "Memuat…",
  payButton: "Bayar",
  switchButton: "Ganti cara bayar",

  payTitle: "Selesaikan pembayaran",
  totalToPay: "Total dibayar",
  includesFee: (fee: string) => `Termasuk biaya ${fee}`,
  scanQris: "Pindai kode QR ini dengan aplikasi e-wallet atau m-banking.",
  vaNumber: (bank: string) => `Nomor Virtual Account ${bank}`,
  vaHint: "Transfer tepat sesuai total ke nomor ini dari m-banking, internet banking, atau ATM.",
  copy: "Salin",
  copied: "Tersalin",
  expiresIn: "Sisa waktu",
  expired: "Waktu pembayaran habis",
  openHosted: "Buka halaman pembayaran",
  qrExpired: "Kode QR sudah tidak berlaku. Lanjutkan pembayaran di halaman doit.id untuk membuat kode baru.",
  continueHosted: "Lanjutkan di halaman pembayaran",

  waiting: "Menunggu pembayaran… halaman ini diperbarui otomatis.",
  paid: "Pembayaran diterima. Membuat pesanan…",
  failed: "Pembayaran gagal atau kedaluwarsa.",
  newInvoice: "Buat tagihan baru",
  testMode: "Mode uji (sandbox): tidak ada uang sungguhan.",
  errorGeneric: "Status pembayaran belum bisa diperiksa. Mencoba lagi…",
  errorStart: "Pembayaran belum bisa dimulai. Coba lagi atau pilih metode lain.",
}

export type DoitLabels = typeof id

const en: DoitLabels = {
  methodTitle: "QRIS / Virtual Account",
  methodHint: "Pay with an e-wallet, mobile banking or a virtual account (doit.id).",
  chooseMethod: "Choose how to pay",
  qris: "QRIS",
  qrisHint: "Every e-wallet and mobile banking app",
  va: "Virtual Account",
  transfer: "Bank transfer",
  feeByCustomer: (fee: string) => `+ ${fee} fee`,
  noFee: "No extra fee",
  totalWithFee: (total: string) => `Total ${total}`,
  outsideLimit: (limit: string | null) => (limit ? `Not available: ${limit}` : "Not available for this amount"),
  feeNote: "Service fees are set by doit.id per method. The total you pay is shown before you choose.",
  methodsUnavailable: "The list of methods could not be loaded. The store's default method will be used.",
  methodsError: "This payment method is not available right now. Please choose another one.",
  loading: "Loading…",
  payButton: "Pay",
  switchButton: "Switch method",

  payTitle: "Complete your payment",
  totalToPay: "Total to pay",
  includesFee: (fee: string) => `Includes a ${fee} fee`,
  scanQris: "Scan this QR code with your e-wallet or mobile banking app.",
  vaNumber: (bank: string) => `${bank} Virtual Account number`,
  vaHint: "Transfer exactly the total to this number from mobile banking, internet banking or an ATM.",
  copy: "Copy",
  copied: "Copied",
  expiresIn: "Time left",
  expired: "The payment window has closed",
  openHosted: "Open the payment page",
  qrExpired: "This QR code has expired. Continue on the doit.id page to get a new one.",
  continueHosted: "Continue on the payment page",

  waiting: "Waiting for your payment… this page updates by itself.",
  paid: "Payment received. Placing your order…",
  failed: "The payment failed or expired.",
  newInvoice: "Create a new invoice",
  testMode: "Test mode (sandbox): no real money.",
  errorGeneric: "The payment status could not be checked. Trying again…",
  errorStart: "The payment could not be started. Try again or pick another method.",
}

/** True for any doit.id provider registered in Medusa (pp_doit_<id>) */
export const isDoit = (providerId?: string | null) => !!providerId?.startsWith("pp_doit_")

export const doitLabels = (locale: string): DoitLabels => (locale.toLowerCase().startsWith("id") ? id : en)

export const bankNames: Record<string, string> = {
  bmri: "Mandiri",
  bnia: "BNI",
  brin: "BRI",
  cimb: "CIMB Niaga",
  permata: "Permata",
  maybank: "Maybank",
  danamon: "Danamon",
  bsyi: "BSI",
  bca: "BCA",
  mandiri: "Mandiri",
  bni: "BNI",
  bsi: "BSI",
}
