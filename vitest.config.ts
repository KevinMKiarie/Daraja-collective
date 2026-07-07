import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      // Commands are CLI integration-level code — testing them requires
      // mocking the full commander.js action pipeline. They are covered
      // by integration tests, not unit tests.
      exclude: ['src/index.ts', 'src/global.d.ts', 'src/commands/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
