import { Command } from 'commander'
import { input, number } from '@inquirer/prompts'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { c2bRegister, c2bSimulate } from '../../api/c2b.js'
import { success, error, warn, printKeyValue } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

export const c2bCommand = new Command('c2b')
  .description('Customer-to-Business (C2B) commands')

c2bCommand
  .command('register')
  .description('Register validation and confirmation URLs for C2B payments')
  .option('--validation-url <url>', 'URL to validate incoming payments')
  .option('--confirmation-url <url>', 'URL to confirm completed payments')
  .option(
    '--response-type <type>',
    'Response type on validation failure: Completed | Cancelled',
    'Completed',
  )
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(
    async (opts: {
      validationUrl?: string
      confirmationUrl?: string
      responseType?: string
      debug?: boolean
      format: string
    }) => {
      const config = requireConfig()

      const validationUrl =
        opts.validationUrl ??
        config.validationUrl ??
        (await input({ message: 'Validation URL:' }))

      const confirmationUrl =
        opts.confirmationUrl ??
        config.confirmationUrl ??
        (await input({ message: 'Confirmation URL:' }))

      const client = new DarajaClient(config, {
        ...(opts.debug ? { debug: true } : {}),
      })
      const spinner = ora('Registering C2B URLs...').start()

      try {
        const response = await c2bRegister(client, config, {
          validationUrl,
          confirmationUrl,
          responseType: (opts.responseType as 'Completed' | 'Cancelled') ?? 'Completed',
        })

        spinner.stop()

        if (opts.format === 'json') {
          process.stdout.write(JSON.stringify(response, null, 2) + '\n')
          return
        }

        success('C2B URLs registered successfully')
        printKeyValue({
          ResponseCode: response.ResponseCode,
          ResponseDescription: response.ResponseDescription,
          OriginatorConversationID: response.OriginatorCoversationID,
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
    },
  )

c2bCommand
  .command('simulate')
  .description('Simulate a C2B payment (sandbox only)')
  .option('--phone <phone>', 'Customer phone number')
  .option('--amount <amount>', 'Amount in KES')
  .option('--bill-ref <ref>', 'Bill reference number')
  .option(
    '--command-id <id>',
    'Command ID: CustomerPayBillOnline | CustomerBuyGoodsOnline',
    'CustomerPayBillOnline',
  )
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(
    async (opts: {
      phone?: string
      amount?: string
      billRef?: string
      commandId: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline'
      debug?: boolean
      format: string
    }) => {
      const config = requireConfig()

      if (config.environment !== 'sandbox') {
        warn('C2B simulate is only available in the sandbox environment.')
        process.exit(1)
      }

      const phone = opts.phone ?? (await input({ message: 'Customer phone number:' }))
      const amountRaw = opts.amount
        ? parseInt(opts.amount, 10)
        : ((await number({ message: 'Amount (KES):' })) ?? 0)
      const billRefNumber =
        opts.billRef ?? (await input({ message: 'Bill reference number:' }))

      const client = new DarajaClient(config, {
        ...(opts.debug ? { debug: true } : {}),
      })
      const spinner = ora('Simulating C2B payment...').start()

      try {
        const response = await c2bSimulate(client, config, {
          phone,
          amount: amountRaw,
          billRefNumber,
          commandId: opts.commandId,
        })

        spinner.stop()

        if (opts.format === 'json') {
          process.stdout.write(JSON.stringify(response, null, 2) + '\n')
          return
        }

        success('C2B payment simulated successfully')
        printKeyValue({
          ConversationID: response.ConversationID,
          OriginatorConversationID: response.OriginatorCoversationID,
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
    },
  )
