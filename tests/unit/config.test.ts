import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadConfig, requireConfig } from '../../src/config/index.js'
import { ConfigError } from '../../src/errors/index.js'

// Don't touch real ~/.daraja/config.json or local .daraja.json during tests
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    existsSync: () => false,
    readFileSync: (p: string, enc: unknown) => actual.readFileSync(p, enc as BufferEncoding),
  }
})

describe('loadConfig', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('defaults environment to sandbox', () => {
    const config = loadConfig()
    expect(config.environment).toBe('sandbox')
  })

  it('reads consumer key from DARAJA_CONSUMER_KEY env var', () => {
    process.env['DARAJA_CONSUMER_KEY'] = 'env_key'
    const config = loadConfig()
    expect(config.consumerKey).toBe('env_key')
  })

  it('env vars override provided overrides? No — overrides win over env', () => {
    process.env['DARAJA_CONSUMER_KEY'] = 'env_key'
    const config = loadConfig({ consumerKey: 'override_key' })
    expect(config.consumerKey).toBe('override_key')
  })

  it('reads environment from DARAJA_ENVIRONMENT env var', () => {
    process.env['DARAJA_ENVIRONMENT'] = 'production'
    const config = loadConfig()
    expect(config.environment).toBe('production')
  })

  it('ignores invalid DARAJA_ENVIRONMENT values', () => {
    process.env['DARAJA_ENVIRONMENT'] = 'staging'
    const config = loadConfig()
    expect(config.environment).toBe('sandbox')
  })
})

describe('requireConfig', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('throws ConfigError when required fields are missing', () => {
    expect(() => requireConfig()).toThrow(ConfigError)
  })

  it('returns a valid config when all required fields are present', () => {
    const config = requireConfig({
      environment: 'sandbox',
      consumerKey: 'key',
      consumerSecret: 'secret',
      shortcode: '174379',
    })
    expect(config.environment).toBe('sandbox')
    expect(config.consumerKey).toBe('key')
  })

  it('throws ConfigError with a helpful message mentioning daraja init', () => {
    try {
      requireConfig()
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError)
      expect((err as ConfigError).message).toContain('daraja init')
    }
  })
})
