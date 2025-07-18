# 🚀 MJOS MCP配置完整指南

## 📦 一键安装

MJOS现已发布到npm，支持通过npx一键安装和使用：

```bash
# 直接运行MCP服务器
npx mjos@latest mjos-mcp-server

# 或全局安装
npm install -g mjos
mjos mjos-mcp-server
```

## 🌐 支持的客户端

MJOS MCP服务器支持所有遵循MCP协议的客户端：

- ✅ **Claude Desktop**
- ✅ **Cursor**  
- ✅ **VS Code** (通过MCP扩展)
- ✅ **Augment**
- ✅ **任何支持MCP的客户端**

## 🔧 客户端配置

### 1. Claude Desktop

**配置文件位置**:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/claude/claude_desktop_config.json`

**配置内容**:
```json
{
  "mcpServers": {
    "mjos": {
      "command": "npx",
      "args": [
        "-y",
        "mjos@latest", 
        "mjos-mcp-server"
      ],
      "env": {
        "MJOS_LOG_LEVEL": "info",
        "MJOS_MODE": "production"
      }
    }
  }
}
```

### 2. Cursor

**配置方法**:
1. 打开Cursor设置
2. 搜索"MCP"或"Model Context Protocol"
3. 添加服务器配置

**配置内容**:
```json
{
  "mcpServers": {
    "mjos": {
      "command": "npx",
      "args": [
        "-y",
        "mjos@latest",
        "mjos-mcp-server"
      ],
      "env": {
        "MJOS_LOG_LEVEL": "info",
        "MJOS_MODE": "production"
      }
    }
  }
}
```

### 3. VS Code

**前置要求**: 安装MCP扩展

**配置文件**: `.vscode/settings.json`

```json
{
  "mcp.servers": {
    "mjos": {
      "command": "npx",
      "args": [
        "-y",
        "mjos@latest",
        "mjos-mcp-server"
      ],
      "env": {
        "MJOS_LOG_LEVEL": "info",
        "MJOS_MODE": "production"
      }
    }
  },
  "mjos.enableIntelliSense": true,
  "mjos.enableCodeAnalysis": true,
  "mjos.enableTaskManagement": true
}
```

### 4. Augment

**配置文件**: Augment配置目录

```json
{
  "mcpServers": {
    "mjos": {
      "command": "npx",
      "args": [
        "-y",
        "mjos@latest", 
        "mjos-mcp-server"
      ],
      "env": {
        "MJOS_LOG_LEVEL": "info",
        "MJOS_MODE": "production",
        "AUGMENT_INTEGRATION": "true"
      }
    }
  },
  "augmentIntegration": {
    "contextEngine": {
      "enableMjosMemory": true,
      "enableCollaboration": true
    },
    "codebaseAnalysis": {
      "enableMjosInsights": true,
      "enableSmartSuggestions": true
    }
  }
}
```

## 🛠️ 可用工具

MJOS MCP服务器提供以下工具：

### 1. mjos_remember
存储记忆到MJOS系统
```json
{
  "name": "mjos_remember",
  "description": "存储记忆到MJOS智能记忆系统",
  "inputSchema": {
    "type": "object",
    "properties": {
      "content": {"type": "string", "description": "要记忆的内容"},
      "importance": {"type": "number", "description": "重要性(0-1)"},
      "tags": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["content"]
  }
}
```

### 2. mjos_recall
从MJOS系统检索记忆
```json
{
  "name": "mjos_recall",
  "description": "从MJOS智能记忆系统检索记忆",
  "inputSchema": {
    "type": "object", 
    "properties": {
      "query": {"type": "string", "description": "查询内容"},
      "limit": {"type": "number", "description": "结果数量限制"}
    }
  }
}
```

### 3. mjos_create_task
创建新任务
```json
{
  "name": "mjos_create_task",
  "description": "创建新任务",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": {"type": "string", "description": "任务标题"},
      "description": {"type": "string", "description": "任务描述"},
      "priority": {"type": "string", "enum": ["low", "medium", "high"]}
    },
    "required": ["title"]
  }
}
```

### 4. mjos_assign_task
分配任务给团队成员
```json
{
  "name": "mjos_assign_task",
  "description": "分配任务给团队成员",
  "inputSchema": {
    "type": "object",
    "properties": {
      "taskId": {"type": "string", "description": "任务ID"},
      "memberId": {"type": "string", "description": "成员ID"}
    },
    "required": ["taskId", "memberId"]
  }
}
```

### 5. mjos_get_status
获取MJOS系统状态
```json
{
  "name": "mjos_get_status",
  "description": "获取MJOS系统状态",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

### 6. mjos_performance_metrics
获取性能指标
```json
{
  "name": "mjos_performance_metrics", 
  "description": "获取MJOS系统性能指标",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

## 🎯 使用示例

### Claude Desktop中使用

```
用户: 请帮我记住这个重要信息：MJOS系统支持MCP协议

Claude: 我来帮您存储这个信息到MJOS记忆系统中。

[调用 mjos_remember 工具]
- content: "MJOS系统支持MCP协议"
- importance: 0.8
- tags: ["MJOS", "MCP", "协议", "重要"]

✅ 信息已成功存储到MJOS智能记忆系统中！
```

```
用户: 请回忆一下关于MCP的信息

Claude: 让我从MJOS记忆系统中检索相关信息。

[调用 mjos_recall 工具]
- query: "MCP"
- limit: 5

找到以下相关记忆：
1. MJOS系统支持MCP协议 (重要性: 0.8)
2. MCP配置已完成 (重要性: 0.7)
...
```

### Cursor中使用

在编程过程中，Cursor会自动调用MJOS工具来：
- 分析代码结构
- 提供智能建议
- 管理开发任务
- 记录重要决策

### VS Code中使用

通过MCP扩展，VS Code可以：
- 实时代码分析
- 智能任务管理
- 协作决策支持
- 性能监控

## 🔧 高级配置

### 环境变量

```bash
# 日志级别
MJOS_LOG_LEVEL=debug|info|warn|error

# 运行模式  
MJOS_MODE=development|production

# 特定集成
AUGMENT_INTEGRATION=true
VSCODE_INTEGRATION=true
```

### 自定义配置

```json
{
  "mcpServers": {
    "mjos": {
      "command": "npx",
      "args": ["-y", "mjos@latest", "mjos-mcp-server"],
      "env": {
        "MJOS_LOG_LEVEL": "debug",
        "MJOS_MODE": "development",
        "MJOS_MEMORY_LIMIT": "1000",
        "MJOS_TASK_LIMIT": "500"
      }
    }
  }
}
```

## 🚀 快速开始

1. **安装**: `npx mjos@latest mcp-server`
2. **配置客户端**: 选择您的客户端并添加配置
3. **重启客户端**: 重启以加载MCP服务器
4. **开始使用**: 享受MJOS智能协作功能！

## 🆘 故障排除

### 常见问题

**Q: npx命令失败？**
A: 确保Node.js版本 >= 16，网络连接正常

**Q: MCP服务器无法启动？**
A: 检查端口是否被占用，查看错误日志

**Q: 客户端无法连接？**
A: 验证配置文件格式，重启客户端

**Q: 工具调用失败？**
A: 检查参数格式，查看服务器日志

### 获取帮助

- 📚 查看项目文档
- 🐛 提交GitHub Issues
- 💬 社区讨论

## 🎉 总结

MJOS MCP服务器现已完全支持：
- ✅ npm发布，npx一键安装
- ✅ 多客户端支持 (Claude Desktop, Cursor, VS Code, Augment)
- ✅ 标准MCP协议
- ✅ 完整工具集
- ✅ 生产级稳定性

**🚀 立即开始使用MJOS，让AI协作更智能，让开发更高效！**
