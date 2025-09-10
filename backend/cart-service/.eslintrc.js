module.exports = {
  extends: ['../../.eslintrc.js'],
  ignorePatterns: [
    'dist/',
    'node_modules/'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_|^this$',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        args: 'after-used',
        ignoreRestSiblings: true
      }
    ]
  }
};
