const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
    rules: {
      'no-constant-binary-expression': 'off',
    },
  },
  {
    files: ['test/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
  },
  {
    files: ['static/scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        $: 'readonly',
      },
    },
  },
];


