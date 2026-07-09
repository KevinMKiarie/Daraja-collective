export type Tier = 1 | 2 | 3 | 4
export type SDKStatus = 'stable' | 'beta' | 'planned' | 'community' | 'unmaintained'
export type Maintainer = 'official' | 'community'

export type Feature =
  | 'stk-push'
  | 'c2b'
  | 'b2c'
  | 'b2b'
  | 'balance'
  | 'status'
  | 'reversal'
  | 'qr'
  | 'ratiba'
  | 'tax'
  | 'bill'

export const FEATURE_LABELS: Record<Feature, string> = {
  'stk-push': 'STK Push',
  'c2b':      'C2B (receive payments)',
  'b2c':      'B2C (pay customers)',
  'b2b':      'B2B (business payments)',
  'balance':  'Account Balance',
  'status':   'Transaction Status',
  'reversal': 'Reversal',
  'qr':       'QR Code',
  'ratiba':   'Standing Orders (Ratiba)',
  'tax':      'Tax Remittance (KRA)',
  'bill':     'Bill Manager',
}

export const ALL_FEATURES: Feature[] = [
  'stk-push', 'c2b', 'b2c', 'b2b', 'balance', 'status', 'reversal', 'qr', 'ratiba', 'tax', 'bill',
]

export interface SDK {
  language: string
  languageLabel: string
  name: string
  tier: Tier
  status: SDKStatus
  maintainer: Maintainer
  registry: string
  installCmd: string
  importExample: string
  features: Feature[]
  description: string
  url: string
  note?: string
}

export const TIER_LABELS: Record<Tier, string> = {
  1: 'Tier 1 — Official (full coverage)',
  2: 'Tier 2 — Official (core coverage)',
  3: 'Tier 3 — Community (verified)',
  4: 'Tier 4 — Community (unverified)',
}

export const TIER_COLORS: Record<Tier, string> = {
  1: 'green',
  2: 'cyan',
  3: 'yellow',
  4: 'dim',
}

