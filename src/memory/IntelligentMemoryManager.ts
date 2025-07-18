import { EventEmitter } from 'events';
import { Logger } from '../core';
import { MemorySystem, MemoryItem, MemoryQuery } from './index';

/**
 * 记忆类型枚举
 */
export enum MemoryType {
  LONG_TERM = 'long_term',    // 长期记忆
  WORKING = 'working'         // 工作记忆
}

/**
 * 记忆分类规则
 */
export interface MemoryClassificationRule {
  name: string;
  condition: (content: string, tags?: string[]) => boolean;
  memoryType: MemoryType;
  importance: number;
  autoStore: boolean;
}

/**
 * 深度思考方法枚举
 */
export enum ThinkingMethod {
  MCKINSEY_7_STEPS = 'mckinsey_7_steps',
  GLOBAL_OVERVIEW = 'global_overview',
  CONTRADICTION_ANALYSIS = 'contradiction_analysis'
}

/**
 * 智能记忆管理器
 * 实现记忆系统分层策略和自动调用机制
 */
export class IntelligentMemoryManager extends EventEmitter {
  private logger: Logger;
  private longTermMemory: MemorySystem;
  private workingMemory: MemorySystem;
  private classificationRules: MemoryClassificationRule[];
  private autoRetrievalEnabled: boolean = true;

  constructor() {
    super();
    this.logger = new Logger('IntelligentMemoryManager');
    this.longTermMemory = new MemorySystem();
    this.workingMemory = new MemorySystem();
    this.classificationRules = this.initializeClassificationRules();
    
    this.logger.info('Intelligent Memory Manager initialized with layered strategy');
  }

  /**
   * 初始化分类规则
   */
  private initializeClassificationRules(): MemoryClassificationRule[] {
    return [
      // 长期记忆规则
      {
        name: 'project_experience',
        condition: (content, tags) =>
          content.length > 100 ||
          Boolean(tags && tags.some(tag => ['project', 'experience', 'solution'].includes(tag.toLowerCase()))),
        memoryType: MemoryType.LONG_TERM,
        importance: 0.9,
        autoStore: true
      },
      {
        name: 'technical_content',
        condition: (content, tags) =>
          /code|config|architecture|技术|代码|配置|架构/.test(content) ||
          Boolean(tags && tags.some(tag => ['code', 'config', 'tech', 'architecture'].includes(tag.toLowerCase()))),
        memoryType: MemoryType.LONG_TERM,
        importance: 0.8,
        autoStore: true
      },
      {
        name: 'knowledge_learning',
        condition: (content, tags) =>
          /learn|knowledge|best practice|教训|学习|知识|最佳实践/.test(content) ||
          Boolean(tags && tags.some(tag => ['learning', 'knowledge', 'practice'].includes(tag.toLowerCase()))),
        memoryType: MemoryType.LONG_TERM,
        importance: 0.8,
        autoStore: true
      },
      {
        name: 'user_preferences',
        condition: (content, tags) =>
          /preference|workflow|personal|偏好|工作流程|个人/.test(content) ||
          Boolean(tags && tags.some(tag => ['preference', 'workflow', 'personal'].includes(tag.toLowerCase()))),
        memoryType: MemoryType.LONG_TERM,
        importance: 0.7,
        autoStore: true
      },
      {
        name: 'detailed_content',
        condition: (content) => content.length > 100,
        memoryType: MemoryType.LONG_TERM,
        importance: 0.6,
        autoStore: true
      },
      {
        name: 'shared_links',
        condition: (content) => /https?:\/\/[^\s]+/.test(content),
        memoryType: MemoryType.LONG_TERM,
        importance: 0.7,
        autoStore: true
      },
      
      // 工作记忆规则
      {
        name: 'conversation_context',
        condition: (content, tags) =>
          Boolean(tags && tags.some(tag => ['context', 'conversation', 'current'].includes(tag.toLowerCase()))),
        memoryType: MemoryType.WORKING,
        importance: 0.5,
        autoStore: true
      },
      {
        name: 'role_activation',
        condition: (content, tags) =>
          /role|activation|mode|角色|激活|模式/.test(content) ||
          Boolean(tags && tags.some(tag => ['role', 'activation', 'mode'].includes(tag.toLowerCase()))),
        memoryType: MemoryType.WORKING,
        importance: 0.6,
        autoStore: true
      },
      {
        name: 'temporary_reasoning',
        condition: (content, tags) =>
          /reasoning|process|temporary|推理|过程|临时/.test(content) ||
          Boolean(tags && tags.some(tag => ['reasoning', 'process', 'temporary'].includes(tag.toLowerCase()))),
        memoryType: MemoryType.WORKING,
        importance: 0.4,
        autoStore: true
      }
    ];
  }

