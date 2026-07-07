import { Command } from 'commander'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import chalk from 'chalk'
import { loadConfig, BASE_URLS } from '../config/index.js'
import { fetchOAuthToken } from '../api/auth.js'

function pass(label: string, detail?: string): void {
  process.stdout.write(`  ${chalk.green('✓')} ${label}`)
  if (detail) process.stdout.write(chalk.dim(` — ${detail}`))
  process.stdout.write('\n')
}

function fail(label: string, hint?: string): void {
  process.stderr.write(`  ${chalk.red('✗')} ${label}\n`)
  if (hint) process.stderr.write(chalk.dim(`      ${hint}\n`))
}

function warn(label: string, hint?: string): void {
  process.stdout.write(`  ${chalk.yellow('⚠')} ${label}`)
  if (hint) process.stdout.write(chalk.dim(` — ${hint}`))
  process.stdout.write('\n')
}

export const doctorCommand = new Command('doctor')
  .description('Check your Daraja CLI configuration for common issues')
  .action(async () => {
    process.stdout.write('\nDaraja CLI — configuration check\n\n')

    const config = loadConfig()
    let hasErrors = false

    // Config present check
    if (Object.keys(config).length > 1) {
      pass('Configuration found')
    } else {
      fail('No configuration found', 'Run `daraja init` or create a .daraja.json file')
      hasErrors = true
    }

    // Consumer key
    if (config.consumerKey) {
      pass('consumerKey is set')
    } else {
      fail('consumerKey is not set', 'Required for all API calls. Run `daraja init`')
      hasErrors = true
    }

    // Consumer secret
    if (config.consumerSecret) {
      pass('consumerSecret is set')
    } else {
      fail('consumerSecret is not set', 'Required for all API calls. Run `daraja init`')
      hasErrors = true
    }

    // Environment
    if (config.environment) {
      pass('environment is set', config.environment)
    } else {
      fail('environment is not set', 'Defaulting to sandbox')
      hasErrors = true
    }

    // Shortcode
    if (config.shortcode) {
      pass('shortcode is set', config.shortcode)
    } else {
      fail('shortcode is not set', 'Required for most API calls. Run `daraja init`')
      hasErrors = true
    }

    // Passkey (optional, warn)
    if (config.passkey) {
      pass('passkey is set')
    } else {
      warn('passkey is not set', 'Required for STK Push and Ratiba standing orders')
    }

    // Initiator credentials (optional, warn)
    if (config.initiatorName && config.initiatorPassword) {
      pass('initiatorName and initiatorPassword are set')
    } else if (!config.initiatorName && !config.initiatorPassword) {
      warn(
        'initiatorName and initiatorPassword are not set',
        'Required for B2C, B2B, reversal, balance, and status queries',
      )
    } else {
      warn(
        'Only one of initiatorName / initiatorPassword is set',
        'Both are required together',
      )
    }

    // Security certificate (only matters if initiator creds are set)
    if (config.initiatorName && config.initiatorPassword) {
      const environment = config.environment ?? 'sandbox'
      const certFile = environment === 'sandbox' ? 'sandbox.cer' : 'production.cer'
      const certPath = join(homedir(), '.daraja', 'certs', certFile)
      if (existsSync(certPath)) {
        pass('Security certificate found', certPath)
      } else {
        fail(
          `Security certificate not found (${certFile})`,
          'Run `daraja keygen security` to download it',
        )
        hasErrors = true
      }
    }

    // Callback URL (optional, warn)
    if (config.callbackUrl) {
      pass('callbackUrl is set', config.callbackUrl)
    } else {
      warn('callbackUrl is not set', 'Required for async result delivery. Run `daraja init`')
    }

    // Connectivity check
    process.stdout.write('\n')
    if (config.consumerKey && config.consumerSecret) {
      const environment = config.environment ?? 'sandbox'
      const baseUrl = BASE_URLS[environment]
      try {
        await fetchOAuthToken(config.consumerKey, config.consumerSecret, baseUrl, environment)
        pass(`Can reach Daraja (${environment})`)
      } catch (err) {
        fail(
          `Cannot reach Daraja (${environment})`,
          err instanceof Error ? err.message : String(err),
        )
        hasErrors = true
      }
    } else {
      warn('Skipping connectivity check — consumerKey or consumerSecret is missing')
    }

    process.stdout.write('\n')

    if (hasErrors) {
      process.stderr.write(
        chalk.red('Some checks failed. Run `daraja init` to configure missing values.\n'),
      )
      process.exit(1)
    } else {
      process.stdout.write(chalk.green('All checks passed.\n'))
    }
  })
