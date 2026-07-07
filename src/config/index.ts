import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { ConfigError } from '../errors/index.js'
import { configSchema } from './schema.js'
import type { DarajaConfig, PartialDarajaConfig } from './schema.js'

const GLOBAL_CONFIG_PATH = join(homedir(), '.daraja', 'config.json')
const LOCAL_CONFIG_FILE = '.daraja.json'

function readJsonFile(path: string): PartialDarajaConfig {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as PartialDarajaConfig
  } catch {
    return {}
  }
}

function fromEnv(): PartialDarajaConfig {
  const env = process.env
  const config: PartialDarajaConfig = {}

  if (env['DARAJA_ENVIRONMENT'] === 'sandbox' || env['DARAJA_ENVIRONMENT'] === 'production') {
    config.environment = env['DARAJA_ENVIRONMENT']
  }
  if (env['DARAJA_CONSUMER_KEY']) config.consumerKey = env['DARAJA_CONSUMER_KEY']
  if (env['DARAJA_CONSUMER_SECRET']) config.consumerSecret = env['DARAJA_CONSUMER_SECRET']
  if (env['DARAJA_SHORTCODE']) config.shortcode = env['DARAJA_SHORTCODE']
  if (env['DARAJA_PASSKEY']) config.passkey = env['DARAJA_PASSKEY']
  if (env['DARAJA_INITIATOR_NAME']) config.initiatorName = env['DARAJA_INITIATOR_NAME']
  if (env['DARAJA_INITIATOR_PASSWORD']) config.initiatorPassword = env['DARAJA_INITIATOR_PASSWORD']
  if (env['DARAJA_CALLBACK_URL']) config.callbackUrl = env['DARAJA_CALLBACK_URL']
  if (env['DARAJA_VALIDATION_URL']) config.validationUrl = env['DARAJA_VALIDATION_URL']
  if (env['DARAJA_CONFIRMATION_URL']) config.confirmationUrl = env['DARAJA_CONFIRMATION_URL']

  return config
}

function findLocalConfig(): PartialDarajaConfig {
  let dir = process.cwd()
  const root = homedir()

  while (dir !== root && dir !== '/') {
    const candidate = join(dir, LOCAL_CONFIG_FILE)
    if (existsSync(candidate)) return readJsonFile(candidate)
    dir = join(dir, '..')
  }

  return {}
}

// Merges config sources with priority: env vars > local file > global file > defaults
export function loadConfig(overrides?: PartialDarajaConfig): PartialDarajaConfig {
  const globalConfig = readJsonFile(GLOBAL_CONFIG_PATH)
  const localConfig = findLocalConfig()
  const envConfig = fromEnv()

  return {
    environment: 'sandbox',
    ...globalConfig,
    ...localConfig,
    ...envConfig,
    ...overrides,
  }
}

// Validates the merged config and throws a ConfigError listing all missing fields
export function requireConfig(overrides?: PartialDarajaConfig): DarajaConfig {
  const raw = loadConfig(overrides)
  const result = configSchema.safeParse(raw)

  if (!result.success) {
    const missing = result.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    throw new ConfigError(
      `Invalid or incomplete configuration:\n${missing.join('\n')}\n\nRun \`daraja init\` to set up credentials or check your .env file.`,
    )
  }

  return result.data
}

export const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
} as const
