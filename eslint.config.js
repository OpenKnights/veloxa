import { defineConfig } from '@king-3/eslint-config'

export default defineConfig(
  {
    typescript: true
  },
  {
    rules: {
      'regexp/no-unused-capturing-group': 'off'
    }
  }
)
