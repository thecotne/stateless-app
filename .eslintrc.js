module.exports = {
  extends: 'standard',
  plugins: [
    'only-warn',
    'sort-imports-es6-autofix'
  ],
  settings: {
    react: {
      version: '17.0'
    }
  },
  env: {
    browser: true
  },
  overrides: [{
    files: ['*.ts', '*.tsx'],
    parser: '@typescript-eslint/parser',
    plugins: [
      '@typescript-eslint',
      'react-hooks'
    ],
    extends: [
      'standard-with-typescript',
      // 'plugin:@typescript-eslint/recommended',
      'standard-jsx',
      'standard-react',
      'plugin:react-hooks/recommended',
      'plugin:react/recommended'
    ],
    parserOptions: {
      project: ['./workspaces/frontend/tsconfig.json', './workspaces/producers/tsconfig.json']
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': ['off'],
      '@typescript-eslint/no-invalid-void-type': ['off'],
      '@typescript-eslint/require-array-sort-compare': ['error', { ignoreStringArrays: true }],
      'react/jsx-no-useless-fragment': 'error',
      'react/no-typos': 'error',
      'react/react-in-jsx-scope': 'off'
    }
  }, {
    files: ['*'],
    rules: {
      'no-invalid-this': ['error', { capIsConstructor: false }],
      'no-void': 'off',
      camelcase: 'off',
      'dot-notation': 'error',
      'sort-imports-es6-autofix/sort-imports-es6': ['error', {
        ignoreCase: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single']
      }],
      'arrow-parens': ['error', 'as-needed'],
      'import/newline-after-import': 'error',
      'object-curly-spacing': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'quote-props': ['error', 'as-needed', { numbers: true }],
      'no-restricted-properties': ['error', {
        object: 'console',
        property: 'log',
        message: 'Don\'t leave console.log\'s in your code'
      }]
    }
  }]
}
