import { Command } from 'commander'
import { select } from '@inquirer/prompts'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'
import chalk from 'chalk'
import {
  generateStkCallback,
  generateC2BWebhook,
  generateEnvTemplate,
  SUPPORTED_STACKS,
  SUPPORTED_PLATFORMS,
  STACK_LABELS,
  PLATFORM_LABELS,
  type Stack,
  type EnvPlatform,
} from './templates.js'
import { success, error, info, warn } from '../../output/index.js'

function writeOutput(content: string, outputPath: string | undefined, defaultFilename: string): void {
  const dest = outputPath ?? defaultFilename

  if (existsSync(dest) && !outputPath) {
    warn(`${dest} already exists — pass --output <path> to write elsewhere`)
    process.stdout.write('\n')
  }

  if (outputPath) {
    const dir = dirname(dest)
    if (dir !== '.') mkdirSync(dir, { recursive: true })
    writeFileSync(dest, content, 'utf-8')
    success(`Written to ${chalk.cyan(dest)}`)
  } else {
    process.stdout.write('\n')
    process.stdout.write(chalk.dim(`# ${defaultFilename}`) + '\n')
    process.stdout.write(content)
    process.stdout.write('\n')
  }
}

export const generateCommand = new Command('generate')
  .alias('gen')
  .description('Generate production-ready M-Pesa integration boilerplate for your tech stack')

// ─── stk-callback ────────────────────────────────────────────────────────────

generateCommand
  .command('stk-callback')
  .description('Generate an STK Push callback handler for your framework')
  .option(
    '--stack <stack>',
    `Framework to generate for: ${SUPPORTED_STACKS.join(' | ')}`,
  )
  .option('--output <path>', 'Write the output to a file instead of printing to stdout')
  .option('--list', 'List all supported stacks')
  .action(async (opts: { stack?: string; output?: string; list?: boolean }) => {
    if (opts.list) {
      process.stdout.write('\nSupported stacks:\n\n')
      for (const s of SUPPORTED_STACKS) {
        process.stdout.write(`  ${chalk.cyan(s.padEnd(12))}  ${STACK_LABELS[s]}\n`)
      }
      process.stdout.write('\n')
      return
    }

    let stack = opts.stack as Stack | undefined

    if (!stack) {
      stack = await select({
        message: 'Select your framework:',
        choices: SUPPORTED_STACKS.map((s) => ({ name: STACK_LABELS[s], value: s })),
      })
    } else if (!SUPPORTED_STACKS.includes(stack)) {
      error(
        `Unknown stack: ${stack}`,
        `Supported: ${SUPPORTED_STACKS.join(', ')}. Run with --list to see all options.`,
      )
      process.exit(1)
    }

    const file = generateStkCallback(stack)

    info(`Generating STK Push callback handler for ${chalk.bold(STACK_LABELS[stack])}`)

    if (!opts.output) {
      info(`Suggested file: ${chalk.cyan(file.filename)}`)
    }

    writeOutput(file.content, opts.output, file.filename)

    if (!opts.output) {
      process.stdout.write(
        chalk.dim(`  Tip: daraja generate stk-callback --stack ${stack} --output ${file.filename}\n`),
      )
    }
  })

// ─── c2b ─────────────────────────────────────────────────────────────────────

generateCommand
  .command('c2b')
  .description('Generate C2B validation and confirmation webhook handlers for your framework')
  .option(
    '--stack <stack>',
    `Framework to generate for: ${SUPPORTED_STACKS.join(' | ')}`,
  )
  .option('--output <path>', 'Write the output to a file instead of printing to stdout')
  .option('--list', 'List all supported stacks')
  .action(async (opts: { stack?: string; output?: string; list?: boolean }) => {
    if (opts.list) {
      process.stdout.write('\nSupported stacks:\n\n')
      for (const s of SUPPORTED_STACKS) {
        process.stdout.write(`  ${chalk.cyan(s.padEnd(12))}  ${STACK_LABELS[s]}\n`)
      }
      process.stdout.write('\n')
      return
    }

    let stack = opts.stack as Stack | undefined

    if (!stack) {
      stack = await select({
        message: 'Select your framework:',
        choices: SUPPORTED_STACKS.map((s) => ({ name: STACK_LABELS[s], value: s })),
      })
    } else if (!SUPPORTED_STACKS.includes(stack)) {
      error(
        `Unknown stack: ${stack}`,
        `Supported: ${SUPPORTED_STACKS.join(', ')}. Run with --list to see all options.`,
      )
      process.exit(1)
    }

    const file = generateC2BWebhook(stack)

    info(`Generating C2B webhook handlers for ${chalk.bold(STACK_LABELS[stack])}`)

    if (!opts.output) {
      info(`Suggested file: ${chalk.cyan(file.filename)}`)
    }

    writeOutput(file.content, opts.output, file.filename)

    if (!opts.output) {
      process.stdout.write(
        chalk.dim(`  Tip: daraja generate c2b --stack ${stack} --output ${file.filename}\n`),
      )
      process.stdout.write(
        chalk.dim(`  Then register URLs: daraja c2b register\n`),
      )
    }
  })

