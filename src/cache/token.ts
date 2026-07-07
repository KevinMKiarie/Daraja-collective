import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CACHE_DIR = join(homedir(), '.daraja')
const CACHE_FILE = join(CACHE_DIR, 'tokens.json')

// How early we refresh — avoids a token expiring mid-request
const REFRESH_BUFFER_MS = 5 * 60 * 1000

export interface CachedToken {
  access_token: string
  token_type: 'Bearer'
  expires_at: number
  created_at: number
  environment: 'sandbox' | 'production'
  consumer_key: string
}

type TokenStore = Record<string, CachedToken>

function read(): TokenStore {
  if (!existsSync(CACHE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) as TokenStore
  } catch {
    return {}
  }
}

function write(store: TokenStore): void {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true, mode: 0o700 })
  writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), { mode: 0o600 })
}

function cacheKey(environment: string, consumerKey: string): string {
  return `${environment}:${consumerKey}`
}

export function getToken(
  environment: 'sandbox' | 'production',
  consumerKey: string,
): CachedToken | null {
  const store = read()
  const key = cacheKey(environment, consumerKey)
  const token = store[key]

  if (!token) return null

  // Treat as expired if we're within the refresh buffer
  if (Date.now() >= token.expires_at - REFRESH_BUFFER_MS) return null

  return token
}

export function setToken(token: CachedToken): void {
  const store = read()
  const key = cacheKey(token.environment, token.consumer_key)
  store[key] = token
  write(store)
}

export function clearToken(environment?: string, consumerKey?: string): void {
  if (!environment || !consumerKey) {
    write({})
    return
  }
  const store = read()
  delete store[cacheKey(environment, consumerKey)]
  write(store)
}
