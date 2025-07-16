module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended'
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'coverage/', '*.backup/', 'node_modules/'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/prefer-const': 'warn',
    '@typescript-eslint/no-var-requires': 'off',
    'prefer-const': 'warn',
    'no-var': 'warn',
    'no-console': 'off', // Allow console for logging
    'no-debugger': 'warn',
    'no-duplicate-imports': 'warn',
    'no-unused-expressions': 'warn',
    'prefer-template': 'warn',
    'object-shorthand': 'warn',
    'arrow-spacing': 'warn',
    'comma-dangle': ['warn', 'never'],
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': ['warn', 'always'],
    'indent': ['warn', 2],
    'max-len': ['warn', { code: 120 }],
  },
};
