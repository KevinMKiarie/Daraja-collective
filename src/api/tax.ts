import { generateSecurityCredential } from '../crypto/index.js'
import { ValidationError } from '../errors/index.js'
import type { DarajaClient } from './client.js'
import type { DarajaConfig } from '../config/schema.js'

export interface TaxRemittanceParams {
  amount: number
  accountReference: string
  remarks?: string
}

export interface TaxRemittanceResponse {
  ConversationID: string
  OriginatorConversationID: string
  ResponseCode: string
  ResponseDescription: string
}

// KRA's PayBill shortcode for tax remittance
const KRA_SHORTCODE = '572572'

export async function remitTax(
  client: DarajaClient,
  config: DarajaConfig,
  params: TaxRemittanceParams,
): Promise<TaxRemittanceResponse> {
  if (!config.initiatorName || !config.initiatorPassword) {
    throw new ValidationError('Tax remittance requires initiatorName and initiatorPassword.')
  }

  const securityCredential = generateSecurityCredential(
    config.initiatorPassword,
    config.environment,
  )

  return client.post<TaxRemittanceResponse>('/mpesa/b2b/v1/remittax', {
    Initiator: config.initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'PayTaxToKRA',
    SenderIdentifierType: '4',
    RecieverIdentifierType: '4',
    Amount: params.amount,
    PartyA: config.shortcode,
    PartyB: KRA_SHORTCODE,
    AccountReference: params.accountReference,
    Remarks: params.remarks ?? 'Tax remittance',
    QueueTimeOutURL: config.callbackUrl,
    ResultURL: config.callbackUrl,
  })
}
