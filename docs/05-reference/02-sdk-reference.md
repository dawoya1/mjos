# MJOS SDK 开发参考

> **最后更新时间**: 2025-07-17 09:47:15 UTC  
> **文档版本**: v2.0.0  
> **更新内容**: 创建完整的SDK开发参考文档

## 📋 概述

MJOS SDK提供了完整的编程接口，支持多种编程语言，让开发者能够轻松集成和扩展MJOS系统功能。

## 🚀 支持的语言

- **TypeScript/JavaScript** - 主要SDK，功能最完整
- **Python** - 数据科学和AI集成
- **Java** - 企业级应用集成
- **Go** - 高性能服务集成
- **C#** - .NET生态系统集成

## 📦 安装

### TypeScript/JavaScript
```bash
npm install mjos-sdk
# 或
yarn add mjos-sdk
```

### Python
```bash
pip install mjos-sdk
```

### Java
```xml
<dependency>
    <groupId>com.mjos</groupId>
    <artifactId>mjos-sdk</artifactId>
    <version>2.0.0</version>
</dependency>
```

### Go
```bash
go get github.com/mjos/mjos-sdk-go
```

### C#
```bash
dotnet add package MJOS.SDK
```

## 🔧 TypeScript/JavaScript SDK

### 基本使用

#### 初始化客户端
```typescript
import { MJOSClient } from 'mjos-sdk';

// 基本初始化
const client = new MJOSClient({
  endpoint: 'http://localhost:3000',
  apiKey: 'your-api-key'
});

// 高级配置
const client = new MJOSClient({
  endpoint: 'https://api.mjos.com',
  apiKey: 'your-api-key',
  timeout: 30000,
  retries: 3,
  logger: console,
  enableMetrics: true
});
```

#### 连接和认证
```typescript
// 连接到服务器
await client.connect();

// 使用Token认证
await client.authenticate('your-jwt-token');

// 使用用户名密码认证
await client.login('username', 'password');

// 检查连接状态
const isConnected = client.isConnected();
```

### 记忆系统API

#### 存储记忆
```typescript
// 基本存储
const memoryId = await client.memory.store({
  content: '今天学习了MJOS系统架构',
  tags: ['学习', '架构'],
  importance: 0.8
});

// 高级存储
const memoryId = await client.memory.store({
  content: '项目会议记录',
  tags: ['会议', '项目'],
  importance: 0.9,
  category: '工作',
  metadata: {
    date: '2025-01-17',
    participants: ['张三', '李四'],
    duration: 60
  },
  associations: ['memory123', 'memory456']
});
```

#### 检索记忆
```typescript
// 按ID检索
const memory = await client.memory.retrieve('memory-id');

// 搜索记忆
const results = await client.memory.search({
  query: 'TypeScript学习',
  tags: ['学习'],
  limit: 10,
  minImportance: 0.5
});

// 高级搜索
const results = await client.memory.search({
  query: '项目会议',
  filters: {
    category: '工作',
    dateRange: {
      from: '2025-01-01',
      to: '2025-01-31'
    },
    tags: ['会议'],
    importance: { min: 0.7, max: 1.0 }
  },
  sort: 'importance',
  limit: 20,
  offset: 0
});
```

#### 更新和删除记忆
```typescript
// 更新记忆
await client.memory.update('memory-id', {
  content: '更新后的内容',
  importance: 0.9,
  tags: ['学习', '更新']
});

// 删除记忆
await client.memory.delete('memory-id');

// 批量删除
await client.memory.deleteBatch(['id1', 'id2', 'id3']);
```

### 知识图谱API

#### 添加知识节点
```typescript
// 添加事实节点
const nodeId = await client.knowledge.addFact({
  subject: 'TypeScript',
  predicate: 'is',
  object: '编程语言',
  confidence: 0.95,
  source: '官方文档'
});

// 添加概念节点
const conceptId = await client.knowledge.addConcept({
  name: '人工智能',
  description: 'AI是计算机科学的一个分支',
  category: '技术',
  properties: {
    domain: '计算机科学',
    complexity: 'high'
  }
});
```

