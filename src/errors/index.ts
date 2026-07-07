export class DarajaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'DarajaError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class AuthenticationError extends DarajaError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class ConfigError extends DarajaError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR')
    this.name = 'ConfigError'
  }
}

export class ValidationError extends DarajaError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NetworkError extends DarajaError {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

// Daraja returned a non-zero ResultCode or ResponseCode in the body
export class DarajaApiError extends DarajaError {
  constructor(
    message: string,
    public readonly resultCode: string,
    public readonly requestId?: string,
  ) {
    super(message, 'DARAJA_API_ERROR')
    this.name = 'DarajaApiError'
  }
}
