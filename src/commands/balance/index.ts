import { Command } from 'commander'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { queryAccountBalance } from '../../api/balance.js'
import { success, error, printKeyValue } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

interface BalanceOptions {
  debug?: boolean
  format: string
}

export const balanceCommand = new Command('balance')
  .description('Query the account balance for your M-Pesa shortcode')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(async (opts: BalanceOptions) => {
    const config = requireConfig()

    const client = new DarajaClient(config, {
      ...(opts.debug ? { debug: true } : {}),
    })
    const spinner = ora('Querying account balance...').start()

    try {
      const response = await queryAccountBalance(client, config)

      spinner.stop()

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(response, null, 2) + '\n')
        return
      }

      success('Account balance query accepted — result will be sent to your callback URL')
      printKeyValue({
        ConversationID: response.ConversationID,
        OriginatorConversationID: response.OriginatorConversationID,
        ResponseCode: response.ResponseCode,
        ResponseDescription: response.ResponseDescription,
      })
    } catch (err) {
      spinner.stop()
      if (err instanceof DarajaError) {
        error(err.message)
      } else {
        error('Unexpected error', err instanceof Error ? err.message : String(err))
      }
      process.exit(1)
    }
  })
