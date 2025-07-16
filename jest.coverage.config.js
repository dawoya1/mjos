/**
 * Jest Configuration with Coverage
 * Jest配置（包含覆盖率）
 */

module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  
  // 测试文件匹配
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'dist/**/*.js',
    '!dist/**/*.d.ts',
    '!dist/**/__tests__/**',
    '!dist/**/node_modules/**'
  ],
  
  // 覆盖率报告
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'json'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  verbose: true,
  
  // 忽略的文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/.backup/'
  ]
};
