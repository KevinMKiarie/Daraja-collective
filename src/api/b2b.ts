import { generateSecurityCredential } from '../crypto/index.js'
import { ValidationError } from '../errors/index.js'
import type { DarajaClient } from './client.js'
import type { DarajaConfig } from '../config/schema.js'

export type B2BCommandId =
  | 'BusinessPayBill'
  | 'MerchantToMerchantTransfer'
  | 'MerchantTransferFromMerchantToWorking'
  | 'MerchantServicesMMFAccountTransfer'
  | 'AgencyFloatAdvance'

export interface B2BParams {
  receiverShortcode: string
  amount: number
  commandId: B2BCommandId
  accountReference?: string
  remarks?: string
  queueTimeoutUrl?: string
  resultUrl?: string
}

export interface B2BResponse {
  ConversationID: string
  OriginatorConversationID: string
  ResponseCode: string
  ResponseDescription: string
}

export async function b2bPay(
  client: DarajaClient,
  config: DarajaConfig,
  params: B2BParams,
): Promise<B2BResponse> {
  if (!config.initiatorName || !config.initiatorPassword) {
    throw new ValidationError(
      'B2B requires initiatorName and initiatorPassword in your configuration.',
    )
  }

  const securityCredential = generateSecurityCredential(
    config.initiatorPassword,
    config.environment,
  )

  return client.post<B2BResponse>('/mpesa/b2b/v1/paymentrequest', {
    Initiator: config.initiatorName,
    SecurityCredential: securityCredential,
    CommandID: params.commandId,
    Amount: params.amount,
    PartyA: config.shortcode,
    SenderIdentifierType: '4',
    PartyB: params.receiverShortcode,
    RecieverIdentifierType: '4',
    Remarks: params.remarks ?? 'B2B Payment',
    AccountReference: params.accountReference ?? params.receiverShortcode,
    QueueTimeOutURL: params.queueTimeoutUrl ?? config.callbackUrl,
    ResultURL: params.resultUrl ?? config.callbackUrl,
  })
}
