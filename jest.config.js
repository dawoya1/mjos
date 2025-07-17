module.exports = {
  // 预设配置
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // 根目录
  rootDir: '.',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts'
  ],
  
  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@memory/(.*)$': '<rootDir>/src/memory/$1',
    '^@team/(.*)$': '<rootDir>/src/team/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  },
  
  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // 转换配置
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // 超时设置
  testTimeout: 30000,

  // 详细输出
  verbose: true,

  // 强制退出以避免进程挂起
  forceExit: true,

  // 检测打开的句柄
  detectOpenHandles: true,

  // 最大工作进程数
  maxWorkers: 1
};