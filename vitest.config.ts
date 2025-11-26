import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Global test setup
    setupFiles: ['./test/setup.ts'],

    // Test environment
    environment: 'node',

    // Test timeout
    testTimeout: 10000,

    // Listening mode
    watch: false,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts'
      ]
    },

    // Include test files
    include: ['test/**/*.test.ts'],

    // Exclude files
    exclude: ['node_modules/', 'dist/', '.idea/', '.git/', '.cache/'],

    // Globals
    globals: true,

    // Reporter
    reporters: ['verbose'],

    // Retry failed tests
    retry: 0,

    // Run tests in parallel
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  }
})
