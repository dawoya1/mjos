/**
 * Engram Memory System
 * 基于记忆痕迹的高级记忆系�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { MemoryEntry, MJOSError } from './types/index';

export interface EngramTrace {
  id: string;
  content: any;
  strength: number; // 记忆强度 0-100
  frequency: number; // 访问频率
  recency: number; // 最近访问时间戳
  associations: Map<string, number>; // 关联记忆及强�?  semanticVector: number[]; // 语义向量
  emotionalValence: number; // 情感价�?-1�?
  contextualTags: string[]; // 上下文标�?  consolidationLevel: ConsolidationLevel; // 巩固级别
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  decayRate: number; // 遗忘衰减率
}

export type ConsolidationLevel = 
  | 'working' // 工作记忆
  | 'short-term' // 短期记忆
  | 'long-term' // 长期记忆
  | 'permanent'; // 永久记忆

export interface SemanticNetwork {
  nodes: Map<string, SemanticNode>;
  edges: Map<string, SemanticEdge>;
  clusters: Map<string, SemanticCluster>;
  pathCache: Map<string, SemanticPath>;
}

export interface SemanticNode {
  id: string;
  engramId: string;
  concept: string;
  weight: number;
  centrality: number; // 中心性度�?  embeddings: number[];
  lastUpdated: Date;
}

export interface SemanticEdge {
  id: string;
  sourceId: string;
  targetId: string;
  weight: number;
  type: EdgeType;
  confidence: number;
  createdAt: Date;
}

export type EdgeType = 
  | 'causal' // 因果关系
  | 'temporal' // 时间关系
  | 'spatial' // 空间关系
  | 'semantic' // 语义关系
  | 'associative' // 联想关系
  | 'hierarchical'; // 层次关系

export interface SemanticCluster {
  id: string;
  nodeIds: string[];
  centroid: number[];
  coherence: number; // 聚类一致�?  topic: string;
  keywords: string[];
}

export interface SemanticPath {
  sourceId: string;
  targetId: string;
  path: string[];
  strength: number;
  hops: number;
}

export interface MemoryConsolidationConfig {
  workingMemoryCapacity: number; // 工作记忆容量
  shortTermThreshold: number; // 短期记忆阈�?  longTermThreshold: number; // 长期记忆阈�?  permanentThreshold: number; // 永久记忆阈�?  consolidationInterval: number; // 巩固间隔(ms)
  decayFactor: number; // 衰减因子
  strengthenFactor: number; // 强化因子
}

export interface RetrievalContext {
  query: string;
  semanticVector?: number[];
  contextTags?: string[];
  emotionalState?: number;
  timeWindow?: { start: Date; end: Date };
  associationDepth?: number;
  minStrength?: number;
}

export interface RetrievalResult {
  engrams: EngramTrace[];
  semanticPaths: SemanticPath[];
  confidence: number;
  retrievalTime: number;
  associatedConcepts: string[];
}

/**
 * Engram记忆系统�? * 基于神经科学的记忆痕迹理论实现高级记忆管�? */
export class EngramMemorySystem {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly config: MemoryConsolidationConfig;
  
  private engrams = new Map<string, EngramTrace>();
  private semanticNetwork: SemanticNetwork;
  private consolidationTimer?: NodeJS.Timeout;
  private accessHistory: Array<{ engramId: string; timestamp: Date; context: any }> = [];

  constructor(
    logger: Logger,
    eventBus: EventBus,
    config: Partial<MemoryConsolidationConfig> = {}
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.config = {
      workingMemoryCapacity: 7, // Miller's magic number
      shortTermThreshold: 30,
      longTermThreshold: 70,
      permanentThreshold: 90,
      consolidationInterval: 300000, // 5分钟
      decayFactor: 0.95,
      strengthenFactor: 1.1,
      ...config
    };
    
    this.semanticNetwork = {
      nodes: new Map(),
      edges: new Map(),
      clusters: new Map(),
      pathCache: new Map()
    };
    
    this.startConsolidationProcess();
    this.setupEventListeners();
    
    this.logger.info('Engram Memory System initialized', {
      config: this.config
    });
  }

