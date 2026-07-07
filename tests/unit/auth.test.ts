import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchOAuthToken } from '../../src/api/auth.js'
import { AuthenticationError } from '../../src/errors/index.js'
import { SANDBOX_TOKEN_RESPONSE, DARAJA_AUTH_ERROR } from '../fixtures/responses.js'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

describe('fetchOAuthToken', () => {
  const BASE_URL = 'https://sandbox.safaricom.co.ke'

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns a CachedToken on success', async () => {
    mockFetch.mockResolvedValue(mockResponse(SANDBOX_TOKEN_RESPONSE))

    const token = await fetchOAuthToken('key', 'secret', BASE_URL, 'sandbox')

    expect(token.access_token).toBe(SANDBOX_TOKEN_RESPONSE.access_token)
    expect(token.token_type).toBe('Bearer')
    expect(token.environment).toBe('sandbox')
    expect(token.consumer_key).toBe('key')
    expect(token.expires_at).toBeGreaterThan(Date.now())
    expect(token.created_at).toBeLessThanOrEqual(Date.now())
  })

  it('sends Basic auth header with base64-encoded credentials', async () => {
    mockFetch.mockResolvedValue(mockResponse(SANDBOX_TOKEN_RESPONSE))

    await fetchOAuthToken('mykey', 'mysecret', BASE_URL, 'sandbox')

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    const expected = 'Basic ' + Buffer.from('mykey:mysecret').toString('base64')
    expect((options.headers as Record<string, string>)['Authorization']).toBe(expected)
  })

  it('hits the correct token endpoint', async () => {
    mockFetch.mockResolvedValue(mockResponse(SANDBOX_TOKEN_RESPONSE))

    await fetchOAuthToken('key', 'secret', BASE_URL, 'sandbox')

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toBe(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`)
  })

  it('throws AuthenticationError on HTTP 401', async () => {
    mockFetch.mockResolvedValue(mockResponse(DARAJA_AUTH_ERROR, 401))

    await expect(fetchOAuthToken('bad', 'creds', BASE_URL, 'sandbox')).rejects.toThrow(
      AuthenticationError,
    )
  })

  it('throws AuthenticationError when fetch itself fails (network down)', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'))

    await expect(fetchOAuthToken('key', 'secret', BASE_URL, 'sandbox')).rejects.toThrow(
      AuthenticationError,
    )
  })

  it('sets expires_at approximately 1 hour from now', async () => {
    mockFetch.mockResolvedValue(mockResponse(SANDBOX_TOKEN_RESPONSE))

    const before = Date.now()
    const token = await fetchOAuthToken('key', 'secret', BASE_URL, 'sandbox')
    const after = Date.now()

    const oneHourMs = 3600 * 1000
    expect(token.expires_at).toBeGreaterThanOrEqual(before + oneHourMs)
    expect(token.expires_at).toBeLessThanOrEqual(after + oneHourMs)
  })
})
