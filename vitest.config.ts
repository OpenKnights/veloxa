import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false,
    testTimeout: 60_000
  }
})
