import { describe, it, expect } from 'vitest'
import {
  DarajaError,
  AuthenticationError,
  ConfigError,
  ValidationError,
  NetworkError,
  DarajaApiError,
} from '../../src/errors/index.js'

describe('error hierarchy', () => {
  it('DarajaError sets name and code', () => {
    const err = new DarajaError('something failed', 'TEST_CODE')
    expect(err.name).toBe('DarajaError')
    expect(err.code).toBe('TEST_CODE')
    expect(err.message).toBe('something failed')
    expect(err).toBeInstanceOf(Error)
  })

  it('AuthenticationError is a DarajaError with AUTH_ERROR code', () => {
    const err = new AuthenticationError('bad credentials')
    expect(err).toBeInstanceOf(DarajaError)
    expect(err.code).toBe('AUTH_ERROR')
    expect(err.name).toBe('AuthenticationError')
  })

  it('ConfigError is a DarajaError with CONFIG_ERROR code', () => {
    const err = new ConfigError('missing shortcode')
    expect(err).toBeInstanceOf(DarajaError)
    expect(err.code).toBe('CONFIG_ERROR')
  })

  it('ValidationError carries optional field name', () => {
    const err = new ValidationError('invalid phone', 'phone')
    expect(err).toBeInstanceOf(DarajaError)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.field).toBe('phone')
  })

  it('NetworkError carries optional status code', () => {
    const err = new NetworkError('timeout', 408)
    expect(err).toBeInstanceOf(DarajaError)
    expect(err.statusCode).toBe(408)
  })

  it('DarajaApiError carries resultCode', () => {
    const err = new DarajaApiError('initiator invalid', '1', 'req-001')
    expect(err).toBeInstanceOf(DarajaError)
    expect(err.resultCode).toBe('1')
    expect(err.requestId).toBe('req-001')
  })
})
