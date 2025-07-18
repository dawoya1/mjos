# 🚀 MJOS MCP生产部署指南

## 📋 部署概述

MJOS现已完全支持标准MCP（Model Context Protocol）协议，可以直接在Claude Desktop、Cursor等支持MCP的客户端中使用。

## 🌐 MCP服务器

### 启动MCP服务器
```bash
cd D:\code\mjos
node bin/mjos-mcp-server.js
```

### 服务器特性
- ✅ **标准MCP协议2.0**
- ✅ **生产级稳定性**
- ✅ **完整工具集成**
- ✅ **智能协作功能**

## 🔧 客户端配置

### Claude Desktop配置

将以下配置添加到Claude Desktop的配置文件中：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": ["D:\\code\\mjos\\bin\\mjos-mcp-server.js"],
      "env": {
        "MJOS_LOG_LEVEL": "info",
        "MJOS_MODE": "production"
      }
    }
  }
}
```

### Cursor配置

在Cursor的设置中添加MCP服务器配置：

```json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": ["D:\\code\\mjos\\bin\\mjos-mcp-server.js"],
      "env": {
        "MJOS_LOG_LEVEL": "info",
        "MJOS_MODE": "production"
      }
    }
  }
}
```

## 🛠️ 可用工具

MJOS MCP服务器提供以下工具：

### 1. mjos_remember
**功能**: 存储记忆到MJOS系统
**参数**: 
- `content` (string): 要记忆的内容
- `importance` (number): 重要性 (0-1)
- `tags` (array): 标签列表

### 2. mjos_recall
**功能**: 从MJOS系统检索记忆
**参数**:
- `query` (string): 查询内容
- `limit` (number): 结果数量限制

### 3. mjos_create_task
**功能**: 创建新任务
**参数**:
- `title` (string): 任务标题
- `description` (string): 任务描述
- `priority` (string): 优先级

### 4. mjos_assign_task
**功能**: 分配任务给团队成员
**参数**:
- `taskId` (string): 任务ID
- `memberId` (string): 成员ID

### 5. mjos_get_status
**功能**: 获取MJOS系统状态
**参数**: 无

### 6. mjos_performance_metrics
**功能**: 获取性能指标
**参数**: 无

## 🎯 使用示例

### 在Claude Desktop中使用

1. 启动MCP服务器
2. 重启Claude Desktop
3. 在对话中可以使用MJOS功能：

```
请帮我记住这个重要信息：MJOS系统已成功部署到生产环境
```

```
请回忆一下关于MJOS部署的信息
```

```
请创建一个任务：优化MCP服务器性能
```

### 在Cursor中使用

1. 配置MCP服务器
2. 重启Cursor
3. 在编程过程中使用MJOS辅助

## 📊 监控和维护

### 日志查看
MCP服务器会输出详细的运行日志，包括：
- 系统启动信息
- 工具调用记录
- 性能指标
- 错误信息

### 健康检查
服务器提供健康检查端点，可以监控系统状态。

### 性能优化
- 定期清理记忆系统
- 监控资源使用情况
- 优化任务执行效率

## 🔒 安全考虑

- MCP服务器运行在本地，数据不会外传
- 支持访问控制和权限管理
- 提供安全的API接口

## 🆘 故障排除

### 常见问题

**Q: MCP服务器无法启动？**
A: 检查Node.js版本，确保在项目目录下运行

**Q: 客户端无法连接？**
A: 检查配置文件路径和格式是否正确

**Q: 工具调用失败？**
A: 查看服务器日志，检查参数格式

### 支持联系

如有问题，请查看：
- 项目文档
- 日志文件
- GitHub Issues

## 🎉 总结

MJOS MCP服务现已完全就绪，可以在生产环境中使用。通过标准MCP协议，您可以在任何支持MCP的客户端中享受MJOS的智能协作功能。

**🚀 开始使用MJOS，让AI协作更智能，让开发更高效！**
