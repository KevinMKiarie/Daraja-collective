import { Command } from 'commander'
import { stkPushCommand } from './push.js'
import { stkQueryCommand } from './query.js'

export const stkCommand = new Command('stk')
  .description('STK Push (Lipa Na M-Pesa Online) commands')
  .addCommand(stkPushCommand)
  .addCommand(stkQueryCommand)
