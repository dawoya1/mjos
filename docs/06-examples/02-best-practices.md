# MJOS 最佳实践指南

> **最后更新时间**: 2025-07-17 09:53:15 UTC  
> **文档版本**: v2.0.0  
> **更新内容**: 创建完整的最佳实践指南

## 📋 概述

本指南汇总了MJOS系统开发、部署和运维的最佳实践，帮助团队构建高质量、可维护的AI协作系统。

## 🏗️ 架构设计最佳实践

### 1. 模块化设计
```typescript
// ✅ 好的做法：模块化设计
class MemoryModule {
  private storage: IStorage;
  private indexer: IIndexer;
  
  constructor(storage: IStorage, indexer: IIndexer) {
    this.storage = storage;
    this.indexer = indexer;
  }
  
  async store(content: string, metadata: any): Promise<string> {
    const id = await this.storage.save(content, metadata);
    await this.indexer.index(id, content);
    return id;
  }
}

// ❌ 避免：紧耦合设计
class BadMemoryModule {
  async store(content: string): Promise<string> {
    // 直接依赖具体实现
    const db = new PostgreSQLDatabase();
    const search = new ElasticsearchIndexer();
    // ...
  }
}
```

### 2. 依赖注入
```typescript
// ✅ 使用依赖注入容器
import { Container } from 'inversify';

const container = new Container();
container.bind<IStorage>('Storage').to(PostgreSQLStorage);
container.bind<IIndexer>('Indexer').to(ElasticsearchIndexer);
container.bind<MemoryModule>('MemoryModule').to(MemoryModule);

// 在应用启动时配置
const memoryModule = container.get<MemoryModule>('MemoryModule');
```

### 3. 事件驱动架构
```typescript
// ✅ 使用事件驱动模式
class AgentManager extends EventEmitter {
  async createAgent(config: AgentConfig): Promise<string> {
    const agent = new Agent(config);
    const agentId = await this.storage.save(agent);
    
    // 发布事件而不是直接调用
    this.emit('agent:created', { agentId, config });
    
    return agentId;
  }
}

// 监听器解耦处理
agentManager.on('agent:created', async (event) => {
  await notificationService.notify('新智能体已创建');
  await metricsService.incrementCounter('agents.created');
});
```

## 💾 数据管理最佳实践

### 1. 记忆存储策略
```typescript
// ✅ 分层存储策略
class HierarchicalMemoryStorage {
  private shortTerm: MemoryCache;    // 内存缓存
  private mediumTerm: RedisStorage;  // Redis缓存
  private longTerm: DatabaseStorage; // 数据库存储
  
  async store(memory: Memory): Promise<string> {
    const id = generateId();
    
    // 根据重要性和访问频率分层存储
    if (memory.importance > 0.8) {
      await this.shortTerm.set(id, memory);
    }
    
    if (memory.importance > 0.5) {
      await this.mediumTerm.set(id, memory, { ttl: 3600 });
    }
    
    // 所有记忆都存储到长期存储
    await this.longTerm.save(id, memory);
    
    return id;
  }
  
  async retrieve(id: string): Promise<Memory | null> {
    // 按层级检索，提高性能
    let memory = await this.shortTerm.get(id);
    if (memory) return memory;
    
    memory = await this.mediumTerm.get(id);
    if (memory) {
      // 提升到短期存储
      await this.shortTerm.set(id, memory);
      return memory;
    }
    
    memory = await this.longTerm.get(id);
    if (memory && memory.importance > 0.5) {
      await this.mediumTerm.set(id, memory, { ttl: 3600 });
    }
    
    return memory;
  }
}
```

### 2. 数据一致性
```typescript
// ✅ 使用事务确保一致性
class TransactionalMemoryService {
  async storeWithKnowledge(
    memory: Memory, 
    knowledge: Knowledge
  ): Promise<{ memoryId: string; knowledgeId: string }> {
    const transaction = await this.db.beginTransaction();
    
    try {
      const memoryId = await this.memoryStorage.save(memory, transaction);
      const knowledgeId = await this.knowledgeStorage.save(knowledge, transaction);
      
      // 创建关联
      await this.createAssociation(memoryId, knowledgeId, transaction);
      
      await transaction.commit();
      
      return { memoryId, knowledgeId };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
```

