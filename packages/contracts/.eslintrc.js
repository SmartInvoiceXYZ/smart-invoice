module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  extends: ['../../.eslintrc.js'],
  plugins: ['@typescript-eslint', 'simple-import-sort'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'sort-imports': 'off',
    'import/order': 'off',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'no-console': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'prefer-arrow-callback': 'off',
    'import/no-default-export': 'off',
    'func-names': 'off',
  },
};