#### 查询知识
```typescript
// 简单查询
const facts = await client.knowledge.query({
  subject: 'TypeScript'
});

// 复杂查询
const results = await client.knowledge.query({
  pattern: {
    subject: '?x',
    predicate: 'is',
    object: '编程语言'
  },
  filters: {
    confidence: { min: 0.8 }
  },
  limit: 10
});

// 路径查询
const path = await client.knowledge.findPath('TypeScript', 'JavaScript');
```

### 智能体API

#### 创建智能体
```typescript
// 创建基本智能体
const agentId = await client.agent.create({
  name: '数据分析师',
  type: 'deliberative',
  role: '数据分析专家',
  capabilities: [
    {
      name: 'data-analysis',
      type: 'cognitive',
      parameters: {
        algorithms: ['regression', 'clustering'],
        tools: ['pandas', 'numpy']
      }
    }
  ]
});

// 创建高级智能体
const agentId = await client.agent.create({
  name: '项目经理助手',
  type: 'hybrid',
  role: '项目管理专家',
  capabilities: [
    { name: 'task-planning', type: 'cognitive' },
    { name: 'resource-allocation', type: 'cognitive' },
    { name: 'risk-assessment', type: 'analytical' }
  ],
  configuration: {
    maxConcurrentTasks: 5,
    memoryLimit: 1000,
    collaborationMode: 'proactive',
    preferences: {
      communicationStyle: 'formal',
      reportingFrequency: 'daily'
    }
  }
});
```

#### 智能体交互
```typescript
// 发送消息给智能体
const response = await client.agent.sendMessage(agentId, {
  content: '请分析最近一周的销售数据',
  type: 'request',
  priority: 'high',
  context: {
    dataSource: 'sales_db',
    timeRange: '2025-01-10 to 2025-01-17'
  }
});

// 获取智能体状态
const status = await client.agent.getStatus(agentId);

// 获取智能体能力
const capabilities = await client.agent.getCapabilities(agentId);
```

### 任务管理API

#### 创建和管理任务
```typescript
// 创建任务
const taskId = await client.task.create({
  title: '数据分析报告',
  description: '分析Q4销售数据并生成报告',
  priority: 'high',
  deadline: '2025-01-25T18:00:00Z',
  tags: ['分析', '报告', 'Q4'],
  requirements: {
    skills: ['data-analysis', 'reporting'],
    resources: ['sales_data', 'template']
  }
});

// 分配任务
await client.task.assign(taskId, agentId);

// 更新任务状态
await client.task.updateStatus(taskId, 'in-progress', {
  progress: 0.3,
  notes: '已完成数据收集，开始分析阶段'
});

// 获取任务列表
const tasks = await client.task.list({
  status: 'active',
  assignee: agentId,
  priority: ['high', 'urgent'],
  limit: 20
});
```

### 团队协作API

#### 团队管理
```typescript
// 创建团队
const teamId = await client.team.create({
  name: '数据科学团队',
  description: '负责数据分析和机器学习项目',
  members: [agentId1, agentId2],
  roles: {
    [agentId1]: 'lead',
    [agentId2]: 'analyst'
  }
});

// 添加成员
await client.team.addMember(teamId, agentId3, 'developer');

// 团队协作
await client.team.collaborate(teamId, {
  task: taskId,
  strategy: 'parallel',
  coordination: 'centralized'
});
```

### 事件和监听

#### 事件监听
```typescript
// 监听记忆事件
client.on('memory:stored', (event) => {
  console.log('新记忆已存储:', event.memoryId);
});

// 监听智能体事件
client.on('agent:message', (event) => {
  console.log('智能体消息:', event.agentId, event.message);
});

// 监听任务事件
client.on('task:completed', (event) => {
  console.log('任务完成:', event.taskId, event.result);
});

// 监听系统事件
client.on('system:error', (event) => {
  console.error('系统错误:', event.error);
});
```

#### 实时订阅
```typescript
// 订阅智能体状态变化
const subscription = await client.subscribe('agent:status', {
  agentId: agentId,
  events: ['status-change', 'task-assignment', 'message']
});

// 取消订阅
await subscription.unsubscribe();
```

### 配置和工具

#### 配置管理
```typescript
// 获取配置
const config = await client.config.get('memory.retention');

// 设置配置
await client.config.set('memory.retention', 30);

// 批量配置
await client.config.setBatch({
  'memory.retention': 30,
  'agent.maxConcurrent': 10,
  'task.defaultPriority': 'medium'
});
```

