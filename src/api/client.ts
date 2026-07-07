import { getToken, setToken } from '../cache/token.js'
import { fetchOAuthToken } from './auth.js'
import { NetworkError, DarajaApiError } from '../errors/index.js'
import { debugLog } from '../output/index.js'
import { BASE_URLS } from '../config/index.js'
import type { DarajaConfig } from '../config/schema.js'

export interface ClientOptions {
  debug?: boolean
  dryRun?: boolean
}

interface DarajaErrorBody {
  errorCode?: string
  errorMessage?: string
  requestId?: string
  ResponseCode?: string
  ResponseDescription?: string
}

export class DarajaClient {
  private readonly baseUrl: string

  constructor(
    private readonly config: DarajaConfig,
    private readonly options: ClientOptions = {},
  ) {
    this.baseUrl = BASE_URLS[config.environment]
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    if (this.options.dryRun) {
      debugLog('dry-run payload', { url: `${this.baseUrl}${path}`, body })
      return {} as T
    }

    const token = await this.resolveToken()
    const url = `${this.baseUrl}${path}`

    if (this.options.debug) {
      debugLog('request', { url, body })
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      })
    } catch (cause) {
      throw new NetworkError(`Request to ${url} failed. Check your connection.`)
    }

    const data = (await response.json()) as T | DarajaErrorBody

    if (this.options.debug) {
      debugLog('response', { status: response.status, body: data })
    }

    if (!response.ok) {
      const err = data as DarajaErrorBody
      throw new NetworkError(
        err.errorMessage ?? `HTTP ${response.status} from Daraja`,
        response.status,
      )
    }

    // Some Daraja endpoints return 200 but embed a failure in ResponseCode
    const maybeErr = data as DarajaErrorBody
    if (maybeErr.ResponseCode !== undefined && maybeErr.ResponseCode !== '0') {
      throw new DarajaApiError(
        maybeErr.ResponseDescription ?? 'Daraja returned an error response',
        maybeErr.ResponseCode,
      )
    }

    return data as T
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const token = await this.resolveToken()
    const url = new URL(`${this.baseUrl}${path}`)

    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }

    if (this.options.debug) {
      debugLog('request', { url: url.toString(), method: 'GET' })
    }

    let response: Response
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
    } catch {
      throw new NetworkError(`Request to ${url.toString()} failed. Check your connection.`)
    }

    const data = (await response.json()) as T

    if (this.options.debug) {
      debugLog('response', { status: response.status, body: data })
    }

    if (!response.ok) {
      throw new NetworkError(`HTTP ${response.status} from Daraja`, response.status)
    }

    return data
  }

  private async resolveToken(): Promise<string> {
    const cached = getToken(this.config.environment, this.config.consumerKey)
    if (cached) return cached.access_token

    const fresh = await fetchOAuthToken(
      this.config.consumerKey,
      this.config.consumerSecret,
      this.baseUrl,
      this.config.environment,
    )

    setToken(fresh)
    return fresh.access_token
  }
}