  /**
   * 智能存储记忆
   * 根据分层策略自动分类和存储
   */
  async smartStore(content: string, options?: {
    tags?: string[];
    importance?: number;
    forceType?: MemoryType;
  }): Promise<string> {
    const { tags = [], importance, forceType } = options || {};
    
    // 自动分类
    const classification = this.classifyMemory(content, tags);
    const memoryType = forceType || classification.memoryType;
    const finalImportance = importance || classification.importance;
    
    // 选择存储系统
    const memorySystem = memoryType === MemoryType.LONG_TERM ? 
      this.longTermMemory : this.workingMemory;
    
    // 存储记忆
    const memoryId = memorySystem.store(
      content,
      [...tags, memoryType, classification.name],
      finalImportance
    );
    
    this.logger.info(`Memory stored in ${memoryType}: ${memoryId}`);
    this.emit('memoryStored', { memoryId, memoryType, classification });
    
    return memoryId;
  }

  /**
   * 分类记忆
   */
  private classifyMemory(content: string, tags: string[]): {
    memoryType: MemoryType;
    importance: number;
    name: string;
  } {
    // 找到匹配的规则
    const matchedRule = this.classificationRules.find(rule => 
      rule.condition(content, tags)
    );
    
    if (matchedRule) {
      return {
        memoryType: matchedRule.memoryType,
        importance: matchedRule.importance,
        name: matchedRule.name
      };
    }
    
    // 默认分类
    return {
      memoryType: MemoryType.WORKING,
      importance: 0.3,
      name: 'default'
    };
  }

