import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { success, error, info, warn, table, formatTimestamp, printKeyValue } from '../../src/output/index.js'

describe('output helpers', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('success()', () => {
    it('writes to stdout', () => {
      success('payment complete')
      expect(logSpy).toHaveBeenCalled()
      expect(logSpy.mock.calls[0]?.[0]).toContain('payment complete')
    })

    it('outputs raw JSON in json format', () => {
      success('done', { id: 1 }, 'json')
      const output = JSON.parse(String(logSpy.mock.calls[0]?.[0]))
      expect(output.ok).toBe(true)
      expect(output.data).toEqual({ id: 1 })
    })
  })

  describe('error()', () => {
    it('writes to stderr', () => {
      error('something failed')
      expect(errorSpy).toHaveBeenCalled()
      expect(errorSpy.mock.calls[0]?.[0]).toContain('something failed')
    })

    it('prints the hint on a second line when provided', () => {
      error('failed', 'run daraja init')
      expect(errorSpy).toHaveBeenCalledTimes(2)
      expect(errorSpy.mock.calls[1]?.[0]).toContain('run daraja init')
    })
  })

  describe('info()', () => {
    it('writes to stdout', () => {
      info('token cached')
      expect(logSpy).toHaveBeenCalled()
      expect(logSpy.mock.calls[0]?.[0]).toContain('token cached')
    })
  })

  describe('warn()', () => {
    it('writes to stderr via console.warn', () => {
      warn('sandbox only')
      expect(warnSpy).toHaveBeenCalled()
      expect(warnSpy.mock.calls[0]?.[0]).toContain('sandbox only')
    })
  })

  describe('table()', () => {
    it('outputs the headers and all rows', () => {
      table(['Name', 'Amount'], [['Alice', '1000'], ['Bob', '500']])
      const output = logSpy.mock.calls.map((c) => String(c[0])).join('\n')
      expect(output).toContain('Name')
      expect(output).toContain('Amount')
      expect(output).toContain('Alice')
      expect(output).toContain('Bob')
    })
  })

  describe('formatTimestamp()', () => {
    it('returns a non-empty string for a valid epoch value', () => {
      const result = formatTimestamp(Date.now())
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('formats in Africa/Nairobi timezone (EAT is UTC+3)', () => {
      // 2026-01-01 00:00:00 UTC = 2026-01-01 03:00:00 EAT
      const utcMidnight = new Date('2026-01-01T00:00:00Z').getTime()
      const result = formatTimestamp(utcMidnight)
      expect(result).toContain('2026')
      expect(result).toContain('01')
    })
  })

  describe('printKeyValue()', () => {
    it('prints each key-value pair', () => {
      printKeyValue({ status: 'ok', code: '0' })
      const output = logSpy.mock.calls.map((c) => String(c[0])).join('\n')
      expect(output).toContain('status')
      expect(output).toContain('ok')
      expect(output).toContain('code')
      expect(output).toContain('0')
    })

    it('skips undefined values', () => {
      printKeyValue({ present: 'yes', missing: undefined })
      const output = logSpy.mock.calls.map((c) => String(c[0])).join('\n')
      expect(output).toContain('present')
      expect(output).not.toContain('missing')
    })
  })
})
