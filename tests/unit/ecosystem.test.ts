import { describe, it, expect } from 'vitest'
import {
  REGISTRY,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  TIER_LABELS,
  ALL_FEATURES,
  FEATURE_LABELS,
  getBestSDKForLanguage,
  getSDKsForLanguage,
  getSDKsByTier,
  type Tier,
} from '../../src/commands/ecosystem/registry.js'

// ─── Registry integrity ───────────────────────────────────────────────────────

describe('REGISTRY', () => {
  it('is a non-empty array', () => {
    expect(REGISTRY.length).toBeGreaterThan(0)
  })

  it('every entry has all required fields', () => {
    for (const sdk of REGISTRY) {
      expect(sdk.language,     `${sdk.name}: missing language`).toBeTruthy()
      expect(sdk.languageLabel,`${sdk.name}: missing languageLabel`).toBeTruthy()
      expect(sdk.name,         `${sdk.name}: missing name`).toBeTruthy()
      expect(sdk.tier,         `${sdk.name}: missing tier`).toBeDefined()
      expect(sdk.status,       `${sdk.name}: missing status`).toBeTruthy()
      expect(sdk.maintainer,   `${sdk.name}: missing maintainer`).toBeTruthy()
      expect(sdk.registry,     `${sdk.name}: missing registry`).toBeTruthy()
      expect(sdk.installCmd,   `${sdk.name}: missing installCmd`).toBeTruthy()
      expect(sdk.importExample,`${sdk.name}: missing importExample`).toBeTruthy()
      expect(sdk.features,     `${sdk.name}: missing features`).toBeDefined()
      expect(sdk.description,  `${sdk.name}: missing description`).toBeTruthy()
      expect(sdk.url,          `${sdk.name}: missing url`).toBeTruthy()
    }
  })

  it('all tiers are valid values (1–4)', () => {
    for (const sdk of REGISTRY) {
      expect([1, 2, 3, 4]).toContain(sdk.tier)
    }
  })

  it('all statuses are valid values', () => {
    const validStatuses = ['stable', 'beta', 'planned', 'community', 'unmaintained']
    for (const sdk of REGISTRY) {
      expect(validStatuses).toContain(sdk.status)
    }
  })

  it('all maintainer values are valid', () => {
    for (const sdk of REGISTRY) {
      expect(['official', 'community']).toContain(sdk.maintainer)
    }
  })

  it('all features listed in each SDK are members of ALL_FEATURES', () => {
    for (const sdk of REGISTRY) {
      for (const feature of sdk.features) {
        expect(ALL_FEATURES).toContain(feature)
      }
    }
  })

  it('official SDKs (maintainer=official) are Tier 1 or Tier 2', () => {
    for (const sdk of REGISTRY.filter((s) => s.maintainer === 'official')) {
      expect(sdk.tier).toBeLessThanOrEqual(2)
    }
  })

  it('community SDKs (maintainer=community) are Tier 3 or Tier 4', () => {
    for (const sdk of REGISTRY.filter((s) => s.maintainer === 'community')) {
      expect(sdk.tier).toBeGreaterThanOrEqual(3)
    }
  })

  it('Tier 1 SDKs cover all features', () => {
    for (const sdk of REGISTRY.filter((s) => s.tier === 1)) {
      expect(sdk.features).toHaveLength(ALL_FEATURES.length)
    }
  })

  it('has at least one Tier 1 official SDK', () => {
    const tier1 = REGISTRY.filter((s) => s.tier === 1 && s.maintainer === 'official')
    expect(tier1.length).toBeGreaterThan(0)
  })

  it('has official SDKs for Node.js and Python', () => {
    const official = REGISTRY.filter((s) => s.maintainer === 'official')
    const langs = official.map((s) => s.language)
    expect(langs).toContain('node')
    expect(langs).toContain('python')
  })
})

// ─── getSDKsForLanguage ───────────────────────────────────────────────────────

