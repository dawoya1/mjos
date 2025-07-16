# MJOS 使用示例

本文档提供了MJOS系统的详细使用示例，涵盖各种常见场景和最佳实践。

## 目录

- [基础使用](#基础使用)
- [记忆系统示例](#记忆系统示例)
- [团队管理示例](#团队管理示例)
- [上下文管理示例](#上下文管理示例)
- [事件处理示例](#事件处理示例)
- [MCP集成示例](#mcp集成示例)
- [完整应用示例](#完整应用示例)

## 基础使用

### 简单的系统启动和停止

```javascript
const { MJOS } = require('mjos');

async function basicExample() {
  const mjos = new MJOS();
  
  try {
    // 启动系统
    await mjos.start();
    console.log('MJOS系统启动成功');
    
    // 获取系统状态
    const status = mjos.getStatus();
    console.log('系统状态:', status);
    
    // 停止系统
    await mjos.stop();
    console.log('MJOS系统停止成功');
  } catch (error) {
    console.error('操作失败:', error.message);
  }
}

basicExample();
```

## 记忆系统示例

### 存储和检索会议记录

```javascript
async function meetingMemoryExample() {
  const mjos = new MJOS();
  await mjos.start();
  
  // 存储会议记录
  const meetingNotes = {
    date: '2024-01-15',
    participants: ['张三', '李四', '王五'],
    decisions: ['采用新的开发框架', '增加测试覆盖率'],
    actionItems: ['完成技术调研', '制定实施计划']
  };
  
  const memoryId = mjos.remember(meetingNotes, ['会议', '决策', '2024'], 0.9);
  console.log('会议记录已存储，ID:', memoryId);
  
  // 检索相关记忆
  const relatedMemories = mjos.recall({
    tags: ['会议', '决策'],
    importance: { min: 0.8, max: 1.0 }
  });
  
  console.log('找到相关会议记录:', relatedMemories.length);
  relatedMemories.forEach(memory => {
    console.log('- 日期:', memory.content.date);
    console.log('- 决策:', memory.content.decisions);
  });
  
  await mjos.stop();
}

meetingMemoryExample();
```

### 知识库管理

```javascript
async function knowledgeBaseExample() {
  const mjos = new MJOS();
  await mjos.start();
  
  // 存储技术文档
  const techDocs = [
    {
      title: 'API设计规范',
      content: 'RESTful API设计最佳实践...',
      tags: ['API', '规范', '技术'],
      importance: 0.8
    },
    {
      title: '数据库优化指南',
      content: '数据库性能优化技巧...',
      tags: ['数据库', '性能', '技术'],
      importance: 0.7
    },
    {
      title: '安全编码规范',
      content: '安全编码最佳实践...',
      tags: ['安全', '编码', '规范'],
      importance: 0.9
    }
  ];
  
  // 批量存储文档
  const docIds = techDocs.map(doc => 
    mjos.remember(doc, doc.tags, doc.importance)
  );
  
  console.log('技术文档已存储:', docIds.length);
  
  // 按主题检索
  const apiDocs = mjos.recall({ tags: ['API'] });
  const securityDocs = mjos.recall({ tags: ['安全'] });
  
  console.log('API相关文档:', apiDocs.length);
  console.log('安全相关文档:', securityDocs.length);
  
  // 检索高重要性文档
  const importantDocs = mjos.recall({
    importance: { min: 0.8, max: 1.0 },
    limit: 5
  });
  
  console.log('重要文档:', importantDocs.length);
  
  await mjos.stop();
}

knowledgeBaseExample();
```

## 团队管理示例

### 项目任务管理

```javascript
async function projectManagementExample() {
  const mjos = new MJOS();
  await mjos.start();
  
  const teamManager = mjos.getTeamManager();
  
  // 创建项目任务
  const tasks = [
    {
      title: '需求分析',
      description: '分析用户需求，制定功能规格',
      priority: 'high'
    },
    {
      title: '系统设计',
      description: '设计系统架构和数据库结构',
      priority: 'high'
    },
    {
      title: '前端开发',
      description: '开发用户界面和交互功能',
      priority: 'medium'
    },
    {
      title: '后端开发',
      description: '开发API和业务逻辑',
      priority: 'medium'
    },
    {
      title: '测试验证',
      description: '进行功能测试和性能测试',
      priority: 'high'
    }
  ];
  
  // 创建任务
  const taskIds = tasks.map(task => 
    mjos.createTask(task.title, task.description, task.priority)
  );
  
  console.log('项目任务已创建:', taskIds.length);
  
  // 分配任务给团队成员
  mjos.assignTask(taskIds[0], 'moxiaozhi');  // 需求分析 -> 莫小智
  mjos.assignTask(taskIds[1], 'moxiaochuang'); // 系统设计 -> 莫小创
  mjos.assignTask(taskIds[2], 'moxiaocang');   // 前端开发 -> 莫小仓
  mjos.assignTask(taskIds[3], 'moxiaocang');   // 后端开发 -> 莫小仓
  mjos.assignTask(taskIds[4], 'moxiaoce');     // 测试验证 -> 莫小测
  
  // 查看任务分配情况
  const allTasks = teamManager.getTasks();
  console.log('任务分配情况:');
  allTasks.forEach(task => {
    const assignee = teamManager.getMember(task.assignedTo);
    console.log(`- ${task.title}: ${assignee ? assignee.name : '未分配'} (${task.priority})`);
  });
  
  // 更新任务状态
  teamManager.updateTaskStatus(taskIds[0], 'completed');
  teamManager.updateTaskStatus(taskIds[1], 'in_progress');
  
  // 查看团队统计
  const stats = teamManager.getTeamStats();
  console.log('团队统计:', stats);
  
  await mjos.stop();
}

projectManagementExample();
```

### 协作会话管理

```javascript
async function collaborationExample() {
  const mjos = new MJOS();
  await mjos.start();
  
  const teamManager = mjos.getTeamManager();
  
  // 开始技术讨论会话
  const techSessionId = teamManager.startCollaboration(
    '技术架构讨论',
    ['moxiaozhi', 'moxiaochuang', 'moxiaocang']
  );
  
  // 开始测试评审会话
  const testSessionId = teamManager.startCollaboration(
    '测试方案评审',
    ['moxiaoce', 'moxiaozhi']
  );
  
  console.log('协作会话已开始:');
  console.log('- 技术讨论:', techSessionId);
  console.log('- 测试评审:', testSessionId);
  
  // 查看活跃会话
  const activeSessions = teamManager.getActiveSessions();
  console.log('当前活跃会话:', activeSessions.length);
  
  activeSessions.forEach(session => {
    console.log(`- ${session.topic}: ${session.participants.length}人参与`);
  });
  
  // 结束会话
  setTimeout(() => {
    teamManager.endCollaboration(techSessionId);
    console.log('技术讨论会话已结束');
  }, 5000);
  
  await mjos.stop();
}

collaborationExample();
```

## 上下文管理示例

### 项目上下文管理

```javascript
async function contextManagementExample() {
  const mjos = new MJOS();
  await mjos.start();
  
  const contextManager = mjos.getContextManager();
  
  // 设置项目上下文
  contextManager.set('project', {
    name: 'MJOS开发',
    version: '1.0.0',
    startDate: '2024-01-01',
    deadline: '2024-03-31'
  });
  
  contextManager.set('currentSprint', {
    number: 3,
    startDate: '2024-01-15',
    endDate: '2024-01-29',
    goals: ['完成核心功能', '提升测试覆盖率']
  });
  
  contextManager.set('environment', 'development');
  contextManager.set('debugMode', true);
  
  // 获取上下文信息
  const project = contextManager.get('project');
  const sprint = contextManager.get('currentSprint');
  
  console.log('当前项目:', project.name);
  console.log('当前冲刺:', `Sprint ${sprint.number}`);
  console.log('冲刺目标:', sprint.goals);
  
  // 基于上下文做决策
  if (contextManager.get('debugMode')) {
    console.log('调试模式已启用，详细日志记录中...');
  }
  
  // 获取所有上下文
  const allContext = contextManager.getAll();
  console.log('完整上下文:', Object.keys(allContext));
  
  await mjos.stop();
}

contextManagementExample();
```

## 事件处理示例

### 监听系统事件

```javascript
async function eventHandlingExample() {
  const mjos = new MJOS();
  
  // 获取事件总线
  const eventBus = mjos.getEngine().getEventBus();
  
  // 监听任务相关事件
  eventBus.on('team:task:created', (task) => {
    console.log(`📝 新任务创建: ${task.title}`);
    
    // 自动记录任务创建事件
    mjos.remember(
      `任务"${task.title}"已创建`,
      ['任务', '创建', '日志'],
      0.6
    );
  });
  
  eventBus.on('team:task:assigned', ({ task, member }) => {
    console.log(`👤 任务分配: ${task.title} -> ${member.name}`);
  });
  
  eventBus.on('team:collaboration:started', (session) => {
    console.log(`🤝 协作开始: ${session.topic}`);
  });
  
  // 监听引擎事件
  eventBus.on('engine:started', () => {
    console.log('🚀 MJOS引擎已启动');
  });
  
  eventBus.on('engine:stopped', () => {
    console.log('⏹️ MJOS引擎已停止');
  });
  
  await mjos.start();
  
  // 创建一些任务来触发事件
  const taskId = mjos.createTask('示例任务', '这是一个示例任务', 'medium');
  mjos.assignTask(taskId, 'moxiaozhi');
  
  // 开始协作会话
  const teamManager = mjos.getTeamManager();
  teamManager.startCollaboration('事件示例讨论', ['moxiaozhi', 'moxiaochuang']);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  await mjos.stop();
}

eventHandlingExample();
```

## MCP集成示例

### MCP服务器启动

```javascript
// examples/mcp-server-demo.js
const { MJOS } = require('../dist/index.js');

class SimpleMJOSMCPServer {
  constructor() {
    this.mjos = new MJOS();
    this.tools = new Map();
    this.setupTools();
  }

  setupTools() {
    // 记忆管理工具
    this.tools.set('mjos_remember', {
      name: 'mjos_remember',
      description: '存储记忆到MJOS系统',
      handler: async (args) => {
        const { content, tags = [], importance = 0.5 } = args;
        const memoryId = this.mjos.remember(content, tags, importance);
        return {
          success: true,
          memoryId,
          message: `记忆已存储，ID: ${memoryId}`
        };
      }
    });

    // 任务管理工具
    this.tools.set('mjos_create_task', {
      name: 'mjos_create_task',
      description: '创建新任务',
      handler: async (args) => {
        const { title, description, priority = 'medium' } = args;
        const taskId = this.mjos.createTask(title, description, priority);
        return {
          success: true,
          taskId,
          message: `任务已创建，ID: ${taskId}`
        };
      }
    });
  }

  async start() {
    await this.mjos.start();
    console.log('🌐 MJOS MCP服务器已启动');

    // 显示配置示例
    console.log('\n💡 Claude Desktop配置:');
    console.log(JSON.stringify({
      mcpServers: {
        mjos: {
          command: "node",
          args: [".mjos/examples/mcp-server-demo.js"],
          cwd: process.cwd()
        }
      }
    }, null, 2));
  }
}

// 启动服务器
const server = new SimpleMJOSMCPServer();
server.start().catch(console.error);
```

### AI客户端配置示例

#### Claude Desktop配置
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

#### Cursor配置
```json
{
  "mcp.servers": [
    {
      "name": "mjos",
      "command": "node",
      "args": [".mjos/examples/mcp-server-demo.js"],
      "cwd": "/path/to/your/project"
    }
  ]
}
```

#### Augment配置
```json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": [".mjos/examples/mcp-server-demo.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### MCP工具使用示例

在AI客户端中的对话示例：

```
用户: 请帮我记住这次会议的要点：讨论了新产品功能，决定下周开始开发。

AI: 我来帮您将会议要点存储到MJOS记忆系统中。

[使用 mjos_remember 工具]
参数: {
  "content": "讨论了新产品功能，决定下周开始开发",
  "tags": ["会议", "产品", "决策"],
  "importance": 0.8
}

✅ 记忆已成功存储到MJOS系统，ID: mem_1642345678_abc123

用户: 创建一个开发任务并分配给莫小仓

AI: 我来为您创建开发任务并分配给莫小仓。

[使用 mjos_create_task 工具]
参数: {
  "title": "新产品功能开发",
  "description": "根据会议决策开发新产品功能",
  "priority": "high"
}

[使用 mjos_assign_task 工具]
参数: {
  "task_id": "task_1642345679_def456",
  "member_id": "moxiaocang"
}

✅ 任务已成功创建并分配给莫小仓（Cangjie编程专家）
```

### MCP集成最佳实践

```javascript
// 1. 错误处理
this.tools.set('mjos_safe_operation', {
  handler: async (args) => {
    try {
      const result = await this.mjos.someOperation(args);
      return { success: true, result };
    } catch (error) {
      console.error('MCP工具错误:', error);
      return {
        success: false,
        error: error.message,
        message: '操作失败，请检查参数或系统状态'
      };
    }
  }
});

// 2. 参数验证
this.tools.set('mjos_validated_tool', {
  handler: async (args) => {
    if (!args.required_param) {
      return {
        success: false,
        error: 'Missing required parameter: required_param'
      };
    }

    // 执行操作...
    return { success: true };
  }
});

// 3. 性能监控
this.tools.set('mjos_monitored_tool', {
  handler: async (args) => {
    const startTime = Date.now();

    try {
      const result = await this.performOperation(args);
      const duration = Date.now() - startTime;

      console.log(`工具执行时间: ${duration}ms`);

      return {
        success: true,
        result,
        performance: { duration }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});
```

## 完整应用示例

### 智能项目助手

```javascript
class IntelligentProjectAssistant {
  constructor() {
    this.mjos = new MJOS();
    this.setupEventHandlers();
  }
  
  async initialize() {
    await this.mjos.start();
    console.log('🤖 智能项目助手已启动');
    
    // 初始化项目上下文
    this.setupProjectContext();
  }
  
  setupProjectContext() {
    const contextManager = this.mjos.getContextManager();
    
    contextManager.set('assistant', {
      name: '智能项目助手',
      version: '1.0.0',
      capabilities: ['任务管理', '知识检索', '团队协调']
    });
  }
  
  setupEventHandlers() {
    const eventBus = this.mjos.getEngine().getEventBus();
    
    // 自动记录重要事件
    eventBus.on('team:task:created', (task) => {
      this.recordEvent('任务创建', `新任务: ${task.title}`, ['任务', '创建']);
    });
    
    eventBus.on('team:task:assigned', ({ task, member }) => {
      this.recordEvent('任务分配', `${task.title} 分配给 ${member.name}`, ['任务', '分配']);
    });
  }
  
  recordEvent(type, description, tags) {
    this.mjos.remember({
      type,
      description,
      timestamp: new Date()
    }, tags, 0.7);
  }
  
  async createProjectPlan(projectName, requirements) {
    console.log(`📋 为项目 "${projectName}" 创建计划...`);
    
    // 记录项目需求
    this.mjos.remember({
      project: projectName,
      requirements,
      createdAt: new Date()
    }, ['项目', '需求', projectName], 0.9);
    
    // 创建基础任务
    const basicTasks = [
      { title: '需求分析', description: '分析项目需求', priority: 'high' },
      { title: '技术选型', description: '选择技术栈', priority: 'high' },
      { title: '架构设计', description: '设计系统架构', priority: 'medium' },
      { title: '开发实现', description: '编码实现功能', priority: 'medium' },
      { title: '测试验证', description: '测试系统功能', priority: 'high' }
    ];
    
    const taskIds = basicTasks.map(task => 
      this.mjos.createTask(task.title, task.description, task.priority)
    );
    
    console.log(`✅ 已创建 ${taskIds.length} 个基础任务`);
    return taskIds;
  }
  
  async getProjectInsights(projectName) {
    console.log(`🔍 分析项目 "${projectName}" 的洞察...`);
    
    // 检索项目相关记忆
    const projectMemories = this.mjos.recall({
      tags: [projectName],
      limit: 10
    });
    
    // 获取团队状态
    const teamManager = this.mjos.getTeamManager();
    const stats = teamManager.getTeamStats();
    
    const insights = {
      projectMemories: projectMemories.length,
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      activeMembers: stats.activeMembers,
      progress: stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks * 100).toFixed(1) : 0
    };
    
    console.log('📊 项目洞察:', insights);
    return insights;
  }
  
  async shutdown() {
    await this.mjos.stop();
    console.log('👋 智能项目助手已关闭');
  }
}

// 使用示例
async function intelligentAssistantExample() {
  const assistant = new IntelligentProjectAssistant();
  
  try {
    await assistant.initialize();
    
    // 创建项目计划
    await assistant.createProjectPlan('电商平台', [
      '用户注册登录',
      '商品展示',
      '购物车功能',
      '订单管理',
      '支付集成'
    ]);
    
    // 获取项目洞察
    await assistant.getProjectInsights('电商平台');
    
    await assistant.shutdown();
  } catch (error) {
    console.error('助手运行错误:', error.message);
  }
}

intelligentAssistantExample();
```

## 最佳实践总结

1. **错误处理**: 始终使用try-catch处理异步操作
2. **资源管理**: 确保调用stop()方法清理资源
3. **事件监听**: 合理使用事件系统实现响应式功能
4. **记忆管理**: 使用有意义的标签和合适的重要性等级
5. **上下文使用**: 及时更新和清理不需要的上下文
6. **团队协作**: 充分利用团队管理功能提升协作效率

这些示例展示了MJOS系统的强大功能和灵活性，可以根据具体需求进行调整和扩展。
