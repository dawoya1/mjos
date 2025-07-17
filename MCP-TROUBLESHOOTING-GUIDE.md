# 🔧 MJOS MCP 故障排除指南

## 🚨 问题诊断

### 你遇到的问题
```
2025-07-17 19:56:07.852 [error] user-mjos: No server info found
2025-07-17 19:56:17.298 [info] user-mjos: Client closed for command
```

### 🔍 问题原因
1. **配置错误** - 使用了错误的命令格式
2. **命令路径问题** - MCP服务器没有正确启动
3. **npm权限警告** - Windows权限问题（不影响功能）

## ✅ 解决方案

### 步骤1: 安装MJOS全局包
```bash
npm install -g mjos@2.1.9
```

### 步骤2: 验证安装
```bash
# 测试MCP服务器是否可用
mjos-mcp-server --help
```

### 步骤3: 更新Cursor配置
将 `.cursor/mcp.json` 更新为：

```json
{
  "mcpServers": {
    "mjos": {
      "command": "mjos-mcp-server",
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  }
}
```

### 步骤4: 重启Cursor IDE
- 完全关闭Cursor IDE
- 重新启动Cursor IDE
- MCP服务器应该自动连接

## 🧪 测试验证

### 手动测试MCP服务器
```bash
# 启动MCP服务器
mjos-mcp-server

# 你应该看到:
✅ MJOS系统已启动
🌐 MCP服务器已启动，等待客户端连接...
📋 可用工具:
   - mjos_remember: 存储记忆到MJOS系统
   - mjos_recall: 从MJOS系统检索记忆
   - mjos_create_task: 创建新任务
   - mjos_assign_task: 分配任务给团队成员
   - mjos_get_status: 获取MJOS系统状态
   - mjos_performance_metrics: 获取性能指标
```

### 在Cursor中测试
1. 重启Cursor IDE后
2. 尝试使用MJOS工具
3. 应该能看到6个可用工具

## 🔄 替代配置方案

### 方案1: 使用npx (如果全局安装有问题)
```json
{
  "mcpServers": {
    "mjos": {
      "command": "npx",
      "args": [
        "-y",
        "mjos@2.1.9",
        "mjos-mcp-server"
      ],
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  }
}
```

### 方案2: 使用本地路径 (开发环境)
```json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": [
        "bin/mjos-mcp-server.js"
      ],
      "cwd": "D:\\code\\mjos",
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  }
}
```

## 🐛 常见问题

### Q: "No server info found" 错误
**A:** 这通常意味着MCP服务器没有正确启动。检查：
- 命令路径是否正确
- 是否已安装mjos包
- 配置文件格式是否正确

### Q: npm cleanup警告
**A:** 这是Windows权限问题，不影响功能：
```
npm warn cleanup Failed to remove some directories
```
可以忽略这些警告。

### Q: "Client closed for command" 错误
**A:** 服务器进程意外关闭，通常是因为：
- 配置错误导致启动失败
- 依赖问题
- 权限问题

### Q: 高内存使用警告
**A:** 这是正常的性能监控信息：
```
Performance warning detected: High memory usage: 85.0%
```
不影响功能，可以通过环境变量调整日志级别。

## 🎯 最佳实践

### 推荐配置
```json
{
  "mcpServers": {
    "mjos": {
      "command": "mjos-mcp-server",
      "env": {
        "MJOS_LOG_LEVEL": "warn"
      }
    }
  }
}
```

### 调试配置
```json
{
  "mcpServers": {
    "mjos": {
      "command": "mjos-mcp-server",
      "env": {
        "MJOS_LOG_LEVEL": "debug",
        "NODE_ENV": "development"
      }
    }
  }
}
```

## 🚀 验证成功

成功配置后，你应该能在Cursor中看到：
- ✅ MJOS MCP服务器连接成功
- ✅ 6个可用工具
- ✅ 无错误日志
- ✅ 可以正常使用MJOS功能

## 📞 获取帮助

如果问题仍然存在：
1. 检查npm全局安装路径
2. 验证Node.js版本 (需要 >=16.0.0)
3. 尝试重新安装: `npm uninstall -g mjos && npm install -g mjos@2.1.9`
4. 查看详细错误日志