### 3. 数据验证和清理
```typescript
// ✅ 数据验证和清理
class DataValidator {
  validateMemory(memory: Memory): ValidationResult {
    const errors: string[] = [];
    
    if (!memory.content || memory.content.trim().length === 0) {
      errors.push('记忆内容不能为空');
    }
    
    if (memory.importance < 0 || memory.importance > 1) {
      errors.push('重要性必须在0-1之间');
    }
    
    if (memory.tags && memory.tags.length > 10) {
      errors.push('标签数量不能超过10个');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  sanitizeContent(content: string): string {
    // 清理HTML标签
    content = content.replace(/<[^>]*>/g, '');
    
    // 清理特殊字符
    content = content.replace(/[^\w\s\u4e00-\u9fff]/g, '');
    
    // 限制长度
    if (content.length > 10000) {
      content = content.substring(0, 10000) + '...';
    }
    
    return content.trim();
  }
}
```

## 🤖 智能体开发最佳实践

### 1. 智能体设计模式
```typescript
// ✅ 使用策略模式设计智能体行为
interface AgentBehavior {
  execute(context: AgentContext): Promise<AgentAction>;
}

class ReactiveAgentBehavior implements AgentBehavior {
  async execute(context: AgentContext): Promise<AgentAction> {
    // 简单的刺激-响应行为
    const stimulus = context.getCurrentStimulus();
    return this.generateResponse(stimulus);
  }
}

class DeliberativeAgentBehavior implements AgentBehavior {
  async execute(context: AgentContext): Promise<AgentAction> {
    // 复杂的推理和规划
    const goals = context.getGoals();
    const plan = await this.createPlan(goals, context);
    return plan.getNextAction();
  }
}

class Agent {
  private behavior: AgentBehavior;
  
  constructor(behavior: AgentBehavior) {
    this.behavior = behavior;
  }
  
  async act(context: AgentContext): Promise<AgentAction> {
    return await this.behavior.execute(context);
  }
  
  // 运行时切换行为
  setBehavior(behavior: AgentBehavior): void {
    this.behavior = behavior;
  }
}
```

### 2. 能力组合模式
```typescript
// ✅ 组合模式构建复杂能力
interface Capability {
  name: string;
  execute(input: any): Promise<any>;
  canHandle(input: any): boolean;
}

class DataAnalysisCapability implements Capability {
  name = 'data-analysis';
  
  canHandle(input: any): boolean {
    return input.type === 'dataset' || input.type === 'csv';
  }
  
  async execute(input: any): Promise<any> {
    // 数据分析逻辑
    return this.analyzeData(input.data);
  }
}

class ReportGenerationCapability implements Capability {
  name = 'report-generation';
  
  canHandle(input: any): boolean {
    return input.type === 'analysis-result';
  }
  
  async execute(input: any): Promise<any> {
    // 报告生成逻辑
    return this.generateReport(input.analysis);
  }
}

class CompositeAgent {
  private capabilities: Capability[] = [];
  
  addCapability(capability: Capability): void {
    this.capabilities.push(capability);
  }
  
  async processTask(task: Task): Promise<any> {
    let result = task.input;
    
    // 链式处理
    for (const capability of this.capabilities) {
      if (capability.canHandle(result)) {
        result = await capability.execute(result);
      }
    }
    
    return result;
  }
}
```

### 3. 智能体通信协议
```typescript
// ✅ 标准化消息协议
interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'broadcast';
  content: any;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

class AgentCommunicationManager {
  private messageQueue: Map<string, AgentMessage[]> = new Map();
  
  async sendMessage(message: AgentMessage): Promise<void> {
    // 验证消息格式
    this.validateMessage(message);
    
    // 路由消息
    await this.routeMessage(message);
    
    // 记录通信日志
    await this.logCommunication(message);
  }
  
  private async routeMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'broadcast') {
      await this.broadcastToAll(message);
    } else {
      await this.deliverToAgent(message.to, message);
    }
  }
  
  private validateMessage(message: AgentMessage): void {
    if (!message.id || !message.from || !message.to) {
      throw new Error('消息格式无效：缺少必要字段');
    }
    
    if (!['request', 'response', 'notification', 'broadcast'].includes(message.type)) {
      throw new Error('消息类型无效');
    }
  }
}
```

