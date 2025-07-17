# MJOS 编码规范

> **最后更新时间**: 2025-07-17 09:18:20 UTC  
> **文档版本**: v2.0.0  
> **更新内容**: 创建完整的编码规范和最佳实践指南

## 📋 概述

本文档定义了MJOS项目的编码规范和最佳实践，旨在确保代码质量、可维护性和团队协作效率。

## 🎯 编码原则

### 核心原则
1. **可读性优先**: 代码应该易于理解和维护
2. **一致性**: 遵循统一的编码风格和模式
3. **简洁性**: 避免不必要的复杂性
4. **可测试性**: 编写易于测试的代码
5. **性能意识**: 考虑性能影响，但不过度优化

### SOLID原则
- **S**ingle Responsibility Principle (单一职责原则)
- **O**pen/Closed Principle (开放/封闭原则)
- **L**iskov Substitution Principle (里氏替换原则)
- **I**nterface Segregation Principle (接口隔离原则)
- **D**ependency Inversion Principle (依赖倒置原则)

## 📝 TypeScript 编码规范

### 1. 命名约定

#### 变量和函数
```typescript
// ✅ 使用camelCase
const userName = 'john_doe';
const isActive = true;
const getUserById = (id: string) => { /* ... */ };

// ❌ 避免
const user_name = 'john_doe';  // snake_case
const IsActive = true;         // PascalCase
```

#### 类和接口
```typescript
// ✅ 类使用PascalCase
class UserManager {
  private readonly users: User[] = [];
}

// ✅ 接口使用PascalCase，可选择I前缀
interface User {
  id: string;
  name: string;
}

interface IUserRepository {
  findById(id: string): Promise<User | null>;
}
```

#### 常量和枚举
```typescript
// ✅ 常量使用SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;

// ✅ 枚举使用PascalCase
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}
```

#### 文件和目录
```typescript
// ✅ 文件名使用kebab-case
user-manager.ts
memory-system.ts
knowledge-graph.ts

// ✅ 目录名使用kebab-case
src/
  core/
  memory-system/
  knowledge-graph/
```

### 2. 类型定义

#### 接口定义
```typescript
// ✅ 明确的接口定义
interface CreateUserRequest {
  readonly name: string;
  readonly email: string;
  readonly age?: number;
}

interface UserResponse {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: Date;
}
```

#### 泛型使用
```typescript
// ✅ 有意义的泛型参数名
interface Repository<TEntity, TKey = string> {
  findById(id: TKey): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
  delete(id: TKey): Promise<boolean>;
}

// ✅ 约束泛型
interface Identifiable {
  id: string;
}

class BaseRepository<T extends Identifiable> {
  protected entities: Map<string, T> = new Map();
}
```

#### 联合类型和字面量类型
```typescript
// ✅ 使用联合类型
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// ✅ 使用字面量类型
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}
```

### 3. 函数和方法

#### 函数签名
```typescript
// ✅ 明确的参数和返回类型
async function createUser(
  userData: CreateUserRequest
): Promise<UserResponse> {
  // 实现
}

// ✅ 可选参数放在最后
function formatDate(
  date: Date,
  format: string = 'YYYY-MM-DD',
  timezone?: string
): string {
  // 实现
}
```

#### 错误处理
```typescript
// ✅ 使用Result模式
type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

async function safeCreateUser(
  userData: CreateUserRequest
): Promise<Result<UserResponse>> {
  try {
    const user = await createUser(userData);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### 4. 类设计

#### 类结构
```typescript
// ✅ 清晰的类结构
class UserService {
  // 1. 静态属性
  private static readonly DEFAULT_PAGE_SIZE = 20;
  
  // 2. 实例属性
  private readonly repository: IUserRepository;
  private readonly logger: ILogger;
  
  // 3. 构造函数
  constructor(
    repository: IUserRepository,
    logger: ILogger
  ) {
    this.repository = repository;
    this.logger = logger;
  }
  
  // 4. 公共方法
  public async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    this.logger.info('Creating user', { userData });
    
    const validation = this.validateUserData(userData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    return await this.repository.save(userData);
  }
  
  // 5. 私有方法
  private validateUserData(userData: CreateUserRequest): ValidationResult {
    // 验证逻辑
  }
}
```

#### 继承和组合
```typescript
// ✅ 优先使用组合而非继承
class UserService {
  constructor(
    private readonly repository: IUserRepository,
    private readonly validator: IValidator,
    private readonly logger: ILogger
  ) {}
}

// ✅ 适当使用继承
abstract class BaseService {
  protected readonly logger: ILogger;
  
  constructor(logger: ILogger) {
    this.logger = logger;
  }
  
  protected abstract getServiceName(): string;
}

class UserService extends BaseService {
  protected getServiceName(): string {
    return 'UserService';
  }
}
```

## 🧪 测试编码规范

### 1. 测试文件组织
```typescript
// ✅ 测试文件命名
user-service.test.ts
memory-manager.test.ts
integration.test.ts

