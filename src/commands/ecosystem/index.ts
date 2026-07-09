import { Command } from 'commander'
import { select, checkbox } from '@inquirer/prompts'
import chalk from 'chalk'
import {
  REGISTRY,
  TIER_LABELS,
  FEATURE_LABELS,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  getBestSDKForLanguage,
  getSDKsForLanguage,
  getSDKsByTier,
  ALL_FEATURES,
  type SDK,
  type Feature,
  type Tier,
} from './registry.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIER_CHALK: Record<Tier, (s: string) => string> = {
  1: chalk.green,
  2: chalk.cyan,
  3: chalk.yellow,
  4: chalk.dim,
}

const STATUS_BADGE: Record<string, string> = {
  stable:       chalk.green('stable'),
  beta:         chalk.yellow('beta'),
  planned:      chalk.blue('coming soon'),
  community:    chalk.cyan('community'),
  unmaintained: chalk.red('unmaintained'),
}

function tierBadge(tier: Tier): string {
  return TIER_CHALK[tier](`[Tier ${tier}]`)
}

function featureDots(sdk: SDK): string {
  return ALL_FEATURES.map((f) =>
    sdk.features.includes(f) ? chalk.green('●') : chalk.dim('○'),
  ).join(' ')
}

function featureList(sdk: SDK): string {
  return sdk.features.map((f) => `${chalk.green('✓')} ${FEATURE_LABELS[f]}`).join('\n  ')
}

function missingFeatures(sdk: SDK): Feature[] {
  return ALL_FEATURES.filter((f) => !sdk.features.includes(f))
}

function printSDKCard(sdk: SDK, verbose = false): void {
  const col = TIER_CHALK[sdk.tier]
  process.stdout.write(`\n  ${col(sdk.name)}  ${tierBadge(sdk.tier)}  ${STATUS_BADGE[sdk.status]}\n`)
  process.stdout.write(`  ${chalk.dim(sdk.languageLabel)} · ${chalk.dim(sdk.registry)}\n`)
  process.stdout.write(`  ${sdk.description}\n`)

  if (verbose) {
    process.stdout.write(`\n  ${chalk.underline('Install')}\n`)
    process.stdout.write(`  ${chalk.cyan(sdk.installCmd)}\n`)

    process.stdout.write(`\n  ${chalk.underline('Quick import')}\n`)
    process.stdout.write(`  ${chalk.dim(sdk.importExample)}\n`)

    process.stdout.write(`\n  ${chalk.underline('API coverage')}\n`)
    process.stdout.write(`  ${featureList(sdk)}\n`)

    const missing = missingFeatures(sdk)
    if (missing.length > 0) {
      process.stdout.write(`\n  ${chalk.underline('Not covered')}\n`)
      missing.forEach((f) =>
        process.stdout.write(`  ${chalk.dim('○')} ${chalk.dim(FEATURE_LABELS[f])}\n`),
      )
      process.stdout.write(
        `\n  ${chalk.dim('Tip: Use `daraja serve` to access the missing APIs via HTTP.')}\n`,
      )
    }

    if (sdk.note) {
      process.stdout.write(`\n  ${chalk.yellow('⚠')}  ${chalk.yellow(sdk.note)}\n`)
    }

    process.stdout.write(`\n  ${chalk.dim(sdk.url)}\n`)
  } else {
    process.stdout.write(`  Coverage: ${featureDots(sdk)}\n`)
    if (sdk.note) process.stdout.write(`  ${chalk.yellow('⚠')}  ${chalk.dim(sdk.note)}\n`)
  }
}

