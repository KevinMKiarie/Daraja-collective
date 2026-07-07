import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DarajaClient } from '../../src/api/client.js'
import { NetworkError, DarajaApiError } from '../../src/errors/index.js'
import type { DarajaConfig } from '../../src/config/schema.js'

const mockGetToken = vi.fn()
const mockSetToken = vi.fn()
const mockFetchOAuthToken = vi.fn()
const mockFetch = vi.fn()

vi.mock('../../src/cache/token.js', () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
  setToken: (...args: unknown[]) => mockSetToken(...args),
}))

vi.mock('../../src/api/auth.js', () => ({
  fetchOAuthToken: (...args: unknown[]) => mockFetchOAuthToken(...args),
}))

vi.stubGlobal('fetch', mockFetch)

const FRESH_TOKEN = {
  access_token: 'fresh_tok',
  token_type: 'Bearer' as const,
  expires_at: Date.now() + 3600000,
  created_at: Date.now(),
  environment: 'sandbox' as const,
  consumer_key: 'key',
}

const CACHED_TOKEN = {
  ...FRESH_TOKEN,
  access_token: 'cached_tok',
}

const config: DarajaConfig = {
  environment: 'sandbox',
  consumerKey: 'key',
  consumerSecret: 'secret',
  shortcode: '174379',
}

function mockOkResponse(body: unknown, status = 200): Response {
  return { ok: true, status, json: async () => body } as Response
}

function mockErrResponse(body: unknown, status: number): Response {
  return { ok: false, status, json: async () => body } as Response
}

describe('DarajaClient.post', () => {
  beforeEach(() => {
    mockGetToken.mockReset()
    mockSetToken.mockReset()
    mockFetchOAuthToken.mockReset()
    mockFetch.mockReset()
  })

  it('uses the cached token when available', async () => {
    mockGetToken.mockReturnValue(CACHED_TOKEN)
    mockFetch.mockResolvedValue(mockOkResponse({ ResponseCode: '0' }))

    const client = new DarajaClient(config)
    await client.post('/some/path', {})

    expect(mockFetchOAuthToken).not.toHaveBeenCalled()
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer cached_tok')
  })

  it('fetches a fresh token and caches it when the cache is empty', async () => {
    mockGetToken.mockReturnValue(null)
    mockFetchOAuthToken.mockResolvedValue(FRESH_TOKEN)
    mockFetch.mockResolvedValue(mockOkResponse({ ResponseCode: '0' }))

    const client = new DarajaClient(config)
    await client.post('/some/path', {})

    expect(mockFetchOAuthToken).toHaveBeenCalledOnce()
    expect(mockSetToken).toHaveBeenCalledWith(FRESH_TOKEN)
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer fresh_tok')
  })

  it('posts to the correct sandbox URL', async () => {
    mockGetToken.mockReturnValue(CACHED_TOKEN)
    mockFetch.mockResolvedValue(mockOkResponse({ ResponseCode: '0' }))

    const client = new DarajaClient(config)
    await client.post('/mpesa/stkpush/v1/processrequest', { foo: 'bar' })

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toBe('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest')
  })

  it('posts to the correct production URL when environment is production', async () => {
    mockGetToken.mockReturnValue(CACHED_TOKEN)
    mockFetch.mockResolvedValue(mockOkResponse({ ResponseCode: '0' }))

    const client = new DarajaClient({ ...config, environment: 'production' })
    await client.post('/mpesa/stkpush/v1/processrequest', {})

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toBe('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest')
  })

  it('sends Content-Type and Accept headers', async () => {
    mockGetToken.mockReturnValue(CACHED_TOKEN)
    mockFetch.mockResolvedValue(mockOkResponse({ ResponseCode: '0' }))

    const client = new DarajaClient(config)
    await client.post('/path', { data: 1 })

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = opts.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['Accept']).toBe('application/json')
  })

  it('throws NetworkError when fetch rejects', async () => {
    mockGetToken.mockReturnValue(CACHED_TOKEN)
    mockFetch.mockRejectedValue(new TypeError('fetch failed'))

    const client = new DarajaClient(config)
    await expect(client.post('/path', {})).rejects.toThrow(NetworkError)
  })

  it('throws NetworkError on a non-2xx HTTP response', async () => {
    mockGetToken.mockReturnValue(CACHED_TOKEN)
    mockFetch.mockResolvedValue(mockErrResponse({ errorMessage: 'Unauthorized' }, 401))

    const client = new DarajaClient(config)
    await expect(client.post('/path', {})).rejects.toThrow(NetworkError)
  })

  it('throws DarajaApiError when ResponseCode is non-zero', async () => {
    mockGetToken.mockReturnValue(CACHED_TOKEN)
    mockFetch.mockResolvedValue(
      mockOkResponse({ ResponseCode: '1', ResponseDescription: 'Invalid shortcode' }),
    )

    const client = new DarajaClient(config)
    await expect(client.post('/path', {})).rejects.toThrow(DarajaApiError)
  })

  it('returns the response body when ResponseCode is 0', async () => {
    mockGetToken.mockReturnValue(CACHED_TOKEN)
    const body = { ResponseCode: '0', CheckoutRequestID: 'abc123' }
    mockFetch.mockResolvedValue(mockOkResponse(body))

    const client = new DarajaClient(config)
    const result = await client.post<typeof body>('/path', {})
    expect(result.CheckoutRequestID).toBe('abc123')
  })

  it('skips fetch entirely in dry-run mode', async () => {
    mockGetToken.mockReturnValue(CACHED_TOKEN)

    const client = new DarajaClient(config, { dryRun: true })
    const result = await client.post('/path', { amount: 100 })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result).toEqual({})
  })

  it('passes response through without checking ResponseCode when the field is absent', async () => {
    mockGetToken.mockReturnValue(CACHED_TOKEN)
    const body = { SomeOtherField: 'value' }
    mockFetch.mockResolvedValue(mockOkResponse(body))

    const client = new DarajaClient(config)
    const result = await client.post<typeof body>('/path', {})
    expect(result.SomeOtherField).toBe('value')
  })
})
