/**
 * Enhanced Engram Memory System
 * 增强的Engram记忆系统 - 基于神经科学的记忆巩固和管理
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { EngramMemorySystem, Engram, EngramMetadata } from './EngramMemorySystem';

// 记忆类型枚举
export enum MemoryType {
  WORKING = 'working',      // 工作记忆 (0-30秒)
  SHORT_TERM = 'short_term', // 短期记忆 (30秒-24小时)
  LONG_TERM = 'long_term'   // 长期记忆 (24小时+)
}

// 记忆巩固状�?export enum ConsolidationStatus {
  FRESH = 'fresh',           // 新鲜记忆
  CONSOLIDATING = 'consolidating', // 巩固�?  CONSOLIDATED = 'consolidated',   // 已巩�?  RECONSOLIDATING = 'reconsolidating' // 重新巩固
}

// 增强的Engram接口
export interface EnhancedEngram extends Engram {
  memoryType: MemoryType;
  consolidationStatus: ConsolidationStatus;
  synapticStrength: number;
  rehearsalCount: number;
  lastRehearsed: Date;
  decayRate: number;
  associativeLinks: AssociativeLink[];
  neuralPattern: NeuralPattern;
}

// 关联链接
export interface AssociativeLink {
  targetEngramId: string;
  linkType: LinkType;
  strength: number;
  createdAt: Date;
  lastActivated: Date;
}

export enum LinkType {
  SEMANTIC = 'semantic',     // 语义关联
  TEMPORAL = 'temporal',     // 时间关联
  CAUSAL = 'causal',        // 因果关联
  SPATIAL = 'spatial',      // 空间关联
  EMOTIONAL = 'emotional'   // 情感关联
}

// 神经模式
export interface NeuralPattern {
  activationVector: number[];
  firingRate: number;
  synchrony: number;
  plasticity: number;
}

// LRU缓存节点
interface LRUNode {
  engramId: string;
  prev?: LRUNode;
  next?: LRUNode;
}

// LFU缓存�?interface LFUItem {
  engramId: string;
  frequency: number;
  lastAccessed: Date;
}

/**
 * 增强的Engram记忆系统�? */
export class EnhancedEngramMemorySystem extends EngramMemorySystem {
  private workingMemory = new Map<string, EnhancedEngram>();
  private shortTermMemory = new Map<string, EnhancedEngram>();
  private longTermMemory = new Map<string, EnhancedEngram>();
  
  // LRU缓存管理
  private lruHead?: LRUNode;
  private lruTail?: LRUNode;
  private lruMap = new Map<string, LRUNode>();
  
  // LFU缓存管理
  private lfuItems = new Map<string, LFUItem>();
  private frequencyGroups = new Map<number, Set<string>>();
  private minFrequency = 1;
  
  // 记忆容量限制
  private readonly WORKING_MEMORY_CAPACITY = 7; // 米勒定律�?±2
  private readonly SHORT_TERM_CAPACITY = 100;
  private readonly LONG_TERM_CAPACITY = 10000;
  
  // 时间阈值（毫秒�?  private readonly WORKING_TO_SHORT_THRESHOLD = 30 * 1000; // 30�?  private readonly SHORT_TO_LONG_THRESHOLD = 24 * 60 * 60 * 1000; // 24小时
  
  // 巩固和衰减参�?  private readonly CONSOLIDATION_THRESHOLD = 0.7;
  private readonly BASE_DECAY_RATE = 0.1;
  private readonly REHEARSAL_BOOST = 0.2;

  constructor(logger: Logger, eventBus: EventBus) {
    super(logger, eventBus);
    
    // 启动记忆维护定时�?    this.startMemoryMaintenance();
    
    this.logger.info('Enhanced Engram Memory System initialized', {
      workingCapacity: this.WORKING_MEMORY_CAPACITY,
      shortTermCapacity: this.SHORT_TERM_CAPACITY,
      longTermCapacity: this.LONG_TERM_CAPACITY
    });
  }

