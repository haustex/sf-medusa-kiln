// Fails fast when the storefront cannot talk to Medusa. No dependencies: it runs from next.config.js.
const requiredEnvs = [
  {
    key: "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
    description: "A publishable API key from Medusa Admin → Settings → Publishable API Keys (see README).",
  },
]

function checkEnvVariables() {
  const missing = requiredEnvs.filter((env) => !process.env[env.key])
  if (missing.length === 0) return
  console.error("\nMissing required environment variables:\n")
  for (const env of missing) {
    console.error(`  ${env.key}`)
    if (env.description) console.error(`    ${env.description}\n`)
  }
  console.error("Set them in .env (copy .env.example) or in the environment before starting the storefront.\n")
  process.exit(1)
}

module.exports = checkEnvVariables
