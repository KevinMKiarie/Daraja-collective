import { Command } from 'commander'
import { input, number, select } from '@inquirer/prompts'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { createStandingOrder } from '../../api/ratiba.js'
import type { RatibaFrequency } from '../../api/ratiba.js'
import { success, error, printKeyValue } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

export const ratibaCommand = new Command('ratiba')
  .description('Standing order (Ratiba) commands')

ratibaCommand
  .command('create')
  .description('Create a standing order for recurring M-Pesa payments')
  .option('--phone <phone>', 'Customer phone number')
  .option('--amount <amount>', 'Amount in KES per cycle')
  .option('--start-date <date>', 'Start date (YYYYMMDD)')
  .option('--end-date <date>', 'End date (YYYYMMDD)')
  .option('--frequency <freq>', 'Frequency: Daily | Weekly | Monthly')
  .option('--reference <ref>', 'Standing order name / account reference')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(
    async (opts: {
      phone?: string
      amount?: string
      startDate?: string
      endDate?: string
      frequency?: RatibaFrequency
      reference?: string
      debug?: boolean
      format: string
    }) => {
      const config = requireConfig()

      const phone = opts.phone ?? (await input({ message: 'Customer phone number:' }))
      const amountRaw = opts.amount
        ? parseInt(opts.amount, 10)
        : ((await number({ message: 'Amount per cycle (KES):' })) ?? 0)
      const startDate =
        opts.startDate ?? (await input({ message: 'Start date (YYYYMMDD):' }))
      const endDate =
        opts.endDate ?? (await input({ message: 'End date (YYYYMMDD):' }))
      const frequency: RatibaFrequency =
        opts.frequency ??
        (await select({
          message: 'Frequency:',
          choices: [
            { value: 'Daily' as const },
            { value: 'Weekly' as const },
            { value: 'Monthly' as const },
          ],
        }))
      const reference =
        opts.reference ?? (await input({ message: 'Standing order name / account reference:' }))

      const client = new DarajaClient(config, {
        ...(opts.debug ? { debug: true } : {}),
      })
      const spinner = ora('Creating standing order...').start()

      try {
        const response = await createStandingOrder(client, config, {
          phone,
          amount: amountRaw,
          startDate,
          endDate,
          frequency,
          accountReference: reference,
        })

        spinner.stop()

        if (opts.format === 'json') {
          process.stdout.write(JSON.stringify(response, null, 2) + '\n')
          return
        }

        success('Standing order created successfully')
        printKeyValue({
          MerchantRequestID: response.MerchantRequestID,
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
