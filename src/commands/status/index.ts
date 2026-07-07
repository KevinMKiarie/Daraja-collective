import { Command } from 'commander'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { queryTransactionStatus } from '../../api/status.js'
import { success, error, warn, printKeyValue } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

interface StatusOptions {
  debug?: boolean
  format: string
}

export const statusCommand = new Command('status')
  .description('Query the status of a Daraja transaction')
  .argument('<transactionId>', 'The M-Pesa transaction ID to query')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(async (transactionId: string, opts: StatusOptions) => {
    const config = requireConfig()

    const client = new DarajaClient(config, {
      ...(opts.debug ? { debug: true } : {}),
    })
    const spinner = ora('Querying transaction status...').start()

    try {
      const response = await queryTransactionStatus(client, config, { transactionId })

      spinner.stop()

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(response, null, 2) + '\n')
        return
      }

      const ok = response.ResponseCode === '0'

      if (ok) {
        success('Transaction status query accepted')
      } else {
        warn(`Query returned a non-zero response: ${response.ResponseDescription}`)
      }

      printKeyValue({
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
