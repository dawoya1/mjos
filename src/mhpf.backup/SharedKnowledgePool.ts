/**
 * MHPF Shared Knowledge Pool
 * Magic Human-AI Partnership Framework 共享知识�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { 
  MemoryEntry, 
  MemoryType, 
  MemoryAccessLevel, 
  MemoryMetadata,
  MJOSError 
} from './types/index';

export interface KnowledgeEntry extends MemoryEntry {
  category: KnowledgeCategory;
  relevanceScore: number;
  usageCount: number;
  lastAccessed: Date;
  contributors: string[];
  validationStatus: ValidationStatus;
}

export type KnowledgeCategory = 
  | 'domain-expertise' 
  | 'best-practices' 
  | 'lessons-learned' 
  | 'project-context' 
  | 'tool-knowledge' 
  | 'collaboration-patterns';

export type ValidationStatus = 'pending' | 'validated' | 'outdated' | 'deprecated';

export interface KnowledgeQuery {
  keywords: string[];
  categories?: KnowledgeCategory[];
  accessLevel?: MemoryAccessLevel;
  timeRange?: {
    from: Date;
    to: Date;
  };
  relevanceThreshold?: number;
  maxResults?: number;
}

export interface KnowledgeInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  supportingEvidence: string[];
  relatedEntries: string[];
  actionableRecommendations: string[];
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  clusters: KnowledgeCluster[];
}

export interface KnowledgeNode {
  id: string;
  label: string;
  category: KnowledgeCategory;
  weight: number;
  metadata: any;
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  relationship: string;
  strength: number;
}

export interface KnowledgeCluster {
  id: string;
  name: string;
  nodes: string[];
  centralConcept: string;
  coherence: number;
}

/**
 * 共享知识池类
 * 管理团队的共享知识和经验
 */
export class SharedKnowledgePool {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private knowledgeEntries = new Map<string, KnowledgeEntry>();
  private knowledgeIndex = new Map<string, Set<string>>(); // keyword -> entry IDs
  private accessLog: Array<{
    entryId: string;
    accessorId: string;
    timestamp: Date;
    operation: 'read' | 'write' | 'update' | 'delete';
  }> = [];

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.setupEventListeners();
    this.initializeDefaultKnowledge();
    