  /**
   * 存储增强的Engram
   */
  public async storeEnhancedEngram(
    content: any,
    metadata: EngramMetadata,
    neuralPattern?: Partial<NeuralPattern>
  ): Promise<string> {
    const engramId = await this.generateEngramId(content);
    
    const enhancedEngram: EnhancedEngram = {
      id: engramId,
      content,
      strength: metadata.emotionalValence || 0.5,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      contextualTags: metadata.contextualTags || [],
      associations: metadata.associations || [],
      
      // 增强属�?      memoryType: MemoryType.WORKING,
      consolidationStatus: ConsolidationStatus.FRESH,
      synapticStrength: 1.0,
      rehearsalCount: 0,
      lastRehearsed: new Date(),
      decayRate: this.BASE_DECAY_RATE,
      associativeLinks: [],
      neuralPattern: {
        activationVector: neuralPattern?.activationVector || this.generateActivationVector(),
        firingRate: neuralPattern?.firingRate || 0.5,
        synchrony: neuralPattern?.synchrony || 0.3,
        plasticity: neuralPattern?.plasticity || 0.8
      }
    };

    // 存储到工作记�?    await this.storeInWorkingMemory(enhancedEngram);
    
    // 建立关联链接
    await this.establishAssociativeLinks(enhancedEngram);
    
    this.logger.debug('Enhanced engram stored', {
      engramId,
      memoryType: enhancedEngram.memoryType,
      synapticStrength: enhancedEngram.synapticStrength
    });

    this.eventBus.publishEvent('memory.enhanced_engram_stored', {
      engramId,
      memoryType: enhancedEngram.memoryType,
      consolidationStatus: enhancedEngram.consolidationStatus
    }, 'EnhancedEngramMemorySystem');

    return engramId;
  }

  /**
   * 存储到工作记�?   */
  private async storeInWorkingMemory(engram: EnhancedEngram): Promise<void> {
    // 检查容量限�?    if (this.workingMemory.size >= this.WORKING_MEMORY_CAPACITY) {
      await this.evictFromWorkingMemory();
    }

