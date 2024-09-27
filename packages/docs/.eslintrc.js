module.exports = {
  extends: '../../.eslintrc.js',
  ignorePatterns: ['**/node_modules/*', 'dist/*', 'build/*'],
  overrides: [
    {
      // assuming docusaurus application
      files: '**/pages/**/*.{ts,tsx,js,jsx}',
      rules: {
        'import/no-default-export': 'off', // pages have to have a default export
        'import/prefer-default-export': 'error',
        'react/jsx-filename-extension': [
          'error',
          {
            extensions: ['.tsx', '.jsx'],
          },
        ],
      },
    },
  ],
};
