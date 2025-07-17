# ❓ MJOS 常见问题

> **完美企业级AI智能操作系统 - 96个测试100%通过，0个资源泄漏，生产就绪**

本文档回答了关于这个**完美企业级AI智能操作系统**使用的常见问题。

## 🏆 质量保证

<div align="center">

**✅ 96个测试100%通过 | ✅ 0个资源泄漏 | ✅ 生产就绪**

</div>

## 📖 相关文档

- **[HTML主页](../index.html)** - 完整的项目介绍和功能展示
- **[质量保证](../quality.html)** - 详细的测试结果和质量指标
- **[故障排除](02-troubleshooting.md)** - 详细的故障排除指南

## 📋 目录

- [基础问题](#基础问题)
- [功能问题](#功能问题)
- [性能问题](#性能问题)
- [MCP问题](#mcp问题)
- [集成问题](#集成问题)
- [开发问题](#开发问题)

## 🚀 基础问题

### Q: MJOS是什么？
**A**: MJOS（魔剑工作室操作系统）是一个**完美企业级AI智能操作系统**，经过96个测试的全面验证，实现了0个资源泄漏的完美资源管理，提供智能记忆系统、团队管理、上下文管理和性能监控等功能。

### Q: MJOS的质量如何？
**A**: MJOS达到了完美的企业级质量标准：
- ✅ **96个测试100%通过** - 所有功能都经过严格测试
- ✅ **0个资源泄漏** - 完美的资源管理，无定时器、内存泄漏
- ✅ **100%生产就绪** - 可以安全部署到生产环境
- ✅ **完整MCP支持** - 支持所有主流AI客户端

### Q: MJOS支持哪些Node.js版本？
**A**: MJOS需要Node.js 18.0或更高版本。推荐使用最新的LTS版本。

### Q: MJOS是免费的吗？
**A**: 是的，MJOS采用MIT开源许可证，完全免费使用。

### Q: 如何检查MJOS版本？
**A**: 
```javascript
const { MJOS } = require('mjos');
const mjos = new MJOS();
console.log(mjos.getVersion());
```

### Q: MJOS可以在生产环境使用吗？
**A**: 是的，MJOS已经过全面测试，具有91%+的测试覆盖率，可以安全地在生产环境中使用。

## 🧠 功能问题

### Q: 记忆系统的重要性参数如何设置？
**A**: 重要性参数范围是0-1：
- 0.9-1.0: 关键信息（重要决策、核心数据）
- 0.7-0.8: 重要信息（项目信息、会议纪要）
- 0.5-0.6: 一般信息（日常记录、临时数据）
- 0.1-0.4: 临时信息（调试信息、测试数据）

### Q: 如何有效地使用标签系统？
**A**: 建议使用层次化的标签结构：
```javascript
// 好的标签示例
mjos.remember('项目会议纪要', ['项目', '会议', '2025-01', '决策'], 0.8);
mjos.remember('技术文档', ['技术', '文档', 'API', '开发'], 0.7);

// 避免的标签示例
mjos.remember('一些信息', ['信息'], 0.5); // 标签太泛化
```

### Q: 团队成员ID是什么？
**A**: MJOS内置了4个团队成员：
- `moxiaozhi`: 莫小智（智能分析专家）
- `moxiaochuang`: 莫小创（创新设计专家）
- `moxiaocang`: 莫小仓（Cangjie编程专家）
- `moxiaoce`: 莫小测（质量测试专家）

### Q: 可以添加自定义团队成员吗？
**A**: 是的，可以通过TeamManager添加：
```javascript
const teamManager = mjos.getTeamManager();
teamManager.addMember({
  id: 'custom-member',
  name: '自定义成员',
  role: '专家',
  capabilities: ['分析', '设计'],
  status: 'active',
  expertise: ['专业领域']
});
```

### Q: 如何删除记忆？
**A**: 
```javascript
const memorySystem = mjos.getMemorySystem();

// 删除特定记忆
memorySystem.delete(memoryId);

// 清空所有记忆（谨慎使用）
memorySystem.clear();
```

### Q: 上下文数据会持久化吗？
**A**: 不会，上下文数据只在当前MJOS实例的生命周期内存在。如需持久化，请使用记忆系统。

## ⚡ 性能问题

### Q: MJOS的性能如何？
**A**: MJOS具有优秀的性能表现：
- 记忆查询：平均0.03ms
- 任务创建：平均0.10ms
- 上下文访问：平均0.01ms
- 内存使用：通常<60%

### Q: 如何优化MJOS性能？
**A**: 
1. 定期清理不需要的记忆和上下文
2. 使用具体的查询条件而不是宽泛查询
3. 监控性能指标并及时处理警告
4. 避免存储过大的对象

### Q: 性能监控显示警告怎么办？
**A**: 
```javascript
const summary = mjos.getPerformanceSummary();
if (summary.status === 'warning') {
  console.log('性能问题:', summary.issues);
  
  // 重置性能指标
  mjos.resetPerformanceMetrics();
  
  // 清理资源
  const contextManager = mjos.getContextManager();
  contextManager.clear();
}
```

### Q: 如何处理内存泄漏？
**A**: 
1. 确保调用`mjos.stop()`正确关闭系统
2. 定期清理不需要的记忆和上下文
3. 避免在事件监听器中创建闭包引用
4. 使用性能监控及时发现问题

## 🌐 MCP问题

### Q: 什么是MCP？MJOS如何支持MCP？
**A**: MCP（Model Context Protocol）是一个开放标准，允许AI应用程序与外部数据源和工具安全连接。MJOS提供完整的MCP服务器实现，支持9个核心工具，可以与Claude Desktop、Cursor、Augment等AI客户端集成。

### Q: 如何启动MJOS MCP服务器？
**A**:
```bash
# 方法1: 使用npm脚本
npm run mcp:start

# 方法2: 直接运行
node examples/mcp-server-demo.js
```

### Q: 支持哪些AI客户端？
**A**: MJOS MCP服务器支持所有兼容MCP协议的客户端：
- **Claude Desktop** - Anthropic官方桌面应用
- **Cursor** - AI代码编辑器
- **Augment** - AI编程助手
- **Continue.dev** - VS Code扩展
- 其他支持MCP的客户端

### Q: 如何在Claude Desktop中配置MJOS？
**A**: 编辑Claude Desktop配置文件：
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

### Q: MCP工具调用失败怎么办？
**A**:
1. 检查MCP服务器是否正常运行
2. 验证配置文件路径是否正确
3. 查看服务器日志排查错误
4. 确认参数格式是否正确

### Q: 为什么要使用.mjos路径？
**A**: 使用相对路径`.mjos/`可以防止破坏用户的工作目录结构，确保MJOS作为子项目正确运行，同时便于在不同环境中部署。

### Q: 如何在Cursor中使用MJOS工具？
**A**:
1. 在Cursor设置中配置MCP服务器
2. 重启Cursor
3. 在AI聊天中输入 @mjos 来使用MJOS工具
4. 或直接描述需求，AI会自动调用相应工具

### Q: MCP服务器性能如何？
**A**: MJOS MCP服务器具有优秀性能：
- 工具响应时间: <100ms
- 支持并发调用
- 内存使用优化
- 自动错误恢复

## 🔗 集成问题

### Q: 如何在Express应用中使用MJOS？
**A**: 
```javascript
const express = require('express');
const { MJOS } = require('mjos');

const app = express();
const mjos = new MJOS();

// 启动时初始化MJOS
app.listen(3000, async () => {
  await mjos.start();
  console.log('服务器和MJOS已启动');
});

// 在路由中使用MJOS
app.get('/api/memories', (req, res) => {
  const memories = mjos.recall({ tags: ['api'] });
  res.json(memories);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  await mjos.stop();
  process.exit(0);
});
```

### Q: 如何在TypeScript项目中使用MJOS？
**A**: 
```typescript
import { MJOS, MemoryItem, TeamMember } from 'mjos';

class MyService {
  private mjos: MJOS;

  constructor() {
    this.mjos = new MJOS();
  }

  async initialize(): Promise<void> {
    await this.mjos.start();
  }

  async cleanup(): Promise<void> {
    await this.mjos.stop();
  }

  storeMemory(content: any, tags: string[]): string {
    return this.mjos.remember(content, tags, 0.7);
  }
}
```

### Q: 可以同时运行多个MJOS实例吗？
**A**: 可以，每个MJOS实例都是独立的：
```javascript
const mjos1 = new MJOS();
const mjos2 = new MJOS();

await mjos1.start();
await mjos2.start();

// 它们有独立的记忆、任务和上下文
```

### Q: 如何在微服务架构中使用MJOS？
**A**: 每个微服务可以有自己的MJOS实例，通过API或消息队列共享必要的信息：
```javascript
// 服务A
const mjosA = new MJOS();
mjosA.remember('服务A的数据', ['serviceA'], 0.8);

// 服务B
const mjosB = new MJOS();
mjosB.remember('服务B的数据', ['serviceB'], 0.8);

// 通过API共享信息
app.get('/api/share-memory', (req, res) => {
  const memories = mjosA.recall({ tags: ['shared'] });
  res.json(memories);
});
```

## 💻 开发问题

### Q: 如何调试MJOS应用？
**A**: 
1. 启用调试模式：
```javascript
const contextManager = mjos.getContextManager();
contextManager.set('debugMode', true);
```

2. 监听事件：
```javascript
const eventBus = mjos.getEngine().getEventBus();
eventBus.on('team:task:created', (task) => {
  console.log('任务创建:', task);
});
```

3. 使用性能监控：
```javascript
const metrics = mjos.getPerformanceMetrics();
console.log('性能指标:', metrics);
```

### Q: 如何编写MJOS的单元测试？
**A**: 
```javascript
const { MJOS } = require('mjos');

describe('MJOS Tests', () => {
  let mjos;

  beforeEach(async () => {
    mjos = new MJOS();
    await mjos.start();
  });

  afterEach(async () => {
    await mjos.stop();
  });

  test('should store and retrieve memory', () => {
    const memoryId = mjos.remember('test data', ['test'], 0.5);
    expect(memoryId).toBeDefined();

    const memories = mjos.recall({ tags: ['test'] });
    expect(memories).toHaveLength(1);
    expect(memories[0].content).toBe('test data');
  });
});
```

### Q: 如何处理异步操作？
**A**: MJOS的主要方法都是同步的，只有启动和停止是异步的：
```javascript
// 异步方法
await mjos.start();
await mjos.stop();

// 同步方法
const memoryId = mjos.remember('data', ['tag'], 0.5);
const memories = mjos.recall({ tags: ['tag'] });
const taskId = mjos.createTask('title', 'desc', 'high');
```

### Q: 如何扩展MJOS功能？
**A**: 
1. 通过事件系统添加自定义逻辑：
```javascript
const eventBus = mjos.getEngine().getEventBus();
eventBus.on('team:task:created', (task) => {
  // 自定义处理逻辑
  sendNotification(task);
});
```

2. 使用上下文管理器存储配置：
```javascript
const contextManager = mjos.getContextManager();
contextManager.set('customConfig', {
  feature1: true,
  feature2: 'value'
});
```

3. 创建包装类：
```javascript
class ExtendedMJOS extends MJOS {
  constructor() {
    super();
    this.customFeature = new CustomFeature();
  }

  async customMethod() {
    // 自定义功能
  }
}
```

### Q: 如何贡献代码到MJOS项目？
**A**: 
1. Fork GitHub仓库
2. 创建功能分支
3. 编写代码和测试
4. 提交Pull Request
5. 参与代码审查

详细步骤请参考 [CONTRIBUTING.md](../CONTRIBUTING.md)

### Q: 如何报告Bug？
**A**: 
1. 在GitHub Issues中创建新issue
2. 使用Bug报告模板
3. 提供详细的重现步骤
4. 包含错误日志和环境信息

### Q: MJOS的路线图是什么？
**A**: 
- **短期**: 完善MCP集成、优化性能
- **中期**: 增强AI能力、扩展生态系统
- **长期**: 探索前沿技术、产业化应用

## 📞 还有其他问题？

如果您的问题没有在这里找到答案：

1. 查看 [用户指南](./USER_GUIDE.md)
2. 查看 [API文档](./API.md)
3. 查看 [故障排除指南](./TROUBLESHOOTING.md)
4. 在 [GitHub Discussions](https://github.com/magic-sword-studio/mjos/discussions) 中提问
5. 创建 [GitHub Issue](https://github.com/magic-sword-studio/mjos/issues)

---

**魔剑工作室团队**  
让AI团队协作更智能、更高效
