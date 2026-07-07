/* eslint-disable no-console */
import chalk from 'chalk'

export type OutputFormat = 'pretty' | 'json' | 'table'

export function success(message: string, data?: unknown, format: OutputFormat = 'pretty'): void {
  if (format === 'json') {
    console.log(JSON.stringify({ ok: true, message, data }, null, 2))
    return
  }
  console.log(`${chalk.green('✓')} ${message}`)
  if (data !== undefined && format === 'pretty') {
    console.log(chalk.dim(JSON.stringify(data, null, 2)))
  }
}

export function error(message: string, hint?: string): void {
  console.error(`${chalk.red('✗')} ${message}`)
  if (hint) console.error(chalk.dim(`  ${hint}`))
}

export function info(message: string): void {
  console.log(`${chalk.blue('ℹ')} ${message}`)
}

export function warn(message: string): void {
  console.warn(`${chalk.yellow('⚠')} ${message}`)
}

export function debugLog(label: string, data: unknown): void {
  console.log(chalk.magenta(`[debug] ${label}`))
  console.log(chalk.dim(JSON.stringify(data, null, 2)))
}

export function table(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) => {
    const colValues = rows.map((r) => r[i] ?? '')
    return Math.max(h.length, ...colValues.map((v) => v.length))
  })

  const divider = widths.map((w) => '-'.repeat(w + 2)).join('+')
  const formatRow = (cells: string[]): string =>
    cells.map((c, i) => ` ${(c ?? '').padEnd(widths[i] ?? 0)} `).join('|')

  console.log(divider)
  console.log(formatRow(headers))
  console.log(divider)
  rows.forEach((row) => console.log(formatRow(row)))
  console.log(divider)
}

export function json(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

// Formats a Nairobi timestamp from epoch ms for display
export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function printKeyValue(pairs: Record<string, string | number | boolean | undefined>): void {
  const maxKey = Math.max(...Object.keys(pairs).map((k) => k.length))
  for (const [key, value] of Object.entries(pairs)) {
    if (value === undefined) continue
    console.log(`  ${chalk.dim(key.padEnd(maxKey))}  ${chalk.white(String(value))}`)
  }
}
