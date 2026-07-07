import { describe, it, expect, vi } from 'vitest'
import { b2bPay } from '../../src/api/b2b.js'
import { b2cPay } from '../../src/api/b2c.js'
import { queryAccountBalance } from '../../src/api/balance.js'
import { c2bRegister, c2bSimulate } from '../../src/api/c2b.js'
import { generateQR } from '../../src/api/qr.js'
import { queryTransactionStatus } from '../../src/api/status.js'
import { reverseTransaction } from '../../src/api/reversal.js'
import { createStandingOrder } from '../../src/api/ratiba.js'
import { remitTax } from '../../src/api/tax.js'
import { billOptin, sendInvoice, reconcileInvoice } from '../../src/api/bill.js'
import { ValidationError } from '../../src/errors/index.js'
import type { DarajaConfig } from '../../src/config/schema.js'
import type { DarajaClient } from '../../src/api/client.js'

vi.mock('../../src/crypto/index.js', () => ({
  generateSecurityCredential: vi.fn().mockReturnValue('mock-credential'),
  normalizePhone: vi.fn().mockImplementation((p: string) => {
    const d = p.replace(/\D/g, '')
    if (d.startsWith('254') && d.length === 12) return d
    if (d.startsWith('0') && d.length === 10) return `254${d.slice(1)}`
    return d
  }),
  generateStkPassword: vi.fn().mockReturnValue({ password: 'mock-pw', timestamp: '20260101000000' }),
}))

const config: DarajaConfig = {
  environment: 'sandbox',
  consumerKey: 'key',
  consumerSecret: 'secret',
  shortcode: '174379',
  callbackUrl: 'https://example.com/cb',
  initiatorName: 'testapi',
  initiatorPassword: 'Safaricom999!',
  passkey: 'test-passkey-not-a-real-credential',
}

const noInitiatorConfig: DarajaConfig = {
  environment: 'sandbox',
  consumerKey: 'key',
  consumerSecret: 'secret',
  shortcode: '174379',
  callbackUrl: 'https://example.com/cb',
}

function makeClient(body: unknown = { ResponseCode: '0' }): DarajaClient {
  return { post: vi.fn().mockResolvedValue(body) } as unknown as DarajaClient
}

