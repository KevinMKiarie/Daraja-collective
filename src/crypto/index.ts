import { publicEncrypt, constants } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { ValidationError } from '../errors/index.js'

const CERTS_DIR = join(homedir(), '.daraja', 'certs')

export function generateStkPassword(
  shortcode: string,
  passkey: string,
): { password: string; timestamp: string } {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14)

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

  return { password, timestamp }
}

// Encrypts the initiator password with the Safaricom public certificate.
// Daraja requires RSA PKCS1 v1.5 padding — not OAEP.
export function generateSecurityCredential(
  initiatorPassword: string,
  environment: 'sandbox' | 'production',
): string {
  const certFile = environment === 'sandbox' ? 'sandbox.cer' : 'production.cer'
  const certPath = join(CERTS_DIR, certFile)

  let cert: Buffer
  try {
    cert = readFileSync(certPath)
  } catch {
    throw new ValidationError(
      `Certificate not found at ${certPath}. Run \`daraja keygen security\` to download it.`,
    )
  }

  const encrypted = publicEncrypt(
    { key: cert, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(initiatorPassword),
  )

  return encrypted.toString('base64')
}

// Normalizes Kenyan phone numbers to the 2547XXXXXXXX format Daraja expects.
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.length === 9) return `254${digits}`

  throw new ValidationError(
    `Invalid phone number: "${phone}". Expected formats: 0712345678, +254712345678, 254712345678`,
    'phone',
  )
}

// Formats a KES amount for display. Daraja always works in whole shillings (no decimals).
export function formatAmount(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`
}

// Generates a base64 encoded certificate download URL for the given environment
export function certDownloadUrl(environment: 'sandbox' | 'production'): string {
  if (environment === 'sandbox') {
    return 'https://developer.safaricom.co.ke/api/v1/GenerateSecurityCredential/SandboxCertificate.cer'
  }
  return 'https://developer.safaricom.co.ke/api/v1/GenerateSecurityCredential/ProductionCertificate.cer'
}
