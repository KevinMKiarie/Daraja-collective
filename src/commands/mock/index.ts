import { Command } from 'commander'
import { createServer } from 'http'
import type { IncomingMessage, ServerResponse } from 'http'
import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

// ─── Fake data generators ─────────────────────────────────────────────────────

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function mpesaReceipt(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits  = '0123456789'
  let receipt = ''
  for (let i = 0; i < 3; i++) receipt += letters[Math.floor(Math.random() * letters.length)]
  for (let i = 0; i < 7; i++) receipt += digits[Math.floor(Math.random() * digits.length)]
  return receipt
}

function darjatimestamp(): string {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
}

// ─── Response helpers ─────────────────────────────────────────────────────────

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body, null, 2)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(payload)
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk: Buffer) => { raw += chunk.toString() })
    req.on('end', () => {
      try { resolve(JSON.parse(raw) as Record<string, unknown>) }
      catch { resolve({}) }
    })
  })
}

// ─── Mock endpoint handlers ───────────────────────────────────────────────────

type MockHandler = (body: Record<string, unknown>) => unknown

const MOCK_ROUTES: Record<string, MockHandler> = {
  // OAuth token
  'POST /oauth/v1/generate': () => ({
    access_token:  'mock_access_token_' + Math.random().toString(36).slice(2),
    expires_in:    '3599',
    token_type:    'Bearer',
  }),

  // STK Push
  'POST /mpesa/stkpush/v1/processrequest': (body) => ({
    MerchantRequestID:  randomId('MR'),
    CheckoutRequestID:  randomId('ws_CO'),
    ResponseCode:       '0',
    ResponseDescription: 'Success. Request accepted for processing',
    CustomerMessage:    `Dear ${String(body['PhoneNumber'] ?? 'customer')}, please enter your M-PESA PIN to complete the transaction.`,
  }),

  // STK Push query
  'POST /mpesa/stkpushquery/v1/query': () => ({
    ResponseCode:        '0',
    ResponseDescription: 'The service request has been accepted successfully',
    MerchantRequestID:   randomId('MR'),
    CheckoutRequestID:   randomId('ws_CO'),
    ResultCode:          '0',
    ResultDesc:          'The service request is processed successfully.',
  }),

  // C2B register
  'POST /mpesa/c2b/v1/registerurl': () => ({
    OriginatorCoversationID: randomId('AG'),
    ResponseCode:            '0',
    ResponseDescription:     'success',
  }),

  // C2B simulate
  'POST /mpesa/c2b/v1/simulate': (body) => ({
    OriginatorCoversationID: randomId('AG'),
    ConversationID:          randomId('AG'),
    ResponseDescription:     `Accept the service request successfully. Amount: ${String(body['Amount'] ?? 0)}`,
  }),

  // B2C
  'POST /mpesa/b2c/v1/paymentrequest': () => ({
    ConversationID:          randomId('AG'),
    OriginatorConversationID: randomId('AG'),
    ResponseCode:            '0',
    ResponseDescription:     'Accept the service request successfully.',
  }),

  // B2B
  'POST /mpesa/b2b/v1/paymentrequest': () => ({
    ConversationID:          randomId('AG'),
    OriginatorConversationID: randomId('AG'),
    ResponseCode:            '0',
    ResponseDescription:     'Accept the service request successfully.',
  }),

  // Account balance
  'POST /mpesa/accountbalance/v1/query': () => ({
    ConversationID:          randomId('AG'),
    OriginatorConversationID: randomId('AG'),
    ResponseCode:            '0',
    ResponseDescription:     'Accept the service request successfully.',
  }),

  // Transaction status
  'POST /mpesa/transactionstatus/v1/query': () => ({
    ConversationID:          randomId('AG'),
    OriginatorConversationID: randomId('AG'),
    ResponseCode:            '0',
    ResponseDescription:     'Accept the service request successfully.',
  }),

  // Reversal
  'POST /mpesa/reversal/v1/request': () => ({
    ConversationID:          randomId('AG'),
    OriginatorConversationID: randomId('AG'),
    ResponseCode:            '0',
    ResponseDescription:     'Accept the service request successfully.',
  }),

  // QR code
  'POST /mpesa/qrcode/v1/generate': () => ({
    ResponseCode:        '00',
    ResponseDescription: 'The service request is processed successfully.',
    QRCode:              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  }),

  // Standing order
  'POST /mpesa/standing-order/v1/create': () => ({
    ResponseCode:        '0',
    ResponseDescription: 'Success',
    MerchantRequestID:   randomId('MR'),
  }),

  // Tax remittance
  'POST /mpesa/b2b/v1/remittax': () => ({
    ConversationID:          randomId('AG'),
    OriginatorConversationID: randomId('AG'),
    ResponseCode:            '0',
    ResponseDescription:     'Accept the service request successfully.',
  }),

  // Bill manager opt-in
  'POST /v1/billmanager-invoice/optin': () => ({
    app_key:   randomId('BM'),
    rescode:   '200',
    resmsg:    'Shortcode registered successfully',
    timestamp: darjatimestamp(),
  }),

  // Bill manager single invoice
  'POST /v1/billmanager-invoice/single-invoicing': () => ({
    rescode: '200',
    resmsg:  'Invoice sent successfully',
  }),

  // Bill manager reconciliation
  'POST /v1/billmanager-invoice/reconciliation': () => ({
    rescode: '200',
    resmsg:  'Reconciliation done successfully',
  }),
}

