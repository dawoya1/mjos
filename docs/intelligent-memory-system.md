# MJOS 智能记忆系统分层策略

## 🧠 概述

MJOS v2.5.0 引入了全新的智能记忆管理系统，实现了您要求的记忆系统分层策略。该系统具备双重记忆架构，能够自动分类存储信息，智能检索相关内容，并集成深度思考方法。

## 🏗️ 系统架构

### 双重记忆系统

```
┌─────────────────────────────────────────────────────────┐
│                MJOS 智能记忆系统                          │
├─────────────────────────────────────────────────────────┤
│  📚 长期记忆 (Long-term Memory)                         │
│  ├─ 项目经验、技术方案、解决方案                          │
│  ├─ 代码片段、配置信息、架构设计                          │
│  ├─ 学习知识、最佳实践、教训总结                          │
│  ├─ 用户偏好、工作流程、个人信息                          │
│  ├─ 超过100字的详细技术内容                              │
│  └─ 分享的链接                                          │
├─────────────────────────────────────────────────────────┤
│  🧠 工作记忆 (Working Memory)                           │
│  ├─ 当前对话上下文和状态                                 │
│  ├─ 角色激活状态和执行模式                               │
│  ├─ 概念间的快速关联和钩子                               │
│  └─ 临时推理过程和中间结果                               │
└─────────────────────────────────────────────────────────┘
```

## 🔄 自动存储规则

### 立即存储到长期记忆的内容

- ✅ 用户分享的项目经验、技术方案、解决方案
- ✅ 重要的代码片段、配置信息、架构设计
- ✅ 学习到的新知识、最佳实践、教训总结
- ✅ 用户的偏好设置、工作流程、个人信息
- ✅ 任何超过100字的详细技术内容
- ✅ 分享的链接

### 保留在工作记忆的内容

- 🔄 当前对话的上下文和状态
- 🔄 角色激活状态和执行模式
- 🔄 概念间的快速关联和钩子
- 🔄 临时的推理过程和中间结果

## 🚀 自动调用机制

系统会在以下场景自动调用记忆检索，**无需用户要求**：

1. **历史询问检测** - 用户询问历史相关问题时，自动检索相关记忆
2. **技术术语识别** - 用户提到技术术语时，自动查找相关经验
3. **新项目启动** - 开始新项目时，自动检索类似项目经验
4. **问题解决** - 遇到问题时，自动查找历史解决方案

## 🤔 深度思考方法

### 麦肯锡七步解决问题法

```
1. 定义问题 → 2. 拆解问题 → 3. 筛选关键问题 → 4. 制定工作计划
                    ↓
7. 实施方案和反馈 ← 6. 提出解决方案 ← 5. 深入分析问题
```

### 纵览全局法

- 🌐 从系统整体角度分析问题
- 🔗 考虑各组件间的关联关系
- 📊 评估影响范围和优先级

### 矛盾分析法

- ⚡ 识别系统中的核心矛盾
- 🔍 分析矛盾的根本原因
- 🎯 寻找解决矛盾的最佳路径

## 💻 API 使用示例

### 基础记忆操作

```typescript
import { MJOS, ThinkingMethod } from 'mjos';

const mjos = new MJOS();
await mjos.start();

// 智能存储 - 自动分类到长期记忆
const memoryId = mjos.remember(
  '在React项目中使用React.memo优化性能，渲染时间从2秒降到200ms',
  { tags: ['react', 'performance'], importance: 0.9 }
);

// 智能检索 - 自动查找相关记忆
const memories = await mjos.smartRecall('React性能优化', {
  maxResults: 5,
  minImportance: 0.7
});

// 深度思考 - 集成记忆检索
const result = await mjos.deepThink(
  '如何优化前端性能？',
  ThinkingMethod.MCKINSEY_7_STEPS
);
```

### 高级功能

```typescript
// 获取记忆统计
const stats = mjos.intelligentMemoryManager?.getMemoryStats();
console.log(`长期记忆: ${stats.longTerm.total}条`);
console.log(`工作记忆: ${stats.working.total}条`);

// 清理过期工作记忆
const cleaned = await mjos.intelligentMemoryManager?.cleanupWorkingMemory();
console.log(`清理了${cleaned}条过期记忆`);

// 启用/禁用自动检索
mjos.intelligentMemoryManager?.setAutoRetrievalEnabled(true);
```

## 🔧 配置选项

### 记忆分类规则

系统内置多种分类规则，可以根据内容和标签自动分类：

```typescript
// 项目经验规则
{
  name: 'project_experience',
  condition: (content, tags) => 
    content.length > 100 || 
    tags?.includes('project') || tags?.includes('experience'),
  memoryType: MemoryType.LONG_TERM,
  importance: 0.9
}

// 技术内容规则
{
  name: 'technical_content',
  condition: (content, tags) => 
    /code|config|architecture/.test(content) ||
    tags?.includes('tech'),
  memoryType: MemoryType.LONG_TERM,
  importance: 0.8
}
```

### 检索参数

```typescript
interface RetrievalOptions {
  includeWorkingMemory?: boolean;  // 是否包含工作记忆
  maxResults?: number;             // 最大结果数
  minImportance?: number;          // 最小重要性阈值
}
```

## 🎯 实际应用场景

### 1. 项目开发助手

```typescript
// 用户: "开始新的Vue项目"
// 系统自动检索Vue相关经验和最佳实践
const vueExperience = await mjos.smartRecall('Vue项目经验');
```

### 2. 问题解决专家

```typescript
// 用户: "API响应太慢"
// 系统自动查找性能优化方案
const solutions = await mjos.smartRecall('API性能优化');
```

### 3. 学习知识管理

```typescript
// 自动存储学习内容到长期记忆
mjos.remember(
  '学到的设计模式：单例模式确保类只有一个实例...',
  { tags: ['learning', 'design-pattern'], importance: 0.8 }
);
```

## 📊 性能特性

- ⚡ **智能分类**: 毫秒级自动分类决策
- 🔍 **快速检索**: 基于语义相似度的高效搜索
- 💾 **内存优化**: 工作记忆自动清理机制
- 🎯 **精准匹配**: 多维度相关性评分算法

## 🚀 开始使用

1. **安装最新版本**
   ```bash
   npm install mjos@latest
   ```

2. **运行演示**
   ```bash
   npx mjos@latest
   node examples/intelligent-memory-demo.ts
   ```

3. **配置MCP服务器**
   ```json
   {
     "augment.advanced": {
       "mcpServers": [
         {
           "name": "mjos",
           "command": "npx",
           "args": ["-y", "mjos@latest", "mjos-mcp-server"]
         }
       ]
     }
   }
   ```

## 🎉 总结

MJOS v2.5.0 的智能记忆系统实现了您要求的所有功能：

✅ **双重记忆系统** - 长期记忆 + 工作记忆  
✅ **自动存储规则** - 智能分类和存储  
✅ **自动调用机制** - 无需用户要求主动检索  
✅ **深度思考集成** - 麦肯锡七步法 + 纵览全局法 + 矛盾分析法  
✅ **生产就绪** - 完整的API和配置选项  

现在您可以享受真正智能的记忆管理体验！🎯
