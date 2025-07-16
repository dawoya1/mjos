/**
 * Simple Jest Configuration
 * 简化Jest配置
 */

module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/**/*.test.js'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.js',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!src/**/*.backup/**',
    '!src/**/*.backup/*'
  ],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  verbose: true
};
