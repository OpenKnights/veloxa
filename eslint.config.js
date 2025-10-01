import { defineConfig } from '@king-3/eslint-config'

const eslintConfig = defineConfig(
  {
    typescript: true
  },
  {
    rules: {
      'regexp/no-unused-capturing-group': 'off'
    }
  }
)

export default eslintConfig
