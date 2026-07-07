import { Command } from 'commander'
import { input, number } from '@inquirer/prompts'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { b2cPay } from '../../api/b2c.js'
import type { B2CCommandId } from '../../api/b2c.js'
import { success, error, printKeyValue } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

interface B2CPayOptions {
  phone?: string
  amount?: string
  commandId: B2CCommandId
  remarks?: string
  debug?: boolean
  format: string
}

export const b2cCommand = new Command('b2c')
  .description('Business-to-Customer (B2C) payment commands')

b2cCommand
  .command('pay')
  .description('Send money from business to a customer')
  .option('--phone <phone>', 'Recipient phone number')
  .option('--amount <amount>', 'Amount in KES')
  .option(
    '--command-id <id>',
    'Payment type: SalaryPayment | BusinessPayment | PromotionPayment',
    'BusinessPayment',
  )
  .option('--remarks <remarks>', 'Transaction remarks')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(async (opts: B2CPayOptions) => {
    const config = requireConfig()

    const phone = opts.phone ?? (await input({ message: 'Recipient phone number:' }))
    const amountRaw = opts.amount
      ? parseInt(opts.amount, 10)
      : ((await number({ message: 'Amount (KES):' })) ?? 0)

    const client = new DarajaClient(config, {
      ...(opts.debug ? { debug: true } : {}),
    })
    const spinner = ora('Sending B2C payment...').start()

    try {
      const response = await b2cPay(client, config, {
        phone,
        amount: amountRaw,
        commandId: opts.commandId,
        ...(opts.remarks ? { remarks: opts.remarks } : {}),
      })

      spinner.stop()

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(response, null, 2) + '\n')
        return
      }

      success('B2C payment request accepted')
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
