# MJOS 测试指南

> **最后更新时间**: 2025-07-17 09:20:45 UTC  
> **文档版本**: v2.0.0  
> **更新内容**: 创建完整的测试策略和实践指南

## 📋 概述

本指南详细说明了MJOS项目的测试策略、测试类型、最佳实践和工具使用方法，确保代码质量和系统可靠性。

## 🎯 测试策略

### 测试金字塔
```
        /\
       /  \
      / E2E \     <- 少量端到端测试
     /______\
    /        \
   /Integration\ <- 适量集成测试
  /__________\
 /            \
/  Unit Tests  \   <- 大量单元测试
/______________\
```

### 测试目标
- **单元测试覆盖率**: ≥ 90%
- **集成测试覆盖率**: ≥ 80%
- **端到端测试覆盖率**: ≥ 70%
- **关键路径覆盖率**: 100%

## 🧪 测试类型

### 1. 单元测试 (Unit Tests)

#### 目标
- 测试单个函数、方法或类
- 验证业务逻辑正确性
- 确保边界条件处理
- 快速反馈和调试

#### 示例
```typescript
// user-service.test.ts
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    userService = new UserService(mockRepository, mockLogger);
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      const expectedUser = { id: '123', ...userData };
      mockRepository.save.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockRepository.save).toHaveBeenCalledWith(userData);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating user',
        { userData }
      );
    });

    it('should throw ValidationError for invalid email', async () => {
      // Arrange
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      // Act & Assert
      await expect(userService.createUser(invalidData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Database error');
    });
  });
});
```

### 2. 集成测试 (Integration Tests)

#### 目标
- 测试模块间交互
- 验证数据流正确性
- 测试外部依赖集成
- 确保API契约正确

#### 示例
```typescript
// integration.test.ts
describe('Memory and Knowledge Integration', () => {
  let mjos: MJOS;

  beforeAll(async () => {
    mjos = new MJOS();
    await mjos.start();
  });

  afterAll(async () => {
    await mjos.stop();
  });

  it('should store memory and create knowledge index', async () => {
    // Arrange
    const content = 'TypeScript is a programming language';
    const tags = ['programming', 'typescript'];

    // Act
    const memoryId = mjos.getMemorySystem().store(content, tags, 0.8);
    
    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    const memory = mjos.getMemorySystem().retrieve(memoryId);
    expect(memory).toBeDefined();
    expect(memory?.content).toBe(content);

    // Verify knowledge indexing
    const knowledgeResults = mjos.getKnowledgeGraph().query({
      text: 'TypeScript',
      limit: 10
    });
    expect(knowledgeResults.length).toBeGreaterThan(0);
  });

  it('should handle agent task assignment workflow', async () => {
    // Arrange
    const agentDef = {
      name: 'Test Agent',
      type: 'reactive' as const,
      capabilities: [
        { name: 'analysis', type: 'cognitive' as const, parameters: {}, constraints: {} }
      ]
    };

    // Act
    const agentId = mjos.createAgent(agentDef);
    const taskId = mjos.createTask('Analyze data', 'Perform data analysis');
    const assignmentId = mjos.assignTaskToAgent(taskId, agentId);

    // Assert
    expect(agentId).toBeDefined();
    expect(taskId).toBeDefined();
    expect(assignmentId).toBeDefined();

    const agent = mjos.getAgent(agentId);
    expect(agent).toBeDefined();
    expect(agent?.state.currentTasks).toContain(taskId);
  });
});
```

### 3. 端到端测试 (E2E Tests)

#### 目标
- 测试完整用户场景
- 验证系统整体功能
- 测试真实环境配置
- 确保用户体验正确

