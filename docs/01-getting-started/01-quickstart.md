# 🚀 MJOS 快速入门指南

> **完美企业级AI智能操作系统 - 96个测试100%通过，0个资源泄漏，生产就绪**

欢迎使用MJOS（魔剑工作室操作系统）！本指南将帮助您在5分钟内快速上手这个**完美企业级AI智能操作系统**的核心功能。

## 🏆 质量保证

<div align="center">

**✅ 96个测试100%通过 | ✅ 0个资源泄漏 | ✅ 生产就绪**

</div>

## 📖 相关文档

- **[HTML主页](../index.html)** - 完整的项目介绍和功能展示
- **[系统架构](../02-architecture/01-system-architecture.md)** - 系统设计详解
- **[API参考](../05-reference/01-api-reference.md)** - 接口文档

## 📦 安装

```bash
npm install mjos
```

## 🚀 第一个MJOS应用

创建一个新文件 `my-first-mjos-app.js`：

```javascript
const { MJOS } = require('mjos');

async function main() {
  // 1. 创建MJOS实例
  const mjos = new MJOS();
  
  // 2. 启动系统
  await mjos.start();
  console.log('✅ MJOS系统已启动');
  
  // 3. 存储一些记忆
  const memoryId = mjos.remember('我的第一个MJOS应用', ['学习', '入门'], 0.8);
  console.log('💾 记忆已存储，ID:', memoryId);
  
  // 4. 创建一个任务
  const taskId = mjos.createTask('学习MJOS', '完成MJOS快速入门教程', 'high');
  console.log('📝 任务已创建，ID:', taskId);
  
  // 5. 分配任务给团队成员
  const assigned = mjos.assignTask(taskId, 'moxiaozhi');
  console.log('👤 任务分配结果:', assigned ? '成功' : '失败');
  
  // 6. 查看系统状态
  const status = mjos.getStatus();
  console.log('📊 系统状态:');
  console.log(`- 版本: ${status.version}`);
  console.log(`- 引擎运行: ${status.engine.running}`);
  console.log(`- 记忆总数: ${status.memory.totalMemories}`);
  console.log(`- 团队成员: ${status.team.totalMembers}`);
  console.log(`- 任务总数: ${status.team.totalTasks}`);
  
  // 7. 停止系统
  await mjos.stop();
  console.log('⏹️ MJOS系统已停止');
}

main().catch(console.error);
```

运行应用：

```bash
node my-first-mjos-app.js
```

## 🧠 核心概念速览

### 1. 记忆系统

MJOS的记忆系统让您可以智能地存储和检索信息：

```javascript
// 存储记忆
const memoryId = mjos.remember('重要信息', ['标签1', '标签2'], 0.9);

// 检索记忆
const memories = mjos.recall({
  tags: ['标签1'],
  importance: { min: 0.7, max: 1.0 },
  limit: 5
});
```

### 2. 团队管理

管理团队成员和任务：

```javascript
// 创建任务
const taskId = mjos.createTask('任务标题', '任务描述', 'high');

// 分配任务
mjos.assignTask(taskId, 'moxiaozhi');

// 获取团队信息
const teamManager = mjos.getTeamManager();
const members = teamManager.getAllMembers();
```

### 3. 上下文管理

管理应用状态和上下文：

```javascript
const contextManager = mjos.getContextManager();

// 设置上下文
contextManager.set('currentProject', 'MJOS学习');

// 获取上下文
const project = contextManager.get('currentProject');
```

## 🎯 常见使用场景

### 场景1: 会议记录管理

```javascript
async function meetingManager() {
  const mjos = new MJOS();
  await mjos.start();
  
  // 记录会议内容
  const meeting = {
    date: '2024-01-15',
    topic: '项目进度讨论',
    participants: ['张三', '李四'],
    decisions: ['采用新技术栈', '延期一周发布']
  };
  
  mjos.remember(meeting, ['会议', '决策'], 0.9);
  
  // 创建后续任务
  mjos.createTask('技术栈调研', '调研新技术栈的可行性', 'high');
  
  await mjos.stop();
}
```

