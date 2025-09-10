module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended'
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es6: true
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-useless-escape': 'warn',
    'no-undef': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.js', '**/tests/**/*.ts', '**/tests/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.js'
  ]
};