// ─── env ─────────────────────────────────────────────────────────────────────

generateCommand
  .command('env')
  .description('Generate an environment variable template for your deployment platform')
  .option(
    '--platform <platform>',
    `Target platform: ${SUPPORTED_PLATFORMS.join(' | ')}`,
  )
  .option('--output <path>', 'Write the output to a file instead of printing to stdout')
  .option('--list', 'List all supported platforms')
  .action(async (opts: { platform?: string; output?: string; list?: boolean }) => {
    if (opts.list) {
      process.stdout.write('\nSupported platforms:\n\n')
      for (const p of SUPPORTED_PLATFORMS) {
        process.stdout.write(`  ${chalk.cyan(p.padEnd(16))}  ${PLATFORM_LABELS[p]}\n`)
      }
      process.stdout.write('\n')
      return
    }

    let platform = opts.platform as EnvPlatform | undefined

    if (!platform) {
      platform = await select({
        message: 'Select your deployment platform:',
        choices: SUPPORTED_PLATFORMS.map((p) => ({ name: PLATFORM_LABELS[p], value: p })),
      })
    } else if (!SUPPORTED_PLATFORMS.includes(platform)) {
      error(
        `Unknown platform: ${platform}`,
        `Supported: ${SUPPORTED_PLATFORMS.join(', ')}. Run with --list to see all options.`,
      )
      process.exit(1)
    }

    const file = generateEnvTemplate(platform)

    info(`Generating environment template for ${chalk.bold(PLATFORM_LABELS[platform])}`)

    if (!opts.output) {
      info(`Suggested file: ${chalk.cyan(file.filename)}`)
    }

    writeOutput(file.content, opts.output, file.filename)

    if (platform === 'dotenv' && !opts.output) {
      process.stdout.write(
        chalk.yellow(`\n  ⚠  Remember to add ${file.filename} to .gitignore\n`),
      )
    }
  })

// ─── list (top-level) ────────────────────────────────────────────────────────

generateCommand
  .command('list')
  .description('List all available generators, stacks, and platforms')
  .action(() => {
    process.stdout.write('\n' + chalk.bold('daraja generate') + ' — available generators\n\n')

    process.stdout.write(chalk.underline('Handlers') + '\n\n')
    process.stdout.write(
      `  ${chalk.cyan('stk-callback')}   STK Push result handler — fires when a customer pays or cancels\n`,
    )
    process.stdout.write(
      `  ${chalk.cyan('c2b')}            C2B validate + confirm handlers — fires on till/paybill payments\n`,
    )

    process.stdout.write('\n' + chalk.underline('Supported stacks') + '\n\n')
    for (const s of SUPPORTED_STACKS) {
      process.stdout.write(`  ${chalk.cyan(s.padEnd(12))}  ${STACK_LABELS[s]}\n`)
    }

    process.stdout.write('\n' + chalk.underline('Environment templates') + '\n\n')
    process.stdout.write(
      `  ${chalk.cyan('env')}            Daraja credential template for a deployment platform\n`,
    )
    for (const p of SUPPORTED_PLATFORMS) {
      process.stdout.write(`  ${chalk.dim(' '.padEnd(14))}• ${chalk.cyan(p.padEnd(16))}  ${PLATFORM_LABELS[p]}\n`)
    }

    process.stdout.write('\n' + chalk.dim('Examples:') + '\n')
    process.stdout.write(chalk.dim('  daraja generate stk-callback --stack express-ts --output src/routes/mpesa.ts\n'))
    process.stdout.write(chalk.dim('  daraja generate c2b --stack fastapi --output app/routers/mpesa.py\n'))
    process.stdout.write(chalk.dim('  daraja generate env --platform github-actions --output .github/daraja-vars.yml\n'))
    process.stdout.write('\n')
  })
