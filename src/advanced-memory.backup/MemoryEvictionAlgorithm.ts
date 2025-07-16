/**
 * Memory Eviction Algorithm
 * 记忆淘汰算法 - LRU/LFU与强度评分的混合算法
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { EngramTrace, ConsolidationLevel } from './EngramMemorySystem';

export interface EvictionPolicy {
  algorithm: EvictionAlgorithm;
  capacityLimits: CapacityLimits;
  strengthThresholds: StrengthThresholds;
  timeDecayFactors: TimeDecayFactors;
  protectionRules: ProtectionRule[];
}

export type EvictionAlgorithm = 'LRU' | 'LFU' | 'HYBRID' | 'STRENGTH_BASED' | 'ADAPTIVE';

export interface CapacityLimits {
  working: number;
  shortTerm: number;
  longTerm: number;
  permanent: number;
  total: number;
}

export interface StrengthThresholds {
  evictionThreshold: number; // 低于此强度的记忆可被淘汰
  protectionThreshold: number; // 高于此强度的记忆受保�?  promotionThreshold: number; // 高于此强度的记忆可被提升
  criticalThreshold: number; // 关键记忆阈�?}

export interface TimeDecayFactors {
  recencyWeight: number; // 新近度权�?  frequencyWeight: number; // 频率权重
  strengthWeight: number; // 强度权重
  emotionalWeight: number; // 情感权重
  contextualWeight: number; // 上下文权�?}

export interface ProtectionRule {
  id: string;
  name: string;
  condition: (engram: EngramTrace) => boolean;
  priority: number;
  description: string;
}

export interface EvictionCandidate {
  engramId: string;
  engram: EngramTrace;
  evictionScore: number;
  reason: EvictionReason;
  protectedBy?: string[];
}

export type EvictionReason = 
  | 'low_strength' 
  | 'low_frequency' 
  | 'old_access' 
  | 'capacity_limit' 
  | 'decay_threshold' 
  | 'redundancy';

export interface EvictionResult {
  evictedCount: number;
  evictedEngrams: string[];
  protectedCount: number;
  capacityUtilization: Record<ConsolidationLevel, number>;
  evictionReasons: Record<EvictionReason, number>;
}

export interface MemoryPressure {
  level: PressureLevel;
  utilizationRate: number;
  growthRate: number;
  fragmentationRate: number;
  recommendations: string[];
}

export type PressureLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * 记忆淘汰算法�? * 实现多种淘汰策略的智能记忆管�? */
export class MemoryEvictionAlgorithm {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly policy: EvictionPolicy;
  
  private accessHistory = new Map<string, number[]>(); // engramId -> access timestamps
  private frequencyCounter = new Map<string, number>(); // engramId -> access count
  private strengthHistory = new Map<string, number[]>(); // engramId -> strength history
  private evictionHistory: Array<{
    timestamp: Date;
    engramId: string;
    reason: EvictionReason;
    score: number;
  }> = [];

  constructor(
    logger: Logger,
    eventBus: EventBus,
    policy: Partial<EvictionPolicy> = {}
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.policy = {
      algorithm: 'HYBRID',
      capacityLimits: {
        working: 7,
        shortTerm: 50,
        longTerm: 500,
        permanent: 5000,
        total: 10000
      },
      strengthThresholds: {
        evictionThreshold: 10,
        protectionThreshold: 80,
        promotionThreshold: 70,
        criticalThreshold: 95
      },
      timeDecayFactors: {
        recencyWeight: 0.3,
        frequencyWeight: 0.2,
        strengthWeight: 0.4,
        emotionalWeight: 0.05,
        contextualWeight: 0.05
      },
      protectionRules: [],
      ...policy
    };
    
    this.initializeProtectionRules();
    this.setupEventListeners();
    
    this.logger.info('Memory Eviction Algorithm initialized', {
      algorithm: this.policy.algorithm,
      capacityLimits: this.policy.capacityLimits
    });
  }

