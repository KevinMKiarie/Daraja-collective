import { Command } from 'commander'
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import ora from 'ora'
import { loadConfig } from '../../config/index.js'
import { generateStkPassword, certDownloadUrl } from '../../crypto/index.js'
import { success, error, info, printKeyValue } from '../../output/index.js'

export const keygenCommand = new Command('keygen')
  .description('Generate and manage Daraja security credentials')

keygenCommand
  .command('security')
  .description('Download the Safaricom certificate used to encrypt your initiator password')
  .option('--env <environment>', 'Environment to download cert for: sandbox | production')
  .option('--force', 'Re-download and overwrite an existing certificate')
  .action(async (opts: { env?: string; force?: boolean }) => {
    const config = loadConfig()
    const environment = ((opts.env ?? config.environment) || 'sandbox') as 'sandbox' | 'production'

    const certsDir = join(homedir(), '.daraja', 'certs')
    const certFile = environment === 'sandbox' ? 'sandbox.cer' : 'production.cer'
    const certPath = join(certsDir, certFile)

    if (existsSync(certPath) && !opts.force) {
      success(`Certificate already present at ${certPath}`)
      info('Run with --force to re-download.')
      return
    }

    const url = certDownloadUrl(environment)
    const spinner = ora(`Downloading ${environment} certificate from Safaricom...`).start()

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      const certText = await response.text()
      if (!certText.includes('CERTIFICATE')) {
        throw new Error('Response does not look like a PEM certificate — the URL may have changed.')
      }

      mkdirSync(certsDir, { recursive: true, mode: 0o700 })
      writeFileSync(certPath, certText, { encoding: 'utf-8', mode: 0o600 })

      spinner.stop()
      success(`Certificate saved`, certPath)
      info('B2C, B2B, balance, reversal, status, and tax commands are now available.')
    } catch (err) {
      spinner.stop()
      error(
        'Failed to download certificate',
        err instanceof Error ? err.message : String(err),
      )
      process.exit(1)
    }
  })

keygenCommand
  .command('passkey')
  .description('Generate the STK Push password for the current timestamp')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action((opts: { format: string }) => {
    const config = loadConfig()
    const shortcode = config.shortcode ?? ''
    const passkey = config.passkey ?? ''

    if (!shortcode) {
      error('shortcode is not set.', 'Run `daraja init` to configure it.')
      process.exitCode = 1
      return
    }

    if (!passkey) {
      error(
        'passkey is not set in your configuration.',
        'Add it via `daraja init` or set DARAJA_PASSKEY in your environment.',
      )
      process.exitCode = 1
      return
    }

    const { password, timestamp } = generateStkPassword(shortcode, passkey)

    if (opts.format === 'json') {
      process.stdout.write(
        JSON.stringify({ shortcode: config.shortcode, timestamp, password }, null, 2) + '\n',
      )
      return
    }

    success('STK Push password generated')
    printKeyValue({ shortcode: config.shortcode, timestamp, password })
    info('This password encodes the current minute — regenerate it per request, do not cache it.')
  })
