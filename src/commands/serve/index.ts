import { Command } from 'commander'
import { createServer } from 'http'
import type { IncomingMessage, ServerResponse } from 'http'
import chalk from 'chalk'
import { loadConfig } from '../../config/index.js'
import { configSchema } from '../../config/schema.js'
import { DarajaClient } from '../../api/client.js'
import { stkPush, stkQuery } from '../../api/stk.js'
import { c2bRegister, c2bSimulate } from '../../api/c2b.js'
import { b2cPay } from '../../api/b2c.js'
import { b2bPay } from '../../api/b2b.js'
import { queryAccountBalance } from '../../api/balance.js'
import { queryTransactionStatus } from '../../api/status.js'
import { reverseTransaction } from '../../api/reversal.js'
import { generateQR } from '../../api/qr.js'
import { billOptin, sendInvoice, reconcileInvoice } from '../../api/bill.js'
import { createStandingOrder } from '../../api/ratiba.js'
import { remitTax } from '../../api/tax.js'
import { DarajaError, ValidationError } from '../../errors/index.js'
import type { DarajaConfig } from '../../config/schema.js'

// ─── Types ───────────────────────────────────────────────────────────────────

type RouteHandler = (
  body: Record<string, unknown>,
  params: Record<string, string>,
  client: DarajaClient,
  config: DarajaConfig,
) => Promise<unknown>

interface Route {
  method: string
  pattern: RegExp
  paramNames: string[]
  handler: RouteHandler
}

// ─── Body parser ─────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk: Buffer) => { raw += chunk.toString() })
    req.on('end', () => {
      if (!raw.trim()) { resolve({}); return }
      try { resolve(JSON.parse(raw) as Record<string, unknown>) }
      catch { resolve({}) }
    })
  })
}

// ─── Response helpers ─────────────────────────────────────────────────────────

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body, null, 2)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
  res.end(payload)
}

function ok(res: ServerResponse, data: unknown): void {
  send(res, 200, { ok: true, data })
}

function fail(res: ServerResponse, status: number, message: string, hint?: string): void {
  send(res, status, { ok: false, error: message, ...(hint ? { hint } : {}) })
}

// ─── Route builder ───────────────────────────────────────────────────────────

function route(method: string, path: string, handler: RouteHandler): Route {
  const paramNames: string[] = []
  const pattern = new RegExp(
    '^' + path.replace(/:([a-zA-Z]+)/g, (_, name) => { paramNames.push(name); return '([^/]+)' }) + '$',
  )
  return { method: method.toUpperCase(), pattern, paramNames, handler }
}

// ─── Route definitions ───────────────────────────────────────────────────────

