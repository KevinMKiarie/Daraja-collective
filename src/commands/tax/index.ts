import { Command } from 'commander'
import { input, number } from '@inquirer/prompts'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { remitTax } from '../../api/tax.js'
import { success, error, warn, printKeyValue } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

export const taxCommand = new Command('tax')
  .description('KRA tax remittance commands')

taxCommand
  .command('remit')
  .description('Remit tax to KRA via M-Pesa (PayTaxToKRA)')
  .option('--amount <amount>', 'Tax amount in KES')
  .option('--account-reference <ref>', 'KRA payment reference / PRN')
  .option('--remarks <remarks>', 'Transaction remarks')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(
    async (opts: {
      amount?: string
      accountReference?: string
      remarks?: string
      debug?: boolean
      format: string
    }) => {
      const config = requireConfig()

      warn('Tax remittances are irreversible. Ensure the amount and KRA reference are correct.')

      const amountRaw = opts.amount
        ? parseInt(opts.amount, 10)
        : ((await number({ message: 'Tax amount (KES):' })) ?? 0)
      const accountReference =
        opts.accountReference ?? (await input({ message: 'KRA payment reference / PRN:' }))

      const client = new DarajaClient(config, {
        ...(opts.debug ? { debug: true } : {}),
      })
      const spinner = ora('Remitting tax to KRA...').start()

      try {
        const response = await remitTax(client, config, {
          amount: amountRaw,
          accountReference,
          ...(opts.remarks ? { remarks: opts.remarks } : {}),
        })

        spinner.stop()

        if (opts.format === 'json') {
          process.stdout.write(JSON.stringify(response, null, 2) + '\n')
          return
        }

        success('Tax remittance request accepted — result will be sent to your callback URL')
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
    },
  )
