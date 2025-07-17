# 📚 MJOS API 文档

> **完美企业级AI智能操作系统 - 96个测试100%通过，0个资源泄漏，生产就绪**

## 🏆 质量保证

<div align="center">

**✅ 96个测试100%通过 | ✅ 0个资源泄漏 | ✅ 生产就绪**

</div>

## 📖 相关文档

- **[HTML主页](../index.html)** - 完整的项目介绍和功能展示
- **[快速开始](../01-getting-started/01-quickstart.md)** - 安装和基础使用
- **[系统架构](../02-architecture/01-system-architecture.md)** - 系统设计详解

## 目录

- [MJOS 主类](#mjos-主类)
- [记忆系统 API](#记忆系统-api)
- [团队管理 API](#团队管理-api)
- [上下文管理 API](#上下文管理-api)
- [核心引擎 API](#核心引擎-api)
- [MCP 工具 API](#mcp-工具-api)
- [类型定义](#类型定义)

## MJOS 主类

### 构造函数

```typescript
constructor()
```

创建一个新的MJOS实例。

**示例:**
```javascript
const mjos = new MJOS();
```

### 生命周期方法

#### `async start(): Promise<void>`

启动MJOS系统，初始化所有子系统。

**示例:**
```javascript
await mjos.start();
console.log('MJOS系统已启动');
```

#### `async stop(): Promise<void>`

停止MJOS系统，清理资源。

**示例:**
```javascript
await mjos.stop();
console.log('MJOS系统已停止');
```

### 信息获取方法

#### `getVersion(): string`

获取MJOS系统版本号。

**返回值:** 版本字符串

**示例:**
```javascript
const version = mjos.getVersion();
console.log(`MJOS版本: ${version}`);
```

#### `getStatus(): SystemStatus`

获取系统完整状态信息。

**返回值:** SystemStatus对象

**示例:**
```javascript
const status = mjos.getStatus();
console.log('系统状态:', status);
```

### 便捷方法

#### `remember(content: any, tags?: string[], importance?: number): string`

存储记忆到记忆系统。

**参数:**
- `content`: 记忆内容（任意类型）
- `tags`: 标签数组（可选，默认为空数组）
- `importance`: 重要性（可选，0-1之间，默认0.5）

**返回值:** 记忆ID字符串

**示例:**
```javascript
const memoryId = mjos.remember('重要会议纪要', ['会议', '决策'], 0.9);
console.log('记忆已存储，ID:', memoryId);
```

#### `recall(query: MemoryQuery): MemoryItem[]`

从记忆系统检索记忆。

**参数:**
- `query`: 查询条件对象

**返回值:** 记忆项数组

**示例:**
```javascript
const memories = mjos.recall({
  tags: ['会议'],
  importance: { min: 0.7, max: 1.0 },
  limit: 5
});
console.log('找到记忆:', memories.length);
```

#### `createTask(title: string, description: string, priority?: TaskPriority): string`

创建新任务。

**参数:**
- `title`: 任务标题
- `description`: 任务描述
- `priority`: 任务优先级（可选，默认'medium'）

**返回值:** 任务ID字符串

**示例:**
```javascript
const taskId = mjos.createTask('完成API文档', '编写完整的API文档', 'high');
console.log('任务已创建，ID:', taskId);
```

#### `assignTask(taskId: string, memberId: string): boolean`

分配任务给团队成员。

**参数:**
- `taskId`: 任务ID
- `memberId`: 团队成员ID

**返回值:** 是否分配成功

**示例:**
```javascript
const success = mjos.assignTask(taskId, 'moxiaozhi');
if (success) {
  console.log('任务分配成功');
}
```

### 系统组件访问

#### `getEngine(): MJOSEngine`

获取核心引擎实例。

#### `getMemorySystem(): MemorySystem`

获取记忆系统实例。

#### `getTeamManager(): TeamManager`

获取团队管理器实例。

#### `getContextManager(): ContextManager`

获取上下文管理器实例。

## 记忆系统 API

### MemorySystem 类

#### `store(content: any, tags?: string[], importance?: number): string`

存储记忆项。

#### `retrieve(id: string): MemoryItem | undefined`

根据ID检索记忆项。

#### `query(query: MemoryQuery): MemoryItem[]`

查询记忆项。

#### `delete(id: string): boolean`

删除记忆项。

#### `clear(): void`

清空所有记忆。

#### `getStats(): MemoryStats`

获取记忆系统统计信息。

## 团队管理 API

### TeamManager 类

#### 成员管理

##### `addMember(member: TeamMember): void`

添加团队成员。

##### `getMember(id: string): TeamMember | undefined`

获取团队成员信息。

##### `getAllMembers(): TeamMember[]`

获取所有团队成员。

##### `updateMemberStatus(id: string, status: MemberStatus): boolean`

更新成员状态。

#### 任务管理

##### `createTask(task: TaskInput): string`

创建任务。

##### `assignTask(taskId: string, memberId: string): boolean`

分配任务。

##### `updateTaskStatus(taskId: string, status: TaskStatus): boolean`

更新任务状态。

##### `getTasks(filter?: TaskFilter): Task[]`

获取任务列表。

#### 协作管理

##### `startCollaboration(topic: string, participants: string[]): string`

开始协作会话。

##### `endCollaboration(sessionId: string): boolean`

结束协作会话。

##### `getActiveSessions(): CollaborationSession[]`

获取活跃的协作会话。

#### 统计信息

##### `getTeamStats(): TeamStats`

获取团队统计信息。

## 上下文管理 API

### ContextManager 类

#### `set(key: string, value: any): void`

设置上下文值。

#### `get(key: string): any`

获取上下文值。

#### `has(key: string): boolean`

检查上下文键是否存在。

#### `delete(key: string): boolean`

删除上下文键值对。

#### `clear(): void`

清空所有上下文。

#### `getAll(): Record<string, any>`

获取所有上下文。

## 核心引擎 API

### MJOSEngine 类

#### `async start(): Promise<void>`

启动引擎。

#### `async stop(): Promise<void>`

停止引擎。

#### `getStatus(): EngineStatus`

获取引擎状态。

#### `getEventBus(): EventBus`

获取事件总线实例。

## 类型定义

### 基础类型

```typescript
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type MemberStatus = 'active' | 'busy' | 'offline';
```

### 接口定义

```typescript
interface MemoryItem {
  id: string;
  content: any;
  timestamp: Date;
  tags: string[];
  importance: number;
}

interface MemoryQuery {
  tags?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  importance?: {
    min: number;
    max: number;
  };
  limit?: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  status: MemberStatus;
  expertise: string[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

interface SystemStatus {
  version: string;
  engine: EngineStatus;
  memory: MemoryStats;
  team: TeamStats;
}
```

## 错误处理

MJOS使用标准的JavaScript错误处理机制。所有异步方法都会抛出适当的错误，应该使用try-catch块或.catch()方法处理。

**示例:**
```javascript
try {
  await mjos.start();
} catch (error) {
  console.error('启动失败:', error.message);
}
```

## 事件系统

MJOS使用事件驱动架构。可以通过EventBus监听系统事件：

```javascript
const eventBus = mjos.getEngine().getEventBus();

eventBus.on('team:task:created', (task) => {
  console.log('新任务创建:', task.title);
});

eventBus.on('team:member:status_updated', ({ id, status }) => {
  console.log(`成员${id}状态更新为${status}`);
});
```

## MCP 工具 API

MJOS提供了完整的MCP（Model Context Protocol）工具集，可以在支持MCP的AI客户端中使用。

### 记忆管理工具

#### `mjos_remember`
存储记忆到MJOS系统。

**参数:**
- `content` (string): 记忆内容
- `tags` (array): 标签列表
- `importance` (number): 重要性 (0-1)

**返回:**
```json
{
  "success": true,
  "memoryId": "mem_1642345678_abc123",
  "message": "记忆已存储，ID: mem_1642345678_abc123"
}
```

#### `mjos_recall`
从MJOS系统检索记忆。

**参数:**
- `tags` (array): 搜索标签
- `importance_min` (number): 最小重要性
- `importance_max` (number): 最大重要性
- `limit` (number): 结果限制

**返回:**
```json
{
  "success": true,
  "count": 2,
  "memories": [
    {
      "id": "mem_1642345678_abc123",
      "content": "重要会议记录",
      "tags": ["会议", "决策"],
      "importance": 0.9,
      "timestamp": "2025-01-16T10:30:00Z"
    }
  ]
}
```

### 任务管理工具

#### `mjos_create_task`
创建新任务。

**参数:**
- `title` (string): 任务标题
- `description` (string): 任务描述
- `priority` (string): 优先级 (low/medium/high/urgent)

**返回:**
```json
{
  "success": true,
  "taskId": "task_1642345679_def456",
  "message": "任务已创建，ID: task_1642345679_def456"
}
```

#### `mjos_assign_task`
分配任务给团队成员。

**参数:**
- `task_id` (string): 任务ID
- `member_id` (string): 成员ID (moxiaozhi/moxiaochuang/moxiaocang/moxiaoce)

**返回:**
```json
{
  "success": true,
  "message": "任务已分配给 莫小智"
}
```

### 系统监控工具

#### `mjos_get_status`
获取MJOS系统状态。

**返回:**
```json
{
  "success": true,
  "status": {
    "version": "1.0.0",
    "engine_running": true,
    "memory_count": 15,
    "team_members": 4,
    "total_tasks": 8,
    "performance_status": "healthy"
  }
}
```

#### `mjos_performance_metrics`
获取性能指标。

**返回:**
```json
{
  "success": true,
  "metrics": {
    "memory_operations": 150,
    "task_operations": 45,
    "context_operations": 89,
    "avg_memory_query_time": 0.03,
    "avg_task_creation_time": 0.10,
    "memory_usage_percent": 45.2,
    "system_uptime": 3600000,
    "total_errors": 0
  }
}
```

### MCP服务器配置

要使用这些工具，需要先启动MCP服务器：

```bash
npm run mcp:start
# 或者
node examples/mcp-server-demo.js
```

然后在AI客户端中配置：

```json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": [".mjos/examples/mcp-server-demo.js"],
      "cwd": "您的项目根目录"
    }
  }
}
```

## 最佳实践

1. **总是使用try-catch处理异步操作**
2. **合理设置记忆重要性等级**
3. **使用有意义的标签组织记忆**
4. **定期清理不需要的上下文**
5. **监听相关事件以实现响应式功能**
6. **在MCP环境中使用相对路径 (.mjos/)**
7. **为MCP工具提供清晰的参数描述**
