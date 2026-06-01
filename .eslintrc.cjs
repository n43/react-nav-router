/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'eslint-plugin-tsdoc',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: { react: { version: '18' } },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'tsdoc/syntax': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: [
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        'e2e/**',
        'tests/**',
      ],
      rules: { '@typescript-eslint/no-explicit-any': 'off' },
    },
  ],
  ignorePatterns: [
    'dist/',
    'temp/',
    'coverage/',
    'docs/.vitepress/cache/',
    'docs/.vitepress/dist/',
    'docs/api/',
    'node_modules/',
    'playwright-report/',
    'test-results/',
  ],
};
