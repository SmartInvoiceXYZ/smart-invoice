module.exports = {
  extends: ['../../.eslintrc.js'],
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
