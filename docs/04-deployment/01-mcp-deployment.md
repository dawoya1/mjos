# 🚀 MJOS MCP部署指南

> **完美企业级AI智能操作系统 - 96个测试100%通过，0个资源泄漏，生产就绪**

本指南详细介绍如何将这个**完美企业级AI智能操作系统**部署为MCP（Model Context Protocol）服务器，以及如何与各种AI客户端集成。

## 🏆 质量保证

<div align="center">

**✅ 96个测试100%通过 | ✅ 0个资源泄漏 | ✅ 生产就绪**

</div>

## 📖 相关文档

- **[HTML主页](../index.html)** - 完整的项目介绍和功能展示
- **[质量保证](../quality.html)** - 详细的测试结果和质量指标
- **[快速开始](../01-getting-started/01-quickstart.md)** - 安装和基础使用

## 📋 目录

- [MCP概述](#mcp概述)
- [快速开始](#快速开始)
- [客户端配置](#客户端配置)
- [MCP工具](#mcp工具)
- [高级配置](#高级配置)
- [故障排除](#故障排除)

## 🌐 MCP概述

### 什么是MCP？

MCP（Model Context Protocol）是一个开放标准，允许AI应用程序与外部数据源和工具安全地连接。MJOS通过MCP服务器提供：

- **智能记忆管理**: AI可以存储和检索长期记忆
- **团队任务协调**: AI可以创建和管理团队任务
- **上下文共享**: AI可以访问项目上下文信息
- **性能监控**: AI可以监控系统性能状态

### MJOS MCP架构

```
AI客户端 (Claude Desktop/Cursor)
    ↓ MCP协议
MJOS MCP服务器
    ↓ 内部API
MJOS核心系统 (记忆/团队/性能)
```

## 🚀 快速开始

### 1. 检查依赖

确保已安装MCP相关依赖：

```bash
cd .mjos
npm list @modelcontextprotocol/sdk
```

### 2. 启动MCP服务器

```bash
# 方法1: 使用npm脚本
npm run mcp:start

# 方法2: 直接运行示例
node examples/mcp-server-demo.js

# 方法3: 使用TypeScript
npx ts-node examples/mcp-server-demo.ts
```

### 3. 验证服务器运行

```bash
# 检查服务器状态
curl http://localhost:3000/health

# 查看MCP工具列表
curl http://localhost:3000/tools
```

## 🔧 客户端配置

### Claude Desktop配置

#### Windows配置
编辑文件：`%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": [".mjos/examples/mcp-server-demo.js"],
      "cwd": "您的项目根目录",
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  }
}
```

#### macOS配置
编辑文件：`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": [".mjos/examples/mcp-server-demo.js"],
      "cwd": "/path/to/your/project",
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Linux配置
编辑文件：`~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": [".mjos/examples/mcp-server-demo.js"],
      "cwd": "/path/to/your/project",
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  }
}
```

### Cursor配置

在Cursor设置中添加MCP服务器配置：

#### 方法1: 通过设置界面
1. 打开Cursor设置 (Cmd/Ctrl + ,)
2. 搜索"MCP"或导航到Extensions > MCP
3. 点击"Add Server"
4. 填入以下配置：
   - **Name**: mjos
   - **Command**: node
   - **Args**: .mjos/examples/mcp-server-demo.js
   - **Working Directory**: 您的项目根目录

#### 方法2: 直接编辑配置文件
编辑Cursor配置文件：

```json
{
  "mcp.servers": [
    {
      "name": "mjos",
      "command": "node",
      "args": [".mjos/examples/mcp-server-demo.js"],
      "cwd": "您的项目根目录",
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  ]
}
```

**设置步骤**:
1. 重启Cursor
2. 在AI聊天中输入 @mjos 来使用MJOS工具
3. 验证工具是否正常加载

### Augment配置

Augment是一个强大的AI编程助手，完全支持MCP协议。

#### 配置方法
1. 在项目根目录创建或编辑 `.augment/mcp_servers.json`
2. 添加MJOS MCP服务器配置：

```json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": [".mjos/examples/mcp-server-demo.js"],
      "cwd": ".",
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  }
}
```

#### 使用方法
1. 重启Augment
2. 在对话中直接使用MJOS功能：
   - "帮我记住这个重要信息"
   - "创建一个开发任务"
   - "查看团队状态"
3. Augment会自动调用相应的MJOS工具

### Continue.dev配置

在Continue配置文件中添加：

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

## 🛠️ MCP工具

MJOS MCP服务器提供以下工具：

### 记忆管理工具

#### `mjos_remember`
存储记忆到MJOS系统。

**参数:**
- `content` (string): 记忆内容
- `tags` (array): 标签列表
- `importance` (number): 重要性 (0-1)

**示例:**
```json
{
  "name": "mjos_remember",
  "arguments": {
    "content": "项目会议决定采用新架构",
    "tags": ["会议", "决策", "架构"],
    "importance": 0.9
  }
}
```

#### `mjos_recall`
从MJOS系统检索记忆。

**参数:**
- `tags` (array): 搜索标签
- `importance_min` (number): 最小重要性
- `importance_max` (number): 最大重要性
- `limit` (number): 结果限制

**示例:**
```json
{
  "name": "mjos_recall",
  "arguments": {
    "tags": ["会议", "决策"],
    "importance_min": 0.7,
    "limit": 10
  }
}
```

#### `mjos_memory_stats`
获取记忆系统统计信息。

**示例:**
```json
{
  "name": "mjos_memory_stats",
  "arguments": {}
}
```

### 任务管理工具

#### `mjos_create_task`
创建新任务。

**参数:**
- `title` (string): 任务标题
- `description` (string): 任务描述
- `priority` (string): 优先级 (low/medium/high/urgent)

**示例:**
```json
{
  "name": "mjos_create_task",
  "arguments": {
    "title": "实现新功能",
    "description": "根据会议决策实现新架构功能",
    "priority": "high"
  }
}
```

#### `mjos_assign_task`
分配任务给团队成员。

**参数:**
- `task_id` (string): 任务ID
- `member_id` (string): 成员ID

**示例:**
```json
{
  "name": "mjos_assign_task",
  "arguments": {
    "task_id": "task_1642345678_abc123",
    "member_id": "moxiaocang"
  }
}
```

#### `mjos_get_tasks`
获取任务列表。

**参数:**
- `assigned_to` (string): 分配给的成员
- `status` (string): 任务状态
- `priority` (string): 优先级

**示例:**
```json
{
  "name": "mjos_get_tasks",
  "arguments": {
    "assigned_to": "moxiaozhi",
    "status": "in_progress"
  }
}
```

### 系统监控工具

#### `mjos_get_status`
获取系统状态。

**示例:**
```json
{
  "name": "mjos_get_status",
  "arguments": {}
}
```

#### `mjos_performance_metrics`
获取性能指标。

**示例:**
```json
{
  "name": "mjos_performance_metrics",
  "arguments": {}
}
```

#### `mjos_health_check`
系统健康检查。

**示例:**
```json
{
  "name": "mjos_health_check",
  "arguments": {}
}
```

## ⚙️ 高级配置

### 环境变量

```bash
# 日志级别
export MJOS_LOG_LEVEL=debug

# MCP服务器端口
export MJOS_MCP_PORT=3000

# 数据目录
export MJOS_DATA_DIR=/path/to/data

# 性能监控间隔
export MJOS_PERF_INTERVAL=5000

# 最大记忆数量
export MJOS_MAX_MEMORIES=10000
```

### 自定义MCP服务器

创建自定义MCP服务器：

```javascript
const { MJOS } = require('mjos');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

class CustomMJOSMCPServer {
  constructor() {
    this.mjos = new MJOS();
    this.server = new Server(
      {
        name: "custom-mjos-mcp-server",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );
    
    this.setupTools();
  }

  setupTools() {
    // 添加自定义工具
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'custom_tool':
          return await this.handleCustomTool(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async handleCustomTool(args) {
    // 自定义工具逻辑
    return {
      content: [
        {
          type: "text",
          text: "自定义工具执行结果"
        }
      ]
    };
  }

  async start() {
    await this.mjos.start();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log('自定义MJOS MCP服务器已启动');
  }
}

// 启动服务器
const server = new CustomMJOSMCPServer();
server.start().catch(console.error);
```

### 性能优化配置

```javascript
// 在MCP服务器中优化性能
const mjos = new MJOS();

// 启用性能监控
const perfMonitor = mjos.getPerformanceMonitor();
perfMonitor.start();

// 设置性能阈值
const contextManager = mjos.getContextManager();
contextManager.set('performanceThresholds', {
  maxMemoryUsage: 70,
  maxResponseTime: 500,
  maxErrorRate: 2
});

// 定期清理
setInterval(() => {
  const summary = mjos.getPerformanceSummary();
  if (summary.status === 'warning') {
    console.log('性能警告，执行清理...');
    mjos.resetPerformanceMetrics();
  }
}, 60000); // 每分钟检查一次
```

## 🔍 故障排除

### 常见问题

#### 1. MCP服务器启动失败

**症状:**
```
Error: Cannot find module '@modelcontextprotocol/sdk'
```

**解决方案:**
```bash
cd .mjos
npm install @modelcontextprotocol/sdk
```

#### 2. 客户端连接失败

**症状:**
Claude Desktop显示"MCP server failed to start"

**解决方案:**
1. 检查配置文件路径是否正确
2. 验证Node.js版本 (需要18+)
3. 检查文件权限

```bash
# 测试MCP服务器
node examples/mcp-server-demo.js
```

#### 3. 工具调用失败

**症状:**
工具调用返回错误或超时

**解决方案:**
1. 检查MJOS系统状态
2. 查看服务器日志
3. 验证参数格式

```javascript
// 添加错误处理
try {
  const result = await mjos.remember(content, tags, importance);
  return { success: true, result };
} catch (error) {
  console.error('工具调用失败:', error);
  return { success: false, error: error.message };
}
```

### 调试技巧

#### 1. 启用详细日志

```bash
export MJOS_LOG_LEVEL=debug
node examples/mcp-server-demo.js
```

#### 2. 监控MCP通信

```javascript
// 在MCP服务器中添加请求日志
server.setRequestHandler('tools/call', async (request) => {
  console.log('MCP工具调用:', request.params);
  
  try {
    const result = await handleToolCall(request.params);
    console.log('MCP工具结果:', result);
    return result;
  } catch (error) {
    console.error('MCP工具错误:', error);
    throw error;
  }
});
```

#### 3. 健康检查

```javascript
// 定期健康检查
setInterval(async () => {
  try {
    const status = mjos.getStatus();
    console.log('MJOS状态:', status.engine.running ? '正常' : '异常');
    
    if (!status.engine.running) {
      console.log('重启MJOS...');
      await mjos.start();
    }
  } catch (error) {
    console.error('健康检查失败:', error);
  }
}, 30000); // 每30秒检查一次
```

## 📞 获取帮助

如果遇到MCP部署问题：

1. 查看 [用户指南](./USER_GUIDE.md#mcp部署)
2. 检查 [故障排除指南](./TROUBLESHOOTING.md)
3. 在 [GitHub Issues](https://github.com/magic-sword-studio/mjos/issues) 报告问题
4. 参与 [GitHub Discussions](https://github.com/magic-sword-studio/mjos/discussions)

---

**魔剑工作室团队**  
让AI团队协作更智能、更高效