function printProxyRecommendation(): void {
  process.stdout.write('\n')
  process.stdout.write(chalk.bold('  Recommended: daraja serve  ') + chalk.green('[Always available]\n'))
  process.stdout.write('  ' + chalk.dim('Language-agnostic REST proxy — works with any stack right now.\n'))
  process.stdout.write('\n')
  process.stdout.write(`  ${chalk.underline('Start the proxy')}\n`)
  process.stdout.write(`  ${chalk.cyan('daraja serve --port 8080')}\n`)
  process.stdout.write('\n')
  process.stdout.write(`  ${chalk.underline('Then call from your code')}\n`)
  process.stdout.write(`  ${chalk.dim('POST http://localhost:8080/stk/push')}\n`)
  process.stdout.write(`  ${chalk.dim('POST http://localhost:8080/c2b/register')}\n`)
  process.stdout.write(`  ${chalk.dim('POST http://localhost:8080/b2c/pay')}\n`)
  process.stdout.write(`  ${chalk.dim('GET  http://localhost:8080/balance')}\n`)
  process.stdout.write(`  ${chalk.dim('GET  http://localhost:8080/health    (check status)')}\n`)
  process.stdout.write('\n')
  process.stdout.write(
    `  ${chalk.dim('No auth required from your app — the proxy handles OAuth automatically.')}\n`,
  )
}

// ─── Command ─────────────────────────────────────────────────────────────────

export const ecosystemCommand = new Command('ecosystem')
  .alias('eco')
  .description('Explore SDK support, compare languages, and get personalised integration recommendations')

// ─── list ────────────────────────────────────────────────────────────────────

ecosystemCommand
  .command('list')
  .description('Show the full SDK registry grouped by tier')
  .option('--format <format>', 'Output format: pretty | json', 'pretty')
  .action((opts: { format: string }) => {
    if (opts.format === 'json') {
      process.stdout.write(JSON.stringify(REGISTRY, null, 2) + '\n')
      return
    }

    process.stdout.write('\n' + chalk.bold('Daraja SDK Ecosystem') + '\n')
    process.stdout.write(chalk.dim('Full coverage matrix across all supported languages\n'))

    const featureHeader = ALL_FEATURES.map((f) => chalk.dim(FEATURE_LABELS[f].split(' ')[0])).join(' ')
    process.stdout.write('\n  ' + chalk.dim('Coverage: ') + featureHeader + '\n')

    for (const tier of [1, 2, 3, 4] as Tier[]) {
      const sdks = getSDKsByTier(tier)
      if (sdks.length === 0) continue

      process.stdout.write('\n' + chalk.bold(TIER_LABELS[tier]) + '\n')

      for (const sdk of sdks) {
        printSDKCard(sdk)
      }
    }

    process.stdout.write('\n')
    process.stdout.write(chalk.bold('Universal option (any language)') + '\n')
    process.stdout.write(
      `  ${chalk.cyan('daraja serve')}  ${chalk.green('[Tier 1 — always available]')}  Full API via HTTP proxy\n`,
    )
    process.stdout.write(
      chalk.dim(
        '  Start with `daraja serve` then point your app at http://localhost:8080\n',
      ),
    )
    process.stdout.write('\n')
  })

// ─── recommend ───────────────────────────────────────────────────────────────

