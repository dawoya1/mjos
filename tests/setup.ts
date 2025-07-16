/**
 * Test Setup
 * 测试设置文件
 */

// 设置测试超时
jest.setTimeout(30000);

// 模拟控制台输出（减少测试日志）
const originalConsole = console;

beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// 全局测试工具
global.testUtils = {
  // 等待指定时间
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 生成随机字符串
  randomString: (length: number = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },
  
  // 生成测试数据
  generateTestData: (type: string) => {
    switch (type) {
      case 'user':
        return {
          username: `test_user_${Date.now()}`,
          email: `test${Date.now()}@example.com`,
          role: 'user'
        };
      case 'memory':
        return {
          type: 'test-memory',
          content: `Test memory content ${Date.now()}`,
          tags: ['test', 'memory']
        };
      default:
        return {};
    }
  }
};

// 声明全局类型
declare global {
  var testUtils: {
    wait: (ms: number) => Promise<void>;
    randomString: (length?: number) => string;
    generateTestData: (type: string) => any;
  };
}