describe('b2bPay', () => {
  it('throws ValidationError when initiatorName is absent', async () => {
    await expect(
      b2bPay(makeClient(), noInitiatorConfig, {
        receiverShortcode: '000111',
        amount: 500,
        commandId: 'BusinessPayBill',
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('calls the correct endpoint', async () => {
    const client = makeClient({ ConversationID: 'c1', OriginatorConversationID: 'o1', ResponseCode: '0', ResponseDescription: 'ok' })
    await b2bPay(client, config, { receiverShortcode: '000111', amount: 500, commandId: 'BusinessPayBill' })
    expect(client.post).toHaveBeenCalledWith('/mpesa/b2b/v1/paymentrequest', expect.any(Object))
  })

  it('includes SecurityCredential in the payload', async () => {
    const client = makeClient({ ConversationID: 'c1', OriginatorConversationID: 'o1', ResponseCode: '0', ResponseDescription: 'ok' })
    await b2bPay(client, config, { receiverShortcode: '000111', amount: 500, commandId: 'BusinessPayBill' })
    const [, payload] = (client.post as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>]
    expect(payload['SecurityCredential']).toBe('mock-credential')
  })
})

describe('b2cPay', () => {
  it('throws ValidationError when initiatorName is absent', async () => {
    await expect(
      b2cPay(makeClient(), noInitiatorConfig, {
        phone: '254712345678',
        amount: 100,
        commandId: 'BusinessPayment',
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('calls the correct endpoint', async () => {
    const client = makeClient({ ConversationID: 'c1', OriginatorConversationID: 'o1', ResponseCode: '0', ResponseDescription: 'ok' })
    await b2cPay(client, config, { phone: '254712345678', amount: 100, commandId: 'BusinessPayment' })
    expect(client.post).toHaveBeenCalledWith('/mpesa/b2c/v1/paymentrequest', expect.any(Object))
  })
})

describe('queryAccountBalance', () => {
  it('throws ValidationError when initiatorName is absent', async () => {
    await expect(queryAccountBalance(makeClient(), noInitiatorConfig)).rejects.toThrow(ValidationError)
  })

  it('calls the correct endpoint', async () => {
    const client = makeClient({ ResponseCode: '0', ResponseDescription: 'ok', ConversationID: 'c1', OriginatorConversationID: 'o1' })
    await queryAccountBalance(client, config)
    expect(client.post).toHaveBeenCalledWith('/mpesa/accountbalance/v1/query', expect.any(Object))
  })
})

describe('c2bRegister', () => {
  it('calls the correct endpoint', async () => {
    const client = makeClient({ OriginatorCoversationID: 'o1', ResponseCode: '0', ResponseDescription: 'ok' })
    await c2bRegister(client, config)
    expect(client.post).toHaveBeenCalledWith('/mpesa/c2b/v1/registerurl', expect.any(Object))
  })

  it('includes the shortcode in the payload', async () => {
    const client = makeClient({ OriginatorCoversationID: 'o1', ResponseCode: '0', ResponseDescription: 'ok' })
    await c2bRegister(client, config)
    const [, payload] = (client.post as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>]
    expect(payload['ShortCode']).toBe('174379')
  })
})

describe('c2bSimulate', () => {
  it('calls the correct endpoint', async () => {
    const client = makeClient({ OriginatorCoversationID: 'o1', ConversationID: 'c1', ResponseDescription: 'ok' })
    await c2bSimulate(client, config, { phone: '254712345678', amount: 50, billRefNumber: 'INV001' })
    expect(client.post).toHaveBeenCalledWith('/mpesa/c2b/v1/simulate', expect.any(Object))
  })
})

describe('generateQR', () => {
  it('calls the correct endpoint', async () => {
    const client = makeClient({ ResponseCode: '0', ResponseDescription: 'ok', QRCode: 'data:image/png;base64,abc' })
    await generateQR(client, { merchantName: 'Acme', refNo: 'REF1', amount: 100, trxCode: 'BG', cpi: '174379' })
    expect(client.post).toHaveBeenCalledWith('/mpesa/qrcode/v1/generate', expect.any(Object))
  })

  it('defaults Size to 300 when not provided', async () => {
    const client = makeClient({ ResponseCode: '0', ResponseDescription: 'ok', QRCode: 'abc' })
    await generateQR(client, { merchantName: 'Acme', refNo: 'R', amount: 10, trxCode: 'PB', cpi: '174379' })
    const [, payload] = (client.post as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>]
    expect(payload['Size']).toBe('300')
  })
})

describe('queryTransactionStatus', () => {
  it('throws ValidationError when initiatorName is absent', async () => {
    await expect(
      queryTransactionStatus(makeClient(), noInitiatorConfig, { transactionId: 'OEI2AK4Q16' }),
    ).rejects.toThrow(ValidationError)
  })

  it('calls the correct endpoint', async () => {
    const client = makeClient({ ResponseCode: '0', ResponseDescription: 'ok', MerchantRequestID: 'm1', CheckoutRequestID: 'c1', ResultCode: '0', ResultDesc: 'ok' })
    await queryTransactionStatus(client, config, { transactionId: 'OEI2AK4Q16' })
    expect(client.post).toHaveBeenCalledWith('/mpesa/transactionstatus/v1/query', expect.any(Object))
  })
})

describe('reverseTransaction', () => {
  it('throws ValidationError when initiatorName is absent', async () => {
    await expect(
      reverseTransaction(makeClient(), noInitiatorConfig, { transactionId: 'OEI2AK4Q16', amount: 100 }),
    ).rejects.toThrow(ValidationError)
  })

  it('calls the correct endpoint', async () => {
    const client = makeClient({ ResponseCode: '0', ResponseDescription: 'ok', ConversationID: 'c1', OriginatorConversationID: 'o1' })
    await reverseTransaction(client, config, { transactionId: 'OEI2AK4Q16', amount: 100 })
    expect(client.post).toHaveBeenCalledWith('/mpesa/reversal/v1/request', expect.any(Object))
  })
})

describe('createStandingOrder', () => {
  it('calls the correct endpoint', async () => {
    const client = makeClient({ ResponseCode: '0', ResponseDescription: 'ok', MerchantRequestID: 'm1' })
    await createStandingOrder(client, config, {
      phone: '254712345678',
      amount: 500,
      startDate: '20260101',
      endDate: '20261231',
      frequency: 'Monthly',
      accountReference: 'RentDec',
    })
    expect(client.post).toHaveBeenCalledWith('/mpesa/standing-order/v1/create', expect.any(Object))
  })
})

describe('remitTax', () => {
  it('throws ValidationError when initiatorName is absent', async () => {
    await expect(
      remitTax(makeClient(), noInitiatorConfig, { amount: 5000, accountReference: 'P051282012345678GJGKHG' }),
    ).rejects.toThrow(ValidationError)
  })

  it('calls the correct endpoint', async () => {
    const client = makeClient({ ConversationID: 'c1', OriginatorConversationID: 'o1', ResponseCode: '0', ResponseDescription: 'ok' })
    await remitTax(client, config, { amount: 5000, accountReference: 'P051282012345678GJGKHG' })
    expect(client.post).toHaveBeenCalledWith('/mpesa/b2b/v1/remittax', expect.any(Object))
  })
})

describe('billOptin', () => {
  it('calls the correct endpoint', async () => {
    const client = makeClient({ app_key: 'ak', rescode: '0', resmsg: 'ok', timestamp: '2026-01-01' })
    await billOptin(client, config)
    expect(client.post).toHaveBeenCalledWith('/v1/billmanager-invoice/optin', expect.any(Object))
  })
})

describe('sendInvoice', () => {
  it('calls the correct endpoint', async () => {
    const client = makeClient({ rescode: '0', resmsg: 'ok' })
    await sendInvoice(client, config, {
      reference: 'INV001',
      billedTo: 'Alice',
      phone: '254712345678',
      billedAmount: 1000,
      dueDate: '2026-02-01',
      accountReference: 'RENT',
    })
    expect(client.post).toHaveBeenCalledWith('/v1/billmanager-invoice/single-invoicing', expect.any(Object))
  })
})

describe('reconcileInvoice', () => {
  it('calls the correct endpoint', async () => {
    const client = makeClient({ rescode: '0', resmsg: 'ok' })
    await reconcileInvoice(client, config, {
      paymentDate: '2026-01-15',
      paidAmount: 1000,
      accountReference: 'RENT',
      transactionId: 'OEI2AK4Q16',
      phoneNumber: '254712345678',
      fullName: 'Alice Wanjiru',
    })
    expect(client.post).toHaveBeenCalledWith('/v1/billmanager-invoice/reconciliation', expect.any(Object))
  })
})