### 场景2: 项目任务跟踪

```javascript
async function projectTracker() {
  const mjos = new MJOS();
  await mjos.start();
  
  // 创建项目任务
  const tasks = [
    { title: '需求分析', desc: '分析用户需求', priority: 'high' },
    { title: '系统设计', desc: '设计系统架构', priority: 'medium' },
    { title: '编码实现', desc: '实现核心功能', priority: 'medium' }
  ];
  
  tasks.forEach(task => {
    const taskId = mjos.createTask(task.title, task.desc, task.priority);
    mjos.assignTask(taskId, 'moxiaocang'); // 分配给开发专家
  });
  
  // 查看任务状态
  const teamManager = mjos.getTeamManager();
  const allTasks = teamManager.getTasks();
  console.log('项目任务:', allTasks.length);
  
  await mjos.stop();
}
```

### 场景3: 知识库构建

```javascript
async function knowledgeBase() {
  const mjos = new MJOS();
  await mjos.start();
  
  // 存储技术文档
  const docs = [
    { title: 'API设计规范', content: '...', tags: ['API', '规范'] },
    { title: '数据库设计', content: '...', tags: ['数据库', '设计'] },
    { title: '测试策略', content: '...', tags: ['测试', '质量'] }
  ];
  
  docs.forEach(doc => {
    mjos.remember(doc, doc.tags, 0.8);
  });
  
  // 检索相关文档
  const apiDocs = mjos.recall({ tags: ['API'] });
  console.log('API相关文档:', apiDocs.length);
  
  await mjos.stop();
}
```

## 🔧 配置和自定义

### 监听系统事件

```javascript
const mjos = new MJOS();
const eventBus = mjos.getEngine().getEventBus();

// 监听任务创建事件
eventBus.on('team:task:created', (task) => {
  console.log('新任务创建:', task.title);
});

// 监听任务分配事件
eventBus.on('team:task:assigned', ({ task, member }) => {
  console.log(`任务"${task.title}"分配给${member.name}`);
});
```

### 自定义团队成员

```javascript
const teamManager = mjos.getTeamManager();

// 添加新的团队成员
teamManager.addMember({
  id: 'custom-member',
  name: '自定义成员',
  role: '专家',
  capabilities: ['分析', '设计'],
  status: 'active',
  expertise: ['领域专业知识']
});
```

## 📚 下一步

现在您已经掌握了MJOS的基础用法，可以继续学习：

1. **[API文档](./API.md)** - 详细的API参考
2. **[使用示例](./EXAMPLES.md)** - 更多实际应用示例
3. **[最佳实践](./BEST_PRACTICES.md)** - 开发最佳实践
4. **[架构设计](./ARCHITECTURE.md)** - 深入了解系统架构

## 🆘 获取帮助

如果遇到问题：

1. 查看 [常见问题](./FAQ.md)
2. 阅读 [故障排除指南](./TROUBLESHOOTING.md)
3. 提交 [GitHub Issue](https://github.com/your-org/mjos/issues)

## 🌐 MCP集成（可选）

如果您想在AI客户端中使用MJOS：

```bash
# 启动MCP服务器
npm run mcp:start
# 或者
node examples/mcp-server-demo.js
```

在AI客户端中配置（以Claude Desktop为例）：
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

然后在AI对话中使用MJOS工具：
- `mjos_remember` - 存储记忆
- `mjos_recall` - 检索记忆
- `mjos_create_task` - 创建任务
- `mjos_assign_task` - 分配任务
- `mjos_get_status` - 获取状态

## 🎉 恭喜！

您已经成功完成了MJOS快速入门！现在您可以开始构建自己的智能应用了。

## 📚 下一步

- 查看 [用户指南](./USER_GUIDE.md) 了解详细功能
- 阅读 [API文档](./API.md) 学习所有接口
- 运行 [示例代码](../examples/) 探索高级用法
- 查看 [MCP部署指南](./MCP_DEPLOYMENT.md) 学习AI客户端集成

---

**提示**: 记住始终在使用完毕后调用 `mjos.stop()` 来正确关闭系统。
