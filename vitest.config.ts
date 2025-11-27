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

    // Include test files
    include: ['test/**/*.test.ts'],

    // Exclude files
    exclude: ['node_modules/', 'dist/', '.idea/', '.git/', '.cache/'],

    // Globals
    globals: true,

    // Run tests in parallel
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  }
})
