import { Command } from 'commander'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import chalk from 'chalk'
import { loadConfig } from '../../config/index.js'
import { success, error, info, warn } from '../../output/index.js'
import type { PartialDarajaConfig } from '../../config/schema.js'

type ConfigKey = keyof PartialDarajaConfig

const VALID_KEYS: ConfigKey[] = [
  'environment',
  'consumerKey',
  'consumerSecret',
  'shortcode',
  'passkey',
  'initiatorName',
  'initiatorPassword',
  'callbackUrl',
  'validationUrl',
  'confirmationUrl',
]

const SECRET_KEYS = new Set<ConfigKey>(['consumerSecret', 'passkey', 'initiatorPassword'])

const KEY_DESCRIPTIONS: Record<ConfigKey, string> = {
  environment: 'API environment (sandbox | production)',
  consumerKey: 'Daraja consumer key',
  consumerSecret: 'Daraja consumer secret',
  shortcode: 'M-Pesa shortcode (paybill or till number)',
  passkey: 'STK Push passkey',
  initiatorName: 'API operator username for B2C/B2B/reversal',
  initiatorPassword: 'API operator password for B2C/B2B/reversal',
  callbackUrl: 'Default callback URL for STK Push results',
  validationUrl: 'C2B payment validation endpoint',
  confirmationUrl: 'C2B payment confirmation endpoint',
}

const GLOBAL_CONFIG_PATH = join(homedir(), '.daraja', 'config.json')
const LOCAL_CONFIG_FILE = '.daraja.json'

function mask(value: string): string {
  if (value.length <= 8) return '*'.repeat(value.length)
  return value.slice(0, 4) + '*'.repeat(value.length - 8) + value.slice(-4)
}

function findLocalConfigPath(): string | null {
  let dir = process.cwd()
  const root = homedir()
  while (dir !== root && dir !== '/') {
    const candidate = join(dir, LOCAL_CONFIG_FILE)
    if (existsSync(candidate)) return candidate
    dir = join(dir, '..')
  }
  return null
}

function readConfigFile(path: string): PartialDarajaConfig {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as PartialDarajaConfig
  } catch {
    return {}
  }
}

function writeConfigFile(path: string, data: PartialDarajaConfig): void {
  const dir = join(path, '..')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 })
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', { encoding: 'utf-8', mode: 0o600 })
}

export const configCommand = new Command('config')
  .description('Read and write individual Daraja configuration values')

// ─── list ────────────────────────────────────────────────────────────────────

configCommand
  .command('list')
  .description('Show all resolved configuration values (secrets masked)')
  .option('--reveal', 'Show secret values in plaintext (careful in shared terminals)')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action((opts: { reveal?: boolean; format: string }) => {
    const config = loadConfig()

    if (opts.format === 'json') {
      const out: Record<string, string | undefined> = {}
      for (const key of VALID_KEYS) {
        const val = config[key] as string | undefined
        out[key] = val && SECRET_KEYS.has(key) && !opts.reveal ? mask(val) : val
      }
      process.stdout.write(JSON.stringify(out, null, 2) + '\n')
      return
    }

    process.stdout.write('\n' + chalk.bold('Resolved configuration') + '\n\n')

    const localPath = findLocalConfigPath()
    const globalExists = existsSync(GLOBAL_CONFIG_PATH)

    if (localPath) info(`Local config:  ${localPath}`)
    if (globalExists) info(`Global config: ${GLOBAL_CONFIG_PATH}`)
    info('Env vars override both file configs')
    process.stdout.write('\n')

    const maxKey = Math.max(...VALID_KEYS.map((k) => k.length))

    for (const key of VALID_KEYS) {
      const val = config[key] as string | undefined
      const display =
        val === undefined
          ? chalk.dim('(not set)')
          : SECRET_KEYS.has(key) && !opts.reveal
            ? chalk.yellow(mask(val))
            : chalk.white(val)

      process.stdout.write(`  ${chalk.dim(key.padEnd(maxKey))}  ${display}\n`)
    }

    process.stdout.write('\n')

    if (!opts.reveal) {
      process.stdout.write(chalk.dim('  Secrets are masked. Use --reveal to show plaintext.\n\n'))
    }
  })

// ─── get ─────────────────────────────────────────────────────────────────────

configCommand
  .command('get <key>')
  .description('Print the resolved value of a single config key')
  .option('--reveal', 'Show secret values in plaintext')
  .action((key: string, opts: { reveal?: boolean }) => {
    if (!VALID_KEYS.includes(key as ConfigKey)) {
      error(
        `Unknown key: ${key}`,
        `Valid keys: ${VALID_KEYS.join(', ')}`,
      )
      process.exit(1)
    }

    const config = loadConfig()
    const val = config[key as ConfigKey] as string | undefined

    if (val === undefined) {
      warn(`${key} is not set`)
      process.exitCode = 1
      return
    }

    const display = SECRET_KEYS.has(key as ConfigKey) && !opts.reveal ? mask(val) : val
    process.stdout.write(display + '\n')
  })

