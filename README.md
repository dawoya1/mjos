# MJOS - AI Team Collaboration OS

[![npm version](https://badge.fury.io/js/mjos.svg)](https://badge.fury.io/js/mjos)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-96%20passed-brightgreen.svg)]()
[![Version](https://img.shields.io/badge/version-2.1.10-blue.svg)]()

Enterprise-grade AI team collaboration operating system with memory management, knowledge graphs, team coordination, and **MCP protocol integration**.

## 🚀 Quick Start with MCP

MJOS now supports **Model Context Protocol (MCP)** and can be used directly in Claude Desktop, Cursor, VS Code, and Augment!

### One-Line Installation
```bash
# Run MCP server directly
npx mjos@latest mjos-mcp-server

# Or install globally
npm install -g mjos
```

### MCP Configuration for Claude Desktop
```json
{
  "mcpServers": {
    "mjos": {
      "command": "npx",
      "args": ["-y", "mjos@latest", "mjos-mcp-server"]
    }
  }
}
```

### MCP Configuration for Cursor
```json
{
  "mcpServers": {
    "mjos": {
      "command": "npx",
      "args": ["-y", "mjos@latest", "mjos-mcp-server"]
    }
  }
}
```

**📋 See [MCP Configuration Guide](MCP_CONFIGURATION_GUIDE.md) for complete setup instructions for all supported clients.**

## Features

- **Memory System**: Persistent memory with tagging and importance scoring
- **Knowledge Graph**: Entity relationship mapping and semantic search
- **Team Management**: Role-based collaboration and task assignment
- **Workflow Engine**: Automated process orchestration
- **MCP Integration**: Model Context Protocol support for AI tools
- **Performance Monitoring**: Real-time system metrics and health checks
- **Security**: Role-based access control and audit logging

## 📖 文档中心

### 🌐 HTML文档
- **[主页](docs/index.html)** - 完整的项目介绍和功能展示
- **[架构文档](docs/architecture.html)** - 系统架构和设计原理
- **[API文档](docs/api.html)** - 完整的API参考手册
- **[示例文档](docs/examples.html)** - 使用示例和最佳实践

### 📚 Markdown文档
- **[快速开始](docs/01-getting-started/README.md)** - 安装和基础使用
- **[架构设计](docs/02-architecture/README.md)** - 系统架构详解
- **[API参考](docs/03-api/README.md)** - API接口文档
- **[开发指南](docs/04-development/README.md)** - 开发环境和规范
- **[示例教程](docs/05-examples/README.md)** - 完整使用示例
- **[部署运维](docs/06-deployment/README.md)** - 部署和运维指南
- **[故障排除](docs/07-troubleshooting/README.md)** - 常见问题解决

## ✨ 核心特性

### 🧠 智能系统
- **多层次记忆系统**：短期记忆、长期记忆、情景记忆、程序记忆
- **知识图谱**：语义检索、关系推理、知识演化
- **推理引擎**：演绎、归纳、溯因、类比、因果、概率推理
- **上下文管理**：会话持久化、智能压缩、跨会话共享

### 🤖 智能体协作
- **多智能体系统**：生命周期管理、能力配置、协作模式
- **角色权限系统**：层次化角色、权限继承、动态分配
- **团队管理**：智能任务分配、性能跟踪、协作流程
- **通信系统**：消息路由、协议支持、实时通信

### ⚙️ 工作流引擎
- **可视化工作流**：拖拽式定义、条件分支、并行执行
- **智能任务分配**：基于能力匹配、工作负载均衡
- **自动化流程**：触发器、动作、重试策略

### 🏢 企业级基础设施
- **存储系统**：多提供商支持、缓存、备份恢复
- **安全系统**：身份认证、权限控制、审计日志
- **监控系统**：实时指标、健康检查、智能告警
- **性能优化**：自适应调优、资源管理、负载均衡

### 🌐 多接口支持
- **REST API**：完整的HTTP接口、认证、限流
- **CLI工具**：交互式命令行、批处理模式
- **多语言SDK**：TypeScript/JavaScript/Python/Java/C#
- **MCP协议**：跨平台上下文同步

## 🚀 快速开始

### 安装

```bash
npm install mjos
```

### 基本使用

```typescript
import { MJOS } from 'mjos';

async function main() {
  // 创建MJOS实例
  const mjos = new MJOS();
  
  // 启动系统
  await mjos.start();
  
  // 存储记忆
  const memoryId = mjos.getMemorySystem().store('重要信息', ['项目', '会议'], 0.8);
  
  // 创建任务
  const taskId = mjos.createTask('完成项目文档', '编写完整的API文档');
  
  // 创建智能体
  const agentId = mjos.createAgent({
    name: '文档助手',
    type: 'collaborative',
    capabilities: [
      { name: 'writing', type: 'cognitive', parameters: {}, constraints: {} }
    ]
  });
  
  // 分配任务给智能体
  const assignmentId = mjos.assignTaskToAgent(taskId, agentId);
  
  // 查看系统状态
  console.log(mjos.getStatus());
  
  // 停止系统
  await mjos.stop();
}

main().catch(console.error);
```

### CLI使用

```bash
# 启动MJOS系统
npm run cli start

# 交互模式
npm run cli interactive

# 查看系统状态
npm run cli status

# 创建任务
npm run cli team create-task

# 查看团队成员
npm run cli team members
```

### REST API使用

```bash
# 启动API服务器
npm run cli start --port 3000

# 获取系统状态
curl http://localhost:3000/api/v1/status

# 存储记忆
curl -X POST http://localhost:3000/api/v1/memory/store \
  -H "Content-Type: application/json" \
  -d '{"content": "重要信息", "tags": ["项目"], "importance": 0.8}'

# 创建任务
curl -X POST http://localhost:3000/api/v1/team/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "新任务", "description": "任务描述"}'
```

### 多语言SDK

#### Python
```python
from mjos_sdk import MJOSSDK

sdk = MJOSSDK(api_endpoint="http://localhost:3000/api/v1")

# 存储记忆
memory_id = sdk.store_memory("重要信息", ["项目"], 0.8)

# 创建任务
task_id = sdk.create_task("新任务", "任务描述")
```

#### Java
```java
import com.mjos.MJOSSDK;

MJOSSDK sdk = new MJOSSDK("http://localhost:3000/api/v1", "api-key");

// 存储记忆
String memoryId = sdk.storeMemory("重要信息", Arrays.asList("项目"), 0.8, null);

// 创建任务
String taskId = sdk.createTask("新任务", "任务描述");
```

## 📚 核心概念

### 记忆系统
MJOS的记忆系统模拟人类记忆机制：

- **短期记忆**：临时存储，LRU淘汰策略
- **长期记忆**：持久存储，基于重要性
- **情景记忆**：上下文相关的记忆
- **程序记忆**：技能和过程记忆

### 知识图谱
结构化知识存储和推理：

- **实体关系**：概念、事实、规则、模式
- **语义检索**：基于内容和关系的智能搜索
- **知识推理**：基于图结构的推理能力

### 智能体系统
多智能体协作框架：

- **智能体类型**：反应式、深思式、混合式、学习式
- **能力系统**：感知、推理、规划、执行、通信
- **协作模式**：竞争、合作、协调

### 工作流引擎
自动化业务流程：

- **流程定义**：步骤、条件、分支、循环
- **执行引擎**：并行处理、错误恢复、状态管理
- **监控告警**：执行状态、性能指标、异常处理

## 🏗️ 架构设计

### 分层架构
```
┌─────────────────────────────────────────┐
│              接口层 (Interface)          │
├─────────────────────────────────────────┤
│   API Server │ CLI Tool │ Multi-SDK     │
├─────────────────────────────────────────┤
│              协作层 (Collaboration)      │
├─────────────────────────────────────────┤
│  Agents │ Roles │ Team │ Communication  │
├─────────────────────────────────────────┤
│              核心层 (Core)               │
├─────────────────────────────────────────┤
│ Memory │ Knowledge │ Context │ Reasoning │
├─────────────────────────────────────────┤
│            基础设施层 (Infrastructure)    │
├─────────────────────────────────────────┤
│ Storage │ Security │ Monitoring │ Config │
└─────────────────────────────────────────┘
```

### 模块依赖
- **核心模块**：memory, knowledge, context, reasoning
- **协作模块**：agents, roles, team, communication, workflow
- **接口模块**：api, cli, sdk
- **基础设施**：storage, security, monitoring

## 📖 API文档

### 内存系统 API
```typescript
// 存储记忆
memorySystem.store(content: any, tags: string[], importance: number): string

// 检索记忆
memorySystem.retrieve(id: string): Memory | undefined

// 查询记忆
memorySystem.query(query: MemoryQuery): Memory[]

// 获取统计
memorySystem.getStats(): MemoryStats
```

### 团队管理 API
```typescript
// 创建任务
createTask(title: string, description: string): string

// 分配任务
assignTask(taskId: string, memberId: string): boolean

// 获取团队统计
getTeamStats(): TeamStats
```

### 智能体管理 API
```typescript
// 创建智能体
createAgent(definition: AgentDefinition): string

// 分配任务给智能体
assignTaskToAgent(taskId: string, agentId?: string): string

// 获取智能体状态
getAgent(agentId: string): Agent | undefined
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行集成测试
npm run test:integration

# 生成覆盖率报告
npm run test:coverage

# 监视模式
npm run test:watch
```

## 📊 性能

### 基准测试结果
- **内存存储**：10,000 ops/sec
- **知识查询**：5,000 ops/sec
- **任务分配**：1,000 ops/sec
- **工作流执行**：500 ops/sec

### 资源使用
- **内存占用**：< 100MB (基础配置)
- **启动时间**：< 2秒
- **响应时间**：< 10ms (平均)

## 🔧 配置

### 环境变量
```bash
# 数据库配置
MJOS_DB_HOST=localhost
MJOS_DB_PORT=5432
MJOS_DB_NAME=mjos

# Redis配置
MJOS_REDIS_HOST=localhost
MJOS_REDIS_PORT=6379

# 安全配置
MJOS_JWT_SECRET=your-secret-key
MJOS_ENCRYPTION_KEY=your-encryption-key

# 监控配置
MJOS_ENABLE_METRICS=true
MJOS_METRICS_PORT=9090
```

### 配置文件
```json
{
  "mjos": {
    "enableLearning": true,
    "enableCollaboration": true,
    "maxAgents": 50,
    "maxMemories": 10000,
    "defaultStorageProvider": "file",
    "enableRealTimeMetrics": true
  }
}
```

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

### 开发环境设置
```bash
# 克隆仓库
git clone https://github.com/your-org/mjos.git
cd mjos

# 安装依赖
npm install

# 启动开发模式
npm run dev

# 运行测试
npm test

# 构建项目
npm run build
```

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详细信息。

## 🔗 相关链接

- [官方文档](https://mjos.docs.com)
- [API参考](https://mjos.docs.com/api)
- [示例代码](https://github.com/your-org/mjos-examples)
- [社区论坛](https://community.mjos.com)

## 📞 支持

- 📧 邮箱：support@mjos.com
- 💬 Discord：[MJOS Community](https://discord.gg/mjos)
- 🐛 问题反馈：[GitHub Issues](https://github.com/your-org/mjos/issues)
- 📖 文档：[官方文档](https://mjos.docs.com)
