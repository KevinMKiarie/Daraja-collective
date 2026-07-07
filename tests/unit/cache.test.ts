import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getToken, setToken, clearToken } from '../../src/cache/token.js'
import type { CachedToken } from '../../src/cache/token.js'

// Isolate file system calls so tests don't touch the real ~/.daraja/tokens.json
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  let store = '{}'
  return {
    ...actual,
    existsSync: (p: string) => (String(p).endsWith('tokens.json') ? true : actual.existsSync(p)),
    readFileSync: (p: string, enc: unknown) => {
      if (String(p).endsWith('tokens.json')) return store
      return actual.readFileSync(p, enc as BufferEncoding)
    },
    writeFileSync: (p: string, data: unknown) => {
      if (String(p).endsWith('tokens.json')) {
        store = String(data)
        return
      }
      actual.writeFileSync(p, data as string)
    },
    mkdirSync: vi.fn(),
  }
})

function makeToken(overrides?: Partial<CachedToken>): CachedToken {
  return {
    access_token: 'tok_abc',
    token_type: 'Bearer',
    expires_at: Date.now() + 60 * 60 * 1000,
    created_at: Date.now(),
    environment: 'sandbox',
    consumer_key: 'key_123',
    ...overrides,
  }
}

describe('token cache', () => {
  beforeEach(() => {
    clearToken()
  })

  it('returns null when no token is cached', () => {
    expect(getToken('sandbox', 'key_123')).toBeNull()
  })

  it('returns the token after it is set', () => {
    const token = makeToken()
    setToken(token)
    const result = getToken('sandbox', 'key_123')
    expect(result).not.toBeNull()
    expect(result?.access_token).toBe('tok_abc')
  })

  it('returns null when the token is within the 5-minute refresh buffer', () => {
    // expires in 4 minutes — within the 5-minute buffer, should refresh
    const token = makeToken({ expires_at: Date.now() + 4 * 60 * 1000 })
    setToken(token)
    expect(getToken('sandbox', 'key_123')).toBeNull()
  })

  it('returns the token when it has more than 5 minutes remaining', () => {
    const token = makeToken({ expires_at: Date.now() + 10 * 60 * 1000 })
    setToken(token)
    expect(getToken('sandbox', 'key_123')).not.toBeNull()
  })

  it('keeps sandbox and production tokens separate', () => {
    const sandboxToken = makeToken({ environment: 'sandbox', access_token: 'sandbox_tok' })
    const prodToken = makeToken({ environment: 'production', access_token: 'prod_tok' })

    setToken(sandboxToken)
    setToken(prodToken)

    expect(getToken('sandbox', 'key_123')?.access_token).toBe('sandbox_tok')
    expect(getToken('production', 'key_123')?.access_token).toBe('prod_tok')
  })

  it('clearToken removes all tokens', () => {
    setToken(makeToken())
    clearToken()
    expect(getToken('sandbox', 'key_123')).toBeNull()
  })

  it('clearToken with env and key removes only that token', () => {
    setToken(makeToken({ environment: 'sandbox', consumer_key: 'key_1', access_token: 'tok1' }))
    setToken(makeToken({ environment: 'sandbox', consumer_key: 'key_2', access_token: 'tok2' }))
    clearToken('sandbox', 'key_1')
    expect(getToken('sandbox', 'key_1')).toBeNull()
    expect(getToken('sandbox', 'key_2')?.access_token).toBe('tok2')
  })
})
