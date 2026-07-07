import { Command } from 'commander'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { stkQuery } from '../../api/stk.js'
import { success, error, printKeyValue, warn } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

interface QueryOptions {
  debug?: boolean
  format?: string
}

export const stkQueryCommand = new Command('query')
  .description('Check the status of an STK Push request')
  .argument('<checkoutRequestId>', 'The CheckoutRequestID returned from `daraja stk push`')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(async (checkoutRequestId: string, opts: QueryOptions) => {
    const config = requireConfig()

    if (!config.passkey) {
      error('passkey is required to query STK status.', 'Add DARAJA_PASSKEY to your .env')
      process.exit(1)
    }

    const client = new DarajaClient(config, {
      ...(opts.debug ? { debug: true } : {}),
    })
    const spinner = ora('Querying STK Push status...').start()

    try {
      const response = await stkQuery(client, config, { checkoutRequestId })
      spinner.stop()

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(response, null, 2) + '\n')
        return
      }

      const paid = response.ResultCode === '0'

      if (paid) {
        success('Payment completed successfully')
      } else {
        warn(`Payment not completed: ${response.ResultDesc}`)
      }

      printKeyValue({
        ResultCode: response.ResultCode,
        ResultDesc: response.ResultDesc,
        CheckoutRequestID: response.CheckoutRequestID,
        MerchantRequestID: response.MerchantRequestID,
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
