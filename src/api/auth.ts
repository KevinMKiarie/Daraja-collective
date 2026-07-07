import { AuthenticationError } from '../errors/index.js'
import type { CachedToken } from '../cache/token.js'

interface DarajaTokenResponse {
  access_token: string
  expires_in: string
  token_type: string
}

interface DarajaErrorBody {
  errorCode?: string
  errorMessage?: string
  requestId?: string
}

export async function fetchOAuthToken(
  consumerKey: string,
  consumerSecret: string,
  baseUrl: string,
  environment: 'sandbox' | 'production',
): Promise<CachedToken> {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
  const url = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
    })
  } catch (cause) {
    throw new AuthenticationError(
      `Could not reach Daraja at ${baseUrl}. Check your internet connection.`,
    )
  }

  const body = (await response.json()) as DarajaTokenResponse | DarajaErrorBody

  if (!response.ok) {
    const err = body as DarajaErrorBody
    throw new AuthenticationError(
      err.errorMessage ?? `Authentication failed (HTTP ${response.status})`,
    )
  }

  const tokenBody = body as DarajaTokenResponse
  const now = Date.now()
  const expiresIn = parseInt(tokenBody.expires_in, 10) * 1000

  return {
    access_token: tokenBody.access_token,
    token_type: 'Bearer',
    expires_at: now + expiresIn,
    created_at: now,
    environment,
    consumer_key: consumerKey,
  }
}
