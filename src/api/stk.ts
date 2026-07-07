import { generateStkPassword, normalizePhone } from '../crypto/index.js'
import type { DarajaClient } from './client.js'
import type { DarajaConfig } from '../config/schema.js'

export interface StkPushParams {
  phone: string
  amount: number
  reference: string
  description: string
  callbackUrl?: string
}

export interface StkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

export interface StkQueryParams {
  checkoutRequestId: string
}

export interface StkQueryResponse {
  ResponseCode: string
  ResponseDescription: string
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode: string
  ResultDesc: string
}

export async function stkPush(
  client: DarajaClient,
  config: DarajaConfig,
  params: StkPushParams,
): Promise<StkPushResponse> {
  const { password, timestamp } = generateStkPassword(config.shortcode, config.passkey ?? '')
  const phone = normalizePhone(params.phone)
  const callbackUrl = params.callbackUrl ?? config.callbackUrl ?? ''

  return client.post<StkPushResponse>('/mpesa/stkpush/v1/processrequest', {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: params.amount,
    PartyA: phone,
    PartyB: config.shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: params.reference,
    TransactionDesc: params.description,
  })
}

export async function stkQuery(
  client: DarajaClient,
  config: DarajaConfig,
  params: StkQueryParams,
): Promise<StkQueryResponse> {
  const { password, timestamp } = generateStkPassword(config.shortcode, config.passkey ?? '')

  return client.post<StkQueryResponse>('/mpesa/stkpushquery/v1/query', {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: params.checkoutRequestId,
  })
}