## 🔄 任务管理最佳实践

### 1. 任务优先级和调度
```typescript
// ✅ 智能任务调度器
class TaskScheduler {
  private taskQueue: PriorityQueue<Task>;
  private agentPool: AgentPool;
  
  constructor() {
    this.taskQueue = new PriorityQueue((a, b) => 
      this.calculatePriority(b) - this.calculatePriority(a)
    );
  }
  
  private calculatePriority(task: Task): number {
    let priority = 0;
    
    // 基础优先级
    switch (task.priority) {
      case 'urgent': priority += 100; break;
      case 'high': priority += 75; break;
      case 'normal': priority += 50; break;
      case 'low': priority += 25; break;
    }
    
    // 截止日期影响
    if (task.deadline) {
      const timeToDeadline = task.deadline.getTime() - Date.now();
      const urgencyFactor = Math.max(0, 100 - (timeToDeadline / (24 * 60 * 60 * 1000)));
      priority += urgencyFactor;
    }
    
    // 依赖关系影响
    if (task.dependencies.length === 0) {
      priority += 20; // 无依赖任务优先
    }
    
    return priority;
  }
  
  async scheduleTask(task: Task): Promise<void> {
    // 检查依赖
    if (!await this.checkDependencies(task)) {
      task.status = 'waiting';
      this.taskQueue.enqueue(task);
      return;
    }
    
    // 查找合适的智能体
    const suitableAgent = await this.findSuitableAgent(task);
    if (suitableAgent) {
      await this.assignTask(task, suitableAgent);
    } else {
      this.taskQueue.enqueue(task);
    }
  }
  
  private async findSuitableAgent(task: Task): Promise<Agent | null> {
    const availableAgents = await this.agentPool.getAvailableAgents();
    
    // 按能力匹配度排序
    const rankedAgents = availableAgents
      .map(agent => ({
        agent,
        score: this.calculateMatchScore(task, agent)
      }))
      .sort((a, b) => b.score - a.score);
    
    return rankedAgents.length > 0 ? rankedAgents[0].agent : null;
  }
  
  private calculateMatchScore(task: Task, agent: Agent): number {
    let score = 0;
    
    // 能力匹配
    for (const requirement of task.requirements) {
      if (agent.hasCapability(requirement)) {
        score += 10;
      }
    }
    
    // 工作负载
    const workload = agent.getCurrentWorkload();
    score -= workload * 5;
    
    // 历史表现
    const performance = agent.getPerformanceScore();
    score += performance * 20;
    
    return score;
  }
}
```

### 2. 任务状态管理
```typescript
// ✅ 状态机模式管理任务状态
enum TaskStatus {
  CREATED = 'created',
  WAITING = 'waiting',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

class TaskStateMachine {
  private static transitions: Map<TaskStatus, TaskStatus[]> = new Map([
    [TaskStatus.CREATED, [TaskStatus.WAITING, TaskStatus.ASSIGNED, TaskStatus.CANCELLED]],
    [TaskStatus.WAITING, [TaskStatus.ASSIGNED, TaskStatus.CANCELLED]],
    [TaskStatus.ASSIGNED, [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED]],
    [TaskStatus.IN_PROGRESS, [TaskStatus.PAUSED, TaskStatus.COMPLETED, TaskStatus.FAILED]],
    [TaskStatus.PAUSED, [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED]],
    [TaskStatus.COMPLETED, []],
    [TaskStatus.FAILED, [TaskStatus.WAITING, TaskStatus.CANCELLED]],
    [TaskStatus.CANCELLED, []]
  ]);
  
  static canTransition(from: TaskStatus, to: TaskStatus): boolean {
    const allowedTransitions = this.transitions.get(from) || [];
    return allowedTransitions.includes(to);
  }
  
  static validateTransition(task: Task, newStatus: TaskStatus): void {
    if (!this.canTransition(task.status, newStatus)) {
      throw new Error(
        `无效的状态转换: ${task.status} -> ${newStatus}`
      );
    }
  }
}

class Task {
  private _status: TaskStatus = TaskStatus.CREATED;
  
  get status(): TaskStatus {
    return this._status;
  }
  
  setStatus(newStatus: TaskStatus): void {
    TaskStateMachine.validateTransition(this, newStatus);
    
    const oldStatus = this._status;
    this._status = newStatus;
    
    // 触发状态变更事件
    this.emit('statusChanged', {
      taskId: this.id,
      oldStatus,
      newStatus,
      timestamp: new Date()
    });
  }
}
```