#### 示例
```typescript
// e2e.test.ts
describe('MJOS E2E Tests', () => {
  let mjos: MJOS;

  beforeAll(async () => {
    // 使用真实配置启动系统
    mjos = new MJOS({
      storage: {
        provider: 'file',
        path: './test-data'
      },
      enableRealTimeMetrics: true
    });
    await mjos.start();
  });

  afterAll(async () => {
    await mjos.stop();
    // 清理测试数据
    await cleanupTestData();
  });

  it('should complete full AI collaboration workflow', async () => {
    // 1. 存储知识
    const knowledgeId = mjos.getKnowledgeGraph().add({
      type: 'fact',
      content: 'AI can help with data analysis',
      metadata: {
        source: 'test',
        domain: 'AI',
        confidence: 0.9,
        importance: 0.8,
        tags: ['AI', 'analysis'],
        version: 1
      }
    });

    // 2. 创建智能体
    const agentId = mjos.createAgent({
      name: 'Data Analyst',
      type: 'deliberative',
      capabilities: [
        { name: 'data-analysis', type: 'cognitive', parameters: {}, constraints: {} }
      ],
      configuration: {
        maxConcurrentTasks: 3,
        memoryLimit: 1000,
        collaborationMode: 'collaboration',
        preferences: {}
      }
    });

    // 3. 创建任务
    const taskId = mjos.createTask(
      'Analyze user behavior data',
      'Perform comprehensive analysis of user behavior patterns'
    );

    // 4. 分配任务
    const assignmentId = mjos.assignTaskToAgent(taskId, agentId);

    // 5. 验证系统状态
    const status = mjos.getStatus();
    expect(status.agents.total).toBe(1);
    expect(status.agents.active).toBe(1);
    expect(status.tasks.total).toBe(1);
    expect(status.tasks.assigned).toBe(1);

    // 6. 验证性能指标
    const metrics = mjos.getPerformanceMonitor().getMetrics();
    expect(metrics.memoryUsage).toBeDefined();
    expect(metrics.responseTime).toBeDefined();

    // 7. 验证知识检索
    const searchResults = mjos.getKnowledgeGraph().query({
      text: 'data analysis',
      limit: 5
    });
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].id).toBe(knowledgeId);
  });
});
```

## 🛠️ 测试工具和框架

### Jest 配置
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // 测试文件匹配
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/__tests__/**/*.test.ts'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/core/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // 模块映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  },
  
  // 超时设置
  testTimeout: 30000,
  
  // 并行测试
  maxWorkers: '50%'
};
```

### 测试工具函数
```typescript
// tests/utils/test-helpers.ts
export class TestHelper {
  static async createTestMJOS(): Promise<MJOS> {
    const mjos = new MJOS({
      storage: { provider: 'memory' },
      enableRealTimeMetrics: false
    });
    await mjos.start();
    return mjos;
  }

  static createMockLogger(): jest.Mocked<ILogger> {
    return {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
  }

  static createMockRepository<T>(): jest.Mocked<IRepository<T>> {
    return {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    };
  }

  static generateTestData(type: 'user' | 'task' | 'agent') {
    switch (type) {
      case 'user':
        return {
          name: `Test User ${Date.now()}`,
          email: `test${Date.now()}@example.com`
        };
      case 'task':
        return {
          title: `Test Task ${Date.now()}`,
          description: 'Test task description'
        };
      case 'agent':
        return {
          name: `Test Agent ${Date.now()}`,
          type: 'reactive' as const,
          capabilities: []
        };
    }
  }

  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}
```

## 📊 测试数据管理

### 测试数据工厂
```typescript
// tests/factories/user-factory.ts
export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    return {
      id: uuidv4(),
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        name: `User ${index + 1}`,
        email: `user${index + 1}@example.com`,
        ...overrides
      })
    );
  }
}
```

### 测试数据库
```typescript
// tests/setup/database.ts
export class TestDatabase {
  private static instance: TestDatabase;
  private connection: Connection | null = null;

  static getInstance(): TestDatabase {
    if (!this.instance) {
      this.instance = new TestDatabase();
    }
    return this.instance;
  }

