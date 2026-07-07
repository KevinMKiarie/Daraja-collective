import { describe, it, expect } from 'vitest'
import { generateStkPassword, normalizePhone, formatAmount } from '../../src/crypto/index.js'
import { ValidationError } from '../../src/errors/index.js'

describe('generateStkPassword', () => {
  it('returns a base64 string and a 14-digit timestamp', () => {
    const { password, timestamp } = generateStkPassword('174379', 'testpasskey')
    expect(timestamp).toMatch(/^\d{14}$/)
    const decoded = Buffer.from(password, 'base64').toString('utf-8')
    expect(decoded).toContain('174379')
    expect(decoded).toContain('testpasskey')
    expect(decoded).toContain(timestamp)
  })

  it('encodes shortcode + passkey + timestamp in that order', () => {
    const shortcode = '174379'
    const passkey = 'abc'
    const { password, timestamp } = generateStkPassword(shortcode, passkey)
    const expected = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
    expect(password).toBe(expected)
  })
})

describe('normalizePhone', () => {
  it('accepts 0712345678 format', () => {
    expect(normalizePhone('0712345678')).toBe('254712345678')
  })

  it('accepts +254712345678 format', () => {
    expect(normalizePhone('+254712345678')).toBe('254712345678')
  })

  it('accepts 254712345678 format unchanged', () => {
    expect(normalizePhone('254712345678')).toBe('254712345678')
  })

  it('accepts 9-digit number without country code', () => {
    expect(normalizePhone('712345678')).toBe('254712345678')
  })

  it('strips spaces and dashes before normalizing', () => {
    expect(normalizePhone('0712 345 678')).toBe('254712345678')
    expect(normalizePhone('0712-345-678')).toBe('254712345678')
  })

  it('throws ValidationError for an unrecognised format', () => {
    expect(() => normalizePhone('12345')).toThrow(ValidationError)
    expect(() => normalizePhone('hello')).toThrow(ValidationError)
  })
})

describe('formatAmount', () => {
  it('formats whole numbers with KES prefix', () => {
    expect(formatAmount(1000)).toBe('KES 1,000')
  })

  it('handles small amounts', () => {
    expect(formatAmount(1)).toBe('KES 1')
  })
})