// Simulate a realistic STK Push callback payload (for webhook testing)
function makeStkCallback(phone: string, amount: number, checkoutId: string): unknown {
  return {
    Body: {
      stkCallback: {
        MerchantRequestID:  randomId('MR'),
        CheckoutRequestID:  checkoutId,
        ResultCode:         0,
        ResultDesc:         'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount',              Value: amount },
            { Name: 'MpesaReceiptNumber',  Value: mpesaReceipt() },
            { Name: 'TransactionDate',     Value: parseInt(darjatimestamp()) },
            { Name: 'PhoneNumber',         Value: phone },
          ],
        },
      },
    },
  }
}

// ─── Startup banner ───────────────────────────────────────────────────────────

function printBanner(port: number, shortcode: string): void {
  process.stdout.write('\n')
  process.stdout.write(chalk.bold('  daraja mock') + chalk.dim(' — fake Safaricom API server\n'))
  process.stdout.write('\n')
  process.stdout.write(`  ${chalk.green('●')} Listening on ${chalk.cyan(`http://localhost:${port}`)}\n`)
  process.stdout.write(`  ${chalk.dim('Shortcode:')} ${shortcode}\n`)
  process.stdout.write('\n')
  process.stdout.write(chalk.underline('  Mocked endpoints') + '\n\n')

  const routes = Object.keys(MOCK_ROUTES)
  for (const route of routes) {
    const [method, path] = route.split(' ')
    const methodCol = method === 'GET'
      ? chalk.cyan((method ?? '').padEnd(5))
      : chalk.magenta((method ?? '').padEnd(5))
    process.stdout.write(`  ${methodCol} ${chalk.dim(path)}\n`)
  }

  process.stdout.write('\n')
  process.stdout.write(
    chalk.dim('  Special: GET /mock/stk-callback?phone=254712345678&amount=100&checkoutId=ws_CO_001\n'),
  )
  process.stdout.write(
    chalk.dim('           Returns a realistic STK Push callback payload for webhook testing.\n'),
  )
  process.stdout.write('\n')
  process.stdout.write(chalk.dim('  All credentials are ignored — every request returns a success response.\n'))
  process.stdout.write(chalk.dim('  Press Ctrl+C to stop.\n\n'))
}

// ─── Command ─────────────────────────────────────────────────────────────────

export const mockCommand = new Command('mock')
  .description('Start a fake Safaricom API server for testing without real credentials')
  .option('--port <port>',      'Port to listen on', '4010')
  .option('--shortcode <code>', 'Fake shortcode to report in responses', '174379')
  .option('--init',             'Write a .daraja.json pointing at the mock server after starting')
  .option('--delay <ms>',       'Add artificial latency to responses in milliseconds', '0')
  .action((opts: { port: string; shortcode: string; init?: boolean; delay: string }) => {
    const port      = parseInt(opts.port, 10)
    const shortcode = opts.shortcode
    const delay     = parseInt(opts.delay, 10)

    if (opts.init) {
      const configPath = join(process.cwd(), '.daraja.json')
      const mockConfig = {
        environment:    'sandbox',
        consumerKey:    'mock_consumer_key',
        consumerSecret: 'mock_consumer_secret',
        shortcode,
        passkey:        'mock_passkey_bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
        callbackUrl:    `http://localhost:${port}/mock/callback`,
      }

      if (existsSync(configPath)) {
        process.stdout.write(
          chalk.yellow(`\n  ⚠  ${configPath} already exists — skipping --init to avoid overwriting.\n`),
        )
        process.stdout.write(
          chalk.dim(`     Delete it first or set DARAJA_* env vars to use mock credentials.\n\n`),
        )
      } else {
        writeFileSync(configPath, JSON.stringify(mockConfig, null, 2) + '\n', 'utf-8')
        process.stdout.write(chalk.green(`\n  ✓ Wrote mock .daraja.json with fake credentials\n`))
      }
    }

    const server = createServer((req: IncomingMessage, res: ServerResponse): void => {
      void (async (): Promise<void> => {
      const url    = new URL(req.url ?? '/', `http://localhost:${port}`)
      const method = (req.method ?? 'GET').toUpperCase()
      const path   = url.pathname

      // CORS preflight
      if (method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        })
        res.end()
        return
      }

      const body = await readBody(req)

      // Special: return a realistic STK Push callback payload
      if (method === 'GET' && path === '/mock/stk-callback') {
        const phone      = url.searchParams.get('phone')      ?? '254712345678'
        const amount     = parseInt(url.searchParams.get('amount') ?? '100', 10)
        const checkoutId = url.searchParams.get('checkoutId') ?? randomId('ws_CO')
        send(res, 200, makeStkCallback(phone, amount, checkoutId))
        process.stdout.write(chalk.dim(`  [mock] GET  /mock/stk-callback → STK Push callback payload\n`))
        return
      }

      const routeKey = `${method} ${path}`
      const handler  = MOCK_ROUTES[routeKey]

      if (!handler) {
        send(res, 404, { errorCode: 'NOT_FOUND', errorMessage: `No mock for ${method} ${path}` })
        process.stdout.write(chalk.yellow(`  [mock] ${method.padEnd(4)} ${path} → 404 not mocked\n`))
        return
      }

      const responseBody = handler(body)
      const label = method === 'POST' ? chalk.magenta('POST') : chalk.cyan('GET ')

      if (delay > 0) {
        await new Promise<void>((r) => setTimeout(r, delay))
      }

      send(res, 200, responseBody)
      process.stdout.write(chalk.dim(`  [mock] ${label} ${path} → 200\n`))
      })()
    })

    server.listen(port, '127.0.0.1', () => {
      printBanner(port, shortcode)
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        process.stderr.write(chalk.red(`Port ${port} is already in use. Try --port ${port + 1}\n`))
      } else {
        process.stderr.write(chalk.red(`Server error: ${err.message}\n`))
      }
      process.exit(1)
    })

    process.on('SIGINT', () => {
      process.stdout.write('\n' + chalk.dim('Shutting down daraja mock...\n'))
      server.close(() => process.exit(0))
    })
  })
