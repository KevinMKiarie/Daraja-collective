import { Command } from 'commander'
import { input, number, confirm } from '@inquirer/prompts'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { stkPush } from '../../api/stk.js'
import { success, error, printKeyValue } from '../../output/index.js'
import { formatAmount } from '../../crypto/index.js'
import { DarajaError } from '../../errors/index.js'

interface PushOptions {
  phone?: string
  amount?: string
  ref?: string
  description?: string
  callbackUrl?: string
  debug?: boolean
  dryRun?: boolean
  format?: string
}

export const stkPushCommand = new Command('push')
  .description('Trigger an STK Push payment prompt on a customer\'s phone')
  .option('--phone <phone>', 'Customer phone number (0712345678 or 254712345678)')
  .option('--amount <amount>', 'Amount in KES (whole shillings)')
  .option('--ref <ref>', 'Account reference (shown on customer receipt)')
  .option('--description <desc>', 'Transaction description')
  .option('--callback-url <url>', 'Override the callback URL from config')
  .option('--debug', 'Show full Daraja request and response')
  .option('--dry-run', 'Print the payload without sending')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(async (opts: PushOptions) => {
    const config = requireConfig()

    if (!config.passkey) {
      error(
        'passkey is required for STK Push.',
        'Add DARAJA_PASSKEY to your .env or run `daraja init`',
      )
      process.exit(1)
    }

    // Prompt for any missing required fields interactively
    const phone = opts.phone ?? (await input({ message: 'Customer phone number:' }))
    const amountRaw = opts.amount
      ? parseInt(opts.amount, 10)
      : ((await number({ message: 'Amount (KES):' })) ?? 0)
    const ref = opts.ref ?? (await input({ message: 'Account reference:' }))
    const description =
      opts.description ?? (await input({ message: 'Transaction description:', default: 'Payment' }))

    if (!opts.dryRun) {
      const confirmed = await confirm({
        message: `Send STK Push of ${formatAmount(amountRaw)} to ${phone}?`,
        default: true,
      })
      if (!confirmed) {
        process.stdout.write('Cancelled.\n')
        return
      }
    }

    const client = new DarajaClient(config, {
      ...(opts.debug ? { debug: true } : {}),
      ...(opts.dryRun ? { dryRun: true } : {}),
    })

    const spinner = ora('Sending STK Push...').start()

    try {
      const response = await stkPush(client, config, {
        phone,
        amount: amountRaw,
        reference: ref,
        description,
        ...(opts.callbackUrl ? { callbackUrl: opts.callbackUrl } : {}),
      })

      spinner.stop()

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(response, null, 2) + '\n')
        return
      }

      success('STK Push sent — customer will receive a payment prompt')
      printKeyValue({
        CheckoutRequestID: response.CheckoutRequestID,
        MerchantRequestID: response.MerchantRequestID,
        CustomerMessage: response.CustomerMessage,
      })
      process.stdout.write(
        '\nUse `daraja stk query ' + response.CheckoutRequestID + '` to check the result.\n',
      )
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