export const REGISTRY: SDK[] = [
  // ─── Tier 1: Official, full coverage ──────────────────────────────────────
  {
    language: 'node',
    languageLabel: 'Node.js / TypeScript',
    name: '@daraja/node',
    tier: 1,
    status: 'planned',
    maintainer: 'official',
    registry: 'npm',
    installCmd: 'npm install @daraja/node',
    importExample: "import { DarajaClient } from '@daraja/node'",
    features: ALL_FEATURES,
    description: 'Official Node.js SDK with full TypeScript types, token caching, and all Daraja APIs.',
    url: 'https://github.com/KevinMKiarie/Daraja-collective',
    note: 'Coming soon — use `daraja serve` in the meantime',
  },
  {
    language: 'python',
    languageLabel: 'Python',
    name: 'daraja-python',
    tier: 1,
    status: 'planned',
    maintainer: 'official',
    registry: 'PyPI',
    installCmd: 'pip install daraja-python',
    importExample: 'from daraja import DarajaClient',
    features: ALL_FEATURES,
    description: 'Official Python SDK with async support (httpx), Pydantic models, and full API coverage.',
    url: 'https://github.com/KevinMKiarie/Daraja-collective',
    note: 'Coming soon — use `daraja serve` in the meantime',
  },

  // ─── Tier 2: Official, core coverage ──────────────────────────────────────
  {
    language: 'php',
    languageLabel: 'PHP',
    name: 'daraja-php',
    tier: 2,
    status: 'planned',
    maintainer: 'official',
    registry: 'Packagist',
    installCmd: 'composer require daraja/daraja-php',
    importExample: "use Daraja\\DarajaClient;",
    features: ['stk-push', 'c2b', 'b2c', 'b2b', 'balance', 'status', 'reversal', 'qr'],
    description: 'Official PHP SDK with Laravel facade support, PSR-18 HTTP client, and core Daraja APIs.',
    url: 'https://github.com/KevinMKiarie/Daraja-collective',
    note: 'Coming soon — use `daraja serve` in the meantime',
  },
  {
    language: 'go',
    languageLabel: 'Go',
    name: 'daraja-go',
    tier: 2,
    status: 'planned',
    maintainer: 'official',
    registry: 'pkg.go.dev',
    installCmd: 'go get github.com/daraja-collective/daraja-go',
    importExample: 'import "github.com/daraja-collective/daraja-go"',
    features: ['stk-push', 'c2b', 'b2c', 'b2b', 'balance', 'status', 'reversal'],
    description: 'Official Go module with idiomatic error handling, context support, and token caching.',
    url: 'https://github.com/KevinMKiarie/Daraja-collective',
    note: 'Coming soon — use `daraja serve` in the meantime',
  },

  // ─── Tier 3: Community, verified ──────────────────────────────────────────
  {
    language: 'node',
    languageLabel: 'Node.js',
    name: 'mpesa-node',
    tier: 3,
    status: 'community',
    maintainer: 'community',
    registry: 'npm',
    installCmd: 'npm install mpesa-node',
    importExample: "const Mpesa = require('mpesa-node')",
    features: ['stk-push', 'c2b', 'b2c', 'b2b', 'balance', 'reversal'],
    description: 'Community Node.js package with basic M-Pesa Daraja API support.',
    url: 'https://www.npmjs.com/package/mpesa-node',
  },
  {
    language: 'php',
    languageLabel: 'PHP / Laravel',
    name: 'iankibet/daraja',
    tier: 3,
    status: 'community',
    maintainer: 'community',
    registry: 'Packagist',
    installCmd: 'composer require iankibet/daraja',
    importExample: "use Iankibet\\Daraja\\Facades\\Daraja;",
    features: ['stk-push', 'c2b', 'b2c', 'balance'],
    description: 'Community Laravel package for Daraja with Facade support and config publishing.',
    url: 'https://packagist.org/packages/iankibet/daraja',
  },
  {
    language: 'python',
    languageLabel: 'Python',
    name: 'mpesa-sdk-python',
    tier: 3,
    status: 'community',
    maintainer: 'community',
    registry: 'PyPI',
    installCmd: 'pip install mpesa-sdk-python',
    importExample: 'from mpesa_sdk import MpesaClient',
    features: ['stk-push', 'c2b', 'b2c'],
    description: 'Community Python package for M-Pesa Daraja API integration.',
    url: 'https://pypi.org/project/mpesa-sdk-python/',
  },
  {
    language: 'ruby',
    languageLabel: 'Ruby / Rails',
    name: 'mpesa',
    tier: 3,
    status: 'community',
    maintainer: 'community',
    registry: 'RubyGems',
    installCmd: "gem 'mpesa'  # Gemfile",
    importExample: "require 'mpesa'",
    features: ['stk-push', 'c2b'],
    description: 'Community Ruby gem for M-Pesa STK Push and C2B integration.',
    url: 'https://rubygems.org/gems/mpesa',
  },
  {
    language: 'java',
    languageLabel: 'Java / Spring Boot',
    name: 'mpesa-spring-boot-starter',
    tier: 3,
    status: 'community',
    maintainer: 'community',
    registry: 'Maven Central',
    installCmd: '<dependency>io.github.xyz:mpesa-spring-boot-starter</dependency>',
    importExample: '@Autowired private MpesaService mpesaService;',
    features: ['stk-push', 'c2b'],
    description: 'Community Spring Boot starter for M-Pesa STK Push and C2B.',
    url: 'https://mvnrepository.com',
    note: 'Limited coverage — use `daraja serve` for full API access',
  },

  // ─── Tier 4: Community, unverified ────────────────────────────────────────
  {
    language: 'dotnet',
    languageLabel: 'C# / .NET',
    name: 'MpesaDaraja.NET',
    tier: 4,
    status: 'community',
    maintainer: 'community',
    registry: 'NuGet',
    installCmd: 'dotnet add package MpesaDaraja.NET',
    importExample: 'using MpesaDaraja;',
    features: ['stk-push', 'c2b', 'b2c'],
    description: 'Community .NET package for M-Pesa Daraja API.',
    url: 'https://www.nuget.org/',
    note: 'Verify activity before use — use `daraja serve` for guaranteed coverage',
  },
  {
    language: 'rust',
    languageLabel: 'Rust',
    name: 'mpesa-rust',
    tier: 4,
    status: 'community',
    maintainer: 'community',
    registry: 'crates.io',
    installCmd: 'mpesa-rust = "0.1"  # Cargo.toml',
    importExample: 'use mpesa::Mpesa;',
    features: ['stk-push', 'c2b'],
    description: 'Community Rust crate for basic M-Pesa integration.',
    url: 'https://crates.io/',
    note: 'Alpha quality — use `daraja serve` for production use',
  },

  // ─── No native SDK yet — use daraja serve ─────────────────────────────────
  {
    language: 'elixir',
    languageLabel: 'Elixir',
    name: 'daraja serve (REST proxy)',
    tier: 2,
    status: 'stable',
    maintainer: 'official',
    registry: '-',
    installCmd: 'npm install -g @daraja/cli && daraja serve',
    importExample: 'import httpx  # or any HTTP client',
    features: ['stk-push', 'c2b', 'b2c', 'b2b', 'balance', 'status', 'reversal', 'qr', 'ratiba', 'tax', 'bill'],
    description: 'No native Elixir SDK yet. Use daraja serve to expose all Daraja APIs as a local REST proxy — call it from any Elixir/Phoenix app with HTTPoison or Tesla.',
    url: 'https://github.com/KevinMKiarie/Daraja-collective',
    note: 'daraja generate phoenix gives you ready-to-paste Phoenix controller code',
  },
  {
    language: 'kotlin',
    languageLabel: 'Kotlin',
    name: 'daraja serve (REST proxy)',
    tier: 2,
    status: 'stable',
    maintainer: 'official',
    registry: '-',
    installCmd: 'npm install -g @daraja/cli && daraja serve',
    importExample: 'val client = HttpClient(CIO)',
    features: ['stk-push', 'c2b', 'b2c', 'b2b', 'balance', 'status', 'reversal', 'qr', 'ratiba', 'tax', 'bill'],
    description: 'No native Kotlin SDK yet. Use daraja serve as a REST proxy — call it from Ktor or Spring Boot with OkHttp, Ktor HttpClient, or RestTemplate.',
    url: 'https://github.com/KevinMKiarie/Daraja-collective',
    note: 'daraja generate ktor / daraja generate spring gives you ready-to-paste handler code',
  },
  {
    language: 'swift',
    languageLabel: 'Swift',
    name: 'daraja serve (REST proxy)',
    tier: 2,
    status: 'stable',
    maintainer: 'official',
    registry: '-',
    installCmd: 'npm install -g @daraja/cli && daraja serve',
    importExample: 'let task = URLSession.shared.dataTask(...)',
    features: ['stk-push', 'c2b', 'b2c', 'b2b', 'balance', 'status', 'reversal', 'qr'],
    description: 'No native Swift SDK yet. Use daraja serve as a REST proxy — call it from Vapor or a Swift app using URLSession or AsyncHTTPClient.',
    url: 'https://github.com/KevinMKiarie/Daraja-collective',
    note: 'daraja generate vapor gives you ready-to-paste Vapor controller code',
  },
  {
    language: 'dart',
    languageLabel: 'Dart / Flutter',
    name: 'daraja serve (REST proxy)',
    tier: 2,
    status: 'stable',
    maintainer: 'official',
    registry: '-',
    installCmd: 'npm install -g @daraja/cli && daraja serve',
    importExample: "import 'package:http/http.dart' as http;",
    features: ['stk-push', 'c2b', 'b2c', 'b2b', 'balance', 'status', 'reversal', 'qr'],
    description: 'No native Dart SDK yet. Use daraja serve as a REST proxy — call it from Flutter or Dart server apps using the http or dio package.',
    url: 'https://github.com/KevinMKiarie/Daraja-collective',
    note: 'Avoid calling Daraja directly from Flutter — credentials would be exposed in the client',
  },
]

export function getSDKsForLanguage(language: string): SDK[] {
  return REGISTRY.filter((s) => s.language === language)
}

export function getBestSDKForLanguage(language: string): SDK | undefined {
  const sdks = getSDKsForLanguage(language)
  if (sdks.length === 0) return undefined
  return sdks.sort((a, b) => a.tier - b.tier)[0]
}

export function getSDKsByTier(tier: Tier): SDK[] {
  return REGISTRY.filter((s) => s.tier === tier)
}

export const SUPPORTED_LANGUAGES = [...new Set(REGISTRY.map((s) => s.language))]

export const LANGUAGE_LABELS: Record<string, string> = {
  node:   'Node.js / TypeScript',
  python: 'Python',
  php:    'PHP',
  go:     'Go',
  ruby:   'Ruby',
  java:   'Java',
  dotnet: 'C# / .NET',
  rust:   'Rust',
  elixir: 'Elixir',
  kotlin: 'Kotlin',
  swift:  'Swift',
  dart:   'Dart / Flutter',
  other:  'Other / not listed',
}
