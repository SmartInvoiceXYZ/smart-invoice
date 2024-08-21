module.exports = {
  rules: {
    "@typescript-eslint/no-var-requires": "off",
  },
  overrides: [
    {
      files: "**/test/**/*.{ts,tsc,tsx,js,jsx}",
      rules: {
        "prefer-arrow-callback": "off",
        // mocha recommended defaults
        "func-names": "off",
      },
    },
  ],
};
