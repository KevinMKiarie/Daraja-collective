import type { DarajaClient } from './client.js'
import type { DarajaConfig } from '../config/schema.js'

export interface BillOptinParams {
  callbackUrl?: string
  email?: string
  logo?: string
}

export interface BillOptinResponse {
  app_key: string
  rescode: string
  resmsg: string
  timestamp: string
}

export interface BillInvoiceParams {
  reference: string
  billedTo: string
  phone: string
  billedAmount: number
  dueDate: string
  accountReference: string
  notes?: string
}

export interface BillInvoiceResponse {
  rescode: string
  resmsg: string
}

export interface BillReconcileParams {
  paymentDate: string
  paidAmount: number
  accountReference: string
  transactionId: string
  phoneNumber: string
  fullName: string
}

export async function billOptin(
  client: DarajaClient,
  config: DarajaConfig,
  params: BillOptinParams = {},
): Promise<BillOptinResponse> {
  return client.post<BillOptinResponse>('/v1/billmanager-invoice/optin', {
    shortcode: config.shortcode,
    email: params.email ?? '',
    officialContact: config.callbackUrl ?? '',
    sendReminders: '1',
    logo: params.logo ?? '',
    callbackurl: params.callbackUrl ?? config.callbackUrl,
  })
}

export async function sendInvoice(
  client: DarajaClient,
  config: DarajaConfig,
  params: BillInvoiceParams,
): Promise<BillInvoiceResponse> {
  return client.post<BillInvoiceResponse>('/v1/billmanager-invoice/single-invoicing', {
    externalReference: params.reference,
    billedFullName: params.billedTo,
    billedPhoneNumber: params.phone,
    billedPeriod: params.dueDate,
    invoiceName: params.accountReference,
    dueDate: params.dueDate,
    accountReference: params.accountReference,
    amount: params.billedAmount,
    invoiceItems: [
      {
        itemName: params.accountReference,
        amount: params.billedAmount,
      },
    ],
  })
}

export async function reconcileInvoice(
  client: DarajaClient,
  _config: DarajaConfig,
  params: BillReconcileParams,
): Promise<BillInvoiceResponse> {
  return client.post<BillInvoiceResponse>('/v1/billmanager-invoice/reconciliation', {
    paymentDate: params.paymentDate,
    paidAmount: params.paidAmount,
    accountReference: params.accountReference,
    transactionId: params.transactionId,
    phoneNumber: params.phoneNumber,
    fullName: params.fullName,
  })
}
