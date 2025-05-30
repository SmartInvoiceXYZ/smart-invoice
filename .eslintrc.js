module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  extends: [
    'airbnb',
    'plugin:mocha/recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
  },
  plugins: ['prettier', 'simple-import-sort', 'react', 'mocha', 'react-hooks'],
  rules: {
    // defaults
    'no-console': [
      'warn',
      {
        allow: ['error'],
      },
    ],
    'no-unused-vars': 'off',

    // exports
    'import/no-default-export': 'off',
    'import/prefer-default-export': 'off',
    'import/prefer-named-exports': 'off',

    // Auto-sort imports
    'sort-imports': 'off',
    'import/order': 'off',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',

    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],

    // REACT
    'react/prop-types': 'off', // disable prop-types
    'react/require-default-props': 'off', // disable require default props
    'react/react-in-jsx-scope': 'off', // react in jsx scope
    'react/jsx-filename-extension': [
      2,
      { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    ],
    'react/function-component-definition': 'off',
    'react/no-array-index-key': 'off',
    'react/jsx-props-no-spreading': 'off',
    'no-use-before-define': 'off',

    // TS
    '@typescript-eslint/no-explicit-any': 'warn', // disable explicit any
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ], // disable unused vars

    // disable form label
    'jsx-a11y/label-has-associated-control': 'off',

    // leverage prettier
    'prettier/prettier': 'error',
  },
  ignorePatterns: [
    '**/node_modules/*',
    'dist/*',
    'tmp/*',
    '.next',
    'packages/graphql/src/zeus/*',
    'apps/subgraph/*',
    'apps/subgraph/subgraph.template.yaml',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: ['tsconfig.base.json', 'packages/**/tsconfig.json'],
      },
      node: {
        project: ['tsconfig.base.json', 'packages/**/tsconfig.json'],
      },
    },
  },
};
