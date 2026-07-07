import { Command } from 'commander'
import { input, number } from '@inquirer/prompts'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { b2bPay } from '../../api/b2b.js'
import type { B2BCommandId } from '../../api/b2b.js'
import { success, error, printKeyValue } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

interface B2BPayOptions {
  receiverShortcode?: string
  amount?: string
  commandId: B2BCommandId
  accountReference?: string
  remarks?: string
  debug?: boolean
  format: string
}

export const b2bCommand = new Command('b2b')
  .description('Business-to-Business (B2B) payment commands')

b2bCommand
  .command('pay')
  .description('Send money from your business to another business shortcode')
  .option('--receiver-shortcode <shortcode>', 'Recipient business shortcode')
  .option('--amount <amount>', 'Amount in KES')
  .option(
    '--command-id <id>',
    'Payment type: BusinessPayBill | MerchantToMerchantTransfer | MerchantTransferFromMerchantToWorking | MerchantServicesMMFAccountTransfer | AgencyFloatAdvance',
    'BusinessPayBill',
  )
  .option('--account-reference <ref>', 'Account reference for the receiver')
  .option('--remarks <remarks>', 'Transaction remarks')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(async (opts: B2BPayOptions) => {
    const config = requireConfig()

    const receiverShortcode =
      opts.receiverShortcode ?? (await input({ message: 'Receiver business shortcode:' }))
    const amountRaw = opts.amount
      ? parseInt(opts.amount, 10)
      : ((await number({ message: 'Amount (KES):' })) ?? 0)

    const client = new DarajaClient(config, {
      ...(opts.debug ? { debug: true } : {}),
    })
    const spinner = ora('Sending B2B payment...').start()

    try {
      const response = await b2bPay(client, config, {
        receiverShortcode,
        amount: amountRaw,
        commandId: opts.commandId,
        ...(opts.accountReference ? { accountReference: opts.accountReference } : {}),
        ...(opts.remarks ? { remarks: opts.remarks } : {}),
      })

      spinner.stop()

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(response, null, 2) + '\n')
        return
      }

      success('B2B payment request accepted')
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
