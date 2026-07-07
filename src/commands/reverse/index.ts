import { Command } from 'commander'
import { number, confirm } from '@inquirer/prompts'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { reverseTransaction } from '../../api/reversal.js'
import { success, error, warn, printKeyValue } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

interface ReverseOptions {
  amount?: string
  remarks?: string
  debug?: boolean
  format: string
}

export const reverseCommand = new Command('reverse')
  .description('Reverse a completed M-Pesa transaction')
  .argument('<transactionId>', 'The M-Pesa transaction ID to reverse')
  .option('--amount <amount>', 'Amount to reverse in KES')
  .option('--remarks <remarks>', 'Reason for reversal')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(async (transactionId: string, opts: ReverseOptions) => {
    const config = requireConfig()

    const amountRaw = opts.amount
      ? parseInt(opts.amount, 10)
      : ((await number({ message: 'Amount to reverse (KES):' })) ?? 0)

    warn('Transaction reversals are irreversible. Proceed with caution.')

    const confirmed = await confirm({
      message: `Reverse transaction ${transactionId} for KES ${amountRaw}?`,
      default: false,
    })

    if (!confirmed) {
      process.stdout.write('Cancelled.\n')
      return
    }

    const client = new DarajaClient(config, {
      ...(opts.debug ? { debug: true } : {}),
    })
    const spinner = ora('Submitting reversal request...').start()

    try {
      const response = await reverseTransaction(client, config, {
        transactionId,
        amount: amountRaw,
        ...(opts.remarks ? { remarks: opts.remarks } : {}),
      })

      spinner.stop()

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(response, null, 2) + '\n')
        return
      }

      success('Reversal request accepted — result will be sent to your callback URL')
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
