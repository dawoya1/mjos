/**
 * Jest Configuration
 * Jest测试配置
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 根目录
  rootDir: '.',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.ts'
  ],

  // TypeScript支持
  preset: 'ts-jest',

  // 模块路径映射
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@memory/(.*)$': '<rootDir>/src/memory/$1',
    '^@team/(.*)$': '<rootDir>/src/team/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@advanced-memory/(.*)$': '<rootDir>/src/advanced-memory/$1',
    '^@advanced-reasoning/(.*)$': '<rootDir>/src/advanced-reasoning/$1',
    '^@fault-tolerance/(.*)$': '<rootDir>/src/fault-tolerance/$1',
    '^@performance/(.*)$': '<rootDir>/src/performance/$1',
    '^@security/(.*)$': '<rootDir>/src/security/$1'
  },

  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!src/examples/**',
    '!src/mcp/**' // 排除MCP服务器
  ],

  // 覆盖率报告
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

  // 覆盖率输出目录
  coverageDirectory: 'coverage',

  // 测试超时
  testTimeout: 30000,

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 忽略的文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '.*\\.backup/',
    '/src/.*\\.backup/'
  ],

  // 转换配置
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json'],

  // 详细输出
  verbose: true,

  // 错误时停止
  bail: false,

  // 并行测试
  maxWorkers: '50%',

  // 缓存
  cache: true,

  // 清除模拟
  clearMocks: true,

  // 恢复模拟
  restoreMocks: true,

  // 全局变量
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};
