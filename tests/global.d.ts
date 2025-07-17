/**
 * Global Test Type Definitions
 * 全局测试类型定义
 */

declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        delay: (ms: number) => Promise<void>;
        randomString: () => string;
        randomNumber: (min?: number, max?: number) => number;
      };
    }
  }

  var testUtils: {
    delay: (ms: number) => Promise<void>;
    randomString: () => string;
    randomNumber: (min?: number, max?: number) => number;
  };
}

export {};