ecosystemCommand
  .command('recommend')
  .description('Answer a few questions and get a personalised SDK recommendation')
  .action(async () => {
    process.stdout.write('\n' + chalk.bold('Daraja Integration Recommender') + '\n\n')

    const language = await select({
      message: 'What language are you using?',
      choices: [
        ...SUPPORTED_LANGUAGES.map((l) => ({ name: LANGUAGE_LABELS[l] ?? l, value: l })),
        { name: 'Other / not listed', value: 'other' },
      ],
    })

    const neededFeatures = await checkbox({
      message: 'Which M-Pesa features do you need?',
      choices: ALL_FEATURES.map((f) => ({ name: FEATURE_LABELS[f], value: f, checked: f === 'stk-push' })),
    })

    const forProduction = await select({
      message: 'Is this for production or just prototyping?',
      choices: [
        { name: 'Production (real money)', value: true },
        { name: 'Prototype / sandbox testing', value: false },
      ],
    })

    process.stdout.write('\n')
    process.stdout.write('─'.repeat(56) + '\n')
    process.stdout.write(chalk.bold('  Recommendation\n'))
    process.stdout.write('─'.repeat(56) + '\n')

    if (language === 'other') {
      process.stdout.write(
        chalk.dim("\n  We don't have an SDK for your language yet.\n"),
      )
      printProxyRecommendation()
      process.stdout.write(
        chalk.dim(
          '  Also generate webhook handler scaffolding:\n' +
          '  daraja generate --help\n\n',
        ),
      )
      return
    }

    const best = getBestSDKForLanguage(language)

    if (!best) {
      process.stdout.write(
        chalk.dim(`\n  No SDK found for ${LANGUAGE_LABELS[language] ?? language}.\n`),
      )
      printProxyRecommendation()
      return
    }

    // Check if the best SDK covers all needed features
    const uncovered = neededFeatures.filter((f) => !best.features.includes(f))
    const planned = best.status === 'planned'

    if (planned || uncovered.length > 0) {
      // Official SDK is planned or doesn't cover all features — recommend proxy first
      if (planned) {
        process.stdout.write(
          chalk.yellow(`\n  The official ${LANGUAGE_LABELS[language]} SDK is in development.\n`),
        )
      } else {
        process.stdout.write(
          chalk.yellow(`\n  No single SDK covers all the features you need for ${LANGUAGE_LABELS[language]}.\n`),
        )
      }

      printProxyRecommendation()

      process.stdout.write(chalk.dim('  Also available for your language:\n'))
      printSDKCard(best)
    } else {
      // Great match — recommend the SDK
      printSDKCard(best, true)

      process.stdout.write('\n')
      process.stdout.write('─'.repeat(56) + '\n')

      if (forProduction && best.tier > 2) {
        process.stdout.write(
          chalk.yellow('\n  ⚠  This is a community package — review its maintenance status before going live.\n'),
        )
        process.stdout.write(
          chalk.dim('  Alternative: `daraja serve` is officially maintained and covers all APIs.\n'),
        )
      }
    }

    // Always suggest generate for webhooks
    process.stdout.write('\n')
    process.stdout.write(chalk.dim('  Generate webhook handler scaffolding for your stack:\n'))
    const stackMap: Record<string, string> = {
      node: 'express-ts', python: 'fastapi', php: 'laravel',
      go: 'gin', ruby: 'rails', dotnet: 'aspnet',
    }
    const stack = stackMap[language]
    if (stack) {
      if (neededFeatures.includes('stk-push')) {
        process.stdout.write(chalk.dim(`  daraja generate stk-callback --stack ${stack}\n`))
      }
      if (neededFeatures.includes('c2b')) {
        process.stdout.write(chalk.dim(`  daraja generate c2b --stack ${stack}\n`))
      }
    }
    process.stdout.write('\n')
  })

// ─── show ─────────────────────────────────────────────────────────────────────

ecosystemCommand
  .command('show <language>')
  .description('Deep dive into SDK options for a specific language')
  .action((language: string) => {
    const sdks = getSDKsForLanguage(language)

    if (sdks.length === 0) {
      process.stdout.write(
        `\n  ${chalk.yellow('No SDKs found for')} "${language}".\n`,
      )
      process.stdout.write(
        chalk.dim(`  Supported: ${SUPPORTED_LANGUAGES.join(', ')}\n\n`),
      )
      process.stdout.write(
        `  ${chalk.bold('Use the REST proxy instead:')}\n`,
      )
      printProxyRecommendation()
      return
    }

    const label = LANGUAGE_LABELS[language] ?? language
    process.stdout.write(`\n${chalk.bold('SDK options for ' + label)}\n`)

    for (const sdk of sdks.sort((a, b) => a.tier - b.tier)) {
      printSDKCard(sdk, true)
      process.stdout.write('\n')
    }

    process.stdout.write('─'.repeat(56) + '\n')
    process.stdout.write(chalk.bold('  Universal alternative\n'))
    process.stdout.write('─'.repeat(56) + '\n')
    printProxyRecommendation()
  })

// ─── compare ─────────────────────────────────────────────────────────────────