// ✅ 测试结构
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = createValidUserData();
      const mockRepository = createMockRepository();
      const service = new UserService(mockRepository);
      
      // Act
      const result = await service.createUser(userData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(mockRepository.save).toHaveBeenCalledWith(userData);
    });
    
    it('should throw error with invalid data', async () => {
      // Arrange
      const invalidData = createInvalidUserData();
      const service = new UserService(mockRepository);
      
      // Act & Assert
      await expect(service.createUser(invalidData))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

### 2. 测试数据和模拟
```typescript
// ✅ 测试工厂函数
function createValidUserData(overrides: Partial<CreateUserRequest> = {}): CreateUserRequest {
  return {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    ...overrides
  };
}

// ✅ 模拟对象
function createMockRepository(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn(),
    save: jest.fn(),
    delete: jest.fn()
  };
}
```

## 📁 项目结构规范

### 目录结构
```
src/
├── core/                 # 核心模块
│   ├── index.ts
│   ├── logger.ts
│   └── config.ts
├── memory/              # 记忆模块
│   ├── index.ts
│   ├── memory-manager.ts
│   └── types.ts
├── types/               # 共享类型定义
│   ├── index.ts
│   ├── common.ts
│   └── api.ts
├── utils/               # 工具函数
│   ├── index.ts
│   ├── validation.ts
│   └── formatting.ts
└── index.ts             # 主入口文件
```

### 导入导出规范
```typescript
// ✅ 使用绝对导入路径
import { UserService } from '@/services/user-service';
import { Logger } from '@core/logger';
import { CreateUserRequest } from '@types/user';

// ✅ 分组导入
// 1. Node.js内置模块
import { readFile } from 'fs/promises';
import { join } from 'path';

// 2. 第三方库
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

// 3. 项目内部模块
import { UserService } from '@/services/user-service';
import { Logger } from '@core/logger';

// ✅ 导出规范
// 优先使用命名导出
export { UserService };
export { Logger };

// 默认导出用于主要类或函数
export default class Application {
  // ...
}
```

## 🔧 工具配置

### ESLint 规则
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // TypeScript规则
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-readonly': 'error',
    
    // 通用规则
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',
    
    // 导入规则
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always'
    }]
  }
};
```

### Prettier 配置
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

## 📚 注释和文档

### JSDoc 注释
```typescript
/**
 * 创建新用户
 * 
 * @param userData - 用户数据
 * @returns Promise<UserResponse> - 创建的用户信息
 * @throws {ValidationError} 当用户数据无效时
 * @throws {DuplicateEmailError} 当邮箱已存在时
 * 
 * @example
 * ```typescript
 * const user = await userService.createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
async function createUser(userData: CreateUserRequest): Promise<UserResponse> {
  // 实现
}
```

### 代码注释
```typescript
// ✅ 解释为什么，而不是做什么
// 使用LRU策略确保内存使用不会无限增长
const cache = new LRUCache<string, User>(1000);

// ✅ 复杂逻辑的解释
// 计算用户活跃度分数：
// - 最近登录时间权重: 40%
// - 操作频率权重: 35%
// - 数据完整度权重: 25%
const activityScore = calculateActivityScore(user);
```

## 🚀 性能最佳实践

### 异步编程
```typescript
// ✅ 使用async/await
async function processUsers(userIds: string[]): Promise<User[]> {
  const users = await Promise.all(
    userIds.map(id => userRepository.findById(id))
  );
  
  return users.filter(user => user !== null);
}

// ✅ 错误处理
async function safeProcessUsers(userIds: string[]): Promise<User[]> {
  try {
    return await processUsers(userIds);
  } catch (error) {
    logger.error('Failed to process users', { error, userIds });
    return [];
  }
}
```

### 内存管理
```typescript
// ✅ 使用WeakMap避免内存泄漏
const userCache = new WeakMap<User, UserMetadata>();

// ✅ 及时清理资源
class DatabaseConnection {
  async close(): Promise<void> {
    await this.connection.close();
    this.connection = null;
  }
}
```

## 🔒 安全最佳实践

### 输入验证
```typescript
// ✅ 严格的输入验证
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// ✅ 使用类型守卫
function isValidUserData(data: unknown): data is CreateUserRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).name === 'string' &&
    typeof (data as any).email === 'string' &&
    validateEmail((data as any).email)
  );
}
```

### 敏感数据处理
```typescript
// ✅ 避免在日志中记录敏感信息
logger.info('User created', {
  userId: user.id,
  // 不记录密码或其他敏感信息
});

// ✅ 使用readonly防止意外修改
interface User {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string; // 永远不暴露原始密码
}
```

## 📋 代码审查清单

### 提交前检查
- [ ] 代码遵循命名约定
- [ ] 所有函数都有明确的类型注解
- [ ] 添加了必要的测试
- [ ] 测试覆盖率达到要求
- [ ] 没有console.log等调试代码
- [ ] 错误处理完善
- [ ] 性能考虑合理
- [ ] 安全问题已考虑
- [ ] 文档已更新

### 审查要点
- [ ] 代码逻辑正确
- [ ] 边界条件处理
- [ ] 错误处理完善
- [ ] 性能影响评估
- [ ] 安全风险评估
- [ ] 可维护性评估

---

**维护团队**: MJOS开发团队  
**更新频率**: 每季度一次  
**强制执行**: 通过CI/CD流水线自动检查
