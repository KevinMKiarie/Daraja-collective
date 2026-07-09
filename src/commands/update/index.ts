import { Command } from 'commander'
import chalk from 'chalk'
import { success, info, warn } from '../../output/index.js'

declare const __VERSION__: string

interface NpmRegistryResponse {
  'dist-tags': {
    latest: string
  }
  time?: Record<string, string>
}

function parseVersion(v: string): [number, number, number] {
  const parts = v.replace(/^v/, '').split('.').map(Number)
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0]
}

function isNewer(latest: string, current: string): boolean {
  const [lMaj, lMin, lPat] = parseVersion(latest)
  const [cMaj, cMin, cPat] = parseVersion(current)
  if (lMaj !== cMaj) return lMaj > cMaj
  if (lMin !== cMin) return lMin > cMin
  return lPat > cPat
}

export const updateCommand = new Command('update')
  .description('Check if a newer version of the Daraja CLI is available on npm')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action(async (opts: { format: string }) => {
    const current = __VERSION__

    if (opts.format === 'json') {
      process.stdout.write(JSON.stringify({ checking: true, current }, null, 2) + '\n')
    } else {
      info(`Current version: ${chalk.cyan(`v${current}`)}`)
      info('Checking npm registry...')
    }

    let latest: string
    let publishedAt: string | undefined

    try {
      const res = await fetch('https://registry.npmjs.org/@daraja/cli', {
        headers: { Accept: 'application/json' },
        signal:  AbortSignal.timeout(8000),
      })

      if (!res.ok) throw new Error(`npm registry returned HTTP ${res.status}`)

      const data = await res.json() as NpmRegistryResponse
      latest = data['dist-tags']?.latest

      if (!latest) throw new Error('Could not read latest version from npm registry')

      publishedAt = data.time?.[latest]
    } catch (err) {
      if (opts.format === 'json') {
        process.stdout.write(
          JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }, null, 2) + '\n',
        )
      } else {
        warn(`Could not reach npm registry: ${err instanceof Error ? err.message : String(err)}`)
        warn('Check your connection or visit https://www.npmjs.com/package/@daraja/cli')
      }
      process.exitCode = 1
      return
    }

    const hasUpdate = isNewer(latest, current)

    if (opts.format === 'json') {
      process.stdout.write(
        JSON.stringify({ ok: true, current, latest, hasUpdate, publishedAt }, null, 2) + '\n',
      )
      return
    }

    if (!hasUpdate) {
      success(`You are on the latest version: ${chalk.cyan(`v${current}`)}`)
      return
    }

    process.stdout.write('\n')
    process.stdout.write(
      chalk.yellow('  ◆ ') +
      chalk.bold(`Update available: v${current} → v${latest}`) +
      '\n',
    )

    if (publishedAt) {
      const date = new Date(publishedAt).toLocaleDateString('en-KE', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
      process.stdout.write(chalk.dim(`    Published ${date}\n`))
    }

    process.stdout.write('\n')
    process.stdout.write('  ' + chalk.underline('Update with:') + '\n\n')
    process.stdout.write(`  ${chalk.cyan('npm install -g @daraja/cli')}\n`)
    process.stdout.write('\n')
    process.stdout.write(
      chalk.dim('  Or if you installed via npm link (dev):') + '\n',
    )
    process.stdout.write(
      chalk.dim('  git pull && npm run build && npm link') + '\n\n',
    )
  })
