import { Command } from 'commander'
import { authCommand } from './commands/auth/index.js'
import { stkCommand } from './commands/stk/index.js'
import { c2bCommand } from './commands/c2b/index.js'
import { b2cCommand } from './commands/b2c/index.js'
import { b2bCommand } from './commands/b2b/index.js'
import { statusCommand } from './commands/status/index.js'
import { balanceCommand } from './commands/balance/index.js'
import { reverseCommand } from './commands/reverse/index.js'
import { qrCommand } from './commands/qr/index.js'
import { billCommand } from './commands/bill/index.js'
import { ratibaCommand } from './commands/ratiba/index.js'
import { taxCommand } from './commands/tax/index.js'
import { webhookCommand } from './commands/webhook/index.js'
import { doctorCommand } from './commands/doctor.js'
import { initCommand } from './commands/init.js'

declare const __VERSION__: string

const program = new Command()

program
  .name('daraja')
  .description('The official CLI for M-Pesa Daraja API — batteries included')
  .version(__VERSION__, '-v, --version', 'Print the current version')
  .helpOption('-h, --help', 'Show help')

program.addCommand(initCommand)
program.addCommand(doctorCommand)
program.addCommand(authCommand)
program.addCommand(stkCommand)
program.addCommand(c2bCommand)
program.addCommand(b2cCommand)
program.addCommand(b2bCommand)
program.addCommand(statusCommand)
program.addCommand(balanceCommand)
program.addCommand(reverseCommand)
program.addCommand(qrCommand)
program.addCommand(billCommand)
program.addCommand(ratibaCommand)
program.addCommand(taxCommand)
program.addCommand(webhookCommand)

program.parse(process.argv)
