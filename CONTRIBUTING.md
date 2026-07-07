# Contributing to Daraja CLI

Thanks for contributing. This document covers everything you need to get a PR merged.

## Prerequisites

- Node.js >= 18
- A Safaricom developer account at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)

## Local setup

```bash
git clone https://github.com/daraja-collective/cli.git
cd cli
npm install
cp .env.example .env   # fill in your sandbox credentials
```

Run the CLI locally without building:

```bash
npm run dev -- --help
npm run dev -- auth token
npm run dev -- stk push --debug
```

## Project structure

```
src/
  errors/       Error types used across the codebase
  config/       Config loading and schema validation
  cache/        Disk-based token cache with TTL
  crypto/       STK password and security credential generation
  api/          Thin wrappers over each Daraja endpoint
  output/       Formatting helpers (pretty, json, table)
  commands/     One folder per CLI command family
tests/
  unit/         Fast, no-network tests
  integration/  Tests that hit the Daraja sandbox (skipped in CI by default)
  fixtures/     Shared mock responses
```

## Commit message format

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow this pattern:

```
<type>(<optional scope>): <description>
```

**Types that trigger a release:**

| Type | What it means | Version bump |
|------|--------------|--------------|
| `feat` | New command or API support | minor (0.1.0 → 0.2.0) |
| `fix` | Bug fix | patch (0.1.0 → 0.1.1) |
| `perf` | Performance improvement | patch |
| `feat!` or `BREAKING CHANGE:` | Breaking API change | major (0.1.0 → 1.0.0) |

**Types that do NOT trigger a release:**

`docs`, `refactor`, `test`, `chore`, `build`, `ci`, `style`

Examples:

```bash
git commit -m "feat(stk): add interactive prompt for missing phone number"
git commit -m "fix(auth): refresh token when TTL is within 5 minutes of expiry"
git commit -m "docs: add B2C usage examples to README"
git commit -m "feat!: rename --env flag to --environment for consistency"
```

## Running tests

```bash
npm test                 # run all unit tests
npm run test:coverage    # with coverage report
npm run test:watch       # watch mode during development
```

Tests live in `tests/unit/`. Every new command or API method needs a corresponding test file.

## Adding a new command

1. Create `src/commands/<name>/index.ts` with a `Command` export
2. Create `src/api/<name>.ts` with the Daraja HTTP call
3. Register the command in `src/index.ts`
4. Write `tests/unit/<name>.test.ts`
5. Add the command to the table in `README.md`

## Adding a new API method

The API layer (`src/api/`) should be a thin wrapper — no business logic, just typed HTTP calls. All business logic goes in the command file or a service if shared across commands.

## Code style

- No `console.log` — use the output helpers in `src/output/`
- Comments only when the WHY isn't obvious from the code
- All HTTP calls go through `DarajaClient` in `src/api/client.ts` — never raw fetch in commands

## Releasing

Releases are fully automated. Merging to `main` triggers semantic-release, which reads your commit messages, bumps the version, updates `CHANGELOG.md`, creates a GitHub Release, and publishes to npm. You don't need to do anything manually.
`