  async setup(): Promise<void> {
    this.connection = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      entities: [User, Task, Agent],
      synchronize: true
    });
  }

  async cleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async clearAll(): Promise<void> {
    if (this.connection) {
      const entities = this.connection.entityMetadatas;
      for (const entity of entities) {
        const repository = this.connection.getRepository(entity.name);
        await repository.clear();
      }
    }
  }
}
```

## 🔧 模拟和存根

### 模拟外部依赖
```typescript
// tests/mocks/external-services.ts
export const mockExternalAPI = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

// 模拟Redis
export const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn()
};

// 模拟文件系统
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
  mkdir: jest.fn()
}));
```

### 时间模拟
```typescript
// tests/utils/time-mock.ts
export class TimeMock {
  private static originalDate = Date;
  private static mockDate: Date;

  static mockCurrentTime(date: Date): void {
    this.mockDate = date;
    global.Date = class extends Date {
      constructor() {
        super();
        return TimeMock.mockDate;
      }
      
      static now(): number {
        return TimeMock.mockDate.getTime();
      }
    } as any;
  }

  static restore(): void {
    global.Date = this.originalDate;
  }
}
```

## 📈 性能测试

### 基准测试
```typescript
// tests/performance/benchmark.test.ts
describe('Performance Benchmarks', () => {
  let mjos: MJOS;

  beforeAll(async () => {
    mjos = await TestHelper.createTestMJOS();
  });

  it('should handle memory storage within performance limits', async () => {
    const startTime = Date.now();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      mjos.getMemorySystem().store(
        `Test content ${i}`,
        ['test'],
        Math.random()
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTime = duration / iterations;

    expect(avgTime).toBeLessThan(10); // 平均每次操作小于10ms
    expect(duration).toBeLessThan(5000); // 总时间小于5秒
  });

  it('should handle concurrent operations efficiently', async () => {
    const concurrentOperations = 100;
    const startTime = Date.now();

    const promises = Array.from({ length: concurrentOperations }, (_, i) =>
      mjos.getMemorySystem().store(`Concurrent content ${i}`, ['test'], 0.5)
    );

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(2000); // 并发操作在2秒内完成
  });
});
```

### 内存泄漏测试
```typescript
// tests/performance/memory-leak.test.ts
describe('Memory Leak Tests', () => {
  it('should not leak memory during repeated operations', async () => {
    const mjos = await TestHelper.createTestMJOS();
    
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 执行大量操作
    for (let i = 0; i < 10000; i++) {
      const memoryId = mjos.getMemorySystem().store(`Content ${i}`, ['test'], 0.1);
      // 立即删除，模拟短期使用
      // mjos.getMemorySystem().delete(memoryId);
    }
    
    // 强制垃圾回收
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // 内存增长应该在合理范围内
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    
    await mjos.stop();
  });
});
```

## 🚀 CI/CD 集成

### GitHub Actions 配置
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## 📋 测试最佳实践

### 测试命名
```typescript
// ✅ 好的测试名称
describe('UserService.createUser', () => {
  it('should create user when valid data is provided', () => {});
  it('should throw ValidationError when email is invalid', () => {});
  it('should throw DuplicateEmailError when email already exists', () => {});
});

// ❌ 不好的测试名称
describe('UserService', () => {
  it('test1', () => {});
  it('should work', () => {});
  it('creates user', () => {});
});
```

### 测试结构
```typescript
// ✅ 使用AAA模式 (Arrange, Act, Assert)
it('should calculate total price correctly', () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ];
  const calculator = new PriceCalculator();

  // Act
  const total = calculator.calculateTotal(items);

  // Assert
  expect(total).toBe(35);
});
```

### 测试隔离
```typescript
// ✅ 每个测试都是独立的
describe('UserService', () => {
  let userService: UserService;
  
  beforeEach(() => {
    // 每个测试前重新创建实例
    userService = new UserService(mockRepository);
  });
  
  afterEach(() => {
    // 清理测试数据
    jest.clearAllMocks();
  });
});
```

---

**维护团队**: MJOS测试团队  
**更新频率**: 每月一次  
**质量目标**: 90%+ 测试覆盖率
