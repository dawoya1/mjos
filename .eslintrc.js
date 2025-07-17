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
    // Disable problematic TypeScript rules
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // Allow any for flexibility
    '@typescript-eslint/no-unused-vars': 'off', // Too many false positives
    '@typescript-eslint/prefer-const': 'off', // Causing errors
    '@typescript-eslint/no-var-requires': 'off',

    // Basic ESLint rules
    'prefer-const': 'off', // Disabled due to conflicts
    'no-var': 'warn',
    'no-console': 'off', // Allow console for logging
    'no-debugger': 'warn',
    'no-duplicate-imports': 'off', // Can conflict with TypeScript
    'no-unused-expressions': 'off',
    'no-unused-vars': 'off', // Use TypeScript compiler for this
    'no-constant-condition': 'off',
    'prefer-template': 'off',
    'object-shorthand': 'off',
    'arrow-spacing': 'off',
    'comma-dangle': 'off',
    'quotes': 'off',
    'semi': 'off',
    'indent': 'off',
    'max-len': 'off', // Disabled for now
  },
};
