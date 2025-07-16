/**
 * MPEOAS Project Memory Integrator
 * Magic Process Engine of AI State 项目记忆集成�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { 
  MemoryEntry, 
  MemoryType, 
  MemoryAccessLevel, 
  StateContext,
  MJOSError 
} from './types/index';

export interface ProjectMemoryContext {
  projectId: string;
  sessionId: string;
  phase: string;
  participants: string[];
  objectives: string[];
  constraints: string[];
  timeline: {
    start: Date;
    end?: Date;
    milestones: Array<{
      name: string;
      date: Date;
      status: 'pending' | 'completed' | 'missed';
    }>;
  };
}

export interface MemoryIntegrationRule {
  id: string;
  name: string;
  trigger: MemoryTrigger;
  sourceTypes: MemoryType[];
  targetContext: string;
  integrationStrategy: IntegrationStrategy;
  priority: number;
  condition?: (memory: MemoryEntry, context: ProjectMemoryContext) => boolean;
}

export type MemoryTrigger = 
  | 'phase_change' 
  | 'milestone_reached' 
  | 'decision_made' 
  | 'issue_resolved' 
  | 'lesson_learned' 
  | 'manual';

export type IntegrationStrategy = 
  | 'append' 
  | 'merge' 
  | 'replace' 
  | 'reference' 
  | 'synthesize';

export interface IntegratedMemory {
  id: string;
  projectId: string;
  integrationType: IntegrationStrategy;
  sourceMemories: string[];
  integratedContent: any;
  context: ProjectMemoryContext;
  createdAt: Date;
  relevanceScore: number;
  usageCount: number;
  lastAccessed: Date;
}

export interface MemoryInsight {
  id: string;
  title: string;
  description: string;
  category: InsightCategory;
  confidence: number;
  impact: InsightImpact;
  sourceMemories: string[];
  actionableItems: string[];
  relatedProjects: string[];
}

export type InsightCategory = 
  | 'pattern-recognition' 
  | 'risk-identification' 
  | 'opportunity-discovery' 
  | 'process-improvement' 
  | 'knowledge-gap';

export interface InsightImpact {
  productivity: number; // 0-100
  quality: number; // 0-100
  risk: number; // 0-100
  innovation: number; // 0-100
}

/**
 * 项目记忆集成器类
 * 整合和管理项目相关的记忆和知�? */
export class ProjectMemoryIntegrator {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private projectMemories = new Map<string, MemoryEntry[]>();
  private integratedMemories = new Map<string, IntegratedMemory>();
  private integrationRules = new Map<string, MemoryIntegrationRule>();
  private memoryInsights: MemoryInsight[] = [];
  private currentContext?: ProjectMemoryContext;

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.setupDefaultIntegrationRules();
    this.setupEventListeners();
    