  /**
   * 自动检索相关记忆
   * 根据查询内容智能检索相关信息
   */
  async autoRetrieve(query: string, context?: {
    includeWorkingMemory?: boolean;
    maxResults?: number;
    minImportance?: number;
  }): Promise<MemoryItem[]> {
    if (!this.autoRetrievalEnabled) {
      return [];
    }
    
    const { includeWorkingMemory = true, maxResults = 10, minImportance = 0.3 } = context || {};
    
    // 构建查询条件
    const searchQuery: MemoryQuery = {
      limit: maxResults,
      importance: { min: minImportance, max: 1.0 }
    };
    
    // 提取关键词作为标签
    const keywords = this.extractKeywords(query);
    if (keywords.length > 0) {
      searchQuery.tags = keywords;
    }
    
    let results: MemoryItem[] = [];
    
    // 搜索长期记忆
    const longTermResults = this.longTermMemory.query(searchQuery);
    results.push(...longTermResults);
    
    // 搜索工作记忆（如果需要）
    if (includeWorkingMemory) {
      const workingResults = this.workingMemory.query(searchQuery);
      results.push(...workingResults);
    }
    
    // 按重要性和相关性排序
    results = this.rankResults(results, query);
    
    this.logger.info(`Auto-retrieved ${results.length} memories for query: ${query}`);
    this.emit('memoryRetrieved', { query, results });
    
    return results.slice(0, maxResults);
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取算法
    const keywords = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word));
    
    return [...new Set(keywords)];
  }

  /**
   * 排序结果
   */
  private rankResults(memories: MemoryItem[], query: string): MemoryItem[] {
    const queryKeywords = this.extractKeywords(query);
    
    return memories.sort((a, b) => {
      // 计算相关性得分
      const scoreA = this.calculateRelevanceScore(a, queryKeywords);
      const scoreB = this.calculateRelevanceScore(b, queryKeywords);
      
      // 综合重要性和相关性
      const finalScoreA = (a.importance || 0.5) * 0.3 + scoreA * 0.7;
      const finalScoreB = (b.importance || 0.5) * 0.3 + scoreB * 0.7;
      
      return finalScoreB - finalScoreA;
    });
  }

  /**
   * 计算相关性得分
   */
  private calculateRelevanceScore(memory: MemoryItem, queryKeywords: string[]): number {
    if (queryKeywords.length === 0) return 0;
    
    const memoryText = (memory.content + ' ' + (memory.tags || []).join(' ')).toLowerCase();
    const matchCount = queryKeywords.filter(keyword => 
      memoryText.includes(keyword)
    ).length;
    
    return matchCount / queryKeywords.length;
  }

  /**
   * 深度思考
   * 集成麦肯锡七步法、纵览全局法、矛盾分析法
   */
  async deepThink(problem: string, method: ThinkingMethod = ThinkingMethod.MCKINSEY_7_STEPS): Promise<{
    analysis: string;
    solution: string;
    relatedMemories: MemoryItem[];
  }> {
    this.logger.info(`Starting deep thinking with method: ${method}`);
    
    // 自动检索相关记忆
    const relatedMemories = await this.autoRetrieve(problem, {
      maxResults: 20,
      minImportance: 0.5
    });
    
    let analysis: string;
    let solution: string;
    
    switch (method) {
      case ThinkingMethod.MCKINSEY_7_STEPS:
        ({ analysis, solution } = this.applyMcKinsey7Steps(problem, relatedMemories));
        break;
      case ThinkingMethod.GLOBAL_OVERVIEW:
        ({ analysis, solution } = this.applyGlobalOverview(problem, relatedMemories));
        break;
      case ThinkingMethod.CONTRADICTION_ANALYSIS:
        ({ analysis, solution } = this.applyContradictionAnalysis(problem, relatedMemories));
        break;
      default:
        ({ analysis, solution } = this.applyMcKinsey7Steps(problem, relatedMemories));
    }
    
    // 存储思考过程到工作记忆
    await this.smartStore(`深度思考: ${problem}\n分析: ${analysis}\n解决方案: ${solution}`, {
      tags: ['deep_thinking', method, 'analysis'],
      importance: 0.8
    });
    
    return { analysis, solution, relatedMemories };
  }

  /**
   * 应用麦肯锡七步法
   */
  private applyMcKinsey7Steps(problem: string, memories: MemoryItem[]): { analysis: string; solution: string } {
    const steps = [
      '1. 定义问题',
      '2. 拆解问题', 
      '3. 筛选关键问题',
      '4. 制定工作计划',
      '5. 深入分析问题',
      '6. 提出解决方案',
      '7. 实施方案和反馈'
    ];
    
    const analysis = `麦肯锡七步分析法:\n${steps.join('\n')}\n\n基于历史记忆的相关经验: ${memories.length}条`;
    const solution = `基于七步法分析，建议采用系统性方法解决问题: ${problem}`;
    
    return { analysis, solution };
  }

  /**
   * 应用纵览全局法
   */
  private applyGlobalOverview(problem: string, memories: MemoryItem[]): { analysis: string; solution: string } {
    const analysis = `纵览全局分析:\n- 系统整体视角\n- 关联因素分析\n- 影响范围评估\n\n相关历史经验: ${memories.length}条`;
    const solution = `从全局角度，建议综合考虑各方面因素来解决: ${problem}`;
    
    return { analysis, solution };
  }

  /**
   * 应用矛盾分析法
   */
  private applyContradictionAnalysis(problem: string, memories: MemoryItem[]): { analysis: string; solution: string } {
    const analysis = `矛盾分析法:\n- 识别系统矛盾\n- 分析矛盾根源\n- 寻找解决路径\n\n相关历史案例: ${memories.length}条`;
    const solution = `通过解决核心矛盾来处理问题: ${problem}`;
    
    return { analysis, solution };
  }

  /**
   * 清理工作记忆
   * 定期清理过期的工作记忆
   */
  async cleanupWorkingMemory(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffTime = Date.now() - maxAge;
    const allMemories = this.workingMemory.query({});
    
    let cleanedCount = 0;
    for (const memory of allMemories) {
      if (memory.timestamp && memory.timestamp.getTime() < cutoffTime) {
        this.workingMemory.delete(memory.id);
        cleanedCount++;
      }
    }
    
    this.logger.info(`Cleaned up ${cleanedCount} expired working memories`);
    return cleanedCount;
  }

  /**
   * 获取记忆统计
   */
  getMemoryStats(): {
    longTerm: { total: number; avgImportance: number };
    working: { total: number; avgImportance: number };
  } {
    const longTermStats = this.longTermMemory.getStats();
    const workingStats = this.workingMemory.getStats();

    return {
      longTerm: {
        total: longTermStats.totalMemories,
        avgImportance: longTermStats.averageImportance
      },
      working: {
        total: workingStats.totalMemories,
        avgImportance: workingStats.averageImportance
      }
    };
  }

  /**
   * 启用/禁用自动检索
   */
  setAutoRetrievalEnabled(enabled: boolean): void {
    this.autoRetrievalEnabled = enabled;
    this.logger.info(`Auto-retrieval ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    await this.longTermMemory.destroy();
    await this.workingMemory.destroy();
    this.removeAllListeners();
    this.logger.info('Intelligent Memory Manager destroyed');
  }
}
