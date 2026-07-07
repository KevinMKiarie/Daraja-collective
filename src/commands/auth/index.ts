import { Command } from 'commander'
import ora from 'ora'
import { loadConfig } from '../../config/index.js'
import { fetchOAuthToken } from '../../api/auth.js'
import { setToken, clearToken } from '../../cache/token.js'
import { success, error, printKeyValue, formatTimestamp } from '../../output/index.js'
import { BASE_URLS } from '../../config/index.js'
import { AuthenticationError, ConfigError } from '../../errors/index.js'

export const authCommand = new Command('auth')
  .description('Manage OAuth tokens')

authCommand
  .command('token')
  .description('Generate and cache an OAuth access token')
  .option('--fresh', 'Force a new token even if a cached one is still valid')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(async (opts: { fresh?: boolean; format: string }) => {
    const config = loadConfig()

    if (!config.consumerKey || !config.consumerSecret) {
      error(
        'Consumer key and secret are required.',
        'Run `daraja init` or set DARAJA_CONSUMER_KEY and DARAJA_CONSUMER_SECRET in your .env',
      )
      process.exit(1)
    }

    if (opts.fresh) clearToken(config.environment, config.consumerKey)

    const environment = config.environment ?? 'sandbox'
    const baseUrl = BASE_URLS[environment]
    const spinner = ora('Fetching token from Daraja...').start()

    try {
      const token = await fetchOAuthToken(
        config.consumerKey,
        config.consumerSecret,
        baseUrl,
        environment,
      )

      setToken(token)
      spinner.stop()

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(token, null, 2) + '\n')
        return
      }

      success('Token fetched and cached')
      printKeyValue({
        environment,
        token_type: token.token_type,
        expires_at: formatTimestamp(token.expires_at),
        created_at: formatTimestamp(token.created_at),
      })
    } catch (err) {
      spinner.stop()
      if (err instanceof AuthenticationError || err instanceof ConfigError) {
        error(err.message)
      } else {
        error('Unexpected error', err instanceof Error ? err.message : String(err))
      }
      process.exit(1)
    }
  })

authCommand
  .command('clear')
  .description('Remove cached tokens')
  .action(() => {
    clearToken()
    success('All cached tokens cleared')
  })
