import { Command } from 'commander'
import { createServer } from 'http'
import type { IncomingMessage, ServerResponse } from 'http'
import { info, success, warn } from '../../output/index.js'

export const webhookCommand = new Command('webhook')
  .description('Webhook development utilities')

webhookCommand
  .command('serve')
  .description('Start a local HTTP server to receive and log Daraja webhook callbacks')
  .option('--port <port>', 'Port to listen on', '3000')
  .action((opts: { port: string }) => {
    const port = parseInt(opts.port, 10)

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const timestamp = new Date().toISOString()
      const method = req.method ?? 'UNKNOWN'
      const url = req.url ?? '/'

      if (method !== 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
        return
      }

      let body = ''
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString()
      })

      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }))

        process.stdout.write('\n')
        info(`[${timestamp}] ${method} ${url}`)

        if (body) {
          try {
            const parsed: unknown = JSON.parse(body)
            process.stdout.write(JSON.stringify(parsed, null, 2) + '\n')
          } catch {
            process.stdout.write(body + '\n')
          }
        }
      })
    })

    server.listen(port, () => {
      success(`Webhook server listening on http://localhost:${port}`)
      warn(
        'This server is only reachable locally. Use a tunnel tool to expose it to Daraja:',
      )
      process.stdout.write(`  ngrok:        ngrok http ${port}\n`)
      process.stdout.write(`  localtunnel:  lt --port ${port}\n`)
      process.stdout.write('\nWaiting for incoming callbacks... (Ctrl+C to stop)\n')
    })

    server.on('error', (err: Error) => {
      process.stderr.write(`Server error: ${err.message}\n`)
      process.exit(1)
    })
  })
