import { Command } from 'commander'
import { input, select, password } from '@inquirer/prompts'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { success, error, info } from '../output/index.js'

export const initCommand = new Command('init')
  .description('Interactively set up Daraja credentials and write a .daraja.json config file')
  .action(async () => {
    info('Setting up your Daraja CLI configuration\n')

    const environment = await select({
      message: 'Environment:',
      choices: [
        { name: 'sandbox (for testing)', value: 'sandbox' },
        { name: 'production (live payments)', value: 'production' },
      ],
    })

    const consumerKey = await input({ message: 'Consumer Key:' })
    const consumerSecret = await password({ message: 'Consumer Secret:' })
    const shortcode = await input({ message: 'Shortcode:' })
    const passkey = await input({
      message: 'Passkey (leave blank if not using STK Push):',
      default: '',
    })
    const callbackUrl = await input({
      message: 'Callback URL (leave blank to set later):',
      default: '',
    })

    const config: Record<string, string> = {
      environment,
      consumerKey,
      consumerSecret,
      shortcode,
    }

    if (passkey) config['passkey'] = passkey
    if (callbackUrl) config['callbackUrl'] = callbackUrl

    const configPath = join(process.cwd(), '.daraja.json')
    try {
      writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8')
    } catch (err) {
      error(
        'Failed to write .daraja.json',
        err instanceof Error ? err.message : String(err),
      )
      process.exit(1)
    }

    success(`Configuration written to ${configPath}`)

    const gitignorePath = join(process.cwd(), '.gitignore')
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf-8')
      if (!gitignore.includes('.daraja.json')) {
        writeFileSync(gitignorePath, gitignore + '\n.daraja.json\n', 'utf-8')
        info('Added .daraja.json to .gitignore')
      } else {
        info('.daraja.json is already in .gitignore')
      }
    } else {
      info('No .gitignore found — make sure not to commit .daraja.json as it contains secrets')
    }
  })
