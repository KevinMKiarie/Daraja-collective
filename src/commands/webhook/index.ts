import { Command } from 'commander'
import { createServer } from 'http'
import type { IncomingMessage, ServerResponse } from 'http'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import chalk from 'chalk'
import { info, success, warn, error } from '../../output/index.js'

interface CapturedPayload {
  id:        string
  timestamp: string
  method:    string
  url:       string
  body:      unknown
}

export const webhookCommand = new Command('webhook')
  .description('Webhook development utilities')

// ─── serve ───────────────────────────────────────────────────────────────────

webhookCommand
  .command('serve')
  .description('Start a local HTTP server to receive and log Daraja webhook callbacks')
  .option('--port <port>', 'Port to listen on', '3000')
  .option('--save <file>', 'Append captured payloads to a JSON file for later replay')
  .action((opts: { port: string; save?: string }) => {
    const port    = parseInt(opts.port, 10)
    const saveFile = opts.save ? resolve(opts.save) : null
    const captured: CapturedPayload[] = []

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const timestamp = new Date().toISOString()
      const method    = req.method ?? 'UNKNOWN'
      const url       = req.url ?? '/'

      if (method !== 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
        return
      }

      let body = ''
      req.on('data', (chunk: Buffer) => { body += chunk.toString() })

      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }))

        process.stdout.write('\n')
        info(`[${timestamp}] ${method} ${url}`)

        let parsed: unknown = body
        if (body) {
          try { parsed = JSON.parse(body) }
          catch { /* leave as raw string */ }
          process.stdout.write(JSON.stringify(parsed, null, 2) + '\n')
        }

        if (saveFile) {
          const entry: CapturedPayload = {
            id:        `cap-${Date.now()}`,
            timestamp,
            method,
            url,
            body:      parsed,
          }
          captured.push(entry)

          // Load existing file to append, or start fresh
          let existing: CapturedPayload[] = []
          if (existsSync(saveFile)) {
            try { existing = JSON.parse(readFileSync(saveFile, 'utf-8')) as CapturedPayload[] }
            catch { /* start fresh if corrupt */ }
          }
          writeFileSync(saveFile, JSON.stringify([...existing, entry], null, 2), 'utf-8')
          process.stdout.write(chalk.dim(`  Saved to ${saveFile} (${existing.length + 1} total)\n`))
        }
      })
    })

    server.listen(port, () => {
      success(`Webhook server listening on http://localhost:${port}`)

      if (saveFile) {
        info(`Saving captured payloads to ${chalk.cyan(saveFile)}`)
        info(`Replay later with: ${chalk.cyan(`daraja webhook replay ${saveFile} <url>`)}`)
      }

      warn('This server is only reachable locally. Use a tunnel to expose it to Daraja:')
      process.stdout.write(`  ngrok:        ngrok http ${port}\n`)
      process.stdout.write(`  localtunnel:  lt --port ${port}\n`)
      process.stdout.write('\nWaiting for incoming callbacks... (Ctrl+C to stop)\n')
    })

    server.on('error', (err: Error) => {
      process.stderr.write(`Server error: ${err.message}\n`)
      process.exit(1)
    })
  })

// ─── replay ──────────────────────────────────────────────────────────────────

