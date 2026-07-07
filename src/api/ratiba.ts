import { normalizePhone } from '../crypto/index.js'
import type { DarajaClient } from './client.js'
import type { DarajaConfig } from '../config/schema.js'

export type RatibaFrequency = 'Daily' | 'Weekly' | 'Monthly'

export interface RatibaCreateParams {
  phone: string
  amount: number
  startDate: string
  endDate: string
  frequency: RatibaFrequency
  accountReference: string
  transactionDescription?: string
}

export interface RatibaResponse {
  ResponseCode: string
  ResponseDescription: string
  MerchantRequestID: string
}

export async function createStandingOrder(
  client: DarajaClient,
  config: DarajaConfig,
  params: RatibaCreateParams,
): Promise<RatibaResponse> {
  const { generateStkPassword } = await import('../crypto/index.js')
  const { password, timestamp } = generateStkPassword(config.shortcode, config.passkey ?? '')

  return client.post<RatibaResponse>('/mpesa/standing-order/v1/create', {
    StandingOrderName: params.accountReference,
    StartDate: params.startDate,
    EndDate: params.endDate,
    BusinessShortCode: config.shortcode,
    TransactionType: 'Standing Order Customer Pay Bill',
    ReceiverPartyIdentifierType: '4',
    Amount: params.amount,
    PartyA: normalizePhone(params.phone),
    CallBackURL: config.callbackUrl,
    AccountReference: params.accountReference,
    TransactionDesc: params.transactionDescription ?? 'Standing order payment',
    Frequency: params.frequency,
    Password: password,
    Timestamp: timestamp,
  })
}
