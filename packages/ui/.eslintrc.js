module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off',
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
