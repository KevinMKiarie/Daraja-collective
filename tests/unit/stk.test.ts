import { describe, it, expect, vi, beforeEach } from 'vitest'
import { stkPush, stkQuery } from '../../src/api/stk.js'
import { ValidationError } from '../../src/errors/index.js'
import { STK_PUSH_SUCCESS, STK_QUERY_SUCCESS } from '../fixtures/responses.js'
import type { DarajaConfig } from '../../src/config/schema.js'
import type { DarajaClient } from '../../src/api/client.js'

const config: DarajaConfig = {
  environment: 'sandbox',
  consumerKey: 'key',
  consumerSecret: 'secret',
  shortcode: '174379',
  passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  callbackUrl: 'https://example.com/callback',
}

function makeClient(responseBody: unknown): DarajaClient {
  return { post: vi.fn().mockResolvedValue(responseBody) } as unknown as DarajaClient
}

describe('stkPush', () => {
  it('calls the correct Daraja endpoint', async () => {
    const client = makeClient(STK_PUSH_SUCCESS)
    await stkPush(client, config, { phone: '0712345678', amount: 100, reference: 'INV001', description: 'Test' })
    expect(client.post).toHaveBeenCalledWith(
      '/mpesa/stkpush/v1/processrequest',
      expect.any(Object),
    )
  })

  it('normalises the phone number to 254 format', async () => {
    const client = makeClient(STK_PUSH_SUCCESS)
    await stkPush(client, config, { phone: '0712345678', amount: 50, reference: 'REF', description: 'Pay' })
    const [, payload] = (client.post as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>]
    expect(payload['PhoneNumber']).toBe('254712345678')
    expect(payload['PartyA']).toBe('254712345678')
  })

  it('includes BusinessShortCode from config', async () => {
    const client = makeClient(STK_PUSH_SUCCESS)
    await stkPush(client, config, { phone: '254712345678', amount: 1, reference: 'R', description: 'D' })
    const [, payload] = (client.post as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>]
    expect(payload['BusinessShortCode']).toBe('174379')
  })

  it('includes a base64 Password and a 14-digit Timestamp', async () => {
    const client = makeClient(STK_PUSH_SUCCESS)
    await stkPush(client, config, { phone: '254712345678', amount: 1, reference: 'R', description: 'D' })
    const [, payload] = (client.post as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>]
    expect(String(payload['Timestamp'])).toMatch(/^\d{14}$/)
    const decoded = Buffer.from(String(payload['Password']), 'base64').toString('utf-8')
    expect(decoded).toContain(config.shortcode)
    expect(decoded).toContain(config.passkey)
  })

  it('uses the provided callbackUrl over the config value', async () => {
    const client = makeClient(STK_PUSH_SUCCESS)
    await stkPush(client, config, {
      phone: '254712345678',
      amount: 1,
      reference: 'R',
      description: 'D',
      callbackUrl: 'https://override.com/cb',
    })
    const [, payload] = (client.post as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>]
    expect(payload['CallBackURL']).toBe('https://override.com/cb')
  })

  it('falls back to config.callbackUrl when none is provided', async () => {
    const client = makeClient(STK_PUSH_SUCCESS)
    await stkPush(client, config, { phone: '254712345678', amount: 1, reference: 'R', description: 'D' })
    const [, payload] = (client.post as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>]
    expect(payload['CallBackURL']).toBe('https://example.com/callback')
  })

  it('throws ValidationError for an invalid phone number', async () => {
    const client = makeClient(STK_PUSH_SUCCESS)
    await expect(
      stkPush(client, config, { phone: 'not-a-phone', amount: 1, reference: 'R', description: 'D' }),
    ).rejects.toThrow(ValidationError)
  })

  it('returns the CheckoutRequestID from Daraja', async () => {
    const client = makeClient(STK_PUSH_SUCCESS)
    const result = await stkPush(client, config, { phone: '254712345678', amount: 100, reference: 'R', description: 'D' })
    expect(result.CheckoutRequestID).toBe(STK_PUSH_SUCCESS.CheckoutRequestID)
  })
})

describe('stkQuery', () => {
  it('calls the correct Daraja endpoint', async () => {
    const client = makeClient(STK_QUERY_SUCCESS)
    await stkQuery(client, config, { checkoutRequestId: 'ws_CO_123' })
    expect(client.post).toHaveBeenCalledWith(
      '/mpesa/stkpushquery/v1/query',
      expect.any(Object),
    )
  })

  it('includes the CheckoutRequestID in the payload', async () => {
    const client = makeClient(STK_QUERY_SUCCESS)
    await stkQuery(client, config, { checkoutRequestId: 'ws_CO_123456' })
    const [, payload] = (client.post as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>]
    expect(payload['CheckoutRequestID']).toBe('ws_CO_123456')
  })

  it('returns the ResultCode from Daraja', async () => {
    const client = makeClient(STK_QUERY_SUCCESS)
    const result = await stkQuery(client, config, { checkoutRequestId: 'ws_CO_123' })
    expect(result.ResultCode).toBe('0')
  })
})