ecosystemCommand
  .command('compare <languages...>')
  .description('Compare SDK support side-by-side across languages (e.g. compare node python php)')
  .action((languages: string[]) => {
    process.stdout.write('\n' + chalk.bold('SDK comparison') + '\n\n')

    // Header row
    const colWidth = 22
    const langHeader = languages.map((l) =>
      (LANGUAGE_LABELS[l] ?? l).slice(0, colWidth - 1).padEnd(colWidth),
    ).join('')
    process.stdout.write('  ' + chalk.dim('Feature'.padEnd(24)) + langHeader + '\n')
    process.stdout.write('  ' + '─'.repeat(24 + colWidth * languages.length) + '\n')

    // Best SDK per language
    const bestByLang = languages.map((l) => getBestSDKForLanguage(l))

    // Tier row
    const tierRow = bestByLang.map((sdk) => {
      if (!sdk) return chalk.dim('No SDK'.padEnd(colWidth))
      return TIER_CHALK[sdk.tier](`Tier ${sdk.tier}`.padEnd(colWidth))
    }).join('')
    process.stdout.write('  ' + chalk.dim('Best SDK'.padEnd(24)) + tierRow + '\n')

    const nameRow = bestByLang.map((sdk) => {
      if (!sdk) return chalk.dim('—'.padEnd(colWidth))
      const status = sdk.status === 'planned' ? chalk.blue(' (soon)') : ''
      const name = sdk.name.slice(0, colWidth - 7)
      return chalk.white(name) + status + ' '.repeat(Math.max(0, colWidth - name.length - (sdk.status === 'planned' ? 7 : 0)))
    }).join('')
    process.stdout.write('  ' + chalk.dim('Package'.padEnd(24)) + nameRow + '\n')
    process.stdout.write('  ' + '─'.repeat(24 + colWidth * languages.length) + '\n')

    // Feature rows
    for (const feature of ALL_FEATURES) {
      const cells = bestByLang.map((sdk) => {
        if (!sdk) return chalk.dim('○'.padEnd(colWidth))
        return (sdk.features.includes(feature) ? chalk.green('✓') : chalk.dim('○')) + ' '.repeat(colWidth - 1)
      }).join('')
      process.stdout.write(
        '  ' + chalk.dim(FEATURE_LABELS[feature].padEnd(24)) + cells + '\n',
      )
    }

    process.stdout.write('  ' + '─'.repeat(24 + colWidth * languages.length) + '\n')

    // Install commands
    process.stdout.write('\n' + chalk.bold('  Install commands') + '\n\n')
    for (let i = 0; i < languages.length; i++) {
      const lang = languages[i] ?? ''
      const sdk = bestByLang[i]
      const label = (LANGUAGE_LABELS[lang] ?? lang).padEnd(20)
      if (!sdk) {
        process.stdout.write(`  ${chalk.dim(label)}  ${chalk.dim('no SDK — use `daraja serve`')}\n`)
      } else {
        process.stdout.write(`  ${chalk.dim(label)}  ${chalk.cyan(sdk.installCmd)}\n`)
      }
    }
    process.stdout.write('\n')
  })

// ─── status ──────────────────────────────────────────────────────────────────

ecosystemCommand
  .command('status')
  .description('Show the ecosystem health overview')
  .action(() => {
    const official = REGISTRY.filter((s) => s.maintainer === 'official')
    const stable   = official.filter((s) => s.status === 'stable')
    const planned  = official.filter((s) => s.status === 'planned')
    const community = REGISTRY.filter((s) => s.maintainer === 'community')

    process.stdout.write('\n' + chalk.bold('Daraja Ecosystem Status') + '\n\n')

    process.stdout.write(`  ${chalk.green('●')} REST Proxy (daraja serve)     ${chalk.green('Live — works with any language')}\n`)
    process.stdout.write('\n')
    process.stdout.write(`  ${chalk.bold('Official SDKs')}\n`)
    if (stable.length > 0) {
      stable.forEach((s) =>
        process.stdout.write(`  ${chalk.green('●')} ${s.name.padEnd(24)} ${chalk.green('Stable')}\n`),
      )
    }
    planned.forEach((s) =>
      process.stdout.write(`  ${chalk.blue('○')} ${s.name.padEnd(24)} ${chalk.blue('In development')}\n`),
    )

    process.stdout.write('\n')
    process.stdout.write(`  ${chalk.bold('Community SDKs')} (${community.length} listed)\n`)
    community.forEach((s) =>
      process.stdout.write(
        `  ${chalk.yellow('●')} ${s.name.padEnd(24)} ${chalk.dim(s.languageLabel)}\n`,
      ),
    )

    process.stdout.write('\n')
    process.stdout.write(
      chalk.dim(
        '  To contribute an SDK or list a community package:\n' +
        '  https://github.com/KevinMKiarie/Daraja-collective\n\n',
      ),
    )
  })