## 🔒 安全最佳实践

### 1. 输入验证和清理
```typescript
// ✅ 严格的输入验证
class InputValidator {
  static validateMemoryContent(content: string): ValidationResult {
    const errors: string[] = [];
    
    // 长度检查
    if (content.length > 50000) {
      errors.push('内容长度不能超过50000字符');
    }
    
    // 恶意脚本检查
    if (this.containsMaliciousScript(content)) {
      errors.push('内容包含潜在的恶意脚本');
    }
    
    // 敏感信息检查
    if (this.containsSensitiveInfo(content)) {
      errors.push('内容包含敏感信息');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedContent: this.sanitize(content)
    };
  }
  
  private static containsMaliciousScript(content: string): boolean {
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(content));
  }
  
  private static containsSensitiveInfo(content: string): boolean {
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // 信用卡号
      /\b\d{3}-\d{2}-\d{4}\b/, // 社会保险号
      /password\s*[:=]\s*\S+/gi // 密码
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(content));
  }
  
  private static sanitize(content: string): string {
    // 移除HTML标签
    content = content.replace(/<[^>]*>/g, '');
    
    // 转义特殊字符
    content = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    return content.trim();
  }
}
```

### 2. 权限控制
```typescript
// ✅ 基于角色的访问控制
class RBACManager {
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, string[]> = new Map();
  
  defineRole(roleName: string, permissions: Permission[]): void {
    this.roles.set(roleName, new Role(roleName, permissions));
  }
  
  assignRole(userId: string, roleName: string): void {
    const userRoles = this.userRoles.get(userId) || [];
    if (!userRoles.includes(roleName)) {
      userRoles.push(roleName);
      this.userRoles.set(userId, userRoles);
    }
  }
  
  hasPermission(userId: string, resource: string, action: string): boolean {
    const userRoles = this.userRoles.get(userId) || [];
    
    return userRoles.some(roleName => {
      const role = this.roles.get(roleName);
      return role?.hasPermission(resource, action) || false;
    });
  }
  
  checkPermission(userId: string, resource: string, action: string): void {
    if (!this.hasPermission(userId, resource, action)) {
      throw new UnauthorizedError(
        `用户 ${userId} 没有权限执行 ${action} 操作在资源 ${resource} 上`
      );
    }
  }
}

// 使用装饰器进行权限检查
function RequirePermission(resource: string, action: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const userId = this.getCurrentUserId();
      const rbac = this.getRBACManager();
      
      rbac.checkPermission(userId, resource, action);
      
      return method.apply(this, args);
    };
  };
}

class MemoryService {
  @RequirePermission('memory', 'create')
  async createMemory(content: string): Promise<string> {
    // 创建记忆的逻辑
  }
  
  @RequirePermission('memory', 'read')
  async getMemory(id: string): Promise<Memory> {
    // 获取记忆的逻辑
  }
}
```

## 📊 监控和日志最佳实践

### 1. 结构化日志
```typescript
// ✅ 结构化日志记录
class StructuredLogger {
  private logger: winston.Logger;
  
  constructor() {
    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }
  
  logMemoryOperation(operation: string, memoryId: string, userId: string, metadata?: any): void {
    this.logger.info('Memory operation', {
      operation,
      memoryId,
      userId,
      timestamp: new Date().toISOString(),
      module: 'memory',
      ...metadata
    });
  }
  
  logAgentAction(agentId: string, action: string, taskId?: string, result?: any): void {
    this.logger.info('Agent action', {
      agentId,
      action,
      taskId,
      result: result ? JSON.stringify(result) : undefined,
      timestamp: new Date().toISOString(),
      module: 'agent'
    });
  }
  
  logError(error: Error, context?: any): void {
    this.logger.error('Application error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 2. 性能监控
```typescript
// ✅ 性能指标收集
class PerformanceMonitor {
  private metrics: Map<string, Metric> = new Map();
  
