import { generateSecurityCredential, normalizePhone } from '../crypto/index.js'
import { ValidationError } from '../errors/index.js'
import type { DarajaClient } from './client.js'
import type { DarajaConfig } from '../config/schema.js'

export type B2CCommandId = 'SalaryPayment' | 'BusinessPayment' | 'PromotionPayment'

export interface B2CParams {
  phone: string
  amount: number
  commandId: B2CCommandId
  remarks?: string
  occasion?: string
  queueTimeoutUrl?: string
  resultUrl?: string
}

export interface B2CResponse {
  ConversationID: string
  OriginatorConversationID: string
  ResponseCode: string
  ResponseDescription: string
}

export async function b2cPay(
  client: DarajaClient,
  config: DarajaConfig,
  params: B2CParams,
): Promise<B2CResponse> {
  if (!config.initiatorName || !config.initiatorPassword) {
    throw new ValidationError(
      'B2C requires initiatorName and initiatorPassword in your configuration.',
    )
  }

  const securityCredential = generateSecurityCredential(
    config.initiatorPassword,
    config.environment,
  )

  return client.post<B2CResponse>('/mpesa/b2c/v1/paymentrequest', {
    InitiatorName: config.initiatorName,
    SecurityCredential: securityCredential,
    CommandID: params.commandId,
    Amount: params.amount,
    PartyA: config.shortcode,
    PartyB: normalizePhone(params.phone),
    Remarks: params.remarks ?? 'Payment',
    QueueTimeOutURL: params.queueTimeoutUrl ?? config.callbackUrl,
    ResultURL: params.resultUrl ?? config.callbackUrl,
    Occasion: params.occasion ?? '',
  })
}
