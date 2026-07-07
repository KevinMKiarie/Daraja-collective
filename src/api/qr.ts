import type { DarajaClient } from './client.js'

export type QRTransactionCode = 'BG' | 'WA' | 'PB' | 'SM' | 'SB'

export interface QRGenerateParams {
  merchantName: string
  refNo: string
  amount: number
  trxCode: QRTransactionCode
  cpi: string
  size?: number
}

export interface QRGenerateResponse {
  ResponseCode: string
  ResponseDescription: string
  QRCode: string
}

// trxCode meanings: BG=Buy Goods, WA=Withdrawal Agent, PB=PayBill, SM=Send Money, SB=Send to Business
export async function generateQR(
  client: DarajaClient,
  params: QRGenerateParams,
): Promise<QRGenerateResponse> {
  return client.post<QRGenerateResponse>('/mpesa/qrcode/v1/generate', {
    MerchantName: params.merchantName,
    RefNo: params.refNo,
    Amount: params.amount,
    TrxCode: params.trxCode,
    CPI: params.cpi,
    Size: String(params.size ?? 300),
  })
}
