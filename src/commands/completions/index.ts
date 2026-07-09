import { Command } from 'commander'
import chalk from 'chalk'
import { info } from '../../output/index.js'

const BASH_COMPLETION = `
# daraja CLI bash completion
# Add to ~/.bashrc or ~/.bash_profile:
#   eval "$(daraja completions bash)"

_daraja_completions() {
  local cur prev words cword
  _init_completion || return

  local commands="init doctor config auth keygen generate ecosystem serve mock stk c2b b2c b2b status balance reverse qr bill ratiba tax webhook completions update help"

  case "\${prev}" in
    daraja)
      COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
      return ;;
    config)
      COMPREPLY=( $(compgen -W "list get set unset path keys" -- "\${cur}") )
      return ;;
    generate|gen)
      COMPREPLY=( $(compgen -W "stk-callback c2b env list" -- "\${cur}") )
      return ;;
    stk-callback|c2b)
      if [[ "\${COMP_WORDS[1]}" == "generate" || "\${COMP_WORDS[1]}" == "gen" ]]; then
        COMPREPLY=( $(compgen -W "--stack --output --list" -- "\${cur}") )
        return
      fi ;;
    env)
      if [[ "\${COMP_WORDS[1]}" == "generate" || "\${COMP_WORDS[1]}" == "gen" ]]; then
        COMPREPLY=( $(compgen -W "--platform --output --list" -- "\${cur}") )
        return
      fi ;;
    --stack)
      COMPREPLY=( $(compgen -W "express express-ts fastify nextjs fastapi flask django laravel gin rails aspnet phoenix ktor spring vapor" -- "\${cur}") )
      return ;;
    --platform)
      COMPREPLY=( $(compgen -W "dotenv github-actions vercel docker railway" -- "\${cur}") )
      return ;;
    ecosystem|eco)
      COMPREPLY=( $(compgen -W "list recommend show compare status" -- "\${cur}") )
      return ;;
    stk)
      COMPREPLY=( $(compgen -W "push query" -- "\${cur}") )
      return ;;
    auth)
      COMPREPLY=( $(compgen -W "token clear" -- "\${cur}") )
      return ;;
    keygen)
      COMPREPLY=( $(compgen -W "security passkey" -- "\${cur}") )
      return ;;
    webhook)
      COMPREPLY=( $(compgen -W "serve replay list" -- "\${cur}") )
      return ;;
    c2b)
      COMPREPLY=( $(compgen -W "register simulate" -- "\${cur}") )
      return ;;
    completions)
      COMPREPLY=( $(compgen -W "bash zsh fish" -- "\${cur}") )
      return ;;
  esac

  COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
}

complete -F _daraja_completions daraja
`

const ZSH_COMPLETION = `
# daraja CLI zsh completion
# Add to ~/.zshrc:
#   eval "$(daraja completions zsh)"

_daraja() {
  local state

  _arguments \\
    '(-v --version)'{-v,--version}'[Print the current version]' \\
    '(-h --help)'{-h,--help}'[Show help]' \\
    '1: :->command' \\
    '*: :->args'

  case $state in
    command)
      local commands=(
        'init:Interactively set up Daraja credentials'
        'doctor:Check your configuration for common issues'
        'config:Read and write individual configuration values'
        'auth:Manage OAuth tokens'
        'keygen:Generate and manage security credentials'
        'generate:Generate M-Pesa integration boilerplate'
        'gen:Generate M-Pesa integration boilerplate (alias)'
        'ecosystem:Explore SDK support and get recommendations'
        'eco:Explore SDK support and get recommendations (alias)'
        'serve:Start a local REST proxy for any language'
        'mock:Start a fake Safaricom API server'
        'stk:STK Push commands'
        'c2b:Customer-to-Business commands'
        'b2c:Business-to-Customer commands'
        'b2b:Business-to-Business commands'
        'status:Query transaction status'
        'balance:Query account balance'
        'reverse:Reverse a transaction'
        'qr:QR code generation'
        'bill:Bill Manager commands'
        'ratiba:Standing order commands'
        'tax:Tax remittance commands'
        'webhook:Webhook development utilities'
        'completions:Generate shell completion scripts'
        'update:Check for CLI updates'
      )
      _describe 'daraja commands' commands ;;
    args)
      case $words[2] in
        config)
          local subcommands=('list' 'get' 'set' 'unset' 'path' 'keys')
          _describe 'config subcommands' subcommands ;;
        generate|gen)
          local subcommands=('stk-callback' 'c2b' 'env' 'list')
          _describe 'generate subcommands' subcommands ;;
        ecosystem|eco)
          local subcommands=('list' 'recommend' 'show' 'compare' 'status')
          _describe 'ecosystem subcommands' subcommands ;;
        stk)
          local subcommands=('push' 'query')
          _describe 'stk subcommands' subcommands ;;
        auth)
          local subcommands=('token' 'clear')
          _describe 'auth subcommands' subcommands ;;
        keygen)
          local subcommands=('security' 'passkey')
          _describe 'keygen subcommands' subcommands ;;
        webhook)
          local subcommands=('serve' 'replay' 'list')
          _describe 'webhook subcommands' subcommands ;;
        c2b)
          local subcommands=('register' 'simulate')
          _describe 'c2b subcommands' subcommands ;;
        completions)
          local shells=('bash' 'zsh' 'fish')
          _describe 'shells' shells ;;
      esac ;;
  esac
}

compdef _daraja daraja
`

