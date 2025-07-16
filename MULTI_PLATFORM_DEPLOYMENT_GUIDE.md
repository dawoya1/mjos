# MJOS MCP Server 多平台部署指南

## 📝 概述

MJOS魔剑工作室操作系统支持多个AI编程平台的MCP (Model Context Protocol) 集成，让您可以在不同的开发环境中使用MJOS的强大团队协作能力。

## 🎯 支持的平台

### ✅ 完全支持的平台

1. **Augment Code** - 完整MCP协议支持
2. **Cursor** - AI代码编辑器，原生MCP支持
3. **Claude Desktop** - Anthropic官方桌面应用
4. **VS Code** - 通过GitHub Copilot扩展支持

### 🔄 实验性支持的平台

5. **Windsurf IDE** - AI集成开发环境
6. **Replit** - 在线开发环境
7. **JetBrains IDEs** - 通过AI Assistant插件
8. **GitHub Copilot** - VS Code中的原生集成

## 🚀 快速开始

### 1. 安装依赖

```bash
cd .mjos
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 启动MCP服务器

```bash
npm run mcp:server
```

## 📋 平台特定配置

### Augment Code

**配置路径**: `~/.config/augment/mcp_servers.json`

```json
{
  "mjos": {
    "command": "ts-node",
    "args": ["src/mcp/server.ts"],
    "cwd": "/path/to/.mjos",
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

**设置步骤**:
1. 打开Augment Code设置
2. 导航到MCP服务器配置
3. 添加上述配置
4. 重启Augment Code

### Cursor

**配置路径**: `~/.cursor/mcp_servers.json`

```json
{
  "mjos": {
    "command": "ts-node",
    "args": ["src/mcp/server.ts"],
    "cwd": "/path/to/.mjos"
  }
}
```

**设置步骤**:
1. 打开Cursor设置 (Cmd/Ctrl + ,)
2. 搜索"MCP"或导航到Extensions > MCP
3. 点击"Add Server"
4. 输入服务器配置信息
5. 保存并重启Cursor

### Claude Desktop

**配置路径**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
或 `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "mjos": {
      "command": "ts-node",
      "args": ["src/mcp/server.ts"],
      "cwd": "/path/to/.mjos"
    }
  }
}
```

**设置步骤**:
1. 打开Claude Desktop
2. 进入设置 > Developer
3. 启用MCP服务器
4. 添加服务器配置
5. 重启Claude Desktop

### VS Code (GitHub Copilot)

**配置路径**: `~/.vscode/settings.json`

```json
{
  "github.copilot.chat.mcp.servers": {
    "mjos": {
      "command": "ts-node",
      "args": ["src/mcp/server.ts"],
      "cwd": "/path/to/.mjos"
    }
  }
}
```

**设置步骤**:
1. 安装GitHub Copilot扩展
2. 打开VS Code设置
3. 搜索"github.copilot.chat.mcp"
4. 添加MCP服务器配置
5. 重启VS Code

## 🔧 高级配置

### 环境变量配置

```bash
# 设置日志级别
export MJOS_LOG_LEVEL=info

# 设置服务器端口
export MJOS_MCP_PORT=3000

# 设置数据库连接
export MJOS_DB_URL=sqlite:./mjos.db
```

### 自定义启动脚本

创建 `start-mcp.sh`:

```bash
#!/bin/bash
cd /path/to/.mjos
export NODE_ENV=production
export MJOS_LOG_LEVEL=info
ts-node src/mcp/server.ts
```

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "mcp:server"]
```

## 🧪 测试连接

### 1. 检查服务器状态

```bash
# 检查MCP服务器是否运行
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "initialize", "params": {}}'
```

### 2. 测试工具调用

在支持的平台中尝试以下命令：

```
@mjos 获取团队成员信息
@mjos 分析项目协作状态
@mjos 创建新的专业角色
```

## 🔍 故障排除

### 常见问题

1. **服务器启动失败**
   - 检查Node.js版本 (需要16+)
   - 确认依赖已正确安装
   - 查看错误日志

2. **平台无法连接**
   - 验证配置文件路径
   - 检查JSON格式是否正确
   - 确认服务器正在运行

3. **工具调用失败**
   - 检查MCP协议版本兼容性
   - 验证工具权限设置
   - 查看服务器日志

### 调试模式

启用详细日志：

```bash
export MJOS_LOG_LEVEL=debug
npm run mcp:server
```

### 日志文件位置

- **服务器日志**: `./logs/mcp-server.log`
- **协作日志**: `./logs/collaboration.log`
- **错误日志**: `./logs/error.log`

## 📊 性能优化

### 1. 内存优化

```javascript
// 在server.ts中添加
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
```

### 2. 并发优化

```javascript
// 配置工作线程数
const WORKER_THREADS = process.env.MJOS_WORKERS || 4;
```

### 3. 缓存配置

```javascript
// 启用Redis缓存
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
```

## 🔐 安全配置

### 1. API密钥管理

```bash
# 设置API密钥
export MJOS_API_KEY=your-secure-api-key
```

### 2. 访问控制

```json
{
  "security": {
    "allowedOrigins": ["https://cursor.sh", "https://claude.ai"],
    "rateLimiting": {
      "windowMs": 900000,
      "max": 100
    }
  }
}
```

### 3. HTTPS配置

```javascript
// 启用HTTPS
const httpsOptions = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};
```

## 📈 监控和维护

### 1. 健康检查

```bash
# 健康检查端点
curl http://localhost:3000/health
```

### 2. 性能监控

```bash
# 查看系统资源使用
npm run monitor
```

### 3. 日志轮转

```bash
# 配置logrotate
sudo nano /etc/logrotate.d/mjos
```

## 🆘 支持和反馈

如果您在部署过程中遇到问题：

1. 查看[故障排除](#故障排除)部分
2. 检查[GitHub Issues](https://github.com/your-org/mjos/issues)
3. 提交新的Issue并包含：
   - 平台信息
   - 错误日志
   - 配置文件
   - 复现步骤

---

**部署成功后，您将看到莫小智主脑的欢迎消息，表示MJOS团队已准备就绪！**
