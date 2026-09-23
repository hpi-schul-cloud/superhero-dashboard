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
    files: ['static/scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        $: 'readonly',
      },
    },
  },
];