    this.logger.info('Shared Knowledge Pool initialized');
  }

  /**
   * 添加知识条目
   */
  public async addKnowledge(
    content: any,
    metadata: Partial<MemoryMetadata>,
    category: KnowledgeCategory,
    contributorId: string
  ): Promise<string> {
    try {
      const entry: KnowledgeEntry = {
        id: `knowledge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'insight',
        content,
        metadata: {
          source: contributorId,
          tags: metadata.tags || [],
          importance: metadata.importance || 5,
          accessLevel: metadata.accessLevel || 'shared',
          relatedEntries: metadata.relatedEntries || []
        },
        category,
        relevanceScore: 100, // 新知识默认高相关�?        usageCount: 0,
        lastAccessed: new Date(),
        contributors: [contributorId],
        validationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.knowledgeEntries.set(entry.id, entry);
      this.updateKnowledgeIndex(entry);
      this.logAccess(entry.id, contributorId, 'write');

      this.logger.info('Knowledge added', {
        entryId: entry.id,
        category,
        contributor: contributorId
      });

      // 发布知识添加事件
      this.eventBus.publishEvent('knowledge.added', {
        entry,
        contributor: contributorId
      }, 'SharedKnowledgePool');

      return entry.id;

    } catch (error) {
      const knowledgeError = this.createKnowledgeError(
        error,
        'addKnowledge',
        { category, contributorId }
      );
      this.logger.error('Failed to add knowledge', { error: knowledgeError });
      throw knowledgeError;
    }
  }

  /**
   * 查询知识
   */
  public async queryKnowledge(
    query: KnowledgeQuery,
    accessorId: string
  ): Promise<KnowledgeEntry[]> {
    try {
      this.logger.debug('Querying knowledge', {
        keywords: query.keywords,
        categories: query.categories,
        accessor: accessorId
      });

      let candidateIds = new Set<string>();

      // 基于关键词查�?      for (const keyword of query.keywords) {
        const keywordEntries = this.knowledgeIndex.get(keyword.toLowerCase()) || new Set();
        if (candidateIds.size === 0) {
          candidateIds = new Set(keywordEntries);
        } else {
          candidateIds = new Set([...candidateIds].filter(id => keywordEntries.has(id)));
        }
      }

      // 如果没有关键词匹配，返回所有条�?      if (candidateIds.size === 0) {
        candidateIds = new Set(this.knowledgeEntries.keys());
      }

      let results: KnowledgeEntry[] = [];

      for (const entryId of candidateIds) {
        const entry = this.knowledgeEntries.get(entryId);
        if (!entry) continue;

        // 访问权限检�?        if (!this.checkAccess(entry, accessorId)) continue;

        // 类别过滤
        if (query.categories && !query.categories.includes(entry.category)) continue;

        // 时间范围过滤
        if (query.timeRange) {
          if (entry.createdAt < query.timeRange.from || entry.createdAt > query.timeRange.to) {
            continue;
          }
        }

        // 相关性过�?        if (query.relevanceThreshold && entry.relevanceScore < query.relevanceThreshold) {
          continue;
        }

        results.push(entry);
        this.logAccess(entryId, accessorId, 'read');
      }

      // 按相关性排�?      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // 限制结果数量
      if (query.maxResults) {
        results = results.slice(0, query.maxResults);
      }

      // 更新使用统计
      for (const entry of results) {
        entry.usageCount++;
        entry.lastAccessed = new Date();
      }

      this.logger.info('Knowledge query completed', {
        resultCount: results.length,
        accessor: accessorId
      });

      return results;

    } catch (error) {
      const knowledgeError = this.createKnowledgeError(
        error,
        'queryKnowledge',
        { query, accessorId }
      );
      this.logger.error('Failed to query knowledge', { error: knowledgeError });
      throw knowledgeError;
    }
  }

  /**
   * 更新知识条目
   */
  public async updateKnowledge(
    entryId: string,
    updates: Partial<KnowledgeEntry>,
    updaterId: string
  ): Promise<boolean> {
    try {
      const entry = this.knowledgeEntries.get(entryId);
      if (!entry) {
        throw new Error(`Knowledge entry not found: ${entryId}`);
      }

      // 访问权限检�?      if (!this.checkAccess(entry, updaterId)) {
        throw new Error(`Access denied for entry: ${entryId}`);
      }

      // 更新条目
      const updatedEntry: KnowledgeEntry = {
        ...entry,
        ...updates,
        updatedAt: new Date(),
        contributors: [...new Set([...entry.contributors, updaterId])]
      };

      this.knowledgeEntries.set(entryId, updatedEntry);
      this.updateKnowledgeIndex(updatedEntry);
      this.logAccess(entryId, updaterId, 'update');

      this.logger.info('Knowledge updated', {
        entryId,
        updater: updaterId
      });

      // 发布知识更新事件
      this.eventBus.publishEvent('knowledge.updated', {
        entryId,
        entry: updatedEntry,
        updater: updaterId
      }, 'SharedKnowledgePool');

      return true;

    } catch (error) {
      this.logger.error('Failed to update knowledge', {
        entryId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 生成知识洞察
   */
  public async generateInsights(
    context: {
      projectId?: string;
      roleIds?: string[];
      timeframe?: number; // days
    }
  ): Promise<KnowledgeInsight[]> {
    const insights: KnowledgeInsight[] = [];

    // 分析使用模式
    const usageInsights = this.analyzeUsagePatterns(context);
    insights.push(...usageInsights);

    // 分析知识缺口
    const gapInsights = this.analyzeKnowledgeGaps(context);
    insights.push(...gapInsights);

    // 分析协作模式
    const collaborationInsights = this.analyzeCollaborationPatterns(context);
    insights.push(...collaborationInsights);

    // 按置信度排序
    insights.sort((a, b) => b.confidence - a.confidence);

    this.logger.info('Knowledge insights generated', {
      insightCount: insights.length,
      context
    });

    return insights;
  }

  /**
   * 构建知识图谱
   */
  public buildKnowledgeGraph(): KnowledgeGraph {
    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];

    // 创建节点
    for (const entry of this.knowledgeEntries.values()) {
      nodes.push({
        id: entry.id,
        label: this.extractLabel(entry),
        category: entry.category,
        weight: entry.relevanceScore,
        metadata: {
          usageCount: entry.usageCount,
          contributors: entry.contributors.length,
          validationStatus: entry.validationStatus
        }
      });
    }

    // 创建�?    for (const entry of this.knowledgeEntries.values()) {
      for (const relatedId of entry.metadata.relatedEntries) {
        if (this.knowledgeEntries.has(relatedId)) {
          edges.push({
            from: entry.id,
            to: relatedId,
            relationship: 'related',
            strength: this.calculateRelationshipStrength(entry.id, relatedId)
          });
        }
      }
    }

    // 识别集群
    const clusters = this.identifyKnowledgeClusters(nodes, edges);

    return { nodes, edges, clusters };
  }

  /**
   * 验证知识条目
   */
  public async validateKnowledge(
    entryId: string,
    validatorId: string,
    validationResult: ValidationStatus
  ): Promise<boolean> {
    try {
      const entry = this.knowledgeEntries.get(entryId);
      if (!entry) {
        throw new Error(`Knowledge entry not found: ${entryId}`);
      }

      entry.validationStatus = validationResult;
      entry.updatedAt = new Date();

      this.logger.info('Knowledge validated', {
        entryId,
        validator: validatorId,
        result: validationResult
      });

      // 发布验证事件
      this.eventBus.publishEvent('knowledge.validated', {
        entryId,
        validator: validatorId,
        result: validationResult
      }, 'SharedKnowledgePool');

      return true;

    } catch (error) {
      this.logger.error('Failed to validate knowledge', {
        entryId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 获取知识统计
   */
  public getKnowledgeStatistics(): {
    totalEntries: number;
    entriesByCategory: Record<KnowledgeCategory, number>;
    averageRelevance: number;
    totalUsage: number;
    validationStatus: Record<ValidationStatus, number>;
    topContributors: Array<{ id: string; contributions: number }>;
  } {
    const totalEntries = this.knowledgeEntries.size;
    const entriesByCategory: Record<KnowledgeCategory, number> = {} as any;
    const validationStatus: Record<ValidationStatus, number> = {} as any;
    const contributorMap = new Map<string, number>();

    let totalRelevance = 0;
    let totalUsage = 0;

    for (const entry of this.knowledgeEntries.values()) {
      // 按类别统�?      entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1;
      
      // 按验证状态统�?      validationStatus[entry.validationStatus] = (validationStatus[entry.validationStatus] || 0) + 1;
      
      // 贡献者统�?      for (const contributor of entry.contributors) {
        contributorMap.set(contributor, (contributorMap.get(contributor) || 0) + 1);
      }
      
      totalRelevance += entry.relevanceScore;
      totalUsage += entry.usageCount;
    }

    const averageRelevance = totalEntries > 0 ? totalRelevance / totalEntries : 0;
    
    const topContributors = Array.from(contributorMap.entries())
      .map(([id, contributions]) => ({ id, contributions }))
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 10);

    return {
      totalEntries,
      entriesByCategory,
      averageRelevance,
      totalUsage,
      validationStatus,
      topContributors
    };
  }

  /**
   * 更新知识索引
   */
  private updateKnowledgeIndex(entry: KnowledgeEntry): void {
    // 提取关键�?    const keywords = this.extractKeywords(entry);
    
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      if (!this.knowledgeIndex.has(normalizedKeyword)) {
        this.knowledgeIndex.set(normalizedKeyword, new Set());
      }
      this.knowledgeIndex.get(normalizedKeyword)!.add(entry.id);
    }
  }

  /**
   * 提取关键�?   */
  private extractKeywords(entry: KnowledgeEntry): string[] {
    const keywords: string[] = [];
    
    // 从标签提�?    keywords.push(...entry.metadata.tags);
    
    // 从内容提取（简化实现）
    if (typeof entry.content === 'string') {
      const words = entry.content.toLowerCase().split(/\s+/);
      keywords.push(...words.filter(word => word.length > 3));
    }
    
    // 从类别提�?    keywords.push(entry.category);
    
    return [...new Set(keywords)];
  }

  /**
   * 检查访问权�?   */
  private checkAccess(entry: KnowledgeEntry, accessorId: string): boolean {
    switch (entry.metadata.accessLevel) {
      case 'private':
        return entry.contributors.includes(accessorId);
      case 'shared':
      case 'project':
      case 'global':
        return true;
      default:
        return false;
    }
  }

  /**
   * 记录访问日志
   */
  private logAccess(
    entryId: string,
    accessorId: string,
    operation: 'read' | 'write' | 'update' | 'delete'
  ): void {
    this.accessLog.push({
      entryId,
      accessorId,
      timestamp: new Date(),
      operation
    });

    // 限制日志大小
    if (this.accessLog.length > 10000) {
      this.accessLog.splice(0, 1000);
    }
  }

  /**
   * 分析使用模式
   */
  private analyzeUsagePatterns(context: any): KnowledgeInsight[] {
    const insights: KnowledgeInsight[] = [];
    
    // 分析高频使用的知�?    const highUsageEntries = Array.from(this.knowledgeEntries.values())
      .filter(entry => entry.usageCount > 10)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    if (highUsageEntries.length > 0) {
      insights.push({
        id: `usage-pattern-${Date.now()}`,
        title: 'High-Usage Knowledge Patterns',
        description: `Identified ${highUsageEntries.length} frequently accessed knowledge entries`,
        confidence: 85,
        supportingEvidence: highUsageEntries.map(e => `${e.category}: ${e.usageCount} uses`),
        relatedEntries: highUsageEntries.map(e => e.id),
        actionableRecommendations: [
          'Consider creating templates based on high-usage patterns',
          'Ensure high-usage knowledge is kept up-to-date'
        ]
      });
    }

    return insights;
  }

  /**
   * 分析知识缺口
   */
  private analyzeKnowledgeGaps(context: any): KnowledgeInsight[] {
    const insights: KnowledgeInsight[] = [];
    
    // 分析类别分布
    const categoryStats = this.getKnowledgeStatistics().entriesByCategory;
    const underrepresentedCategories = Object.entries(categoryStats)
      .filter(([_, count]) => count < 3)
      .map(([category, _]) => category);

    if (underrepresentedCategories.length > 0) {
      insights.push({
        id: `knowledge-gap-${Date.now()}`,
        title: 'Knowledge Coverage Gaps',
        description: `Identified gaps in ${underrepresentedCategories.length} knowledge categories`,
        confidence: 75,
        supportingEvidence: underrepresentedCategories.map(cat => `Low coverage in ${cat}`),
        relatedEntries: [],
        actionableRecommendations: [
          'Focus on collecting knowledge in underrepresented areas',
          'Encourage team members to document domain-specific expertise'
        ]
      });
    }

    return insights;
  }

  /**
   * 分析协作模式
   */
  private analyzeCollaborationPatterns(context: any): KnowledgeInsight[] {
    const insights: KnowledgeInsight[] = [];
    
    // 分析多贡献者条�?    const collaborativeEntries = Array.from(this.knowledgeEntries.values())
      .filter(entry => entry.contributors.length > 1);

    if (collaborativeEntries.length > 0) {
      insights.push({
        id: `collaboration-pattern-${Date.now()}`,
        title: 'Collaborative Knowledge Creation',
        description: `${collaborativeEntries.length} knowledge entries created collaboratively`,
        confidence: 80,
        supportingEvidence: [`${collaborativeEntries.length} multi-contributor entries`],
        relatedEntries: collaborativeEntries.map(e => e.id),
        actionableRecommendations: [
          'Encourage more collaborative knowledge creation',
          'Establish review processes for collaborative entries'
        ]
      });
    }

    return insights;
  }

  /**
   * 提取标签
   */
  private extractLabel(entry: KnowledgeEntry): string {
    if (typeof entry.content === 'string') {
      return entry.content.substring(0, 50) + '...';
    }
    return `${entry.category} knowledge`;
  }

  /**
   * 计算关系强度
   */
  private calculateRelationshipStrength(entryId1: string, entryId2: string): number {
    // 简化的关系强度计算
    const entry1 = this.knowledgeEntries.get(entryId1);
    const entry2 = this.knowledgeEntries.get(entryId2);
    
    if (!entry1 || !entry2) return 0;
    
    // 基于共同标签计算
    const commonTags = entry1.metadata.tags.filter(tag => 
      entry2.metadata.tags.includes(tag)
    );
    
    return Math.min(commonTags.length * 20, 100);
  }

  /**
   * 识别知识集群
   */
  private identifyKnowledgeClusters(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): KnowledgeCluster[] {
    const clusters: KnowledgeCluster[] = [];
    
    // 按类别分�?    const categoryGroups = new Map<KnowledgeCategory, string[]>();
    
    for (const node of nodes) {
      if (!categoryGroups.has(node.category)) {
        categoryGroups.set(node.category, []);
      }
      categoryGroups.get(node.category)!.push(node.id);
    }
    
    // 为每个类别创建集�?    for (const [category, nodeIds] of categoryGroups) {
      if (nodeIds.length > 1) {
        clusters.push({
          id: `cluster-${category}`,
          name: `${category} Knowledge Cluster`,
          nodes: nodeIds,
          centralConcept: category,
          coherence: this.calculateClusterCoherence(nodeIds, edges)
        });
      }
    }
    
    return clusters;
  }

  /**
   * 计算集群连贯�?   */
  private calculateClusterCoherence(nodeIds: string[], edges: KnowledgeEdge[]): number {
    const internalEdges = edges.filter(edge => 
      nodeIds.includes(edge.from) && nodeIds.includes(edge.to)
    );
    
    const maxPossibleEdges = nodeIds.length * (nodeIds.length - 1) / 2;
    return maxPossibleEdges > 0 ? (internalEdges.length / maxPossibleEdges) * 100 : 0;
  }

  /**
   * 初始化默认知�?   */
  private initializeDefaultKnowledge(): void {
    // 添加一些默认的知识条目
    const defaultKnowledge = [
      {
        content: 'MJOS团队协作最佳实践：明确角色分工，建立清晰的协作规则，定期进行团队回�?,
        category: 'best-practices' as KnowledgeCategory,
        tags: ['团队协作', '最佳实�?, 'MJOS']
      },
      {
        content: '前端开发技术栈：React + TypeScript + Vite，注重组件化和类型安�?,
        category: 'domain-expertise' as KnowledgeCategory,
        tags: ['前端开�?, 'React', 'TypeScript']
      },
      {
        content: '项目质量保证流程：代码审�?�?自动化测�?�?集成测试 �?用户验收测试',
        category: 'collaboration-patterns' as KnowledgeCategory,
        tags: ['质量保证', '测试流程', '协作模式']
      }
    ];

    for (const knowledge of defaultKnowledge) {
      this.addKnowledge(
        knowledge.content,
        { tags: knowledge.tags, importance: 7, accessLevel: 'shared' },
        knowledge.category,
        'system'
      ).catch(error => {
        this.logger.warn('Failed to add default knowledge', { error });
      });
    }
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听任务完成事件，自动提取知�?    this.eventBus.subscribeEvent('task.completed', async (event) => {
      const { roleId, taskDescription, outcome, lessons } = event.payload;
      
      if (lessons && lessons.length > 0) {
        for (const lesson of lessons) {
          await this.addKnowledge(
            lesson,
            { tags: ['经验教训', taskDescription], importance: 6, accessLevel: 'shared' },
            'lessons-learned',
            roleId
          ).catch(error => {
            this.logger.warn('Failed to auto-add lesson', { error });
          });
        }
      }
    });

    // 监听协作事件，记录协作模�?    this.eventBus.subscribeEvent('collaboration.completed', async (event) => {
      const { participants, pattern, effectiveness } = event.payload;
      
      await this.addKnowledge(
        `协作模式�?{pattern}，参与者：${participants.join(', ')}，效果：${effectiveness}%`,
        { tags: ['协作模式', ...participants], importance: 5, accessLevel: 'shared' },
        'collaboration-patterns',
        'system'
      ).catch(error => {
        this.logger.warn('Failed to record collaboration pattern', { error });
      });
    });
  }

  /**
   * 创建知识错误
   */
  private createKnowledgeError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const knowledgeError = new Error(`Knowledge ${operation} failed: ${message}`) as MJOSError;
    
    knowledgeError.code = 'KnowledgeError';
    knowledgeError.component = 'SharedKnowledgePool';
    knowledgeError.context = context;
    knowledgeError.recoverable = true;
    knowledgeError.timestamp = new Date();
    
    return knowledgeError;
  }
}
