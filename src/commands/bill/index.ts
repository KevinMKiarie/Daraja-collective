import { Command } from 'commander'
import { input, number } from '@inquirer/prompts'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { billOptin, sendInvoice, reconcileInvoice } from '../../api/bill.js'
import { success, error, printKeyValue } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

export const billCommand = new Command('bill')
  .description('Bill Manager commands — invoicing and reconciliation')

billCommand
  .command('optin')
  .description('Opt in to M-Pesa Bill Manager')
  .option('--email <email>', 'Contact email for the shortcode')
  .option('--logo <url>', 'Logo URL to display on invoices')
  .option('--callback-url <url>', 'Override the callback URL from config')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(
    async (opts: {
      email?: string
      logo?: string
      callbackUrl?: string
      debug?: boolean
      format: string
    }) => {
      const config = requireConfig()

      const client = new DarajaClient(config, {
        ...(opts.debug ? { debug: true } : {}),
      })
      const spinner = ora('Opting in to Bill Manager...').start()

      try {
        const response = await billOptin(client, config, {
          ...(opts.email ? { email: opts.email } : {}),
          ...(opts.logo ? { logo: opts.logo } : {}),
          ...(opts.callbackUrl ? { callbackUrl: opts.callbackUrl } : {}),
        })

        spinner.stop()

        if (opts.format === 'json') {
          process.stdout.write(JSON.stringify(response, null, 2) + '\n')
          return
        }

        success('Successfully opted in to Bill Manager')
        printKeyValue({
          rescode: response.rescode,
          resmsg: response.resmsg,
          app_key: response.app_key,
          timestamp: response.timestamp,
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

const invoiceCommand = new Command('invoice')
  .description('Invoice management commands')

invoiceCommand
  .command('send')
  .description('Send a Bill Manager invoice to a customer')
  .option('--reference <ref>', 'External reference for the invoice')
  .option('--billed-to <name>', 'Full name of the billed customer')
  .option('--phone <phone>', 'Customer phone number')
  .option('--amount <amount>', 'Billed amount in KES')
  .option('--due-date <date>', 'Invoice due date (YYYY-MM-DD)')
  .option('--account-reference <ref>', 'Account or invoice reference name')
  .option('--notes <notes>', 'Additional notes on the invoice')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(
    async (opts: {
      reference?: string
      billedTo?: string
      phone?: string
      amount?: string
      dueDate?: string
      accountReference?: string
      notes?: string
      debug?: boolean
      format: string
    }) => {
      const config = requireConfig()

      const reference = opts.reference ?? (await input({ message: 'Invoice external reference:' }))
      const billedTo = opts.billedTo ?? (await input({ message: 'Customer full name:' }))
      const phone = opts.phone ?? (await input({ message: 'Customer phone number:' }))
      const amountRaw = opts.amount
        ? parseInt(opts.amount, 10)
        : ((await number({ message: 'Billed amount (KES):' })) ?? 0)
      const dueDate =
        opts.dueDate ?? (await input({ message: 'Due date (YYYY-MM-DD):' }))
      const accountReference =
        opts.accountReference ?? (await input({ message: 'Account reference / invoice name:' }))

      const client = new DarajaClient(config, {
        ...(opts.debug ? { debug: true } : {}),
      })
      const spinner = ora('Sending invoice...').start()

      try {
        const response = await sendInvoice(client, config, {
          reference,
          billedTo,
          phone,
          billedAmount: amountRaw,
          dueDate,
          accountReference,
          ...(opts.notes ? { notes: opts.notes } : {}),
        })

        spinner.stop()

        if (opts.format === 'json') {
          process.stdout.write(JSON.stringify(response, null, 2) + '\n')
          return
        }

        success('Invoice sent successfully')
        printKeyValue({
          rescode: response.rescode,
          resmsg: response.resmsg,
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

billCommand.addCommand(invoiceCommand)

billCommand
  .command('reconcile')
  .description('Reconcile a Bill Manager invoice with a completed payment')
  .option('--payment-date <date>', 'Date payment was made (YYYY-MM-DD HH:MM:SS)')
  .option('--paid-amount <amount>', 'Amount paid in KES')
  .option('--account-reference <ref>', 'Account reference on the invoice')
  .option('--transaction-id <id>', 'M-Pesa transaction ID')
  .option('--phone <phone>', 'Payer phone number')
  .option('--full-name <name>', 'Payer full name')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(
    async (opts: {
      paymentDate?: string
      paidAmount?: string
      accountReference?: string
      transactionId?: string
      phone?: string
      fullName?: string
      debug?: boolean
      format: string
    }) => {
      const config = requireConfig()

      const paymentDate =
        opts.paymentDate ?? (await input({ message: 'Payment date (YYYY-MM-DD HH:MM:SS):' }))
      const paidAmount = opts.paidAmount
        ? parseInt(opts.paidAmount, 10)
        : ((await number({ message: 'Paid amount (KES):' })) ?? 0)
      const accountReference =
        opts.accountReference ?? (await input({ message: 'Account reference:' }))
      const transactionId =
        opts.transactionId ?? (await input({ message: 'M-Pesa transaction ID:' }))
      const phone = opts.phone ?? (await input({ message: 'Payer phone number:' }))
      const fullName = opts.fullName ?? (await input({ message: 'Payer full name:' }))

      const client = new DarajaClient(config, {
        ...(opts.debug ? { debug: true } : {}),
      })
      const spinner = ora('Reconciling invoice...').start()

      try {
        const response = await reconcileInvoice(client, config, {
          paymentDate,
          paidAmount,
          accountReference,
          transactionId,
          phoneNumber: phone,
          fullName,
        })

        spinner.stop()

        if (opts.format === 'json') {
          process.stdout.write(JSON.stringify(response, null, 2) + '\n')
          return
        }

        success('Invoice reconciled successfully')
        printKeyValue({
          rescode: response.rescode,
          resmsg: response.resmsg,
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
