import { Command } from 'commander'
import { input, number } from '@inquirer/prompts'
import ora from 'ora'
import { requireConfig } from '../../config/index.js'
import { DarajaClient } from '../../api/client.js'
import { generateQR } from '../../api/qr.js'
import type { QRTransactionCode } from '../../api/qr.js'
import { success, error, printKeyValue } from '../../output/index.js'
import { DarajaError } from '../../errors/index.js'

interface QRGenerateOptions {
  merchantName?: string
  ref?: string
  amount?: string
  trxCode: QRTransactionCode
  cpi?: string
  size: string
  debug?: boolean
  format: string
}

export const qrCommand = new Command('qr')
  .description('QR code generation commands')

qrCommand
  .command('generate')
  .description('Generate an M-Pesa QR code for payments')
  .option('--merchant-name <name>', 'Merchant name displayed on the QR code')
  .option('--ref <ref>', 'Transaction reference number')
  .option('--amount <amount>', 'Amount in KES')
  .option(
    '--trx-code <code>',
    'Transaction type: BG (Buy Goods) | WA (Withdrawal Agent) | PB (PayBill) | SM (Send Money) | SB (Send to Business)',
    'PB',
  )
  .option('--cpi <cpi>', 'Credit Party Identifier (till number, paybill, or phone)')
  .option('--size <size>', 'QR code image size in pixels', '300')
  .option('--debug', 'Show full Daraja request and response')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(async (opts: QRGenerateOptions) => {
    const config = requireConfig()

    const merchantName =
      opts.merchantName ?? (await input({ message: 'Merchant name:' }))
    const ref = opts.ref ?? (await input({ message: 'Transaction reference:' }))
    const amountRaw = opts.amount
      ? parseInt(opts.amount, 10)
      : ((await number({ message: 'Amount (KES):' })) ?? 0)
    const cpi =
      opts.cpi ?? (await input({ message: 'Credit Party Identifier (till/paybill/phone):' }))

    const client = new DarajaClient(config, {
      ...(opts.debug ? { debug: true } : {}),
    })
    const spinner = ora('Generating QR code...').start()

    try {
      const response = await generateQR(client, {
        merchantName,
        refNo: ref,
        amount: amountRaw,
        trxCode: opts.trxCode,
        cpi,
        size: parseInt(opts.size, 10),
      })

      spinner.stop()

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(response, null, 2) + '\n')
        return
      }

      success('QR code generated successfully')
      printKeyValue({
        ResponseCode: response.ResponseCode,
        ResponseDescription: response.ResponseDescription,
      })
      process.stdout.write('\nQR Code (base64):\n')
      process.stdout.write(response.QRCode + '\n')
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