    this.workingMemory.set(engram.id, engram);
    this.updateLRU(engram.id);
    this.updateLFU(engram.id);
  }

  /**
   * 从工作记忆中驱�?   */
  private async evictFromWorkingMemory(): Promise<void> {
    // 使用LRU策略选择驱逐目�?    const victimId = this.selectLRUVictim();
    if (victimId) {
      const victim = this.workingMemory.get(victimId);
      if (victim) {
        // 尝试转移到短期记�?        await this.promoteToShortTerm(victim);
        this.workingMemory.delete(victimId);
        this.removeLRU(victimId);
      }
    }
  }

  /**
   * 提升到短期记�?   */
  private async promoteToShortTerm(engram: EnhancedEngram): Promise<void> {
    // 检查短期记忆容�?    if (this.shortTermMemory.size >= this.SHORT_TERM_CAPACITY) {
      await this.evictFromShortTerm();
    }

    engram.memoryType = MemoryType.SHORT_TERM;
    engram.consolidationStatus = ConsolidationStatus.CONSOLIDATING;
    this.shortTermMemory.set(engram.id, engram);

    this.logger.debug('Engram promoted to short-term memory', {
      engramId: engram.id,
      synapticStrength: engram.synapticStrength
    });
  }

  /**
   * 从短期记忆中驱�?   */
  private async evictFromShortTerm(): Promise<void> {
    // 使用LFU策略选择驱逐目�?    const victimId = this.selectLFUVictim();
    if (victimId) {
      const victim = this.shortTermMemory.get(victimId);
      if (victim) {
        // 检查是否应该巩固到长期记忆
        if (victim.synapticStrength >= this.CONSOLIDATION_THRESHOLD) {
          await this.consolidateToLongTerm(victim);
        } else {
          // 记忆衰减，被遗忘
          this.logger.debug('Engram forgotten due to insufficient strength', {
            engramId: victim.id,
            synapticStrength: victim.synapticStrength
          });
        }
        this.shortTermMemory.delete(victimId);
        this.removeLFU(victimId);
      }
    }
  }

  /**
   * 巩固到长期记�?   */
  private async consolidateToLongTerm(engram: EnhancedEngram): Promise<void> {
    // 检查长期记忆容�?    if (this.longTermMemory.size >= this.LONG_TERM_CAPACITY) {
      await this.evictFromLongTerm();
    }

    engram.memoryType = MemoryType.LONG_TERM;
    engram.consolidationStatus = ConsolidationStatus.CONSOLIDATED;
    engram.decayRate *= 0.1; // 长期记忆衰减更慢
    this.longTermMemory.set(engram.id, engram);

    this.logger.info('Engram consolidated to long-term memory', {
      engramId: engram.id,
      synapticStrength: engram.synapticStrength,
      rehearsalCount: engram.rehearsalCount
    });

    this.eventBus.publishEvent('memory.engram_consolidated', {
      engramId: engram.id,
      finalStrength: engram.synapticStrength
    }, 'EnhancedEngramMemorySystem');
  }

  /**
   * 从长期记忆中驱�?   */
  private async evictFromLongTerm(): Promise<void> {
    // 找到最弱的记忆进行驱�?    let weakestEngram: EnhancedEngram | null = null;
    let weakestStrength = Infinity;

    for (const engram of this.longTermMemory.values()) {
      if (engram.synapticStrength < weakestStrength) {
        weakestStrength = engram.synapticStrength;
        weakestEngram = engram;
      }
    }

    if (weakestEngram) {
      this.longTermMemory.delete(weakestEngram.id);
      this.logger.debug('Engram evicted from long-term memory', {
        engramId: weakestEngram.id,
        synapticStrength: weakestEngram.synapticStrength
      });
    }
  }

  /**
   * 建立关联链接
   */
  private async establishAssociativeLinks(engram: EnhancedEngram): Promise<void> {
    // 在所有记忆层中寻找相关的Engram
    const allEngrams = [
      ...this.workingMemory.values(),
      ...this.shortTermMemory.values(),
      ...this.longTermMemory.values()
    ];

    for (const otherEngram of allEngrams) {
      if (otherEngram.id !== engram.id) {
        const linkStrength = await this.calculateAssociativeStrength(engram, otherEngram);
        
        if (linkStrength > 0.3) { // 关联阈�?          const linkType = this.determineLinkType(engram, otherEngram);
          
          const link: AssociativeLink = {
            targetEngramId: otherEngram.id,
            linkType,
            strength: linkStrength,
            createdAt: new Date(),
            lastActivated: new Date()
          };

          engram.associativeLinks.push(link);
        }
      }
    }
  }

  /**
   * 计算关联强度
   */
  private async calculateAssociativeStrength(
    engramA: EnhancedEngram,
    engramB: EnhancedEngram
  ): Promise<number> {
    let strength = 0;

    // 1. 语义相似度
    const semanticSimilarity = this.calculateSemanticSimilarity(
      engramA.neuralPattern.activationVector,
      engramB.neuralPattern.activationVector
    );
    strength += semanticSimilarity * 0.4;

    // 2. 时间接近�?    const timeDiff = Math.abs(engramA.createdAt.getTime() - engramB.createdAt.getTime());
    const timeProximity = Math.exp(-timeDiff / (1000 * 60 * 60)); // 1小时衰减
    strength += timeProximity * 0.3;

    // 3. 上下文重�?    const contextOverlap = this.calculateContextOverlap(engramA.contextualTags, engramB.contextualTags);
    strength += contextOverlap * 0.3;

    return Math.min(strength, 1.0);
  }

  /**
   * 计算语义相似�?   */
  private calculateSemanticSimilarity(vectorA: number[], vectorB: number[]): number {
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

    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
  }

  /**
   * 计算上下文重�?   */
  private calculateContextOverlap(tagsA: string[], tagsB: string[]): number {
    const setA = new Set(tagsA);
    const setB = new Set(tagsB);
    const intersection = new Set([...setA].filter(tag => setB.has(tag)));
    const union = new Set([...setA, ...setB]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 确定链接类型
   */
  private determineLinkType(engramA: EnhancedEngram, engramB: EnhancedEngram): LinkType {
    // 基于内容和上下文确定链接类型
    const timeDiff = Math.abs(engramA.createdAt.getTime() - engramB.createdAt.getTime());
    
    if (timeDiff < 60000) { // 1分钟�?      return LinkType.TEMPORAL;
    }
    
    // 检查因果关系关键词
    const contentA = JSON.stringify(engramA.content).toLowerCase();
    const contentB = JSON.stringify(engramB.content).toLowerCase();
    
    if (contentA.includes('because') || contentA.includes('result') || 
        contentB.includes('because') || contentB.includes('result')) {
      return LinkType.CAUSAL;
    }
    
    // 检查情感关键词
    const emotionalWords = ['happy', 'sad', 'angry', 'excited', 'frustrated'];
    const hasEmotion = emotionalWords.some(word => 
      contentA.includes(word) || contentB.includes(word)
    );
    
    if (hasEmotion) {
      return LinkType.EMOTIONAL;
    }
    
    return LinkType.SEMANTIC; // 默认语义关联
  }

  /**
   * 生成激活向�?   */
  private generateActivationVector(dimension: number = 128): number[] {
    const vector = new Array(dimension);
    for (let i = 0; i < dimension; i++) {
      vector[i] = Math.random() * 2 - 1; // [-1, 1]范围
    }
    return vector;
  }

  /**
   * LRU缓存管理
   */
  private updateLRU(engramId: string): void {
    const node = this.lruMap.get(engramId);

    if (node) {
      // 移动到头�?      this.moveToHead(node);
    } else {
      // 创建新节�?      const newNode: LRUNode = { engramId };
      this.lruMap.set(engramId, newNode);
      this.addToHead(newNode);
    }
  }

  private moveToHead(node: LRUNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private addToHead(node: LRUNode): void {
    node.prev = undefined;
    node.next = this.lruHead;

    if (this.lruHead) {
      this.lruHead.prev = node;
    }
    this.lruHead = node;

    if (!this.lruTail) {
      this.lruTail = node;
    }
  }

  private removeNode(node: LRUNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.lruHead = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.lruTail = node.prev;
    }
  }

  private selectLRUVictim(): string | null {
    return this.lruTail ? this.lruTail.engramId : null;
  }

  private removeLRU(engramId: string): void {
    const node = this.lruMap.get(engramId);
    if (node) {
      this.removeNode(node);
      this.lruMap.delete(engramId);
    }
  }

  /**
   * LFU缓存管理
   */
  private updateLFU(engramId: string): void {
    const item = this.lfuItems.get(engramId);

    if (item) {
      // 更新频率
      const oldFreq = item.frequency;
      const newFreq = oldFreq + 1;

      // 从旧频率组中移除
      const oldGroup = this.frequencyGroups.get(oldFreq);
      if (oldGroup) {
        oldGroup.delete(engramId);
        if (oldGroup.size === 0 && oldFreq === this.minFrequency) {
          this.minFrequency++;
        }
      }

      // 添加到新频率�?      item.frequency = newFreq;
      item.lastAccessed = new Date();

      if (!this.frequencyGroups.has(newFreq)) {
        this.frequencyGroups.set(newFreq, new Set());
      }
      this.frequencyGroups.get(newFreq)!.add(engramId);
    } else {
      // 创建新项
      const newItem: LFUItem = {
        engramId,
        frequency: 1,
        lastAccessed: new Date()
      };

      this.lfuItems.set(engramId, newItem);

      if (!this.frequencyGroups.has(1)) {
        this.frequencyGroups.set(1, new Set());
      }
      this.frequencyGroups.get(1)!.add(engramId);
      this.minFrequency = 1;
    }
  }

  private selectLFUVictim(): string | null {
    const minGroup = this.frequencyGroups.get(this.minFrequency);
    if (minGroup && minGroup.size > 0) {
      // 在最低频率组中选择最久未访问�?      let oldestId: string | null = null;
      let oldestTime = Date.now();

      for (const engramId of minGroup) {
        const item = this.lfuItems.get(engramId);
        if (item && item.lastAccessed.getTime() < oldestTime) {
          oldestTime = item.lastAccessed.getTime();
          oldestId = engramId;
        }
      }

      return oldestId;
    }
    return null;
  }

  private removeLFU(engramId: string): void {
    const item = this.lfuItems.get(engramId);
    if (item) {
      const group = this.frequencyGroups.get(item.frequency);
      if (group) {
        group.delete(engramId);
      }
      this.lfuItems.delete(engramId);
    }
  }

  /**
   * 启动记忆维护
   */
  private startMemoryMaintenance(): void {
    // 每分钟执行一次记忆维�?    setInterval(() => {
      this.performMemoryMaintenance();
    }, 60 * 1000);

    // 每小时执行一次记忆巩固检�?    setInterval(() => {
      this.checkMemoryConsolidation();
    }, 60 * 60 * 1000);
  }

  /**
   * 执行记忆维护
   */
  private async performMemoryMaintenance(): Promise<void> {
    const now = Date.now();

    // 1. 检查工作记忆到短期记忆的转�?    for (const [id, engram] of this.workingMemory) {
      const age = now - engram.createdAt.getTime();
      if (age > this.WORKING_TO_SHORT_THRESHOLD) {
        await this.promoteToShortTerm(engram);
        this.workingMemory.delete(id);
        this.removeLRU(id);
      }
    }

    // 2. 检查短期记忆到长期记忆的转�?    for (const [id, engram] of this.shortTermMemory) {
      const age = now - engram.createdAt.getTime();
      if (age > this.SHORT_TO_LONG_THRESHOLD) {
        if (engram.synapticStrength >= this.CONSOLIDATION_THRESHOLD) {
          await this.consolidateToLongTerm(engram);
        }
        this.shortTermMemory.delete(id);
        this.removeLFU(id);
      }
    }

    // 3. 应用记忆衰减
    await this.applyMemoryDecay();

    this.logger.debug('Memory maintenance completed', {
      workingMemorySize: this.workingMemory.size,
      shortTermMemorySize: this.shortTermMemory.size,
      longTermMemorySize: this.longTermMemory.size
    });
  }

  /**
   * 应用记忆衰减
   */
  private async applyMemoryDecay(): Promise<void> {
    const allMemories = [
      ...this.workingMemory.values(),
      ...this.shortTermMemory.values(),
      ...this.longTermMemory.values()
    ];

    for (const engram of allMemories) {
      const timeSinceLastAccess = Date.now() - engram.lastAccessed.getTime();
      const decayFactor = Math.exp(-engram.decayRate * timeSinceLastAccess / (1000 * 60 * 60)); // 小时为单�?
      engram.synapticStrength *= decayFactor;

      // 如果强度过低，标记为需要遗�?      if (engram.synapticStrength < 0.1) {
        this.logger.debug('Engram marked for forgetting due to decay', {
          engramId: engram.id,
          finalStrength: engram.synapticStrength
        });
      }
    }
  }

  /**
   * 检查记忆巩�?   */
  private async checkMemoryConsolidation(): Promise<void> {
    // 检查短期记忆中需要巩固的记忆
    for (const engram of this.shortTermMemory.values()) {
      if (engram.consolidationStatus === ConsolidationStatus.CONSOLIDATING) {
        // 基于访问频率和强度决定是否巩�?        const consolidationScore = this.calculateConsolidationScore(engram);

        if (consolidationScore > this.CONSOLIDATION_THRESHOLD) {
          engram.consolidationStatus = ConsolidationStatus.CONSOLIDATED;
          this.logger.debug('Engram consolidation completed', {
            engramId: engram.id,
            consolidationScore
          });
        }
      }
    }
  }

  /**
   * 计算巩固分数
   */
  private calculateConsolidationScore(engram: EnhancedEngram): number {
    let score = 0;

    // 1. 突触强度 (40%)
    score += engram.synapticStrength * 0.4;

    // 2. 访问频率 (30%)
    const accessFrequency = engram.accessCount / Math.max(1,
      (Date.now() - engram.createdAt.getTime()) / (1000 * 60 * 60)); // 每小时访问次�?    score += Math.min(accessFrequency, 1.0) * 0.3;

    // 3. 复述次数 (20%)
    score += Math.min(engram.rehearsalCount / 5, 1.0) * 0.2;

    // 4. 关联链接数量 (10%)
    score += Math.min(engram.associativeLinks.length / 10, 1.0) * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * 获取记忆统计信息
   */
  public getMemoryStatistics(): {
    workingMemoryCount: number;
    shortTermMemoryCount: number;
    longTermMemoryCount: number;
    totalAssociativeLinks: number;
    averageConsolidationScore: number;
    memoryDistribution: Record<MemoryType, number>;
  } {
    const totalLinks = [
      ...this.workingMemory.values(),
      ...this.shortTermMemory.values(),
      ...this.longTermMemory.values()
    ].reduce((sum, engram) => sum + engram.associativeLinks.length, 0);

    const shortTermEngrams = Array.from(this.shortTermMemory.values());
    const avgConsolidationScore = shortTermEngrams.length > 0
      ? shortTermEngrams.reduce((sum, engram) => sum + this.calculateConsolidationScore(engram), 0) / shortTermEngrams.length
      : 0;

    return {
      workingMemoryCount: this.workingMemory.size,
      shortTermMemoryCount: this.shortTermMemory.size,
      longTermMemoryCount: this.longTermMemory.size,
      totalAssociativeLinks: totalLinks,
      averageConsolidationScore: avgConsolidationScore,
      memoryDistribution: {
        [MemoryType.WORKING]: this.workingMemory.size,
        [MemoryType.SHORT_TERM]: this.shortTermMemory.size,
        [MemoryType.LONG_TERM]: this.longTermMemory.size
      }
    };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    super.destroy();

    this.workingMemory.clear();
    this.shortTermMemory.clear();
    this.longTermMemory.clear();
    this.lruMap.clear();
    this.lfuItems.clear();
    this.frequencyGroups.clear();

    this.logger.info('Enhanced Engram Memory System destroyed');
  }
}