const FISH_COMPLETION = `
# daraja CLI fish completion
# Add to ~/.config/fish/completions/daraja.fish
# Or run: daraja completions fish > ~/.config/fish/completions/daraja.fish

set -l top_commands init doctor config auth keygen generate gen ecosystem eco serve mock stk c2b b2c b2b status balance reverse qr bill ratiba tax webhook completions update

complete -c daraja -f
complete -c daraja -n __fish_use_subcommand -a init         -d 'Set up Daraja credentials'
complete -c daraja -n __fish_use_subcommand -a doctor       -d 'Check configuration for issues'
complete -c daraja -n __fish_use_subcommand -a config       -d 'Read and write configuration values'
complete -c daraja -n __fish_use_subcommand -a auth         -d 'Manage OAuth tokens'
complete -c daraja -n __fish_use_subcommand -a keygen       -d 'Generate security credentials'
complete -c daraja -n __fish_use_subcommand -a generate     -d 'Generate integration boilerplate'
complete -c daraja -n __fish_use_subcommand -a gen          -d 'Generate integration boilerplate (alias)'
complete -c daraja -n __fish_use_subcommand -a ecosystem    -d 'SDK registry and recommender'
complete -c daraja -n __fish_use_subcommand -a eco          -d 'SDK registry and recommender (alias)'
complete -c daraja -n __fish_use_subcommand -a serve        -d 'Start REST proxy for any language'
complete -c daraja -n __fish_use_subcommand -a mock         -d 'Start fake Safaricom API server'
complete -c daraja -n __fish_use_subcommand -a stk          -d 'STK Push commands'
complete -c daraja -n __fish_use_subcommand -a c2b          -d 'Customer-to-Business commands'
complete -c daraja -n __fish_use_subcommand -a b2c          -d 'Business-to-Customer commands'
complete -c daraja -n __fish_use_subcommand -a b2b          -d 'Business-to-Business commands'
complete -c daraja -n __fish_use_subcommand -a status       -d 'Query transaction status'
complete -c daraja -n __fish_use_subcommand -a balance      -d 'Query account balance'
complete -c daraja -n __fish_use_subcommand -a reverse      -d 'Reverse a transaction'
complete -c daraja -n __fish_use_subcommand -a qr           -d 'Generate QR codes'
complete -c daraja -n __fish_use_subcommand -a bill         -d 'Bill Manager commands'
complete -c daraja -n __fish_use_subcommand -a ratiba       -d 'Standing order commands'
complete -c daraja -n __fish_use_subcommand -a tax          -d 'Tax remittance commands'
complete -c daraja -n __fish_use_subcommand -a webhook      -d 'Webhook development utilities'
complete -c daraja -n __fish_use_subcommand -a completions  -d 'Generate shell completions'
complete -c daraja -n __fish_use_subcommand -a update       -d 'Check for CLI updates'

# generate --stack values
complete -c daraja -n '__fish_seen_subcommand_from generate gen' -l stack -r \\
  -a 'express express-ts fastify nextjs fastapi flask django laravel gin rails aspnet phoenix ktor spring vapor' \\
  -d 'Target framework'

# generate --platform values
complete -c daraja -n '__fish_seen_subcommand_from generate gen' -l platform -r \\
  -a 'dotenv github-actions vercel docker railway' \\
  -d 'Target platform'

# completions subcommands
complete -c daraja -n '__fish_seen_subcommand_from completions' -a 'bash zsh fish' -d 'Shell type'
`

export const completionsCommand = new Command('completions')
  .description('Generate shell completion scripts for bash, zsh, or fish')
  .argument('<shell>', 'Shell to generate completions for: bash | zsh | fish')
  .option('--install', 'Print the install instruction for your shell instead of the script')
  .action((shell: string, opts: { install?: boolean }) => {
    const scripts: Record<string, string> = {
      bash: BASH_COMPLETION,
      zsh:  ZSH_COMPLETION,
      fish: FISH_COMPLETION,
    }

    const installInstructions: Record<string, string[]> = {
      bash: [
        'Add to ~/.bashrc or ~/.bash_profile:',
        '  eval "$(daraja completions bash)"',
        '',
        'Then reload your shell:',
        '  source ~/.bashrc',
      ],
      zsh: [
        'Add to ~/.zshrc:',
        '  eval "$(daraja completions zsh)"',
        '',
        'Then reload your shell:',
        '  source ~/.zshrc',
      ],
      fish: [
        'Write to the fish completions directory:',
        '  daraja completions fish > ~/.config/fish/completions/daraja.fish',
        '',
        'Fish picks it up automatically in new sessions.',
      ],
    }

    if (!scripts[shell]) {
      process.stderr.write(`Unknown shell: ${shell}. Supported: bash, zsh, fish\n`)
      process.exit(1)
    }

    if (opts.install) {
      process.stdout.write('\n')
      for (const line of installInstructions[shell] ?? []) {
        process.stdout.write((line ? chalk.dim(line) : '') + '\n')
      }
      process.stdout.write('\n')
      return
    }

    process.stdout.write(scripts[shell] ?? '')

    if (process.stdout.isTTY) {
      process.stdout.write('\n')
      info(`Run ${chalk.cyan(`daraja completions ${shell} --install`)} to see how to enable this.`)
    }
  })
