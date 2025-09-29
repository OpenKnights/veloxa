import king3 from '@king-3/eslint-config'

const eslintConfig = king3(
  {
    typescript: true
  },
  {
    name: 'custom-rules',
    rules: {
      /* regpexp */
      'regexp/no-unused-capturing-group': 'off'
    }
  }
)

export default eslintConfig
