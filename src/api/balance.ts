import { generateSecurityCredential } from '../crypto/index.js'
import { ValidationError } from '../errors/index.js'
import type { DarajaClient } from './client.js'
import type { DarajaConfig } from '../config/schema.js'

export interface AccountBalanceResponse {
  ResponseCode: string
  ResponseDescription: string
  ConversationID: string
  OriginatorConversationID: string
}

export async function queryAccountBalance(
  client: DarajaClient,
  config: DarajaConfig,
): Promise<AccountBalanceResponse> {
  if (!config.initiatorName || !config.initiatorPassword) {
    throw new ValidationError('Account balance query requires initiatorName and initiatorPassword.')
  }

  const securityCredential = generateSecurityCredential(
    config.initiatorPassword,
    config.environment,
  )

  return client.post<AccountBalanceResponse>('/mpesa/accountbalance/v1/query', {
    Initiator: config.initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'AccountBalance',
    PartyA: config.shortcode,
    IdentifierType: '4',
    Remarks: 'Balance check',
    QueueTimeOutURL: config.callbackUrl,
    ResultURL: config.callbackUrl,
  })
}
