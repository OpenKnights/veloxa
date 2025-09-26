import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 超时配置
    testTimeout: 10000, // 10 秒

    // 监听模式配置
    watch: false
  }
})
