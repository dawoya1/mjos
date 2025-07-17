# MJOS 用户指南

欢迎使用MJOS（魔剑工作室操作系统）！本指南将详细介绍如何使用MJOS的各项功能。

## 📋 目录

- [安装和设置](#安装和设置)
- [基础使用](#基础使用)
- [记忆系统](#记忆系统)
- [团队管理](#团队管理)
- [上下文管理](#上下文管理)
- [性能监控](#性能监控)
- [事件系统](#事件系统)
- [MCP部署](#mcp部署)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 🚀 安装和设置

### 系统要求

- Node.js 18.0 或更高版本
- npm 8.0 或更高版本
- TypeScript 5.0+ (如果使用TypeScript开发)

### 安装

```bash
# 使用npm安装
npm install mjos

# 或使用yarn安装
yarn add mjos
```

### 验证安装

创建一个简单的测试文件 `test-mjos.js`：

```javascript
const { MJOS } = require('mjos');

async function test() {
  const mjos = new MJOS();
  console.log('MJOS版本:', mjos.getVersion());
  
  await mjos.start();
  console.log('MJOS启动成功!');
  
  await mjos.stop();
  console.log('MJOS停止成功!');
}

test().catch(console.error);
```

运行测试：
```bash
node test-mjos.js
```

## 🎯 基础使用

### 创建和启动MJOS实例

```javascript
const { MJOS } = require('mjos');

async function main() {
  // 创建MJOS实例
  const mjos = new MJOS();
  
  try {
    // 启动系统
    await mjos.start();
    console.log('MJOS系统已启动');
    
    // 获取系统状态
    const status = mjos.getStatus();
    console.log('系统状态:', status);
    
    // 你的业务逻辑...
    
  } finally {
    // 确保系统正确关闭
    await mjos.stop();
    console.log('MJOS系统已停止');
  }
}

main().catch(console.error);
```

### 系统状态检查

```javascript
// 获取完整系统状态
const status = mjos.getStatus();
console.log('版本:', status.version);
console.log('引擎运行状态:', status.engine.running);
console.log('记忆总数:', status.memory.totalMemories);
console.log('团队成员数:', status.team.totalMembers);
console.log('性能状态:', status.performance.status);
```

## 🧠 记忆系统

MJOS的记忆系统基于神经科学原理，支持智能存储和检索。

### 存储记忆

```javascript
// 基本存储
const memoryId = mjos.remember('重要信息');

// 带标签和重要性的存储
const memoryId = mjos.remember(
  '项目会议纪要', 
  ['会议', '项目', '决策'], 
  0.9  // 重要性 (0-1)
);

// 存储复杂对象
const meetingData = {
  date: '2025-01-16',
  participants: ['张三', '李四'],
  decisions: ['采用新架构', '增加测试']
};
const memoryId = mjos.remember(meetingData, ['会议', '决策'], 0.8);
```

### 检索记忆

```javascript
// 按标签检索
const memories = mjos.recall({ tags: ['会议'] });

// 按重要性检索
const importantMemories = mjos.recall({
  importance: { min: 0.8, max: 1.0 }
});

// 按时间范围检索
const recentMemories = mjos.recall({
  timeRange: {
    start: new Date('2025-01-01'),
    end: new Date()
  }
});

// 组合条件检索
const specificMemories = mjos.recall({
  tags: ['项目', '决策'],
  importance: { min: 0.7, max: 1.0 },
  limit: 10
});

// 处理检索结果
memories.forEach(memory => {
  console.log('内容:', memory.content);
  console.log('标签:', memory.tags);
  console.log('重要性:', memory.importance);
  console.log('时间:', memory.timestamp);
});
```

### 记忆系统高级功能

```javascript
// 直接访问记忆系统
const memorySystem = mjos.getMemorySystem();

// 获取统计信息
const stats = memorySystem.getStats();
console.log('记忆总数:', stats.totalMemories);
console.log('标签总数:', stats.totalTags);
console.log('平均重要性:', stats.averageImportance);

// 删除特定记忆
const deleted = memorySystem.delete(memoryId);

// 清空所有记忆
memorySystem.clear();
```

## 👥 团队管理

MJOS内置了完整的团队管理功能，包括成员管理、任务分配和协作会话。

### 团队成员

```javascript
const teamManager = mjos.getTeamManager();

// 获取所有团队成员
const members = teamManager.getAllMembers();
members.forEach(member => {
  console.log(`${member.name} - ${member.role}`);
  console.log('专长:', member.expertise);
  console.log('状态:', member.status);
});

// 获取特定成员
const member = teamManager.getMember('moxiaozhi');
console.log('成员信息:', member);

// 更新成员状态
teamManager.updateMemberStatus('moxiaozhi', 'busy');
```

### 任务管理

```javascript
// 创建任务 - 使用便捷方法
const taskId = mjos.createTask(
  '完成API文档',
  '编写完整的API参考文档',
  'high'  // 优先级: low, medium, high, urgent
);

// 创建任务 - 使用完整参数
const taskId2 = teamManager.createTask({
  title: '系统测试',
  description: '进行全面的系统测试',
  status: 'pending',
  priority: 'medium',
  dueDate: new Date('2025-01-30')
});

// 分配任务
const assigned = mjos.assignTask(taskId, 'moxiaozhi');
console.log('任务分配结果:', assigned);

// 更新任务状态
teamManager.updateTaskStatus(taskId, 'in_progress');

// 获取任务列表
const allTasks = teamManager.getTasks();
const memberTasks = teamManager.getTasks({ assignedTo: 'moxiaozhi' });
const pendingTasks = teamManager.getTasks({ status: 'pending' });

// 任务信息
allTasks.forEach(task => {
  console.log(`任务: ${task.title}`);
  console.log(`状态: ${task.status}`);
  console.log(`优先级: ${task.priority}`);
  console.log(`分配给: ${task.assignedTo || '未分配'}`);
});
```

### 协作会话

```javascript
// 开始协作会话
const sessionId = teamManager.startCollaboration(
  '技术架构讨论',
  ['moxiaozhi', 'moxiaochuang', 'moxiaocang']
);

// 获取活跃会话
const activeSessions = teamManager.getActiveSessions();
activeSessions.forEach(session => {
  console.log(`会话: ${session.topic}`);
  console.log(`参与者: ${session.participants.length}人`);
  console.log(`开始时间: ${session.startTime}`);
});

// 结束会话
const ended = teamManager.endCollaboration(sessionId);
```

### 团队统计

```javascript
const stats = teamManager.getTeamStats();
console.log('团队统计:');
console.log(`- 总成员数: ${stats.totalMembers}`);
console.log(`- 活跃成员: ${stats.activeMembers}`);
console.log(`- 总任务数: ${stats.totalTasks}`);
console.log(`- 已完成任务: ${stats.completedTasks}`);
console.log(`- 活跃会话: ${stats.activeSessions}`);
```

## 📊 上下文管理

上下文管理用于维护应用状态和共享数据。

### 基本操作

```javascript
const contextManager = mjos.getContextManager();

// 设置上下文
contextManager.set('currentProject', 'MJOS开发');
contextManager.set('environment', 'development');
contextManager.set('userPreferences', {
  theme: 'dark',
  language: 'zh-CN'
});

// 获取上下文
const project = contextManager.get('currentProject');
const env = contextManager.get('environment');

// 检查上下文是否存在
if (contextManager.has('currentProject')) {
  console.log('项目上下文已设置');
}

// 删除上下文
const deleted = contextManager.delete('environment');

// 获取所有上下文
const allContext = contextManager.getAll();
console.log('所有上下文:', allContext);

// 清空上下文
contextManager.clear();
```

### 上下文使用模式

```javascript
// 会话上下文模式
function setupSessionContext(userId, sessionId) {
  contextManager.set('session', {
    userId,
    sessionId,
    startTime: new Date(),
    permissions: ['read', 'write']
  });
}

// 项目上下文模式
function setupProjectContext(projectName, phase) {
  contextManager.set('project', {
    name: projectName,
    phase,
    startDate: new Date(),
    team: ['moxiaozhi', 'moxiaochuang']
  });
}

// 配置上下文模式
function setupConfiguration() {
  contextManager.set('config', {
    debugMode: true,
    logLevel: 'info',
    maxRetries: 3,
    timeout: 5000
  });
}
```

## ⚡ 性能监控

MJOS内置了实时性能监控功能。

### 获取性能指标

```javascript
// 获取详细性能指标
const metrics = mjos.getPerformanceMetrics();

console.log('操作计数:');
console.log(`- 记忆操作: ${metrics.operationCounts.memoryOperations}`);
console.log(`- 任务操作: ${metrics.operationCounts.taskOperations}`);
console.log(`- 上下文操作: ${metrics.operationCounts.contextOperations}`);

console.log('响应时间:');
console.log(`- 记忆查询: ${metrics.responseTimes.averageMemoryQuery.toFixed(2)}ms`);
console.log(`- 任务创建: ${metrics.responseTimes.averageTaskCreation.toFixed(2)}ms`);
console.log(`- 上下文访问: ${metrics.responseTimes.averageContextAccess.toFixed(2)}ms`);

console.log('内存使用:');
console.log(`- 已用: ${(metrics.memoryUsage.used / 1024 / 1024).toFixed(2)}MB`);
console.log(`- 总计: ${(metrics.memoryUsage.total / 1024 / 1024).toFixed(2)}MB`);
console.log(`- 使用率: ${metrics.memoryUsage.percentage.toFixed(1)}%`);
```

### 性能状态检查

```javascript
// 获取性能摘要
const summary = mjos.getPerformanceSummary();

console.log(`性能状态: ${summary.status}`); // healthy, warning, critical

if (summary.issues.length > 0) {
  console.log('性能问题:');
  summary.issues.forEach(issue => {
    console.log(`- ${issue}`);
  });
}
```

### 性能监控管理

```javascript
const perfMonitor = mjos.getPerformanceMonitor();

// 重置性能指标
mjos.resetPerformanceMetrics();

// 手动记录操作
perfMonitor.recordOperation('memory', 150); // 记录150ms的记忆操作
perfMonitor.recordError('ValidationError'); // 记录错误
```

## 🔄 事件系统

MJOS使用事件驱动架构，支持监听系统事件。

### 监听系统事件

```javascript
const eventBus = mjos.getEngine().getEventBus();

// 监听任务事件
eventBus.on('team:task:created', (task) => {
  console.log(`新任务创建: ${task.title}`);
  
  // 自动记录到记忆系统
  mjos.remember(`任务"${task.title}"已创建`, ['任务', '日志'], 0.6);
});

eventBus.on('team:task:assigned', ({ task, member }) => {
  console.log(`任务"${task.title}"分配给${member.name}`);
});

// 监听引擎事件
eventBus.on('engine:started', () => {
  console.log('MJOS引擎已启动');
});

eventBus.on('engine:stopped', () => {
  console.log('MJOS引擎已停止');
});

// 监听协作事件
eventBus.on('team:collaboration:started', (session) => {
  console.log(`协作会话开始: ${session.topic}`);
});
```

### 自定义事件

```javascript
// 发送自定义事件
eventBus.emit('custom:event', { data: 'example' });

// 监听自定义事件
eventBus.on('custom:event', (data) => {
  console.log('收到自定义事件:', data);
});

// 移除事件监听器
const listener = (data) => console.log(data);
eventBus.on('test:event', listener);
eventBus.off('test:event', listener);
```

## 🌐 MCP部署

MJOS支持作为MCP（Model Context Protocol）服务器部署，可以与支持MCP的AI客户端（如Claude Desktop、Cursor等）集成。

### MCP服务器配置

MJOS提供了完整的MCP服务器实现，支持以下功能：

- **记忆管理**: 通过MCP接口存储和检索记忆
- **任务管理**: 创建、分配和管理团队任务
- **上下文共享**: 与AI客户端共享上下文信息
- **性能监控**: 实时监控系统性能状态

### 启动MCP服务器

```bash
# 启动MJOS MCP服务器
npm run mcp:start

# 或者使用Node.js直接运行
node examples/mcp-server-demo.js
```

### MCP客户端配置

#### Claude Desktop配置

在Claude Desktop的配置文件中添加MJOS MCP服务器：

```json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": ["path/to/mjos/examples/mcp-server-demo.js"],
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Cursor配置

在Cursor中配置MJOS MCP服务器：

```json
{
  "mcp": {
    "servers": [
      {
        "name": "mjos",
        "command": "node examples/mcp-server-demo.js",
        "cwd": "path/to/mjos"
      }
    ]
  }
}
```

### MCP工具使用

一旦配置完成，您可以在AI客户端中使用以下MJOS工具：

#### 记忆管理工具
```
mjos_remember - 存储记忆到MJOS系统
mjos_recall - 从MJOS系统检索记忆
mjos_memory_stats - 获取记忆系统统计信息
```

#### 任务管理工具
```
mjos_create_task - 创建新任务
mjos_assign_task - 分配任务给团队成员
mjos_get_tasks - 获取任务列表
mjos_team_stats - 获取团队统计信息
```

#### 系统监控工具
```
mjos_get_status - 获取系统状态
mjos_performance_metrics - 获取性能指标
mjos_health_check - 系统健康检查
```

### MCP使用示例

在支持MCP的AI客户端中，您可以这样使用MJOS：

```
用户: 请帮我记住这次会议的要点：讨论了新产品功能，决定下周开始开发。

AI: 我来帮您将会议要点存储到MJOS记忆系统中。

[使用 mjos_remember 工具]
- 内容: "讨论了新产品功能，决定下周开始开发"
- 标签: ["会议", "产品", "决策"]
- 重要性: 0.8

已成功存储到MJOS记忆系统，记忆ID: mem_1642345678_abc123
```

```
用户: 帮我创建一个开发任务并分配给莫小仓。

AI: 我来为您创建开发任务并分配给莫小仓。

[使用 mjos_create_task 工具]
- 标题: "新产品功能开发"
- 描述: "根据会议决策开发新产品功能"
- 优先级: "high"

[使用 mjos_assign_task 工具]
- 任务ID: task_1642345679_def456
- 分配给: "moxiaocang"

任务已成功创建并分配给莫小仓（Cangjie编程专家）。
```

### MCP部署最佳实践

1. **环境配置**
```bash
# 设置环境变量
export MJOS_LOG_LEVEL=info
export MJOS_MCP_PORT=3000
export MJOS_DATA_DIR=/path/to/data
```

2. **日志配置**
```javascript
// 在MCP服务器中启用详细日志
const contextManager = mjos.getContextManager();
contextManager.set('mcpMode', true);
contextManager.set('logLevel', 'debug');
```

3. **性能优化**
```javascript
// 为MCP使用优化性能设置
const perfMonitor = mjos.getPerformanceMonitor();
perfMonitor.start();

// 定期清理以保持性能
setInterval(() => {
  const summary = mjos.getPerformanceSummary();
  if (summary.status === 'warning') {
    mjos.resetPerformanceMetrics();
  }
}, 300000); // 每5分钟检查一次
```

### MCP故障排除

#### 连接问题
```bash
# 检查MCP服务器状态
curl http://localhost:3000/health

# 查看MCP服务器日志
tail -f mjos-mcp.log
```

#### 工具调用失败
```javascript
// 在MCP服务器中添加错误处理
process.on('uncaughtException', (error) => {
  console.error('MCP服务器错误:', error);
  // 记录到MJOS记忆系统
  mjos.remember(`MCP错误: ${error.message}`, ['错误', 'MCP'], 0.7);
});
```

## 💡 最佳实践

### 1. 错误处理

```javascript
async function robustMJOSUsage() {
  const mjos = new MJOS();
  
  try {
    await mjos.start();
    
    // 你的业务逻辑
    
  } catch (error) {
    console.error('MJOS操作失败:', error.message);
    
    // 记录错误到记忆系统
    if (mjos.getStatus().engine.running) {
      mjos.remember(`错误: ${error.message}`, ['错误', '日志'], 0.7);
    }
  } finally {
    // 确保系统正确关闭
    try {
      await mjos.stop();
    } catch (stopError) {
      console.error('停止MJOS失败:', stopError.message);
    }
  }
}
```

### 2. 记忆管理

```javascript
// 使用有意义的标签
mjos.remember('重要决策', ['决策', '重要', '2025-01'], 0.9);

// 设置合适的重要性等级
// 0.9-1.0: 关键信息
// 0.7-0.8: 重要信息  
// 0.5-0.6: 一般信息
// 0.1-0.4: 临时信息

// 定期清理不需要的记忆
const oldMemories = mjos.recall({
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  },
  importance: { min: 0, max: 0.3 }
});

// 删除低重要性的旧记忆
const memorySystem = mjos.getMemorySystem();
oldMemories.forEach(memory => {
  memorySystem.delete(memory.id);
});
```

### 3. 性能优化

```javascript
// 监控性能并采取行动
const summary = mjos.getPerformanceSummary();

if (summary.status === 'warning') {
  console.log('性能警告，考虑优化');
  
  // 清理上下文
  const contextManager = mjos.getContextManager();
  contextManager.clear();
  
  // 重置性能指标
  mjos.resetPerformanceMetrics();
}

// 批量操作优化
const tasks = [
  { title: '任务1', description: '描述1' },
  { title: '任务2', description: '描述2' },
  { title: '任务3', description: '描述3' }
];

// 批量创建任务
const taskIds = tasks.map(task => 
  mjos.createTask(task.title, task.description, 'medium')
);
```

## 🔧 故障排除

### 常见问题

#### 1. 系统启动失败

```javascript
// 检查系统状态
const status = mjos.getStatus();
if (!status.engine.running) {
  console.log('引擎未运行，尝试重新启动');
  await mjos.start();
}
```

#### 2. 记忆检索为空

```javascript
// 检查记忆系统状态
const memoryStats = mjos.getMemorySystem().getStats();
if (memoryStats.totalMemories === 0) {
  console.log('记忆系统为空，请先存储一些数据');
}

// 检查查询条件
const allMemories = mjos.recall({}); // 获取所有记忆
console.log('总记忆数:', allMemories.length);
```

#### 3. 性能问题

```javascript
// 检查性能状态
const perfSummary = mjos.getPerformanceSummary();
if (perfSummary.status !== 'healthy') {
  console.log('性能问题:', perfSummary.issues);
  
  // 重置性能监控
  mjos.resetPerformanceMetrics();
}
```

### 调试技巧

```javascript
// 启用详细日志
const contextManager = mjos.getContextManager();
contextManager.set('debugMode', true);

// 监听所有事件进行调试
const eventBus = mjos.getEngine().getEventBus();
const originalEmit = eventBus.emit;
eventBus.emit = function(event, ...args) {
  console.log(`事件: ${event}`, args);
  return originalEmit.call(this, event, ...args);
};
```

---

## 📞 获取帮助

如果遇到问题：

1. 查看 [API文档](./API.md)
2. 运行 `examples/getting-started.js` 验证安装
3. 检查 [GitHub Issues](https://github.com/magic-sword-studio/mjos/issues)
4. 在 [Discussions](https://github.com/magic-sword-studio/mjos/discussions) 中提问

---

**魔剑工作室团队**  
让AI团队协作更智能、更高效
