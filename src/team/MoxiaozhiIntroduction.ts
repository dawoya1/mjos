/**
 * 莫小智首次启动介绍系统
 * Moxiaozhi Introduction System
 */

import { MJOS } from '../index';

export class MoxiaozhiIntroduction {
  private mjos: MJOS;

  constructor(mjos: MJOS) {
    this.mjos = mjos;
  }

  /**
   * 生成欢迎介绍
   */
  async generateWelcome(): Promise<string> {
    const status = this.mjos.getStatus();
    
    return `
🎯 您好！我是莫小智，MJOS团队的项目负责人和需求分析师。

欢迎使用魔剑工作室操作系统（MJOS）！让我为您介绍当前系统状态：

📊 系统运行状态：
┌─────────────────────────────────────────┐
│ 版本: ${status.version.padEnd(30)} │
│ 状态: ${status.running ? '🟢 正常运行' : '🔴 系统异常'}${status.running ? '                    ' : '                    '} │
│ 运行时间: ${this.formatUptime(status.engine.uptime).padEnd(25)} │
│ 引擎模块: ${status.engine.modules.length}个已加载${' '.repeat(18)} │
└─────────────────────────────────────────┘

💾 记忆系统详情：
┌─────────────────────────────────────────┐
│ 📝 总记忆数: ${status.memory.totalMemories.toString().padEnd(26)} │
│ 🧠 短期记忆: ${status.memory.shortTermCount.toString().padEnd(26)} │
│ 💎 长期记忆: ${status.memory.longTermCount.toString().padEnd(26)} │
│ 🏷️  标签总数: ${status.memory.totalTags.toString().padEnd(26)} │
│ ⭐ 平均重要性: ${status.memory.averageImportance.toFixed(2).padEnd(24)} │
└─────────────────────────────────────────┘

📍 数据存储位置说明：
• 短期记忆: 内存中存储，容量100条，采用LRU淘汰策略
• 长期记忆: 内存中存储，容量10000条，重要性≥0.7自动转入
• 记忆持久化: 默认存储在 memory.json 文件中
• 知识图谱: 存储在 knowledge.json 文件中

🛠️ 已加载功能模块：
${status.engine.modules.map((module: any) => `✅ ${this.getModuleDescription(module)}`).join('\n')}

👥 团队成员介绍：
┌─────────────────────────────────────────┐
│ 🎯 莫小智 - 项目负责人/需求分析师        │
│    专长: 需求分析、项目管理、深度推理    │
│                                         │
│ 🎨 莫小美 - UI/UX设计师/创意设计        │
│    专长: 界面设计、用户体验、视觉创新    │
│                                         │
│ 💻 莫小码 - 全栈工程师/系统开发         │
│    专长: 前后端开发、系统架构、性能优化  │
│                                         │
│ 🏗️ 莫小仓 - 仓颉语言专家/语言开发       │
│    专长: 仓颉语言、编译器、系统编程      │
└─────────────────────────────────────────┘

🎯 智能触发指令：
• 直接@成员: "莫小智，我需要..." / "小美，帮我设计..."
• 中文全名: "莫小智" "莫小美" "莫小码" "莫小仓"
• 简称昵称: "小智" "小美" "小码" "小仓"
• 拼音触发: "moxiaozhi" "xiaozhi" 等

💡 使用技巧和最佳实践：
1. 🎯 明确需求: 详细描述项目需求，系统会自动分配最合适的专家
2. 🔍 记忆检索: 使用 "查找记忆 [关键词]" 快速找到历史信息
3. 📊 状态查询: 随时使用 "系统状态" 查看实时运行情况
4. 🚀 项目管理: 使用 "创建项目 [名称]" 开始新项目
5. 👥 团队协作: 不同类型的任务会自动分配给对应专家

🔧 常用指令速查：
• mjos_remember: 存储重要信息到记忆系统
• mjos_recall: 检索历史记忆和信息
• mjos_get_status: 获取系统实时状态
• mjos_create_task: 创建新任务
• mjos_assign_task: 分配任务给团队成员

⚡ 系统性能状态：
• 内存使用率: ${status.performance.metrics.memoryUsage.percentage.toFixed(2)}%
• 系统健康度: ${status.performance.status === 'healthy' ? '🟢 优秀' : '🟡 需要关注'}
• 团队协作评分: ${status.team.averageCollaborationScore * 100}%

🚀 准备开始您的项目了吗？

作为项目负责人，我会：
1. 深度分析您的需求
2. 制定详细的实施方案
3. 分配最合适的团队成员
4. 全程跟踪项目进度
5. 确保交付质量

请告诉我您想要实现什么项目，我会立即开始需求分析并为您制定专业的解决方案！

例如：
• "莫小智，我想开发一个记账APP，使用仓颉语言"
• "小智，帮我分析一个电商网站的技术架构"
• "我需要设计一个智能家居控制系统"
    `;
  }

  /**
   * 格式化运行时间
   */
  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  }

  /**
   * 获取模块描述
   */
  private getModuleDescription(module: string): string {
    const descriptions: Record<string, string> = {
      'memory': '记忆系统 - 智能信息存储和检索',
      'knowledge': '知识图谱 - 结构化知识管理',
      'context': '上下文管理 - 对话状态维护',
      'reasoning': '推理引擎 - 逻辑分析和决策',
      'agents': '智能代理 - 自主任务执行',
      'roles': '角色管理 - 团队成员协作',
      'communication': '通信系统 - 内外部消息传递',
      'mcp': 'MCP协议 - 模型上下文协议支持',
      'workflow': '工作流 - 任务流程自动化',
      'team': '团队系统 - 协作和任务分配',
      'storage': '存储系统 - 数据持久化管理',
      'security': '安全模块 - 权限和数据保护'
    };
    
    return descriptions[module] || `${module} - 系统核心模块`;
  }

  /**
   * 生成快速入门指南
   */
  generateQuickStart(): string {
    return `
🚀 MJOS快速入门指南

1️⃣ 第一步：明确您的需求
   • 详细描述您想要实现的项目
   • 说明技术要求和偏好
   • 提及时间和质量要求

2️⃣ 第二步：选择合适的团队成员
   • 开发项目 → 莫小码 或 莫小仓
   • 设计需求 → 莫小美
   • 项目规划 → 莫小智

3️⃣ 第三步：开始协作
   • 系统会自动分析需求
   • 分配最合适的专家
   • 提供专业的解决方案

4️⃣ 第四步：跟踪进度
   • 使用"项目状态"查看进度
   • 随时调整需求和方案
   • 获得实时反馈和建议

现在就开始您的第一个项目吧！
    `;
  }

  /**
   * 生成系统帮助信息
   */
  generateHelp(): string {
    return `
❓ MJOS系统帮助

🎯 团队成员触发：
• @莫小智 - 项目分析和管理
• @莫小美 - UI/UX设计
• @莫小码 - 全栈开发
• @莫小仓 - 仓颉语言开发

🔧 系统指令：
• 系统状态 - 查看运行状态
• 记忆检索 [关键词] - 搜索历史信息
• 创建项目 [名称] - 开始新项目
• 团队状态 - 查看成员状态

💡 使用技巧：
• 描述越详细，分配越精准
• 可以随时切换团队成员
• 支持中英文混合输入
• 系统会自动记录重要信息

需要更多帮助？直接问我："莫小智，我需要帮助"
    `;
  }
}