    this.logger.info('Project Memory Integrator initialized');
  }

  /**
   * 设置项目上下�?   */
  public setProjectContext(context: ProjectMemoryContext): void {
    this.currentContext = context;
    
    this.logger.info('Project context set', {
      projectId: context.projectId,
      sessionId: context.sessionId,
      phase: context.phase,
      participants: context.participants.length
    });

    // 发布上下文设置事�?    this.eventBus.publishEvent('project_memory.context_set', {
      context
    }, 'ProjectMemoryIntegrator');
  }

  /**
   * 添加项目记忆
   */
  public async addProjectMemory(
    memory: MemoryEntry,
    context?: ProjectMemoryContext
  ): Promise<boolean> {
    try {
      const projectContext = context || this.currentContext;
      if (!projectContext) {
        throw new Error('Project context not set');
      }

      const projectId = projectContext.projectId;
      
      if (!this.projectMemories.has(projectId)) {
        this.projectMemories.set(projectId, []);
      }
      
      this.projectMemories.get(projectId)!.push(memory);

      this.logger.debug('Project memory added', {
        projectId,
        memoryId: memory.id,
        type: memory.type
      });

      // 触发集成规则
      await this.triggerIntegration(memory, projectContext);

      // 发布记忆添加事件
      this.eventBus.publishEvent('project_memory.added', {
        memory,
        projectId,
        context: projectContext
      }, 'ProjectMemoryIntegrator');

      return true;

    } catch (error) {
      this.logger.error('Failed to add project memory', {
        memoryId: memory.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 查询项目记忆
   */
  public queryProjectMemory(
    projectId: string,
    query: {
      types?: MemoryType[];
      tags?: string[];
      timeRange?: {
        from: Date;
        to: Date;
      };
      relevanceThreshold?: number;
      limit?: number;
    }
  ): MemoryEntry[] {
    const memories = this.projectMemories.get(projectId) || [];
    let results = [...memories];

    // 类型过滤
    if (query.types) {
      results = results.filter(m => query.types!.includes(m.type));
    }

    // 标签过滤
    if (query.tags) {
      results = results.filter(m => 
        query.tags!.some(tag => m.metadata.tags.includes(tag))
      );
    }

    // 时间范围过滤
    if (query.timeRange) {
      results = results.filter(m => 
        m.createdAt >= query.timeRange!.from && 
        m.createdAt <= query.timeRange!.to
      );
    }

    // 相关性过�?    if (query.relevanceThreshold) {
      results = results.filter(m => 
        m.metadata.importance >= query.relevanceThreshold!
      );
    }

    // 按重要性排�?    results.sort((a, b) => b.metadata.importance - a.metadata.importance);

    // 限制结果数量
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * 集成记忆
   */
  public async integrateMemories(
    sourceMemoryIds: string[],
    strategy: IntegrationStrategy,
    context: ProjectMemoryContext
  ): Promise<string | null> {
    try {
      const sourceMemories = this.findMemoriesByIds(sourceMemoryIds);
      if (sourceMemories.length === 0) {
        throw new Error('No source memories found');
      }

      const integratedContent = await this.executeIntegrationStrategy(
        sourceMemories,
        strategy,
        context
      );

      const integratedMemory: IntegratedMemory = {
        id: `integrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId: context.projectId,
        integrationType: strategy,
        sourceMemories: sourceMemoryIds,
        integratedContent,
        context,
        createdAt: new Date(),
        relevanceScore: this.calculateRelevanceScore(sourceMemories, context),
        usageCount: 0,
        lastAccessed: new Date()
      };

      this.integratedMemories.set(integratedMemory.id, integratedMemory);

      this.logger.info('Memories integrated', {
        integratedId: integratedMemory.id,
        sourceCount: sourceMemoryIds.length,
        strategy,
        projectId: context.projectId
      });

      // 发布集成完成事件
      this.eventBus.publishEvent('project_memory.integrated', {
        integratedMemory,
        sourceMemories: sourceMemoryIds,
        strategy
      }, 'ProjectMemoryIntegrator');

      return integratedMemory.id;

    } catch (error) {
      this.logger.error('Failed to integrate memories', {
        sourceMemoryIds,
        strategy,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 生成记忆洞察
   */
  public async generateInsights(
    projectId: string,
    analysisDepth: 'shallow' | 'medium' | 'deep' = 'medium'
  ): Promise<MemoryInsight[]> {
    try {
      const memories = this.projectMemories.get(projectId) || [];
      const insights: MemoryInsight[] = [];

      // 模式识别洞察
      const patternInsights = await this.analyzePatterns(memories, projectId);
      insights.push(...patternInsights);

      // 风险识别洞察
      const riskInsights = await this.identifyRisks(memories, projectId);
      insights.push(...riskInsights);

      // 机会发现洞察
      const opportunityInsights = await this.discoverOpportunities(memories, projectId);
      insights.push(...opportunityInsights);

      if (analysisDepth === 'deep') {
        // 深度分析：流程改进洞�?        const processInsights = await this.analyzeProcessImprovements(memories, projectId);
        insights.push(...processInsights);

        // 深度分析：知识缺口洞�?        const gapInsights = await this.identifyKnowledgeGaps(memories, projectId);
        insights.push(...gapInsights);
      }

      // 按置信度排序
      insights.sort((a, b) => b.confidence - a.confidence);

      // 更新洞察缓存
      this.memoryInsights = this.memoryInsights.filter(i => !i.relatedProjects.includes(projectId));
      this.memoryInsights.push(...insights);

      this.logger.info('Memory insights generated', {
        projectId,
        insightCount: insights.length,
        analysisDepth
      });

      return insights;

    } catch (error) {
      this.logger.error('Failed to generate insights', {
        projectId,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * 获取项目记忆统计
   */
  public getProjectMemoryStatistics(projectId: string): {
    totalMemories: number;
    memoriesByType: Record<MemoryType, number>;
    integratedMemories: number;
    averageRelevance: number;
    recentActivity: number;
    insightCount: number;
  } {
    const memories = this.projectMemories.get(projectId) || [];
    const integrated = Array.from(this.integratedMemories.values())
      .filter(im => im.projectId === projectId);
    const insights = this.memoryInsights.filter(i => i.relatedProjects.includes(projectId));

    const memoriesByType: Record<MemoryType, number> = {} as any;
    let totalRelevance = 0;

    for (const memory of memories) {
      memoriesByType[memory.type] = (memoriesByType[memory.type] || 0) + 1;
      totalRelevance += memory.metadata.importance;
    }

    const recentActivity = memories.filter(m => 
      m.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalMemories: memories.length,
      memoriesByType,
      integratedMemories: integrated.length,
      averageRelevance: memories.length > 0 ? totalRelevance / memories.length : 0,
      recentActivity,
      insightCount: insights.length
    };
  }

  /**
   * 触发集成
   */
  private async triggerIntegration(
    memory: MemoryEntry,
    context: ProjectMemoryContext
  ): Promise<void> {
    const applicableRules = Array.from(this.integrationRules.values()).filter(rule => {
      // 检查类型匹�?      if (!rule.sourceTypes.includes(memory.type)) return false;
      
      // 检查条�?      if (rule.condition && !rule.condition(memory, context)) return false;
      
      return true;
    });

    for (const rule of applicableRules) {
      await this.executeIntegrationRule(rule, memory, context);
    }
  }

  /**
   * 执行集成规则
   */
  private async executeIntegrationRule(
    rule: MemoryIntegrationRule,
    memory: MemoryEntry,
    context: ProjectMemoryContext
  ): Promise<void> {
    try {
      this.logger.debug('Executing integration rule', {
        ruleId: rule.id,
        memoryId: memory.id,
        strategy: rule.integrationStrategy
      });

      // 查找相关记忆
      const relatedMemories = this.findRelatedMemories(memory, context.projectId);
      
      if (relatedMemories.length > 0) {
        await this.integrateMemories(
          [memory.id, ...relatedMemories.map(m => m.id)],
          rule.integrationStrategy,
          context
        );
      }

    } catch (error) {
      this.logger.error('Failed to execute integration rule', {
        ruleId: rule.id,
        memoryId: memory.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 查找相关记忆
   */
  private findRelatedMemories(memory: MemoryEntry, projectId: string): MemoryEntry[] {
    const projectMemories = this.projectMemories.get(projectId) || [];
    
    return projectMemories.filter(m => {
      if (m.id === memory.id) return false;
      
      // 基于标签的相关�?      const commonTags = memory.metadata.tags.filter(tag => 
        m.metadata.tags.includes(tag)
      );
      
      if (commonTags.length > 0) return true;
      
      // 基于类型的相关�?      if (m.type === memory.type) return true;
      
      // 基于时间的相关�?      const timeDiff = Math.abs(m.createdAt.getTime() - memory.createdAt.getTime());
      if (timeDiff < 24 * 60 * 60 * 1000) return true; // 24小时�?      
      return false;
    });
  }

  /**
   * 执行集成策略
   */
  private async executeIntegrationStrategy(
    memories: MemoryEntry[],
    strategy: IntegrationStrategy,
    context: ProjectMemoryContext
  ): Promise<any> {
    switch (strategy) {
      case 'append':
        return this.appendMemories(memories);
      
      case 'merge':
        return this.mergeMemories(memories);
      
      case 'replace':
        return this.replaceMemories(memories);
      
      case 'reference':
        return this.referenceMemories(memories);
      
      case 'synthesize':
        return this.synthesizeMemories(memories, context);
      
      default:
        throw new Error(`Unknown integration strategy: ${strategy}`);
    }
  }

  /**
   * 追加记忆
   */
  private appendMemories(memories: MemoryEntry[]): any {
    return {
      type: 'appended',
      memories: memories.map(m => ({
        id: m.id,
        content: m.content,
        timestamp: m.createdAt
      })),
      combinedContent: memories.map(m => m.content).join('\n\n')
    };
  }

  /**
   * 合并记忆
   */
  private mergeMemories(memories: MemoryEntry[]): any {
    const mergedTags = [...new Set(memories.flatMap(m => m.metadata.tags))];
    const averageImportance = memories.reduce((sum, m) => sum + m.metadata.importance, 0) / memories.length;
    
    return {
      type: 'merged',
      sourceCount: memories.length,
      mergedTags,
      averageImportance,
      combinedContent: this.intelligentMerge(memories)
    };
  }

  /**
   * 智能合并
   */
  private intelligentMerge(memories: MemoryEntry[]): string {
    // 简化的智能合并逻辑
    const sections = memories.map((m, index) => 
      `## Section ${index + 1} (${m.type})\n${m.content}`
    );
    
    return sections.join('\n\n');
  }

  /**
   * 替换记忆
   */
  private replaceMemories(memories: MemoryEntry[]): any {
    const latest = memories.reduce((latest, current) => 
      current.createdAt > latest.createdAt ? current : latest
    );
    
    return {
      type: 'replaced',
      replacedWith: latest.id,
      content: latest.content,
      replacedCount: memories.length - 1
    };
  }

  /**
   * 引用记忆
   */
  private referenceMemories(memories: MemoryEntry[]): any {
    return {
      type: 'referenced',
      references: memories.map(m => ({
        id: m.id,
        type: m.type,
        summary: this.generateSummary(m.content),
        importance: m.metadata.importance
      }))
    };
  }

  /**
   * 综合记忆
   */
  private synthesizeMemories(memories: MemoryEntry[], context: ProjectMemoryContext): any {
    const themes = this.extractThemes(memories);
    const timeline = this.createTimeline(memories);
    const insights = this.extractInsights(memories);
    
    return {
      type: 'synthesized',
      themes,
      timeline,
      insights,
      context: {
        projectPhase: context.phase,
        participants: context.participants
      }
    };
  }

  /**
   * 提取主题
   */
  private extractThemes(memories: MemoryEntry[]): string[] {
    const allTags = memories.flatMap(m => m.metadata.tags);
    const tagCounts = new Map<string, number>();
    
    for (const tag of allTags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
    
    return Array.from(tagCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, _]) => tag)
      .slice(0, 5);
  }

  /**
   * 创建时间�?   */
  private createTimeline(memories: MemoryEntry[]): Array<{
    timestamp: Date;
    type: MemoryType;
    summary: string;
  }> {
    return memories
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(m => ({
        timestamp: m.createdAt,
        type: m.type,
        summary: this.generateSummary(m.content)
      }));
  }

  /**
   * 提取洞察
   */
  private extractInsights(memories: MemoryEntry[]): string[] {
    // 简化的洞察提取
    const insights: string[] = [];
    
    const lessonMemories = memories.filter(m => m.type === 'lesson');
    if (lessonMemories.length > 0) {
      insights.push(`Identified ${lessonMemories.length} key lessons learned`);
    }
    
    const conversationMemories = memories.filter(m => m.type === 'conversation');
    if (conversationMemories.length > 2) {
      insights.push('High collaboration activity detected');
    }
    
    return insights;
  }

  /**
   * 生成摘要
   */
  private generateSummary(content: any): string {
    if (typeof content === 'string') {
      return content.length > 100 ? content.substring(0, 100) + '...' : content;
    }
    return 'Complex content';
  }

  /**
   * 查找记忆通过ID
   */
  private findMemoriesByIds(ids: string[]): MemoryEntry[] {
    const memories: MemoryEntry[] = [];
    
    for (const projectMemories of this.projectMemories.values()) {
      for (const memory of projectMemories) {
        if (ids.includes(memory.id)) {
          memories.push(memory);
        }
      }
    }
    
    return memories;
  }

  /**
   * 计算相关性分�?   */
  private calculateRelevanceScore(memories: MemoryEntry[], context: ProjectMemoryContext): number {
    let score = 0;
    
    for (const memory of memories) {
      score += memory.metadata.importance;
      
      // 时间相关�?      const daysSinceCreation = (Date.now() - memory.createdAt.getTime()) / (24 * 60 * 60 * 1000);
      score += Math.max(0, 10 - daysSinceCreation);
      
      // 标签相关�?      const relevantTags = memory.metadata.tags.filter(tag => 
        context.objectives.some(obj => obj.toLowerCase().includes(tag.toLowerCase()))
      );
      score += relevantTags.length * 5;
    }
    
    return Math.min(score / memories.length, 100);
  }

  /**
   * 分析模式
   */
  private async analyzePatterns(memories: MemoryEntry[], projectId: string): Promise<MemoryInsight[]> {
    const insights: MemoryInsight[] = [];
    
    // 分析重复模式
    const typeFrequency = new Map<MemoryType, number>();
    for (const memory of memories) {
      typeFrequency.set(memory.type, (typeFrequency.get(memory.type) || 0) + 1);
    }
    
    const dominantType = Array.from(typeFrequency.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (dominantType && dominantType[1] > memories.length * 0.4) {
      insights.push({
        id: `pattern-${Date.now()}`,
        title: 'Dominant Memory Pattern',
        description: `${dominantType[0]} memories dominate the project (${dominantType[1]} out of ${memories.length})`,
        category: 'pattern-recognition',
        confidence: 85,
        impact: {
          productivity: 10,
          quality: 15,
          risk: 5,
          innovation: 20
        },
        sourceMemories: memories.filter(m => m.type === dominantType[0]).map(m => m.id),
        actionableItems: [`Focus on diversifying memory types`, `Leverage ${dominantType[0]} expertise`],
        relatedProjects: [projectId]
      });
    }
    
    return insights;
  }

  /**
   * 识别风险
   */
  private async identifyRisks(memories: MemoryEntry[], projectId: string): Promise<MemoryInsight[]> {
    const insights: MemoryInsight[] = [];
    
    // 检查知识缺�?    const recentMemories = memories.filter(m => 
      m.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentMemories.length < memories.length * 0.2) {
      insights.push({
        id: `risk-${Date.now()}`,
        title: 'Low Recent Activity',
        description: 'Limited recent memory creation may indicate knowledge stagnation',
        category: 'risk-identification',
        confidence: 70,
        impact: {
          productivity: -15,
          quality: -10,
          risk: 25,
          innovation: -20
        },
        sourceMemories: recentMemories.map(m => m.id),
        actionableItems: ['Increase knowledge capture activities', 'Schedule regular retrospectives'],
        relatedProjects: [projectId]
      });
    }
    
    return insights;
  }

  /**
   * 发现机会
   */
  private async discoverOpportunities(memories: MemoryEntry[], projectId: string): Promise<MemoryInsight[]> {
    const insights: MemoryInsight[] = [];
    
    // 检查高质量记忆
    const highQualityMemories = memories.filter(m => m.metadata.importance > 8);
    
    if (highQualityMemories.length > memories.length * 0.3) {
      insights.push({
        id: `opportunity-${Date.now()}`,
        title: 'High-Quality Knowledge Base',
        description: 'Strong foundation of high-quality memories presents reuse opportunities',
        category: 'opportunity-discovery',
        confidence: 90,
        impact: {
          productivity: 25,
          quality: 30,
          risk: -10,
          innovation: 35
        },
        sourceMemories: highQualityMemories.map(m => m.id),
        actionableItems: ['Create knowledge templates', 'Establish best practice guidelines'],
        relatedProjects: [projectId]
      });
    }
    
    return insights;
  }

  /**
   * 分析流程改进
   */
  private async analyzeProcessImprovements(memories: MemoryEntry[], projectId: string): Promise<MemoryInsight[]> {
    // 简化实�?    return [];
  }

  /**
   * 识别知识缺口
   */
  private async identifyKnowledgeGaps(memories: MemoryEntry[], projectId: string): Promise<MemoryInsight[]> {
    // 简化实�?    return [];
  }

  /**
   * 设置默认集成规则
   */
  private setupDefaultIntegrationRules(): void {
    const defaultRules: MemoryIntegrationRule[] = [
      {
        id: 'lesson-integration',
        name: '经验教训集成',
        trigger: 'lesson_learned',
        sourceTypes: ['lesson'],
        targetContext: 'project',
        integrationStrategy: 'synthesize',
        priority: 10
      },
      {
        id: 'conversation-merge',
        name: '对话记录合并',
        trigger: 'phase_change',
        sourceTypes: ['conversation'],
        targetContext: 'phase',
        integrationStrategy: 'merge',
        priority: 8
      },
      {
        id: 'insight-reference',
        name: '洞察引用',
        trigger: 'decision_made',
        sourceTypes: ['insight'],
        targetContext: 'decision',
        integrationStrategy: 'reference',
        priority: 6
      }
    ];

    for (const rule of defaultRules) {
      this.integrationRules.set(rule.id, rule);
    }

    this.logger.debug('Default integration rules setup', {
      ruleCount: defaultRules.length
    });
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听项目阶段变化
    this.eventBus.subscribeEvent('project.phase_changed', async (event) => {
      const { projectId, newPhase, context } = event.payload;
      
      if (this.currentContext && this.currentContext.projectId === projectId) {
        this.currentContext.phase = newPhase;
        
        // 触发阶段变化集成
        const phaseMemories = this.queryProjectMemory(projectId, {
          tags: [newPhase],
          limit: 10
        });
        
        for (const memory of phaseMemories) {
          await this.triggerIntegration(memory, this.currentContext);
        }
      }
    });

    // 监听决策事件
    this.eventBus.subscribeEvent('decision.made', async (event) => {
      const { decision, context, relatedMemories } = event.payload;
      
      if (relatedMemories && relatedMemories.length > 0) {
        await this.integrateMemories(
          relatedMemories,
          'reference',
          this.currentContext!
        );
      }
    });

    // 监听经验教训事件
    this.eventBus.subscribeEvent('lesson.learned', async (event) => {
      const { lesson, context } = event.payload;
      
      // 创建经验教训记忆
      const lessonMemory: MemoryEntry = {
        id: `lesson-${Date.now()}`,
        type: 'lesson',
        content: lesson,
        metadata: {
          source: 'system',
          tags: ['lesson-learned', context.phase],
          importance: 8,
          accessLevel: 'project',
          relatedEntries: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await this.addProjectMemory(lessonMemory, this.currentContext);
    });
  }
}
