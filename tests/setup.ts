/**
 * Jest Test Setup
 * 测试环境设置
 */

// 设置测试超时
jest.setTimeout(30000);

// 全局测试配置
global.console = {
  ...console,
  // 在测试中静默某些日志
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// 模拟环境变量
process.env.NODE_ENV = 'test';
process.env.MJOS_LOG_LEVEL = 'error';

// 全局测试工具
(global as any).testUtils = {
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  randomString: () => Math.random().toString(36).substring(7),
  randomNumber: (min: number = 0, max: number = 100) =>
    Math.floor(Math.random() * (max - min + 1)) + min
};

// 测试前清理
beforeEach(() => {
  jest.clearAllMocks();
});

// 测试后清理
afterEach(() => {
  // 清理定时器
  jest.clearAllTimers();
});