// ─── set ─────────────────────────────────────────────────────────────────────

configCommand
  .command('set <key> <value>')
  .description('Set a config value in the local .daraja.json (or global with --global)')
  .option('--global', 'Write to ~/.daraja/config.json instead of ./.daraja.json')
  .action((key: string, value: string, opts: { global?: boolean }) => {
    if (!VALID_KEYS.includes(key as ConfigKey)) {
      error(
        `Unknown key: ${key}`,
        `Valid keys: ${VALID_KEYS.join(', ')}`,
      )
      process.exit(1)
    }

    if (key === 'environment' && value !== 'sandbox' && value !== 'production') {
      error('environment must be "sandbox" or "production"')
      process.exit(1)
    }

    const configPath = opts.global ? GLOBAL_CONFIG_PATH : join(process.cwd(), LOCAL_CONFIG_FILE)

    let existing: PartialDarajaConfig = {}
    if (existsSync(configPath)) {
      try {
        existing = JSON.parse(readFileSync(configPath, 'utf-8')) as PartialDarajaConfig
      } catch {
        // start fresh if corrupted
      }
    }

    const updated = { ...existing, [key]: value }
    writeConfigFile(configPath, updated)

    const display = SECRET_KEYS.has(key as ConfigKey) ? mask(value) : value
    success(`${key} = ${display}`)
    info(`Written to ${configPath}`)
  })

// ─── unset ───────────────────────────────────────────────────────────────────

configCommand
  .command('unset <key>')
  .description('Remove a key from the local .daraja.json (or global with --global)')
  .option('--global', 'Remove from ~/.daraja/config.json')
  .action((key: string, opts: { global?: boolean }) => {
    if (!VALID_KEYS.includes(key as ConfigKey)) {
      error(
        `Unknown key: ${key}`,
        `Valid keys: ${VALID_KEYS.join(', ')}`,
      )
      process.exit(1)
    }

    const configPath = opts.global ? GLOBAL_CONFIG_PATH : join(process.cwd(), LOCAL_CONFIG_FILE)

    if (!existsSync(configPath)) {
      warn(`${configPath} does not exist — nothing to unset`)
      return
    }

    let existing: PartialDarajaConfig = {}
    try {
      existing = JSON.parse(
        require('fs').readFileSync(configPath, 'utf-8'),
      ) as PartialDarajaConfig
    } catch {
      warn('Could not parse config file')
      return
    }

    if (!(key in existing)) {
      warn(`${key} is not set in ${configPath}`)
      return
    }

    const { [key as ConfigKey]: _removed, ...rest } = existing
    writeConfigFile(configPath, rest)
    success(`Removed ${key} from ${configPath}`)
  })

// ─── path ────────────────────────────────────────────────────────────────────

configCommand
  .command('path')
  .description('Show where configuration files are located')
  .action(() => {
    const localPath = findLocalConfigPath()

    process.stdout.write('\n')
    process.stdout.write(
      `  ${chalk.dim('local')}   ${localPath ? chalk.white(localPath) : chalk.dim('(no .daraja.json found)')}\n`,
    )
    process.stdout.write(
      `  ${chalk.dim('global')}  ${existsSync(GLOBAL_CONFIG_PATH) ? chalk.white(GLOBAL_CONFIG_PATH) : chalk.dim(GLOBAL_CONFIG_PATH + ' (not created yet)')}\n`,
    )
    process.stdout.write(
      `  ${chalk.dim('env vars')} override both file configs (DARAJA_* prefix)\n`,
    )
    process.stdout.write('\n')
  })

// ─── keys ────────────────────────────────────────────────────────────────────

configCommand
  .command('keys')
  .description('List all supported configuration keys and their descriptions')
  .action(() => {
    process.stdout.write('\n' + chalk.bold('Supported configuration keys') + '\n\n')

    const maxKey = Math.max(...VALID_KEYS.map((k) => k.length))

    for (const key of VALID_KEYS) {
      const envVar = `DARAJA_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`
      const isSecret = SECRET_KEYS.has(key)
      process.stdout.write(
        `  ${chalk.cyan(key.padEnd(maxKey))}  ${KEY_DESCRIPTIONS[key]}` +
          (isSecret ? chalk.dim(' [secret]') : '') +
          '\n',
      )
      process.stdout.write(
        `  ${' '.repeat(maxKey)}  ${chalk.dim(`env: ${envVar}`)}\n`,
      )
    }

    process.stdout.write('\n')
  })
