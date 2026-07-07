import { generateSecurityCredential } from '../crypto/index.js'
import { ValidationError } from '../errors/index.js'
import type { DarajaClient } from './client.js'
import type { DarajaConfig } from '../config/schema.js'

export interface ReversalParams {
  transactionId: string
  amount: number
  remarks?: string
  occasion?: string
}

export interface ReversalResponse {
  ResponseCode: string
  ResponseDescription: string
  ConversationID: string
  OriginatorConversationID: string
}

export async function reverseTransaction(
  client: DarajaClient,
  config: DarajaConfig,
  params: ReversalParams,
): Promise<ReversalResponse> {
  if (!config.initiatorName || !config.initiatorPassword) {
    throw new ValidationError('Reversal requires initiatorName and initiatorPassword.')
  }

  const securityCredential = generateSecurityCredential(
    config.initiatorPassword,
    config.environment,
  )

  return client.post<ReversalResponse>('/mpesa/reversal/v1/request', {
    Initiator: config.initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'TransactionReversal',
    TransactionID: params.transactionId,
    Amount: params.amount,
    ReceiverParty: config.shortcode,
    RecieverIdentifierType: '11',
    ResultURL: config.callbackUrl,
    QueueTimeOutURL: config.callbackUrl,
    Remarks: params.remarks ?? 'Reversal',
    Occasion: params.occasion ?? '',
  })
}