  /**
   * 存储记忆痕迹
   */
  public async storeEngram(
    content: any,
    context: {
      emotionalValence?: number;
      contextualTags?: string[];
      associations?: string[];
    } = {}
  ): Promise<string> {
    try {
      const engramId = `engram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 生成语义向量
      const semanticVector = await this.generateSemanticVector(content);
      
      // 创建记忆痕迹
      const engram: EngramTrace = {
        id: engramId,
        content,
        strength: 50, // 初始强度
        frequency: 1,
        recency: Date.now(),
        associations: new Map(),
        semanticVector,
        emotionalValence: context.emotionalValence || 0,
        contextualTags: context.contextualTags || [],
        consolidationLevel: 'working',
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1,
        decayRate: 0.1
      };

      this.engrams.set(engramId, engram);

      // 更新语义网络
      await this.updateSemanticNetwork(engram);

      // 建立关联
      if (context.associations) {
        await this.createAssociations(engramId, context.associations);
      }

      this.logger.debug('Engram stored', {
        engramId,
        consolidationLevel: engram.consolidationLevel,
        strength: engram.strength
      });

      this.eventBus.publishEvent('engram.stored', {
        engramId,
        engram
      }, 'EngramMemorySystem');

      return engramId;

    } catch (error) {
      this.logger.error('Failed to store engram', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 检索记忆痕�?   */
  public async retrieveEngrams(context: RetrievalContext): Promise<RetrievalResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Retrieving engrams', {
        query: context.query,
        contextTags: context.contextTags,
        minStrength: context.minStrength
      });

      // 生成查询向量
      const queryVector = context.semanticVector || 
        await this.generateSemanticVector(context.query);

      // 多维度检�?      let candidates = Array.from(this.engrams.values());

      // 语义相似度过�?      candidates = candidates.filter(engram => {
        const similarity = this.calculateCosineSimilarity(queryVector, engram.semanticVector);
        return similarity > 0.3; // 相似度阈�?      });

      // 强度过滤
      if (context.minStrength) {
        candidates = candidates.filter(engram => engram.strength >= context.minStrength);
      }

      // 上下文标签过滤
      if (context.contextTags && context.contextTags.length > 0) {
        candidates = candidates.filter(engram => 
          context.contextTags!.some(tag => engram.contextualTags.includes(tag))
        );
      }

      // 时间窗口过滤
      if (context.timeWindow) {
        candidates = candidates.filter(engram => 
          engram.createdAt >= context.timeWindow!.start &&
          engram.createdAt <= context.timeWindow!.end
        );
      }

      // 排序：综合考虑相似度、强度、新近度
      candidates.sort((a, b) => {
        const scoreA = this.calculateRetrievalScore(a, queryVector, context);
        const scoreB = this.calculateRetrievalScore(b, queryVector, context);
        return scoreB - scoreA;
      });

      // 限制结果数量
      const maxResults = 20;
      const selectedEngrams = candidates.slice(0, maxResults);

      // 查找语义路径
      const semanticPaths = await this.findSemanticPaths(
        selectedEngrams.map(e => e.id),
        context.associationDepth || 2
      );

      // 提取关联概念
      const associatedConcepts = this.extractAssociatedConcepts(selectedEngrams);

      // 更新访问记录
      for (const engram of selectedEngrams) {
        await this.recordAccess(engram.id, context);
      }

      const retrievalTime = Date.now() - startTime;
      const confidence = this.calculateRetrievalConfidence(selectedEngrams, context);

      const result: RetrievalResult = {
        engrams: selectedEngrams,
        semanticPaths,
        confidence,
        retrievalTime,
        associatedConcepts
      };

      this.logger.info('Engrams retrieved', {
        resultCount: selectedEngrams.length,
        retrievalTime,
        confidence
      });

      this.eventBus.publishEvent('engram.retrieved', {
        context,
        result
      }, 'EngramMemorySystem');

      return result;

    } catch (error) {
      this.logger.error('Failed to retrieve engrams', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 强化记忆痕迹
   */
  public async strengthenEngram(engramId: string, factor: number = 1.1): Promise<boolean> {
    try {
      const engram = this.engrams.get(engramId);
      if (!engram) {
        return false;
      }

      const oldStrength = engram.strength;
      engram.strength = Math.min(100, engram.strength * factor);
      engram.lastAccessed = new Date();
      engram.accessCount += 1;

      // 检查是否需要提升巩固级别
      await this.checkConsolidationPromotion(engram);

      this.logger.debug('Engram strengthened', {
        engramId,
        oldStrength,
        newStrength: engram.strength,
        consolidationLevel: engram.consolidationLevel
      });

      this.eventBus.publishEvent('engram.strengthened', {
        engramId,
        oldStrength,
        newStrength: engram.strength
      }, 'EngramMemorySystem');

      return true;

    } catch (error) {
      this.logger.error('Failed to strengthen engram', {
        engramId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 生成语义向量
   */
  private async generateSemanticVector(content: any): Promise<number[]> {
    // 简化的语义向量生成
    // 实际实现中应该使用预训练的嵌入模�?    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const words = text.toLowerCase().split(/\s+/);
    
    // 创建300维向量（简化实现）
    const vector = new Array(300).fill(0);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      
      for (let j = 0; j < 300; j++) {
        vector[j] += Math.sin(hash + j) * 0.1;
      }
    }
    
    // 归一�?    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  /**
   * 更新语义网络
   */
  private async updateSemanticNetwork(engram: EngramTrace): Promise<void> {
    // 创建语义节点
    const nodeId = `node-${engram.id}`;
    const concept = this.extractMainConcept(engram.content);
    
    const node: SemanticNode = {
      id: nodeId,
      engramId: engram.id,
      concept,
      weight: engram.strength,
      centrality: 0,
      embeddings: engram.semanticVector,
      lastUpdated: new Date()
    };
    
    this.semanticNetwork.nodes.set(nodeId, node);

    // 查找相似节点并创建边
    for (const [existingNodeId, existingNode] of this.semanticNetwork.nodes) {
      if (existingNodeId === nodeId) continue;
      
      const similarity = this.calculateCosineSimilarity(
        node.embeddings,
        existingNode.embeddings
      );
      
      if (similarity > 0.5) { // 相似度阈�?        const edgeId = `edge-${nodeId}-${existingNodeId}`;
        const edge: SemanticEdge = {
          id: edgeId,
          sourceId: nodeId,
          targetId: existingNodeId,
          weight: similarity,
          type: 'semantic',
          confidence: similarity,
          createdAt: new Date()
        };
        
        this.semanticNetwork.edges.set(edgeId, edge);
      }
    }

    // 更新聚类
    await this.updateSemanticClusters();
  }

  /**
   * 计算余弦相似�?   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * 计算检索分�?   */
  private calculateRetrievalScore(
    engram: EngramTrace,
    queryVector: number[],
    context: RetrievalContext
  ): number {
    // 语义相似�?(40%)
    const semanticSimilarity = this.calculateCosineSimilarity(
      queryVector,
      engram.semanticVector
    );
    
    // 记忆强度 (30%)
    const strengthScore = engram.strength / 100;
    
    // 新近�?(20%)
    const recencyScore = Math.exp(-(Date.now() - engram.recency) / (24 * 60 * 60 * 1000));
    
    // 频率 (10%)
    const frequencyScore = Math.min(engram.frequency / 10, 1);
    
    return (
      semanticSimilarity * 0.4 +
      strengthScore * 0.3 +
      recencyScore * 0.2 +
      frequencyScore * 0.1
    );
  }

  /**
   * 记录访问
   */
  private async recordAccess(engramId: string, context: any): Promise<void> {
    const engram = this.engrams.get(engramId);
    if (!engram) return;

    engram.lastAccessed = new Date();
    engram.accessCount += 1;
    engram.frequency += 1;
    engram.recency = Date.now();

    // 轻微强化
    await this.strengthenEngram(engramId, 1.05);

    // 记录访问历史
    this.accessHistory.push({
      engramId,
      timestamp: new Date(),
      context
    });

    // 限制历史记录大小
    if (this.accessHistory.length > 10000) {
      this.accessHistory.splice(0, 1000);
    }
  }

  /**
   * 启动巩固过程
   */
  private startConsolidationProcess(): void {
    this.consolidationTimer = setInterval(() => {
      this.performMemoryConsolidation();
    }, this.config.consolidationInterval);

    this.logger.debug('Memory consolidation process started');
  }

  /**
   * 执行记忆巩固
   */
  private async performMemoryConsolidation(): Promise<void> {
    try {
      this.logger.debug('Performing memory consolidation');

      const engrams = Array.from(this.engrams.values());
      let consolidatedCount = 0;
      let decayedCount = 0;

      for (const engram of engrams) {
        // 应用衰减
        const timeSinceAccess = Date.now() - engram.lastAccessed.getTime();
        const decayAmount = engram.decayRate * (timeSinceAccess / (24 * 60 * 60 * 1000));
        engram.strength = Math.max(0, engram.strength - decayAmount);

        // 检查是否需要删除
        if (engram.strength < 5 && engram.consolidationLevel === 'working') {
          this.engrams.delete(engram.id);
          decayedCount++;
          continue;
        }

        // 检查巩固提升
        const promoted = await this.checkConsolidationPromotion(engram);
        if (promoted) {
          consolidatedCount++;
        }
      }

      // 管理工作记忆容量
      await this.manageWorkingMemoryCapacity();

      this.logger.info('Memory consolidation completed', {
        totalEngrams: this.engrams.size,
        consolidatedCount,
        decayedCount
      });

      this.eventBus.publishEvent('memory.consolidated', {
        totalEngrams: this.engrams.size,
        consolidatedCount,
        decayedCount
      }, 'EngramMemorySystem');

    } catch (error) {
      this.logger.error('Memory consolidation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 检查巩固提升
   */
  private async checkConsolidationPromotion(engram: EngramTrace): Promise<boolean> {
    const oldLevel = engram.consolidationLevel;
    let newLevel = oldLevel;

    if (engram.strength >= this.config.permanentThreshold) {
      newLevel = 'permanent';
    } else if (engram.strength >= this.config.longTermThreshold) {
      newLevel = 'long-term';
    } else if (engram.strength >= this.config.shortTermThreshold) {
      newLevel = 'short-term';
    }

    if (newLevel !== oldLevel) {
      engram.consolidationLevel = newLevel;
      
      this.logger.debug('Engram consolidation promoted', {
        engramId: engram.id,
        oldLevel,
        newLevel,
        strength: engram.strength
      });

      this.eventBus.publishEvent('engram.consolidated', {
        engramId: engram.id,
        oldLevel,
        newLevel
      }, 'EngramMemorySystem');

      return true;
    }

    return false;
  }

  /**
   * 管理工作记忆容量
   */
  private async manageWorkingMemoryCapacity(): Promise<void> {
    const workingMemoryEngrams = Array.from(this.engrams.values())
      .filter(engram => engram.consolidationLevel === 'working')
      .sort((a, b) => a.strength - b.strength); // 按强度升序排�?
    if (workingMemoryEngrams.length > this.config.workingMemoryCapacity) {
      const excessCount = workingMemoryEngrams.length - this.config.workingMemoryCapacity;
      
      for (let i = 0; i < excessCount; i++) {
        const weakestEngram = workingMemoryEngrams[i];
        this.engrams.delete(weakestEngram.id);
        
        this.logger.debug('Weak working memory engram removed', {
          engramId: weakestEngram.id,
          strength: weakestEngram.strength
        });
      }
    }
  }

  /**
   * 简单哈希函�?   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * 提取主要概念
   */
  private extractMainConcept(content: any): string {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const words = text.toLowerCase().split(/\s+/);
    
    // 简化的关键词提�?    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const keywords = words.filter(word => !stopWords.has(word) && word.length > 2);
    
    return keywords.slice(0, 3).join(' ') || 'unknown';
  }

  /**
   * 创建关联
   */
  private async createAssociations(engramId: string, associationIds: string[]): Promise<void> {
    const engram = this.engrams.get(engramId);
    if (!engram) return;

    for (const associationId of associationIds) {
      const associatedEngram = this.engrams.get(associationId);
      if (associatedEngram) {
        const similarity = this.calculateCosineSimilarity(
          engram.semanticVector,
          associatedEngram.semanticVector
        );
        
        engram.associations.set(associationId, similarity);
        associatedEngram.associations.set(engramId, similarity);
      }
    }
  }

  /**
   * 查找语义路径
   */
  private async findSemanticPaths(
    engramIds: string[],
    maxDepth: number
  ): Promise<SemanticPath[]> {
    const paths: SemanticPath[] = [];
    
    // 简化的路径查找实现
    for (let i = 0; i < engramIds.length; i++) {
      for (let j = i + 1; j < engramIds.length; j++) {
        const sourceId = engramIds[i];
        const targetId = engramIds[j];
        
        const path = await this.findShortestPath(sourceId, targetId, maxDepth);
        if (path) {
          paths.push(path);
        }
      }
    }
    
    return paths;
  }

  /**
   * 查找最短路�?   */
  private async findShortestPath(
    sourceId: string,
    targetId: string,
    maxDepth: number
  ): Promise<SemanticPath | null> {
    // 简化的BFS路径查找
    const sourceEngram = this.engrams.get(sourceId);
    const targetEngram = this.engrams.get(targetId);
    
    if (!sourceEngram || !targetEngram) return null;
    
    // 直接关联检�?    if (sourceEngram.associations.has(targetId)) {
      return {
        sourceId,
        targetId,
        path: [sourceId, targetId],
        strength: sourceEngram.associations.get(targetId)!,
        hops: 1
      };
    }
    
    // 简化实现：返回null表示未找到路�?    return null;
  }

  /**
   * 提取关联概念
   */
  private extractAssociatedConcepts(engrams: EngramTrace[]): string[] {
    const concepts = new Set<string>();
    
    for (const engram of engrams) {
      for (const tag of engram.contextualTags) {
        concepts.add(tag);
      }
      
      const mainConcept = this.extractMainConcept(engram.content);
      concepts.add(mainConcept);
    }
    
    return Array.from(concepts);
  }

  /**
   * 计算检索置信度
   */
  private calculateRetrievalConfidence(
    engrams: EngramTrace[],
    context: RetrievalContext
  ): number {
    if (engrams.length === 0) return 0;
    
    const avgStrength = engrams.reduce((sum, e) => sum + e.strength, 0) / engrams.length;
    const avgRecency = engrams.reduce((sum, e) => sum + e.recency, 0) / engrams.length;
    const currentTime = Date.now();
    const recencyScore = Math.exp(-(currentTime - avgRecency) / (24 * 60 * 60 * 1000));
    
    return (avgStrength / 100) * 0.7 + recencyScore * 0.3;
  }

  /**
   * 更新语义聚类
   */
  private async updateSemanticClusters(): Promise<void> {
    // 简化的聚类更新实现
    // 实际实现中应该使用更复杂的聚类算�?    this.logger.debug('Updating semantic clusters');
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('memory.access_requested', async (event) => {
      const { query, context } = event.payload;
      await this.retrieveEngrams({ query, ...context });
    });

    this.eventBus.subscribeEvent('memory.strengthen_requested', async (event) => {
      const { engramId, factor } = event.payload;
      await this.strengthenEngram(engramId, factor);
    });
  }

  /**
   * 获取系统统计
   */
  public getStatistics(): {
    totalEngrams: number;
    consolidationLevels: Record<ConsolidationLevel, number>;
    averageStrength: number;
    semanticNetworkSize: { nodes: number; edges: number; clusters: number };
    accessHistorySize: number;
  } {
    const engrams = Array.from(this.engrams.values());
    const consolidationLevels: Record<ConsolidationLevel, number> = {
      'working': 0,
      'short-term': 0,
      'long-term': 0,
      'permanent': 0
    };

    let totalStrength = 0;
    for (const engram of engrams) {
      consolidationLevels[engram.consolidationLevel]++;
      totalStrength += engram.strength;
    }

    return {
      totalEngrams: engrams.length,
      consolidationLevels,
      averageStrength: engrams.length > 0 ? totalStrength / engrams.length : 0,
      semanticNetworkSize: {
        nodes: this.semanticNetwork.nodes.size,
        edges: this.semanticNetwork.edges.size,
        clusters: this.semanticNetwork.clusters.size
      },
      accessHistorySize: this.accessHistory.length
    };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
      this.consolidationTimer = undefined;
    }

    this.engrams.clear();
    this.semanticNetwork.nodes.clear();
    this.semanticNetwork.edges.clear();
    this.semanticNetwork.clusters.clear();
    this.semanticNetwork.pathCache.clear();
    this.accessHistory = [];

    this.logger.info('Engram Memory System destroyed');
  }
}
