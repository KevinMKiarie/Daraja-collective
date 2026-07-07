import { generateSecurityCredential } from '../crypto/index.js'
import { ValidationError } from '../errors/index.js'
import type { DarajaClient } from './client.js'
import type { DarajaConfig } from '../config/schema.js'

export interface TransactionStatusParams {
  transactionId: string
  remarks?: string
}

export interface TransactionStatusResponse {
  ResponseCode: string
  ResponseDescription: string
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode: string
  ResultDesc: string
}

export async function queryTransactionStatus(
  client: DarajaClient,
  config: DarajaConfig,
  params: TransactionStatusParams,
): Promise<TransactionStatusResponse> {
  if (!config.initiatorName || !config.initiatorPassword) {
    throw new ValidationError(
      'Transaction status query requires initiatorName and initiatorPassword.',
    )
  }

  const securityCredential = generateSecurityCredential(
    config.initiatorPassword,
    config.environment,
  )

  return client.post<TransactionStatusResponse>('/mpesa/transactionstatus/v1/query', {
    Initiator: config.initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'TransactionStatusQuery',
    TransactionID: params.transactionId,
    PartyA: config.shortcode,
    IdentifierType: '4',
    ResultURL: config.callbackUrl,
    QueueTimeOutURL: config.callbackUrl,
    Remarks: params.remarks ?? 'Status check',
    Occasion: '',
  })
}
