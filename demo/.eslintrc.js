module.exports = {
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  parser: 'babel-eslint',
  env: {
    es6: true,
    browser: true,
  },
  plugins: ['svelte3'],
  overrides: [
    {
      files: '*.svelte',
      processor: 'svelte3/svelte3',
      extends: 'prettier',
    },
    {
      files: '*.js',
      extends: ['plugin:jest/all', 'plugin:prettier/recommended'],
    },
  ],
  settings: {
    'svelte3/ignore-styles': () => true,
  },
  extends: ['eslint:recommended'],
};