function buildRoutes(): Route[] {
  return [
    // Health
    route('GET', '/health', async (_b, _p, _c, config) => ({
      status: 'ok',
      environment: config.environment,
      shortcode: config.shortcode,
      features: {
        stk:      !!config.passkey,
        b2c:      !!(config.initiatorName && config.initiatorPassword),
        b2b:      !!(config.initiatorName && config.initiatorPassword),
        balance:  !!(config.initiatorName && config.initiatorPassword),
        reversal: !!(config.initiatorName && config.initiatorPassword),
        c2b:      true,
        qr:       true,
      },
    })),

    // STK Push
    route('POST', '/stk/push', async (body, _p, client, config) => {
      const phone       = body['phone'] as string
      const amount      = Number(body['amount'])
      const reference   = (body['reference'] as string) ?? 'Payment'
      const description = (body['description'] as string) ?? 'Payment'
      const callbackUrl = body['callbackUrl'] as string | undefined

      if (!phone)  throw new ValidationError('phone is required')
      if (!amount) throw new ValidationError('amount is required and must be a positive number')

      return stkPush(client, config, { phone, amount, reference, description, ...(callbackUrl ? { callbackUrl } : {}) })
    }),

    // STK Query
    route('POST', '/stk/query', async (body, _p, client, config) => {
      const checkoutRequestId = body['checkoutRequestId'] as string
      if (!checkoutRequestId) throw new ValidationError('checkoutRequestId is required')
      return stkQuery(client, config, { checkoutRequestId })
    }),

    // C2B Register
    route('POST', '/c2b/register', async (body, _p, client, config) => {
      const validationUrl   = body['validationUrl'] as string | undefined
      const confirmationUrl = body['confirmationUrl'] as string | undefined
      return c2bRegister(client, config, {
        ...(validationUrl   ? { validationUrl }   : {}),
        ...(confirmationUrl ? { confirmationUrl } : {}),
        responseType: (body['responseType'] as 'Completed' | 'Cancelled') ?? 'Completed',
      })
    }),

    // C2B Simulate (sandbox)
    route('POST', '/c2b/simulate', async (body, _p, client, config) => {
      if (config.environment !== 'sandbox') {
        throw new ValidationError('C2B simulate is only available in sandbox environment')
      }
      const phone         = body['phone'] as string
      const amount        = Number(body['amount'])
      const billRefNumber = (body['billRefNumber'] as string) ?? '00000'
      if (!phone)  throw new ValidationError('phone is required')
      if (!amount) throw new ValidationError('amount is required')
      return c2bSimulate(client, config, {
        phone, amount, billRefNumber,
        commandId: (body['commandId'] as 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline') ?? 'CustomerPayBillOnline',
      })
    }),

    // B2C Pay
    route('POST', '/b2c/pay', async (body, _p, client, config) => {
      const phone    = body['phone'] as string
      const amount   = Number(body['amount'])
      const commandId = (body['commandId'] as 'SalaryPayment' | 'BusinessPayment' | 'PromotionPayment') ?? 'BusinessPayment'
      if (!phone)  throw new ValidationError('phone is required')
      if (!amount) throw new ValidationError('amount is required')
      const remarks  = body['remarks'] as string | undefined
      const occasion = body['occasion'] as string | undefined
      return b2cPay(client, config, {
        phone, amount, commandId,
        ...(remarks  ? { remarks }  : {}),
        ...(occasion ? { occasion } : {}),
      })
    }),

    // B2B Pay
    route('POST', '/b2b/pay', async (body, _p, client, config) => {
      const receiverShortcode = body['receiverShortcode'] as string
      const amount            = Number(body['amount'])
      const commandId         = (body['commandId'] as 'BusinessPayBill' | 'MerchantToMerchantTransfer') ?? 'BusinessPayBill'
      if (!receiverShortcode) throw new ValidationError('receiverShortcode is required')
      if (!amount)            throw new ValidationError('amount is required')
      const b2bAccountRef = body['accountReference'] as string | undefined
      const b2bRemarks    = body['remarks'] as string | undefined
      return b2bPay(client, config, {
        receiverShortcode, amount, commandId,
        ...(b2bAccountRef ? { accountReference: b2bAccountRef } : {}),
        ...(b2bRemarks    ? { remarks: b2bRemarks }             : {}),
      })
    }),

    // Account Balance
    route('GET', '/balance', async (_b, _p, client, config) =>
      queryAccountBalance(client, config),
    ),

    // Transaction Status
    route('GET', '/status/:transactionId', async (_b, params, client, config) =>
      queryTransactionStatus(client, config, {
        transactionId: params['transactionId'] ?? '',
      }),
    ),

    // Reversal
    route('POST', '/reverse', async (body, _p, client, config) => {
      const transactionId = body['transactionId'] as string
      const amount        = Number(body['amount'])
      if (!transactionId) throw new ValidationError('transactionId is required')
      if (!amount)        throw new ValidationError('amount is required')
      const revRemarks  = body['remarks'] as string | undefined
      const revOccasion = body['occasion'] as string | undefined
      return reverseTransaction(client, config, {
        transactionId, amount,
        ...(revRemarks  ? { remarks: revRemarks }   : {}),
        ...(revOccasion ? { occasion: revOccasion } : {}),
      })
    }),

    // QR Code
    route('POST', '/qr/generate', async (body, _p, client, _config) => {
      const merchantName = body['merchantName'] as string
      const refNo        = body['refNo'] as string
      const amount       = Number(body['amount'])
      const trxCode      = (body['trxCode'] as 'BG' | 'WA' | 'PB' | 'SM' | 'SB') ?? 'PB'
      const cpi          = body['cpi'] as string
      if (!merchantName) throw new ValidationError('merchantName is required')
      if (!refNo)        throw new ValidationError('refNo is required')
      if (!amount)       throw new ValidationError('amount is required')
      if (!cpi)          throw new ValidationError('cpi (Consumer PayBill/Till number) is required')
      return generateQR(client, { merchantName, refNo, amount, trxCode, cpi, size: Number(body['size'] ?? 300) })
    }),

    // Bill Manager — opt-in
    route('POST', '/bill/optin', async (body, _p, client, config) => {
      const billCallbackUrl = body['callbackUrl'] as string | undefined
      const billEmail       = body['email'] as string | undefined
      const billLogo        = body['logo'] as string | undefined
      return billOptin(client, config, {
        ...(billCallbackUrl ? { callbackUrl: billCallbackUrl } : {}),
        ...(billEmail       ? { email: billEmail }             : {}),
        ...(billLogo        ? { logo: billLogo }               : {}),
      })
    }),

    // Bill Manager — send invoice
    route('POST', '/bill/invoice', async (body, _p, client, config) => {
      const reference   = body['reference'] as string
      const billedTo    = body['billedTo'] as string
      const phone       = body['phone'] as string
      const billedAmount = Number(body['billedAmount'])
      const dueDate     = body['dueDate'] as string
      const accountReference = body['accountReference'] as string
      if (!reference || !billedTo || !phone || !billedAmount || !dueDate || !accountReference) {
        throw new ValidationError('reference, billedTo, phone, billedAmount, dueDate, and accountReference are required')
      }
      return sendInvoice(client, config, { reference, billedTo, phone, billedAmount, dueDate, accountReference })
    }),

    // Bill Manager — reconcile
    route('POST', '/bill/reconcile', async (body, _p, client, config) => {
      const paymentDate      = body['paymentDate'] as string
      const paidAmount       = Number(body['paidAmount'])
      const accountReference = body['accountReference'] as string
      const transactionId    = body['transactionId'] as string
      const phoneNumber      = body['phoneNumber'] as string
      const fullName         = body['fullName'] as string
      if (!paymentDate || !paidAmount || !accountReference || !transactionId || !phoneNumber || !fullName) {
        throw new ValidationError('paymentDate, paidAmount, accountReference, transactionId, phoneNumber, fullName are required')
      }
      return reconcileInvoice(client, config, { paymentDate, paidAmount, accountReference, transactionId, phoneNumber, fullName })
    }),

    // Ratiba — standing order
    route('POST', '/ratiba/create', async (body, _p, client, config) => {
      const phone            = body['phone'] as string
      const amount           = Number(body['amount'])
      const startDate        = body['startDate'] as string
      const endDate          = body['endDate'] as string
      const frequency        = (body['frequency'] as 'Daily' | 'Weekly' | 'Monthly') ?? 'Monthly'
      const accountReference = body['accountReference'] as string
      if (!phone || !amount || !startDate || !endDate || !accountReference) {
        throw new ValidationError('phone, amount, startDate, endDate, and accountReference are required')
      }
      return createStandingOrder(client, config, { phone, amount, startDate, endDate, frequency, accountReference })
    }),

    // Tax remittance
    route('POST', '/tax/remit', async (body, _p, client, config) => {
      const amount           = Number(body['amount'])
      const accountReference = body['accountReference'] as string
      if (!amount || !accountReference) {
        throw new ValidationError('amount and accountReference are required')
      }
      const taxRemarks = body['remarks'] as string | undefined
      return remitTax(client, config, {
        amount, accountReference,
        ...(taxRemarks ? { remarks: taxRemarks } : {}),
      })
    }),
  ]
}

// ─── Router ──────────────────────────────────────────────────────────────────

function matchRoute(
  routes: Route[],
  method: string,
  pathname: string,
): { handler: RouteHandler; params: Record<string, string> } | null {
  for (const r of routes) {
    if (r.method !== method.toUpperCase()) continue
    const match = pathname.match(r.pattern)
    if (!match) continue
    const params: Record<string, string> = {}
    r.paramNames.forEach((name, i) => { params[name] = match[i + 1] ?? '' })
    return { handler: r.handler, params }
  }
  return null
}

// ─── Startup banner ──────────────────────────────────────────────────────────

function printBanner(port: number, config: DarajaConfig): void {
  const base = `http://localhost:${port}`
  const env  = config.environment

  process.stdout.write('\n')
  process.stdout.write(chalk.bold('  daraja serve') + chalk.dim(` — Daraja REST proxy (${env})\n`))
  process.stdout.write('\n')
  process.stdout.write(`  ${chalk.green('●')} Listening on ${chalk.cyan(base)}\n`)
  process.stdout.write(`  ${chalk.dim('Shortcode:')} ${config.shortcode}\n`)
  process.stdout.write('\n')
  process.stdout.write(chalk.underline('  Endpoints') + '\n\n')

  const endpoints: [string, string, string, boolean][] = [
    ['GET',  '/health',            'Health check + feature availability', true],
    ['POST', '/stk/push',         '{ phone, amount, reference, description }', !!config.passkey],
    ['POST', '/stk/query',        '{ checkoutRequestId }', !!config.passkey],
    ['POST', '/c2b/register',     '{ validationUrl, confirmationUrl }', true],
    ['POST', '/c2b/simulate',     '{ phone, amount, billRefNumber }  [sandbox only]', env === 'sandbox'],
    ['POST', '/b2c/pay',          '{ phone, amount, commandId }', !!(config.initiatorName && config.initiatorPassword)],
    ['POST', '/b2b/pay',          '{ receiverShortcode, amount, commandId }', !!(config.initiatorName && config.initiatorPassword)],
    ['GET',  '/balance',          'No body required', !!(config.initiatorName && config.initiatorPassword)],
    ['GET',  '/status/:id',       'No body required', !!(config.initiatorName && config.initiatorPassword)],
    ['POST', '/reverse',          '{ transactionId, amount }', !!(config.initiatorName && config.initiatorPassword)],
    ['POST', '/qr/generate',      '{ merchantName, refNo, amount, cpi, trxCode }', true],
    ['POST', '/bill/optin',       '{ email, callbackUrl }', true],
    ['POST', '/bill/invoice',     '{ reference, billedTo, phone, billedAmount, dueDate, accountReference }', true],
    ['POST', '/bill/reconcile',   '{ paymentDate, paidAmount, accountReference, transactionId, phoneNumber, fullName }', true],
    ['POST', '/ratiba/create',    '{ phone, amount, startDate, endDate, frequency, accountReference }', !!config.passkey],
    ['POST', '/tax/remit',        '{ amount, accountReference }', !!(config.initiatorName && config.initiatorPassword)],
  ]

  for (const [method, path, body, available] of endpoints) {
    const methodCol = method === 'GET' ? chalk.cyan(method.padEnd(5)) : chalk.magenta(method.padEnd(5))
    const pathCol   = chalk.white((base + path).padEnd(46))
    const status    = available ? '' : chalk.dim(' (credentials missing)')
    process.stdout.write(`  ${methodCol} ${pathCol} ${chalk.dim(body)}${status}\n`)
  }

  process.stdout.write('\n')
  process.stdout.write(chalk.dim('  All responses: { ok: true, data: {...} } or { ok: false, error: "..." }\n'))
  process.stdout.write(chalk.dim('  CORS headers included — safe to call from a browser during development.\n'))
  process.stdout.write('\n')
  process.stdout.write(chalk.dim('  Press Ctrl+C to stop.\n\n'))
}

// ─── Command ─────────────────────────────────────────────────────────────────

export const serveCommand = new Command('serve')
  .description('Start a local REST proxy — call any Daraja API from any language via HTTP')
  .option('--port <port>', 'Port to listen on', '8080')
  .option('--host <host>', 'Host to bind to', '127.0.0.1')
  .option('--debug', 'Log every request and response body')
  .action((opts: { port: string; host: string; debug?: boolean }) => {
    const port = parseInt(opts.port, 10)
    const host = opts.host

    // Validate config at startup so errors surface immediately
    const raw = loadConfig()
    const result = configSchema.safeParse(raw)

    if (!result.success) {
      const missing = result.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      process.stderr.write(chalk.red('Cannot start: configuration is incomplete\n\n'))
      process.stderr.write(missing.join('\n') + '\n\n')
      process.stderr.write(chalk.dim('Run `daraja init` or `daraja config set <key> <value>`\n'))
      process.exit(1)
    }

    const config = result.data
    const client = new DarajaClient(config, { ...(opts.debug ? { debug: true } : {}) })
    const routes = buildRoutes()

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const url    = new URL(req.url ?? '/', `http://${host}:${port}`)
      const method = req.method ?? 'GET'
      const path   = url.pathname

      // CORS preflight
      if (method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        })
        res.end()
        return
      }

      if (opts.debug) {
        process.stdout.write(chalk.dim(`→ ${method} ${path}\n`))
      }

      const matched = matchRoute(routes, method, path)

      if (!matched) {
        fail(res, 404, `No route: ${method} ${path}`, 'Run `daraja serve --help` to see available endpoints')
        return
      }

      let body: Record<string, unknown> = {}
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        body = await readBody(req)
        if (opts.debug) process.stdout.write(chalk.dim(JSON.stringify(body, null, 2) + '\n'))
      }

      try {
        const data = await matched.handler(body, matched.params, client, config)
        if (opts.debug) process.stdout.write(chalk.dim(JSON.stringify(data, null, 2) + '\n'))
        ok(res, data)
      } catch (err) {
        if (err instanceof ValidationError) {
          fail(res, 400, err.message)
        } else if (err instanceof DarajaError) {
          fail(res, 502, err.message, 'Daraja returned an error — check your credentials and payload')
        } else {
          fail(res, 500, err instanceof Error ? err.message : 'Unexpected error')
        }
      }
    })

    server.listen(port, host, () => {
      printBanner(port, config)
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
      process.stdout.write('\n' + chalk.dim('Shutting down daraja serve...\n'))
      server.close(() => process.exit(0))
    })
  })