  startTimer(name: string): Timer {
    return new Timer(name, this);
  }
  
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric = this.metrics.get(name) || new Metric(name);
    metric.record(value, tags);
    this.metrics.set(name, metric);
  }
  
  incrementCounter(name: string, tags?: Record<string, string>): void {
    this.recordMetric(name, 1, tags);
  }
  
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const metric = this.metrics.get(name) || new HistogramMetric(name);
    (metric as HistogramMetric).recordValue(value, tags);
    this.metrics.set(name, metric);
  }
  
  getMetrics(): MetricSnapshot[] {
    return Array.from(this.metrics.values()).map(metric => metric.getSnapshot());
  }
}

// 使用装饰器自动监控方法性能
function Monitor(metricName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const monitor = this.getPerformanceMonitor();
      const timer = monitor.startTimer(name);
      
      try {
        const result = await method.apply(this, args);
        timer.end({ status: 'success' });
        return result;
      } catch (error) {
        timer.end({ status: 'error' });
        throw error;
      }
    };
  };
}

class MemoryService {
  @Monitor('memory.store')
  async store(content: string): Promise<string> {
    // 存储逻辑
  }
  
  @Monitor('memory.search')
  async search(query: string): Promise<Memory[]> {
    // 搜索逻辑
  }
}
```

## 🚀 部署和运维最佳实践

### 1. 健康检查
```typescript
// ✅ 全面的健康检查
class HealthChecker {
  private checks: Map<string, HealthCheck> = new Map();
  
  registerCheck(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
  }
  
  async runHealthChecks(): Promise<HealthStatus> {
    const results: HealthCheckResult[] = [];
    
    for (const [name, check] of this.checks) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          check.execute(),
          this.timeout(5000) // 5秒超时
        ]);
        const duration = Date.now() - startTime;
        
        results.push({
          name,
          status: 'healthy',
          duration,
          details: result
        });
      } catch (error) {
        results.push({
          name,
          status: 'unhealthy',
          error: error.message
        });
      }
    }
    
    const overallStatus = results.every(r => r.status === 'healthy') 
      ? 'healthy' 
      : 'unhealthy';
    
    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date().toISOString()
    };
  }
  
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Health check timeout')), ms)
    );
  }
}

// 数据库健康检查
class DatabaseHealthCheck implements HealthCheck {
  constructor(private db: Database) {}
  
  async execute(): Promise<any> {
    const result = await this.db.query('SELECT 1');
    return { connected: true, responseTime: result.duration };
  }
}

// Redis健康检查
class RedisHealthCheck implements HealthCheck {
  constructor(private redis: Redis) {}
  
  async execute(): Promise<any> {
    const start = Date.now();
    await this.redis.ping();
    const responseTime = Date.now() - start;
    return { connected: true, responseTime };
  }
}
```

### 2. 优雅关闭
```typescript
// ✅ 优雅关闭处理
class GracefulShutdown {
  private shutdownHandlers: Array<() => Promise<void>> = [];
  private isShuttingDown = false;
  
  constructor() {
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
  }
  
  addShutdownHandler(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }
  
  private async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    console.log('开始优雅关闭...');
    
    // 停止接受新请求
    await this.stopAcceptingNewRequests();
    
    // 等待现有请求完成
    await this.waitForActiveRequests();
    
    // 执行关闭处理器
    for (const handler of this.shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        console.error('关闭处理器执行失败:', error);
      }
    }
    
    console.log('优雅关闭完成');
    process.exit(0);
  }
  
  private async stopAcceptingNewRequests(): Promise<void> {
    // 实现停止接受新请求的逻辑
  }
  
  private async waitForActiveRequests(): Promise<void> {
    // 实现等待活跃请求完成的逻辑
  }
}

// 使用示例
const gracefulShutdown = new GracefulShutdown();

gracefulShutdown.addShutdownHandler(async () => {
  console.log('关闭数据库连接...');
  await database.close();
});

gracefulShutdown.addShutdownHandler(async () => {
  console.log('停止智能体...');
  await agentManager.stopAllAgents();
});
```

---

**维护团队**: MJOS最佳实践团队  
**更新频率**: 每季度一次  
**技术支持**: best-practices@mjos.com
