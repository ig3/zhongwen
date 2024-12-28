'use strict';

const eslintConfigEntrain = require('@ig3/eslint-config-entrain');
const globals = require('globals');

module.exports = [
  ...eslintConfigEntrain,
  {
    languageOptions: {
      sourceType: 'module',
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        ...globals.browser,
        ...globals.jquery,
        ...globals.webextensions,
      }
    },
  },
];