  /**
   * 执行记忆淘汰
   */
  public async performEviction(
    engrams: Map<string, EngramTrace>,
    targetReduction?: number
  ): Promise<EvictionResult> {
    try {
      this.logger.debug('Starting memory eviction', {
        totalEngrams: engrams.size,
        algorithm: this.policy.algorithm,
        targetReduction
      });

      // 分析记忆压力
      const memoryPressure = this.analyzeMemoryPressure(engrams);
      
      // 生成淘汰候�?      const candidates = await this.generateEvictionCandidates(engrams);
      
      // 应用保护规则
      const protectedCandidates = this.applyProtectionRules(candidates);
      
      // 选择要淘汰的记忆
      const toEvict = this.selectEvictionTargets(
        protectedCandidates,
        targetReduction || this.calculateTargetReduction(engrams, memoryPressure)
      );

      // 执行淘汰
      const evictionResult = await this.executeEviction(engrams, toEvict);

      // 记录淘汰历史
      this.recordEvictionHistory(toEvict);

      // 更新统计信息
      this.updateEvictionStatistics(evictionResult);

      this.logger.info('Memory eviction completed', {
        evictedCount: evictionResult.evictedCount,
        protectedCount: evictionResult.protectedCount,
        memoryPressure: memoryPressure.level
      });

      this.eventBus.publishEvent('memory.eviction_completed', {
        result: evictionResult,
        memoryPressure
      }, 'MemoryEvictionAlgorithm');

      return evictionResult;

    } catch (error) {
      this.logger.error('Memory eviction failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 记录访问
   */
  public recordAccess(engramId: string, timestamp: number = Date.now()): void {
    // 更新访问历史
    if (!this.accessHistory.has(engramId)) {
      this.accessHistory.set(engramId, []);
    }
    
    const history = this.accessHistory.get(engramId)!;
    history.push(timestamp);
    
    // 限制历史记录长度
    if (history.length > 100) {
      history.splice(0, 50);
    }

    // 更新频率计数
    this.frequencyCounter.set(engramId, (this.frequencyCounter.get(engramId) || 0) + 1);
  }

  /**
   * 记录强度变化
   */
  public recordStrengthChange(engramId: string, strength: number): void {
    if (!this.strengthHistory.has(engramId)) {
      this.strengthHistory.set(engramId, []);
    }
    
    const history = this.strengthHistory.get(engramId)!;
    history.push(strength);
    
    // 限制历史记录长度
    if (history.length > 50) {
      history.splice(0, 25);
    }
  }

  /**
   * 分析记忆压力
   */
  private analyzeMemoryPressure(engrams: Map<string, EngramTrace>): MemoryPressure {
    const totalCapacity = this.policy.capacityLimits.total;
    const currentSize = engrams.size;
    const utilizationRate = currentSize / totalCapacity;

    // 计算各级别的利用�?    const levelCounts: Record<ConsolidationLevel, number> = {
      'working': 0,
      'short-term': 0,
      'long-term': 0,
      'permanent': 0
    };

    for (const engram of engrams.values()) {
      levelCounts[engram.consolidationLevel]++;
    }

    // 检查是否超出各级别限制
    const workingPressure = levelCounts.working / this.policy.capacityLimits.working;
    const shortTermPressure = levelCounts['short-term'] / this.policy.capacityLimits.shortTerm;
    const longTermPressure = levelCounts['long-term'] / this.policy.capacityLimits.longTerm;

    const maxPressure = Math.max(utilizationRate, workingPressure, shortTermPressure, longTermPressure);

    let level: PressureLevel;
    if (maxPressure >= 0.95) level = 'critical';
    else if (maxPressure >= 0.8) level = 'high';
    else if (maxPressure >= 0.6) level = 'medium';
    else level = 'low';

    const recommendations: string[] = [];
    if (workingPressure > 0.8) {
      recommendations.push('Promote working memory to short-term');
    }
    if (shortTermPressure > 0.8) {
      recommendations.push('Consolidate short-term memory to long-term');
    }
    if (utilizationRate > 0.9) {
      recommendations.push('Aggressive eviction of weak memories');
    }

    return {
      level,
      utilizationRate,
      growthRate: 0, // 简化实�?      fragmentationRate: 0, // 简化实�?      recommendations
    };
  }

  /**
   * 生成淘汰候�?   */
  private async generateEvictionCandidates(
    engrams: Map<string, EngramTrace>
  ): Promise<EvictionCandidate[]> {
    const candidates: EvictionCandidate[] = [];

    for (const [engramId, engram] of engrams) {
      const score = await this.calculateEvictionScore(engramId, engram);
      const reason = this.determineEvictionReason(engram, score);

      candidates.push({
        engramId,
        engram,
        evictionScore: score,
        reason
      });
    }

    // 按淘汰分数排序（分数越高越容易被淘汰�?    candidates.sort((a, b) => b.evictionScore - a.evictionScore);

    return candidates;
  }

  /**
   * 计算淘汰分数
   */
  private async calculateEvictionScore(engramId: string, engram: EngramTrace): Promise<number> {
    const factors = this.policy.timeDecayFactors;
    let score = 0;

    // 强度因子（强度越低，分数越高�?    const strengthScore = (100 - engram.strength) / 100;
    score += strengthScore * factors.strengthWeight;

    // 新近度因子（越久未访问，分数越高�?    const timeSinceAccess = Date.now() - engram.lastAccessed.getTime();
    const recencyScore = Math.min(timeSinceAccess / (7 * 24 * 60 * 60 * 1000), 1); // 7天为满分
    score += recencyScore * factors.recencyWeight;

    // 频率因子（访问频率越低，分数越高�?    const frequency = this.frequencyCounter.get(engramId) || 1;
    const frequencyScore = Math.max(0, 1 - Math.log(frequency) / 10);
    score += frequencyScore * factors.frequencyWeight;

    // 情感因子（负面情感记忆更容易被淘汰）
    const emotionalScore = engram.emotionalValence < 0 ? Math.abs(engram.emotionalValence) : 0;
    score += emotionalScore * factors.emotionalWeight;

    // 上下文因子（缺乏上下文的记忆更容易被淘汰�?    const contextualScore = engram.contextualTags.length === 0 ? 1 : 0;
    score += contextualScore * factors.contextualWeight;

    // 算法特定调整
    switch (this.policy.algorithm) {
      case 'LRU':
        score = recencyScore;
        break;
      case 'LFU':
        score = frequencyScore;
        break;
      case 'STRENGTH_BASED':
        score = strengthScore;
        break;
      case 'ADAPTIVE':
        score = await this.calculateAdaptiveScore(engramId, engram);
        break;
    }

    return Math.min(score, 1);
  }

  /**
   * 计算自适应分数
   */
  private async calculateAdaptiveScore(engramId: string, engram: EngramTrace): Promise<number> {
    // 基于历史淘汰效果动态调整权�?    const baseScore = await this.calculateEvictionScore(engramId, engram);
    
    // 分析强度趋势
    const strengthHistory = this.strengthHistory.get(engramId) || [];
    let trendFactor = 0;
    
    if (strengthHistory.length >= 2) {
      const recent = strengthHistory.slice(-5);
      const trend = recent[recent.length - 1] - recent[0];
      trendFactor = trend < 0 ? 0.2 : -0.1; // 下降趋势增加淘汰分数
    }

    return Math.min(baseScore + trendFactor, 1);
  }

  /**
   * 确定淘汰原因
   */
  private determineEvictionReason(engram: EngramTrace, score: number): EvictionReason {
    if (engram.strength < this.policy.strengthThresholds.evictionThreshold) {
      return 'low_strength';
    }
    
    const frequency = this.frequencyCounter.get(engram.id) || 1;
    if (frequency < 2) {
      return 'low_frequency';
    }
    
    const timeSinceAccess = Date.now() - engram.lastAccessed.getTime();
    if (timeSinceAccess > 30 * 24 * 60 * 60 * 1000) { // 30�?      return 'old_access';
    }
    
    if (score > 0.8) {
      return 'decay_threshold';
    }
    
    return 'capacity_limit';
  }

  /**
   * 应用保护规则
   */
  private applyProtectionRules(candidates: EvictionCandidate[]): EvictionCandidate[] {
    for (const candidate of candidates) {
      const protections: string[] = [];
      
      for (const rule of this.policy.protectionRules) {
        if (rule.condition(candidate.engram)) {
          protections.push(rule.name);
        }
      }
      
      candidate.protectedBy = protections;
    }
    
    return candidates;
  }

  /**
   * 选择淘汰目标
   */
  private selectEvictionTargets(
    candidates: EvictionCandidate[],
    targetCount: number
  ): EvictionCandidate[] {
    const toEvict: EvictionCandidate[] = [];
    
    // 过滤受保护的候�?    const unprotectedCandidates = candidates.filter(c => !c.protectedBy || c.protectedBy.length === 0);
    
    // 按分数排序并选择目标数量
    unprotectedCandidates.sort((a, b) => b.evictionScore - a.evictionScore);
    
    for (let i = 0; i < Math.min(targetCount, unprotectedCandidates.length); i++) {
      toEvict.push(unprotectedCandidates[i]);
    }
    
    return toEvict;
  }

  /**
   * 计算目标减少数量
   */
  private calculateTargetReduction(
    engrams: Map<string, EngramTrace>,
    memoryPressure: MemoryPressure
  ): number {
    const currentSize = engrams.size;
    const totalCapacity = this.policy.capacityLimits.total;
    
    switch (memoryPressure.level) {
      case 'critical':
        return Math.floor(currentSize * 0.3); // 减少30%
      case 'high':
        return Math.floor(currentSize * 0.2); // 减少20%
      case 'medium':
        return Math.floor(currentSize * 0.1); // 减少10%
      default:
        return Math.max(0, currentSize - Math.floor(totalCapacity * 0.8)); // 保持�?0%以下
    }
  }

  /**
   * 执行淘汰
   */
  private async executeEviction(
    engrams: Map<string, EngramTrace>,
    toEvict: EvictionCandidate[]
  ): Promise<EvictionResult> {
    const evictedEngrams: string[] = [];
    const evictionReasons: Record<EvictionReason, number> = {
      'low_strength': 0,
      'low_frequency': 0,
      'old_access': 0,
      'capacity_limit': 0,
      'decay_threshold': 0,
      'redundancy': 0
    };

    for (const candidate of toEvict) {
      engrams.delete(candidate.engramId);
      evictedEngrams.push(candidate.engramId);
      evictionReasons[candidate.reason]++;
      
      // 清理相关数据
      this.accessHistory.delete(candidate.engramId);
      this.frequencyCounter.delete(candidate.engramId);
      this.strengthHistory.delete(candidate.engramId);

      this.logger.debug('Engram evicted', {
        engramId: candidate.engramId,
        reason: candidate.reason,
        score: candidate.evictionScore
      });
    }

    // 计算容量利用�?    const capacityUtilization: Record<ConsolidationLevel, number> = {
      'working': 0,
      'short-term': 0,
      'long-term': 0,
      'permanent': 0
    };

    for (const engram of engrams.values()) {
      capacityUtilization[engram.consolidationLevel]++;
    }

    const protectedCount = this.countProtectedEngrams(engrams);

    return {
      evictedCount: evictedEngrams.length,
      evictedEngrams,
      protectedCount,
      capacityUtilization,
      evictionReasons
    };
  }

  /**
   * 统计受保护的记忆数量
   */
  private countProtectedEngrams(engrams: Map<string, EngramTrace>): number {
    let count = 0;
    
    for (const engram of engrams.values()) {
      for (const rule of this.policy.protectionRules) {
        if (rule.condition(engram)) {
          count++;
          break;
        }
      }
    }
    
    return count;
  }

  /**
   * 记录淘汰历史
   */
  private recordEvictionHistory(evicted: EvictionCandidate[]): void {
    for (const candidate of evicted) {
      this.evictionHistory.push({
        timestamp: new Date(),
        engramId: candidate.engramId,
        reason: candidate.reason,
        score: candidate.evictionScore
      });
    }
    
    // 限制历史记录大小
    if (this.evictionHistory.length > 10000) {
      this.evictionHistory.splice(0, 5000);
    }
  }

  /**
   * 更新淘汰统计
   */
  private updateEvictionStatistics(result: EvictionResult): void {
    // 发布统计事件
    this.eventBus.publishEvent('memory.eviction_statistics', {
      result,
      timestamp: new Date()
    }, 'MemoryEvictionAlgorithm');
  }

  /**
   * 初始化保护规�?   */
  private initializeProtectionRules(): void {
    const defaultRules: ProtectionRule[] = [
      {
        id: 'permanent-protection',
        name: 'Permanent Memory Protection',
        condition: (engram) => engram.consolidationLevel === 'permanent',
        priority: 100,
        description: 'Protect all permanent memories from eviction'
      },
      {
        id: 'high-strength-protection',
        name: 'High Strength Protection',
        condition: (engram) => engram.strength >= this.policy.strengthThresholds.protectionThreshold,
        priority: 90,
        description: 'Protect memories with high strength'
      },
      {
        id: 'recent-access-protection',
        name: 'Recent Access Protection',
        condition: (engram) => {
          const timeSinceAccess = Date.now() - engram.lastAccessed.getTime();
          return timeSinceAccess < 24 * 60 * 60 * 1000; // 24小时内访问过
        },
        priority: 80,
        description: 'Protect recently accessed memories'
      },
      {
        id: 'emotional-protection',
        name: 'Emotional Memory Protection',
        condition: (engram) => Math.abs(engram.emotionalValence) > 0.7,
        priority: 70,
        description: 'Protect memories with strong emotional content'
      },
      {
        id: 'frequent-access-protection',
        name: 'Frequent Access Protection',
        condition: (engram) => {
          const frequency = this.frequencyCounter.get(engram.id) || 0;
          return frequency > 10;
        },
        priority: 60,
        description: 'Protect frequently accessed memories'
      }
    ];

    this.policy.protectionRules.push(...defaultRules);
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('engram.accessed', (event) => {
      const { engramId, timestamp } = event.payload;
      this.recordAccess(engramId, timestamp);
    });

    this.eventBus.subscribeEvent('engram.strengthened', (event) => {
      const { engramId, newStrength } = event.payload;
      this.recordStrengthChange(engramId, newStrength);
    });
  }

  /**
   * 获取淘汰统计
   */
  public getEvictionStatistics(): {
    totalEvictions: number;
    evictionsByReason: Record<EvictionReason, number>;
    averageEvictionScore: number;
    protectionRuleEffectiveness: Array<{ ruleId: string; protectedCount: number }>;
    recentEvictions: Array<{ timestamp: Date; count: number }>;
  } {
    const totalEvictions = this.evictionHistory.length;
    const evictionsByReason: Record<EvictionReason, number> = {
      'low_strength': 0,
      'low_frequency': 0,
      'old_access': 0,
      'capacity_limit': 0,
      'decay_threshold': 0,
      'redundancy': 0
    };

    let totalScore = 0;
    for (const eviction of this.evictionHistory) {
      evictionsByReason[eviction.reason]++;
      totalScore += eviction.score;
    }

    const averageEvictionScore = totalEvictions > 0 ? totalScore / totalEvictions : 0;

    // 简化的保护规则效果统计
    const protectionRuleEffectiveness = this.policy.protectionRules.map(rule => ({
      ruleId: rule.id,
      protectedCount: 0 // 简化实�?    }));

    // 最近淘汰统�?    const recentEvictions: Array<{ timestamp: Date; count: number }> = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const count = this.evictionHistory.filter(e => 
        e.timestamp.toDateString() === date.toDateString()
      ).length;
      recentEvictions.push({ timestamp: date, count });
    }

    return {
      totalEvictions,
      evictionsByReason,
      averageEvictionScore,
      protectionRuleEffectiveness,
      recentEvictions
    };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.accessHistory.clear();
    this.frequencyCounter.clear();
    this.strengthHistory.clear();
    this.evictionHistory = [];

    this.logger.info('Memory Eviction Algorithm destroyed');
  }
}
