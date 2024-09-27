module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: ['../../.eslintrc.js', 'plugin:@next/next/recommended'],
  rules: {
    'no-use-before-define': 'off',
    'import/no-default-export': 'off',
  },
  overrides: [
    {
      files: '**/test/**/*.{ts,tsc,tsx,js,jsx}',
      rules: {
        'prefer-arrow-callback': 'off',
        // mocha recommended defaults
        'func-names': 'off',
      },
    },
  ],
};
