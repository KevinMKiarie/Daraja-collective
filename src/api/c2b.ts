import type { DarajaClient } from './client.js'
import type { DarajaConfig } from '../config/schema.js'

export interface C2BRegisterParams {
  validationUrl?: string
  confirmationUrl?: string
  responseType?: 'Completed' | 'Cancelled'
}

export interface C2BRegisterResponse {
  OriginatorCoversationID: string
  ResponseCode: string
  ResponseDescription: string
}

export interface C2BSimulateParams {
  phone: string
  amount: number
  billRefNumber: string
  commandId?: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline'
}

export interface C2BSimulateResponse {
  OriginatorCoversationID: string
  ConversationID: string
  ResponseDescription: string
}

export async function c2bRegister(
  client: DarajaClient,
  config: DarajaConfig,
  params: C2BRegisterParams = {},
): Promise<C2BRegisterResponse> {
  return client.post<C2BRegisterResponse>('/mpesa/c2b/v1/registerurl', {
    ShortCode: config.shortcode,
    ResponseType: params.responseType ?? 'Completed',
    ConfirmationURL: params.confirmationUrl ?? config.confirmationUrl,
    ValidationURL: params.validationUrl ?? config.validationUrl,
  })
}

export async function c2bSimulate(
  client: DarajaClient,
  config: DarajaConfig,
  params: C2BSimulateParams,
): Promise<C2BSimulateResponse> {
  return client.post<C2BSimulateResponse>('/mpesa/c2b/v1/simulate', {
    ShortCode: config.shortcode,
    CommandID: params.commandId ?? 'CustomerPayBillOnline',
    Amount: params.amount,
    Msisdn: params.phone,
    BillRefNumber: params.billRefNumber,
  })
}
