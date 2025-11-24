import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Timeout
    testTimeout: 10000,

    // Listening mode
    watch: false
  }
})
