# MJOS - 魔剑工作室操作系统

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-org/mjos)
[![Coverage](https://img.shields.io/badge/coverage-91%25-brightgreen.svg)](https://github.com/your-org/mjos)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/mjos)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/your-org/mjos)

MJOS（Magic Sword Studio Operating System）是一个企业级AI团队协作框架，专为智能化团队管理和协作而设计。

## ✨ 特性

- 🧠 **智能记忆系统** - 基于神经科学的三层记忆架构
- 👥 **团队协作管理** - 完整的团队成员和任务管理系统
- 🔄 **事件驱动架构** - 响应式系统设计
- 📊 **上下文管理** - 智能上下文感知和管理
- 🌐 **MCP协议支持** - 支持作为MCP服务器与AI客户端集成
- 🚀 **高性能** - 优化的异步处理和内存管理
- 🧪 **高测试覆盖率** - 91%+ 的测试覆盖率
- 📝 **TypeScript支持** - 完整的类型定义和智能提示

## 🚀 快速开始

### 安装

```bash
npm install mjos
```

### 基本使用

```javascript
const { MJOS } = require('mjos');

async function main() {
  // 创建MJOS实例
  const mjos = new MJOS();
  
  // 启动系统
  await mjos.start();
  
  // 存储记忆
  const memoryId = mjos.remember('重要信息', ['项目', '会议'], 0.8);
  
  // 创建任务
  const taskId = mjos.createTask('完成项目文档', '编写完整的API文档', 'high');
  
  // 分配任务
  mjos.assignTask(taskId, 'moxiaozhi');
  
  // 查看系统状态
  console.log(mjos.getStatus());
  
  // 停止系统
  await mjos.stop();
}

main().catch(console.error);
```

### MCP服务器部署

MJOS支持作为MCP服务器与AI客户端集成：

```bash
# 启动MCP服务器
node examples/mcp-server-demo.js
```

配置AI客户端（以Claude Desktop为例）：
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

支持的客户端：
- **Claude Desktop** - Anthropic官方桌面应用
- **Cursor** - AI代码编辑器
- **Augment** - AI编程助手

然后在Claude中使用MJOS工具：
- `mjos_remember` - 存储记忆
- `mjos_recall` - 检索记忆
- `mjos_create_task` - 创建任务
- `mjos_assign_task` - 分配任务
- `mjos_get_status` - 获取状态

## 📚 核心概念

### 记忆系统

MJOS的记忆系统基于神经科学原理，支持智能存储和检索：

```javascript
// 存储记忆
const memoryId = mjos.remember('会议纪要', ['会议', '决策'], 0.9);

// 检索记忆
const memories = mjos.recall({
  tags: ['会议'],
  importance: { min: 0.7, max: 1.0 },
  limit: 10
});
```

### 团队管理

完整的团队成员和任务管理功能：

```javascript
const teamManager = mjos.getTeamManager();

// 获取团队成员
const members = teamManager.getAllMembers();

// 创建任务
const taskId = teamManager.createTask({
  title: '系统优化',
  description: '优化系统性能',
  status: 'pending',
  priority: 'high'
});

// 分配任务
teamManager.assignTask(taskId, 'moxiaochuang');

// 开始协作会话
const sessionId = teamManager.startCollaboration('技术讨论', ['moxiaozhi', 'moxiaochuang']);
```

### 上下文管理

智能上下文感知和管理：

```javascript
const contextManager = mjos.getContextManager();

// 设置上下文
contextManager.set('current-project', 'MJOS开发');
contextManager.set('phase', '测试阶段');

// 获取上下文
const project = contextManager.get('current-project');
const allContext = contextManager.getAll();
```

## 🏗️ 架构设计

MJOS采用模块化架构设计：

```
MJOS
├── Core Engine          # 核心引擎
├── Memory System        # 记忆系统
├── Team Manager         # 团队管理
├── Context Manager      # 上下文管理
└── Event Bus           # 事件总线
```

### 核心模块

- **MJOSEngine**: 系统核心引擎，负责生命周期管理
- **MemorySystem**: 智能记忆存储和检索系统
- **TeamManager**: 团队成员和任务管理系统
- **ContextManager**: 上下文状态管理
- **EventBus**: 事件驱动通信机制

## 🔧 API 参考

### MJOS 主类

#### 构造函数
```typescript
constructor()
```

#### 方法

##### `getVersion(): string`
获取系统版本号。

##### `async start(): Promise<void>`
启动MJOS系统。

##### `async stop(): Promise<void>`
停止MJOS系统。

##### `getStatus(): SystemStatus`
获取系统状态信息。

##### `remember(content: any, tags?: string[], importance?: number): string`
存储记忆到记忆系统。

- `content`: 记忆内容
- `tags`: 标签数组（可选）
- `importance`: 重要性（0-1，可选，默认0.5）

##### `recall(query: MemoryQuery): MemoryItem[]`
从记忆系统检索记忆。

##### `createTask(title: string, description: string, priority?: TaskPriority): string`
创建新任务。

##### `assignTask(taskId: string, memberId: string): boolean`
分配任务给团队成员。

### 系统组件访问

##### `getEngine(): MJOSEngine`
获取核心引擎实例。

##### `getMemorySystem(): MemorySystem`
获取记忆系统实例。

##### `getTeamManager(): TeamManager`
获取团队管理器实例。

##### `getContextManager(): ContextManager`
获取上下文管理器实例。

## 🧪 测试

运行测试套件：

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- tests/basic.test.js
```

当前测试覆盖率：
- 语句覆盖率：91.11%
- 分支覆盖率：79.54%
- 函数覆盖率：86.84%
- 行覆盖率：92.23%

## 📈 性能

MJOS经过性能优化，具有以下特点：

- **内存效率**: 智能内存管理和垃圾回收
- **异步处理**: 全异步API设计，避免阻塞
- **事件驱动**: 高效的事件通信机制
- **可扩展性**: 模块化设计，易于扩展

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📚 文档和资源

### 📖 用户文档
- **[快速入门](./docs/QUICKSTART.md)** - 5分钟快速上手指南
- **[用户指南](./docs/USER_GUIDE.md)** - 详细的使用指南和最佳实践
- **[API文档](./docs/API.md)** - 完整的API参考文档
- **[使用示例](./docs/EXAMPLES.md)** - 丰富的实际应用示例

### 🔧 开发文档
- **[贡献指南](./CONTRIBUTING.md)** - 如何参与项目开发
- **[MCP部署指南](./docs/MCP_DEPLOYMENT.md)** - MCP服务器部署和配置
- **[故障排除](./docs/TROUBLESHOOTING.md)** - 常见问题解决方案
- **[常见问题](./docs/FAQ.md)** - 常见问题快速解答

### 💡 示例代码
- **[入门示例](./examples/getting-started.js)** - 基础功能演示
- **[完整示例](./examples/complete-system-demo.js)** - 系统完整功能展示
- **[MCP服务器示例](./examples/mcp-server-demo.js)** - MCP服务器部署演示
- **[更多示例](./examples/)** - 查看examples目录获取更多示例

## 🙏 致谢

感谢所有为MJOS项目做出贡献的开发者和用户。

---

**魔剑工作室团队**
- 莫小智 - 智能分析专家
- 莫小创 - 创新设计专家
- 莫小仓 - Cangjie编程专家
- 莫小测 - 质量测试专家