describe('getSDKsForLanguage', () => {
  it('returns SDKs for node', () => {
    const sdks = getSDKsForLanguage('node')
    expect(sdks.length).toBeGreaterThan(0)
    expect(sdks.every((s) => s.language === 'node')).toBe(true)
  })

  it('returns SDKs for python', () => {
    const sdks = getSDKsForLanguage('python')
    expect(sdks.length).toBeGreaterThan(0)
    expect(sdks.every((s) => s.language === 'python')).toBe(true)
  })

  it('returns an empty array for an unknown language', () => {
    const sdks = getSDKsForLanguage('cobol')
    expect(sdks).toEqual([])
  })

  it('returns multiple SDKs when more than one exists for a language', () => {
    // Node.js has both an official and a community SDK
    const sdks = getSDKsForLanguage('node')
    expect(sdks.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── getBestSDKForLanguage ────────────────────────────────────────────────────

describe('getBestSDKForLanguage', () => {
  it('returns the lowest-tier SDK for node', () => {
    const best = getBestSDKForLanguage('node')
    expect(best).toBeDefined()
    // Official node SDK is Tier 1 — it should win over community Tier 3
    expect(best!.tier).toBe(1)
  })

  it('returns the lowest-tier SDK for python', () => {
    const best = getBestSDKForLanguage('python')
    expect(best).toBeDefined()
    expect(best!.tier).toBe(1)
  })

  it('returns the lowest-tier SDK for php', () => {
    const best = getBestSDKForLanguage('php')
    expect(best).toBeDefined()
    // Official PHP SDK is Tier 2; community is Tier 3
    expect(best!.tier).toBeLessThanOrEqual(2)
  })

  it('returns undefined for an unknown language', () => {
    const best = getBestSDKForLanguage('cobol')
    expect(best).toBeUndefined()
  })

  it('always picks the lowest tier number when multiple SDKs exist', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const sdks = getSDKsForLanguage(lang)
      if (sdks.length < 2) continue
      const best = getBestSDKForLanguage(lang)
      const minTier = Math.min(...sdks.map((s) => s.tier))
      expect(best!.tier).toBe(minTier)
    }
  })
})

// ─── getSDKsByTier ────────────────────────────────────────────────────────────

describe('getSDKsByTier', () => {
  it('returns only Tier 1 SDKs', () => {
    const sdks = getSDKsByTier(1)
    expect(sdks.every((s) => s.tier === 1)).toBe(true)
  })

  it('returns only Tier 3 SDKs', () => {
    const sdks = getSDKsByTier(3)
    expect(sdks.every((s) => s.tier === 3)).toBe(true)
  })

  it('all tiers return a non-empty list', () => {
    for (const tier of [1, 2, 3, 4] as Tier[]) {
      expect(getSDKsByTier(tier).length).toBeGreaterThan(0)
    }
  })
})

// ─── SUPPORTED_LANGUAGES ─────────────────────────────────────────────────────

describe('SUPPORTED_LANGUAGES', () => {
  it('is derived from the registry (no manual duplication)', () => {
    const fromRegistry = [...new Set(REGISTRY.map((s) => s.language))]
    expect(SUPPORTED_LANGUAGES).toEqual(fromRegistry)
  })

  it('includes all major languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('node')
    expect(SUPPORTED_LANGUAGES).toContain('python')
    expect(SUPPORTED_LANGUAGES).toContain('php')
    expect(SUPPORTED_LANGUAGES).toContain('go')
    expect(SUPPORTED_LANGUAGES).toContain('ruby')
  })
})

// ─── Metadata ─────────────────────────────────────────────────────────────────

describe('LANGUAGE_LABELS', () => {
  it('has a label for every supported language', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(LANGUAGE_LABELS[lang]).toBeTruthy()
    }
  })
})

describe('TIER_LABELS', () => {
  it('has a label for tiers 1–4', () => {
    for (const tier of [1, 2, 3, 4] as Tier[]) {
      expect(TIER_LABELS[tier]).toBeTruthy()
    }
  })
})

describe('ALL_FEATURES and FEATURE_LABELS', () => {
  it('FEATURE_LABELS has an entry for every feature in ALL_FEATURES', () => {
    for (const feature of ALL_FEATURES) {
      expect(FEATURE_LABELS[feature]).toBeTruthy()
    }
  })

  it('ALL_FEATURES includes the core M-Pesa features', () => {
    expect(ALL_FEATURES).toContain('stk-push')
    expect(ALL_FEATURES).toContain('c2b')
    expect(ALL_FEATURES).toContain('b2c')
    expect(ALL_FEATURES).toContain('b2b')
  })
})