#### 性能监控
```typescript
// 获取性能指标
const metrics = await client.metrics.get();

// 获取特定指标
const memoryUsage = await client.metrics.get('memory.usage');

// 监控性能
client.metrics.monitor('response-time', (metric) => {
  if (metric.value > 1000) {
    console.warn('响应时间过长:', metric.value);
  }
});
```

## 🐍 Python SDK

### 基本使用
```python
from mjos_sdk import MJOSClient

# 初始化客户端
client = MJOSClient(
    endpoint='http://localhost:3000',
    api_key='your-api-key'
)

# 连接
await client.connect()
```

### 记忆操作
```python
# 存储记忆
memory_id = await client.memory.store(
    content='Python数据分析学习笔记',
    tags=['Python', '数据分析'],
    importance=0.8
)

# 搜索记忆
results = await client.memory.search(
    query='Python学习',
    limit=10
)
```

### 智能体操作
```python
# 创建智能体
agent_id = await client.agent.create(
    name='数据科学家',
    type='deliberative',
    capabilities=['data-analysis', 'machine-learning']
)

# 发送消息
response = await client.agent.send_message(
    agent_id,
    content='请分析这个数据集',
    context={'dataset': 'sales_data.csv'}
)
```

## ☕ Java SDK

### 基本使用
```java
import com.mjos.sdk.MJOSClient;
import com.mjos.sdk.config.ClientConfig;

// 初始化客户端
ClientConfig config = ClientConfig.builder()
    .endpoint("http://localhost:3000")
    .apiKey("your-api-key")
    .timeout(30000)
    .build();

MJOSClient client = new MJOSClient(config);
client.connect();
```

### 记忆操作
```java
// 存储记忆
MemoryRequest request = MemoryRequest.builder()
    .content("Java企业级开发经验")
    .tags(Arrays.asList("Java", "企业级"))
    .importance(0.9)
    .build();

String memoryId = client.memory().store(request);

// 搜索记忆
SearchRequest searchRequest = SearchRequest.builder()
    .query("Java开发")
    .limit(10)
    .build();

List<Memory> results = client.memory().search(searchRequest);
```

## 🔗 错误处理

### TypeScript错误处理
```typescript
try {
  const memory = await client.memory.retrieve('invalid-id');
} catch (error) {
  if (error instanceof MJOSError) {
    switch (error.code) {
      case 'MEMORY_NOT_FOUND':
        console.log('记忆不存在');
        break;
      case 'AUTHENTICATION_FAILED':
        console.log('认证失败');
        break;
      case 'RATE_LIMIT_EXCEEDED':
        console.log('请求频率过高');
        break;
      default:
        console.log('未知错误:', error.message);
    }
  }
}
```

### 重试机制
```typescript
const client = new MJOSClient({
  endpoint: 'http://localhost:3000',
  apiKey: 'your-api-key',
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    retryCondition: (error) => error.code === 'NETWORK_ERROR'
  }
});
```

## 📊 最佳实践

### 连接管理
```typescript
// 使用连接池
const client = new MJOSClient({
  endpoint: 'http://localhost:3000',
  apiKey: 'your-api-key',
  poolConfig: {
    maxConnections: 10,
    keepAlive: true,
    timeout: 30000
  }
});

// 优雅关闭
process.on('SIGTERM', async () => {
  await client.disconnect();
  process.exit(0);
});
```

### 批量操作
```typescript
// 批量存储记忆
const memories = [
  { content: '记忆1', tags: ['tag1'] },
  { content: '记忆2', tags: ['tag2'] },
  { content: '记忆3', tags: ['tag3'] }
];

const results = await client.memory.storeBatch(memories);
```

### 缓存策略
```typescript
// 启用本地缓存
const client = new MJOSClient({
  endpoint: 'http://localhost:3000',
  apiKey: 'your-api-key',
  cache: {
    enabled: true,
    ttl: 300000, // 5分钟
    maxSize: 1000
  }
});
```

---

**维护团队**: MJOS SDK团队  
**更新频率**: 每个版本发布时更新  
**技术支持**: sdk@mjos.com
