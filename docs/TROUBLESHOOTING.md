# MJOS 故障排除指南

本指南帮助您解决使用MJOS时可能遇到的常见问题。

## 📋 目录

- [安装问题](#安装问题)
- [启动问题](#启动问题)
- [功能问题](#功能问题)
- [性能问题](#性能问题)
- [MCP问题](#mcp问题)
- [错误代码](#错误代码)
- [调试技巧](#调试技巧)
- [获取帮助](#获取帮助)

## 🚀 安装问题

### 问题：npm install 失败

**症状**：
```bash
npm ERR! code ENOTFOUND
npm ERR! errno ENOTFOUND
```

**解决方案**：
1. 检查网络连接
2. 尝试使用不同的npm镜像：
   ```bash
   npm config set registry https://registry.npmmirror.com/
   npm install mjos
   ```
3. 清理npm缓存：
   ```bash
   npm cache clean --force
   npm install mjos
   ```

### 问题：Node.js版本不兼容

**症状**：
```bash
Error: Unsupported Node.js version
```

**解决方案**：
1. 检查Node.js版本：
   ```bash
   node --version
   ```
2. 升级到Node.js 18.0或更高版本
3. 使用nvm管理Node.js版本：
   ```bash
   nvm install 18
   nvm use 18
   ```

### 问题：TypeScript类型错误

**症状**：
```typescript
Cannot find module 'mjos' or its corresponding type declarations
```

**解决方案**：
1. 确保安装了类型定义：
   ```bash
   npm install @types/node
   ```
2. 检查tsconfig.json配置：
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "esModuleInterop": true
     }
   }
   ```

## 🔧 启动问题

### 问题：MJOS启动失败

**症状**：
```javascript
Error: Failed to start MJOS engine
```

**诊断步骤**：
```javascript
const { MJOS } = require('mjos');

async function diagnose() {
  const mjos = new MJOS();
  
  try {
    console.log('MJOS版本:', mjos.getVersion());
    
    const status = mjos.getStatus();
    console.log('初始状态:', status);
    
    await mjos.start();
    console.log('启动成功');
    
  } catch (error) {
    console.error('启动失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

diagnose();
```

**解决方案**：
1. 检查系统资源是否充足
2. 确保没有其他MJOS实例在运行
3. 重新安装MJOS：
   ```bash
   npm uninstall mjos
   npm install mjos
   ```

### 问题：重复启动错误

**症状**：
```javascript
Warning: MJOS is already running
```

**解决方案**：
```javascript
const mjos = new MJOS();

// 检查状态后再启动
const status = mjos.getStatus();
if (!status.engine.running) {
  await mjos.start();
} else {
  console.log('MJOS已经在运行');
}
```

## 🧠 功能问题

### 问题：记忆系统无法存储数据

**症状**：
```javascript
const memoryId = mjos.remember('test');
// memoryId 为 undefined 或 null
```

**诊断**：
```javascript
// 检查系统状态
const status = mjos.getStatus();
console.log('引擎状态:', status.engine.running);
console.log('记忆统计:', status.memory);

// 检查记忆系统
const memorySystem = mjos.getMemorySystem();
const stats = memorySystem.getStats();
console.log('记忆系统统计:', stats);
```

**解决方案**：
1. 确保MJOS已启动
2. 检查传入的数据格式
3. 验证重要性参数范围（0-1）

### 问题：记忆检索返回空结果

**症状**：
```javascript
const memories = mjos.recall({ tags: ['test'] });
// memories.length === 0
```

**诊断**：
```javascript
// 检查所有记忆
const allMemories = mjos.recall({});
console.log('总记忆数:', allMemories.length);

// 检查标签
allMemories.forEach(memory => {
  console.log('记忆标签:', memory.tags);
});

// 检查查询条件
const testMemories = mjos.recall({ tags: ['test'] });
console.log('匹配的记忆:', testMemories.length);
```

**解决方案**：
1. 检查标签拼写是否正确
2. 使用更宽泛的查询条件
3. 检查重要性和时间范围过滤器

### 问题：任务分配失败

**症状**：
```javascript
const assigned = mjos.assignTask(taskId, 'member');
// assigned === false
```

**诊断**：
```javascript
const teamManager = mjos.getTeamManager();

// 检查任务是否存在
const tasks = teamManager.getTasks();
const task = tasks.find(t => t.id === taskId);
console.log('任务存在:', !!task);

// 检查成员是否存在
const member = teamManager.getMember('member');
console.log('成员存在:', !!member);

// 检查所有成员
const allMembers = teamManager.getAllMembers();
console.log('所有成员:', allMembers.map(m => m.id));
```

**解决方案**：
1. 验证任务ID和成员ID的正确性
2. 使用正确的成员ID（如：'moxiaozhi'）
3. 检查任务当前状态

## ⚡ 性能问题

### 问题：响应时间过慢

**症状**：
```javascript
// 操作耗时过长
const start = Date.now();
const result = mjos.recall({ tags: ['test'] });
const duration = Date.now() - start;
console.log('查询耗时:', duration, 'ms'); // > 1000ms
```

**诊断**：
```javascript
// 检查性能指标
const metrics = mjos.getPerformanceMetrics();
console.log('性能指标:', {
  memoryQuery: metrics.responseTimes.averageMemoryQuery,
  taskCreation: metrics.responseTimes.averageTaskCreation,
  contextAccess: metrics.responseTimes.averageContextAccess
});

// 检查系统负载
const summary = mjos.getPerformanceSummary();
console.log('性能状态:', summary.status);
console.log('性能问题:', summary.issues);
```

**解决方案**：
1. 重置性能监控：
   ```javascript
   mjos.resetPerformanceMetrics();
   ```
2. 清理不必要的记忆：
   ```javascript
   const memorySystem = mjos.getMemorySystem();
   // 删除低重要性的旧记忆
   const oldMemories = mjos.recall({
     importance: { min: 0, max: 0.3 }
   });
   oldMemories.forEach(memory => {
     memorySystem.delete(memory.id);
   });
   ```
3. 优化查询条件，使用更具体的标签

### 问题：内存使用过高

**症状**：
```javascript
const metrics = mjos.getPerformanceMetrics();
console.log('内存使用率:', metrics.memoryUsage.percentage); // > 80%
```

**解决方案**：
1. 清理上下文：
   ```javascript
   const contextManager = mjos.getContextManager();
   contextManager.clear();
   ```
2. 清理记忆系统：
   ```javascript
   const memorySystem = mjos.getMemorySystem();
   memorySystem.clear(); // 谨慎使用
   ```
3. 重启MJOS实例：
   ```javascript
   await mjos.stop();
   await mjos.start();
   ```

## 🌐 MCP问题

### 问题：MCP服务器启动失败

**症状**：
```
Error: Cannot find module '@modelcontextprotocol/sdk'
```

**解决方案**：
1. 安装MCP SDK依赖：
   ```bash
   npm install @modelcontextprotocol/sdk
   ```
2. 重新构建项目：
   ```bash
   npm run build
   ```

### 问题：AI客户端无法连接MCP服务器

**症状**：
Claude Desktop显示"MCP server failed to start"

**诊断步骤**：
```bash
# 1. 测试MCP服务器是否能正常启动
node examples/mcp-server-demo.js

# 2. 检查配置文件路径
echo "配置文件路径是否正确？"

# 3. 验证Node.js版本
node --version  # 需要18+
```

**解决方案**：
1. 确保使用相对路径 `.mjos/examples/mcp-server-demo.js`
2. 检查工作目录设置 `"cwd": "您的项目根目录"`
3. 验证文件权限
4. 重启AI客户端

### 问题：MCP工具调用失败

**症状**：
```
Tool call failed: mjos_remember
Error: MJOS system not initialized
```

**解决方案**：
```javascript
// 在MCP服务器中添加初始化检查
async handleToolCall(name, args) {
  // 确保MJOS系统已启动
  if (!this.mjos || !this.mjos.getStatus().engine.running) {
    await this.mjos.start();
  }

  try {
    return await this.callTool(name, args);
  } catch (error) {
    console.error(`工具调用失败: ${name}`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 问题：MCP工具响应缓慢

**症状**：
工具调用超时或响应时间过长

**诊断**：
```javascript
// 添加性能监控
const startTime = Date.now();
const result = await this.mjos.someOperation();
const duration = Date.now() - startTime;
console.log(`操作耗时: ${duration}ms`);
```

**解决方案**：
1. 重置性能指标：
   ```javascript
   this.mjos.resetPerformanceMetrics();
   ```
2. 清理系统资源：
   ```javascript
   const contextManager = this.mjos.getContextManager();
   contextManager.clear();
   ```
3. 优化查询条件

### 问题：MCP配置文件位置

**不同系统的配置文件位置**：

**Windows**:
- Claude Desktop: `%APPDATA%\Claude\claude_desktop_config.json`
- Cursor: 通过设置界面或配置文件

**macOS**:
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Cursor: `~/.cursor/config.json`

**Linux**:
- Claude Desktop: `~/.config/claude/claude_desktop_config.json`
- Cursor: `~/.config/cursor/config.json`

### 问题：MCP服务器日志调试

**启用详细日志**：
```bash
# 设置环境变量
export MJOS_LOG_LEVEL=debug
node examples/mcp-server-demo.js
```

**在代码中添加日志**：
```javascript
// MCP工具调用日志
console.log(`[MCP] 工具调用: ${toolName}`, args);
console.log(`[MCP] 工具结果:`, result);

// 错误日志
console.error(`[MCP] 错误:`, error.message);
console.error(`[MCP] 堆栈:`, error.stack);
```

## 🚨 错误代码

### MJOS_ENGINE_START_FAILED
**原因**：引擎启动失败  
**解决**：检查系统资源，重新启动

### MJOS_MEMORY_STORE_FAILED
**原因**：记忆存储失败  
**解决**：检查数据格式和系统状态

### MJOS_TASK_ASSIGN_FAILED
**原因**：任务分配失败  
**解决**：验证任务ID和成员ID

### MJOS_PERFORMANCE_WARNING
**原因**：性能警告  
**解决**：检查性能指标，进行优化

## 🔍 调试技巧

### 1. 启用详细日志

```javascript
// 方法1：使用上下文管理器
const contextManager = mjos.getContextManager();
contextManager.set('debugMode', true);
contextManager.set('logLevel', 'debug');

// 方法2：监听所有事件
const eventBus = mjos.getEngine().getEventBus();
const events = [
  'engine:started', 'engine:stopped',
  'team:task:created', 'team:task:assigned',
  'team:member:status_updated'
];

events.forEach(event => {
  eventBus.on(event, (...args) => {
    console.log(`[DEBUG] ${event}:`, args);
  });
});
```

### 2. 性能分析

```javascript
// 创建性能分析器
function createProfiler() {
  const timers = new Map();
  
  return {
    start(name) {
      timers.set(name, Date.now());
    },
    
    end(name) {
      const start = timers.get(name);
      if (start) {
        const duration = Date.now() - start;
        console.log(`[PERF] ${name}: ${duration}ms`);
        timers.delete(name);
        return duration;
      }
    }
  };
}

// 使用示例
const profiler = createProfiler();

profiler.start('memory-operation');
const memoryId = mjos.remember('test data', ['test'], 0.5);
profiler.end('memory-operation');

profiler.start('memory-query');
const memories = mjos.recall({ tags: ['test'] });
profiler.end('memory-query');
```

### 3. 状态检查工具

```javascript
function checkMJOSHealth(mjos) {
  console.log('=== MJOS健康检查 ===');
  
  // 基本状态
  const status = mjos.getStatus();
  console.log('版本:', status.version);
  console.log('引擎运行:', status.engine.running);
  
  // 记忆系统
  console.log('记忆总数:', status.memory.totalMemories);
  console.log('标签总数:', status.memory.totalTags);
  
  // 团队系统
  console.log('团队成员:', status.team.totalMembers);
  console.log('任务总数:', status.team.totalTasks);
  
  // 性能状态
  console.log('性能状态:', status.performance.status);
  
  // 详细性能指标
  const metrics = mjos.getPerformanceMetrics();
  console.log('平均响应时间:');
  console.log('- 记忆查询:', metrics.responseTimes.averageMemoryQuery.toFixed(2), 'ms');
  console.log('- 任务创建:', metrics.responseTimes.averageTaskCreation.toFixed(2), 'ms');
  console.log('- 上下文访问:', metrics.responseTimes.averageContextAccess.toFixed(2), 'ms');
  
  console.log('内存使用:', metrics.memoryUsage.percentage.toFixed(1), '%');
  console.log('错误总数:', metrics.errorCounts.total);
  
  console.log('=== 检查完成 ===');
}

// 使用
checkMJOSHealth(mjos);
```

### 4. 自动化测试

```javascript
async function runDiagnostics() {
  const mjos = new MJOS();
  const results = [];
  
  try {
    // 测试1：启动
    await mjos.start();
    results.push({ test: 'startup', passed: true });
    
    // 测试2：记忆系统
    const memoryId = mjos.remember('test', ['test'], 0.5);
    const memories = mjos.recall({ tags: ['test'] });
    results.push({ 
      test: 'memory', 
      passed: memoryId && memories.length > 0 
    });
    
    // 测试3：任务系统
    const taskId = mjos.createTask('test task', 'description', 'medium');
    const assigned = mjos.assignTask(taskId, 'moxiaozhi');
    results.push({ 
      test: 'tasks', 
      passed: taskId && assigned 
    });
    
    // 测试4：性能
    const perfSummary = mjos.getPerformanceSummary();
    results.push({ 
      test: 'performance', 
      passed: perfSummary.status === 'healthy' 
    });
    
  } catch (error) {
    results.push({ 
      test: 'error', 
      passed: false, 
      error: error.message 
    });
  } finally {
    await mjos.stop();
  }
  
  // 报告结果
  console.log('=== 诊断结果 ===');
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });
  
  return results;
}

// 运行诊断
runDiagnostics();
```

## 📞 获取帮助

如果以上方法都无法解决问题：

### 1. 收集信息
```javascript
// 生成诊断报告
function generateDiagnosticReport(mjos) {
  const report = {
    timestamp: new Date().toISOString(),
    version: mjos.getVersion(),
    status: mjos.getStatus(),
    metrics: mjos.getPerformanceMetrics(),
    summary: mjos.getPerformanceSummary(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  console.log('诊断报告:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}
```

### 2. 联系支持
- **GitHub Issues**: https://github.com/magic-sword-studio/mjos/issues
- **讨论区**: https://github.com/magic-sword-studio/mjos/discussions
- **邮箱**: support@magic-sword-studio.com

### 3. 提供信息
在报告问题时，请提供：
- MJOS版本
- Node.js版本
- 操作系统
- 错误消息和堆栈跟踪
- 重现步骤
- 诊断报告

---

**魔剑工作室团队**  
我们致力于为您提供最好的技术支持