webhookCommand
  .command('replay <file> <url>')
  .description('Replay captured webhook payloads from a file to a handler URL')
  .option('--index <n>',  'Replay only the payload at index N (0-based)')
  .option('--delay <ms>', 'Delay between replays in milliseconds', '200')
  .option('--dry-run',    'Print what would be sent without making requests')
  .action(async (file: string, targetUrl: string, opts: { index?: string; delay: string; dryRun?: boolean }) => {
    const filePath = resolve(file)

    if (!existsSync(filePath)) {
      error(`File not found: ${filePath}`)
      process.exit(1)
    }

    let payloads: CapturedPayload[]
    try {
      payloads = JSON.parse(readFileSync(filePath, 'utf-8')) as CapturedPayload[]
    } catch {
      error(`Could not parse ${filePath} — expected a JSON array of captured payloads`)
      process.exit(1)
    }

    if (!Array.isArray(payloads) || payloads.length === 0) {
      warn(`No payloads found in ${filePath}`)
      return
    }

    const targets = opts.index !== undefined
      ? [payloads[parseInt(opts.index, 10)]].filter(Boolean) as CapturedPayload[]
      : payloads

    if (targets.length === 0) {
      error(`No payload at index ${opts.index}`)
      process.exit(1)
    }

    info(`Replaying ${targets.length} payload(s) → ${chalk.cyan(targetUrl)}`)
    if (opts.dryRun) warn('Dry run — no requests will be sent')
    process.stdout.write('\n')

    let sent = 0
    let failed = 0

    for (const payload of targets) {
      const label = `[${payload.id}] ${payload.timestamp}`

      if (opts.dryRun) {
        process.stdout.write(chalk.dim(`  ${label}\n`))
        process.stdout.write(chalk.dim(JSON.stringify(payload.body, null, 2) + '\n\n'))
        continue
      }

      try {
        const res = await fetch(targetUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload.body),
        })

        if (res.ok) {
          process.stdout.write(`  ${chalk.green('✓')} ${label} → ${res.status}\n`)
          sent++
        } else {
          process.stdout.write(`  ${chalk.yellow('⚠')} ${label} → ${res.status}\n`)
          failed++
        }
      } catch (err) {
        process.stdout.write(`  ${chalk.red('✗')} ${label} → ${err instanceof Error ? err.message : 'error'}\n`)
        failed++
      }

      if (parseInt(opts.delay, 10) > 0 && targets.indexOf(payload) < targets.length - 1) {
        await new Promise<void>((r) => setTimeout(r, parseInt(opts.delay, 10)))
      }
    }

    if (!opts.dryRun) {
      process.stdout.write('\n')
      if (failed === 0) {
        success(`Replayed ${sent}/${targets.length} payloads successfully`)
      } else {
        warn(`${sent} succeeded, ${failed} failed`)
      }
    }
  })

// ─── list ────────────────────────────────────────────────────────────────────

webhookCommand
  .command('list <file>')
  .description('List all captured payloads in a saved file')
  .action((file: string) => {
    const filePath = resolve(file)

    if (!existsSync(filePath)) {
      error(`File not found: ${filePath}`)
      process.exit(1)
    }

    let payloads: CapturedPayload[]
    try {
      payloads = JSON.parse(readFileSync(filePath, 'utf-8')) as CapturedPayload[]
    } catch {
      error(`Could not parse ${filePath}`)
      process.exit(1)
    }

    if (!Array.isArray(payloads) || payloads.length === 0) {
      warn(`No payloads in ${filePath}`)
      return
    }

    process.stdout.write(`\n${chalk.bold(filePath)} — ${payloads.length} payload(s)\n\n`)

    payloads.forEach((p, i) => {
      const type = detectPayloadType(p.body)
      process.stdout.write(
        `  ${chalk.dim(String(i).padStart(3))}  ${chalk.cyan(p.id)}  ${chalk.dim(p.timestamp)}  ${chalk.white(p.url)}  ${chalk.yellow(type)}\n`,
      )
    })

    process.stdout.write('\n')
    process.stdout.write(chalk.dim(`  Replay all:     daraja webhook replay ${file} <url>\n`))
    process.stdout.write(chalk.dim(`  Replay one:     daraja webhook replay ${file} <url> --index 0\n`))
    process.stdout.write('\n')
  })

function detectPayloadType(body: unknown): string {
  if (typeof body !== 'object' || body === null) return 'unknown'
  const b = body as Record<string, unknown>
  if (b['Body'] && (b['Body'] as Record<string, unknown>)['stkCallback']) return 'stk-callback'
  if (b['TransID'] && b['MSISDN']) return 'c2b'
  if (b['Result']) return 'b2c/b2b-result'
  return 'unknown'
}
