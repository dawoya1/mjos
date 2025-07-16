/**
 * MHPF Role Capability Matrix
 * Magic Human-AI Partnership Framework 角色能力矩阵
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { RoleConfig, RoleType } from './types/index';

export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  complexity: number; // 1-10
  prerequisites: string[];
  relatedCapabilities: string[];
}

export type CapabilityCategory = 
  | 'technical' 
  | 'creative' 
  | 'analytical' 
  | 'communication' 
  | 'management' 
  | 'domain-specific';

export interface RoleCapabilityProfile {
  roleId: string;
  capabilities: Map<string, CapabilityLevel>;
  strengths: string[];
  weaknesses: string[];
  collaborationAffinities: string[];
  workloadCapacity: number;
}

export interface CapabilityLevel {
  capabilityId: string;
  proficiency: number; // 0-100
  experience: number; // 使用次数
  lastUsed?: Date;
  effectiveness: number; // 0-100
}

export interface CapabilityGap {
  requiredCapability: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  suggestedRoles: string[];
}

export interface CollaborationRecommendation {
  primaryRole: string;
  supportingRoles: string[];
  reason: string;
  confidence: number;
  expectedOutcome: string;
}

/**
 * 角色能力矩阵�? * 管理团队中所有角色的能力定义、评估和匹配
 */
export class RoleCapabilityMatrix {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private capabilities = new Map<string, CapabilityDefinition>();
  private roleProfiles = new Map<string, RoleCapabilityProfile>();
  private capabilityUsageHistory: Array<{
    roleId: string;
    capabilityId: string;
    timestamp: Date;
    effectiveness: number;
  }> = [];

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.initializeDefaultCapabilities();
    this.setupEventListeners();
    
    this.logger.info('Role Capability Matrix initialized');
  }

  /**
   * 注册角色
   */
  public registerRole(role: RoleConfig): void {
    const profile: RoleCapabilityProfile = {
      roleId: role.id,
      capabilities: new Map(),
      strengths: [],
      weaknesses: [],
      collaborationAffinities: [],
      workloadCapacity: this.calculateWorkloadCapacity(role)
    };

    // 解析角色能力
    for (const capabilityId of role.capabilities) {
      const capability = this.capabilities.get(capabilityId);
      if (capability) {
        profile.capabilities.set(capabilityId, {
          capabilityId,
          proficiency: this.estimateInitialProficiency(role.type, capabilityId),
          experience: 0,
          effectiveness: 0
        });
      } else {
        this.logger.warn('Unknown capability referenced', {
          roleId: role.id,
          capabilityId
        });
      }
    }

    // 分析角色特征
    this.analyzeRoleCharacteristics(profile, role);
    
    this.roleProfiles.set(role.id, profile);
    
    this.logger.info('Role registered in capability matrix', {
      roleId: role.id,
      capabilityCount: profile.capabilities.size
    });

    // 发布角色注册事件
    this.eventBus.publishEvent('capability_matrix.role_registered', {
      roleId: role.id,
      profile
    }, 'RoleCapabilityMatrix');
  }

  /**
   * 获取角色能力档案
   */
  public getRoleProfile(roleId: string): RoleCapabilityProfile | undefined {
    return this.roleProfiles.get(roleId);
  }

  /**
   * 评估任务能力需�?   */
  public assessTaskRequirements(
    taskDescription: string,
    requiredCapabilities: string[],
    complexityLevel: number = 5
  ): CapabilityGap[] {
    const gaps: CapabilityGap[] = [];
    
    for (const capabilityId of requiredCapabilities) {
      const capability = this.capabilities.get(capabilityId);
      if (!capability) continue;
      
      const requiredLevel = Math.min(complexityLevel * 10, 100);
      const bestRole = this.findBestRoleForCapability(capabilityId);
      const currentLevel = bestRole ? 
        bestRole.capabilities.get(capabilityId)?.proficiency || 0 : 0;
      
      if (currentLevel < requiredLevel) {
        gaps.push({
          requiredCapability: capabilityId,
          currentLevel,
          requiredLevel,
          gap: requiredLevel - currentLevel,
          suggestedRoles: this.findRolesWithCapability(capabilityId, requiredLevel * 0.8)
        });
      }
    }
    
    return gaps.sort((a, b) => b.gap - a.gap);
  }

  /**
   * 推荐协作组合
   */
  public recommendCollaboration(
    taskCapabilities: string[],
    constraints: {
      maxRoles?: number;
      preferredRoles?: string[];
      excludedRoles?: string[];
    } = {}
  ): CollaborationRecommendation[] {
    const recommendations: CollaborationRecommendation[] = [];
    const maxRoles = constraints.maxRoles || 3;
    
    // 为每个主要能力找到最佳角�?    const primaryRoles = new Map<string, string>();
    
    for (const capabilityId of taskCapabilities) {
      const bestRole = this.findBestRoleForCapability(capabilityId);
      if (bestRole && !constraints.excludedRoles?.includes(bestRole.roleId)) {
        primaryRoles.set(capabilityId, bestRole.roleId);
      }
    }
    
    // 生成协作组合
    const uniqueRoles = Array.from(new Set(primaryRoles.values()));
    
    for (const primaryRole of uniqueRoles) {
      const profile = this.roleProfiles.get(primaryRole);
      if (!profile) continue;
      
      const supportingRoles = this.findSupportingRoles(
        primaryRole,
        taskCapabilities,
        maxRoles - 1
      );
      
      const confidence = this.calculateCollaborationConfidence(
        primaryRole,
        supportingRoles,
        taskCapabilities
      );
      
      recommendations.push({
        primaryRole,
        supportingRoles,
        reason: this.generateCollaborationReason(primaryRole, supportingRoles, taskCapabilities),
        confidence,
        expectedOutcome: this.predictCollaborationOutcome(primaryRole, supportingRoles)
      });
    }
    
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 更新能力使用记录
   */
  public recordCapabilityUsage(
    roleId: string,
    capabilityId: string,
    effectiveness: number
  ): void {
    const profile = this.roleProfiles.get(roleId);
    if (!profile) return;
    
    const capabilityLevel = profile.capabilities.get(capabilityId);
    if (!capabilityLevel) return;
    
    // 更新能力级别
    capabilityLevel.experience += 1;
    capabilityLevel.lastUsed = new Date();
    capabilityLevel.effectiveness = this.updateEffectiveness(
      capabilityLevel.effectiveness,
      effectiveness,
      capabilityLevel.experience
    );
    
    // 基于使用效果调整熟练�?    if (effectiveness > 80) {
      capabilityLevel.proficiency = Math.min(
        capabilityLevel.proficiency + 2,
        100
      );
    } else if (effectiveness < 50) {
      capabilityLevel.proficiency = Math.max(
        capabilityLevel.proficiency - 1,
        0
      );
    }
    
    // 记录使用历史
    this.capabilityUsageHistory.push({
      roleId,
      capabilityId,
      timestamp: new Date(),
      effectiveness
    });
    
    // 重新分析角色特征
    this.updateRoleCharacteristics(profile);
    
    this.logger.debug('Capability usage recorded', {
      roleId,
      capabilityId,
      effectiveness,
      newProficiency: capabilityLevel.proficiency
    });
  }

  /**
   * 获取能力统计
   */
  public getCapabilityStatistics(): {
    totalCapabilities: number;
    totalRoles: number;
    averageProficiency: number;
    topCapabilities: Array<{ id: string; avgProficiency: number; usage: number }>;
    capabilityGaps: string[];
  } {
    const totalCapabilities = this.capabilities.size;
    const totalRoles = this.roleProfiles.size;
    
    let totalProficiency = 0;
    let proficiencyCount = 0;
    const capabilityStats = new Map<string, { total: number; count: number; usage: number }>();
    
    for (const profile of this.roleProfiles.values()) {
      for (const [capId, level] of profile.capabilities) {
        totalProficiency += level.proficiency;
        proficiencyCount++;
        
        const stats = capabilityStats.get(capId) || { total: 0, count: 0, usage: 0 };
        stats.total += level.proficiency;
        stats.count++;
        stats.usage += level.experience;
        capabilityStats.set(capId, stats);
      }
    }
    
    const averageProficiency = proficiencyCount > 0 ? totalProficiency / proficiencyCount : 0;
    
    const topCapabilities = Array.from(capabilityStats.entries())
      .map(([id, stats]) => ({
        id,
        avgProficiency: stats.total / stats.count,
        usage: stats.usage
      }))
      .sort((a, b) => b.avgProficiency - a.avgProficiency)
      .slice(0, 10);
    
    const capabilityGaps = Array.from(this.capabilities.keys())
      .filter(capId => !capabilityStats.has(capId));
    
    return {
      totalCapabilities,
      totalRoles,
      averageProficiency,
      topCapabilities,
      capabilityGaps
    };
  }

  /**
   * 初始化默认能�?   */
  private initializeDefaultCapabilities(): void {
    const defaultCapabilities: CapabilityDefinition[] = [
      // 技术能�?      {
        id: 'system-architecture',
        name: '系统架构设计',
        description: '设计和规划系统整体架�?,
        category: 'technical',
        complexity: 8,
        prerequisites: ['technical-analysis'],
        relatedCapabilities: ['system-design', 'technology-selection']
      },
      {
        id: 'frontend-development',
        name: '前端开�?,
        description: '用户界面和交互开�?,
        category: 'technical',
        complexity: 6,
        prerequisites: [],
        relatedCapabilities: ['ui-design', 'user-experience']
      },
      {
        id: 'backend-development',
        name: '后端开�?,
        description: '服务器端逻辑和数据处�?,
        category: 'technical',
        complexity: 7,
        prerequisites: [],
        relatedCapabilities: ['database-design', 'api-design']
      },
      
      // 创意能力
      {
        id: 'ui-design',
        name: 'UI设计',
        description: '用户界面视觉设计',
        category: 'creative',
        complexity: 6,
        prerequisites: [],
        relatedCapabilities: ['visual-design', 'user-experience']
      },
      {
        id: 'ux-optimization',
        name: 'UX优化',
        description: '用户体验优化和改�?,
        category: 'creative',
        complexity: 7,
        prerequisites: ['user-research'],
        relatedCapabilities: ['ui-design', 'user-testing']
      },
      
      // 分析能力
      {
        id: 'requirement-analysis',
        name: '需求分�?,
        description: '分析和整理项目需�?,
        category: 'analytical',
        complexity: 6,
        prerequisites: [],
        relatedCapabilities: ['business-analysis', 'stakeholder-management']
      },
      {
        id: 'quality-assurance',
        name: '质量保证',
        description: '确保产品质量和标�?,
        category: 'analytical',
        complexity: 7,
        prerequisites: ['testing-methodology'],
        relatedCapabilities: ['automation-testing', 'performance-testing']
      },
      
      // 沟通能�?      {
        id: 'team-collaboration',
        name: '团队协作',
        description: '与团队成员有效协�?,
        category: 'communication',
        complexity: 5,
        prerequisites: [],
        relatedCapabilities: ['communication', 'conflict-resolution']
      },
      
      // 管理能力
      {
        id: 'project-management',
        name: '项目管理',
        description: '规划和管理项目进�?,
        category: 'management',
        complexity: 8,
        prerequisites: ['planning', 'resource-management'],
        relatedCapabilities: ['risk-management', 'stakeholder-management']
      },
      
      // 领域专业能力
      {
        id: 'cangjie-language',
        name: '仓颉语言开�?,
        description: '使用仓颉语言进行开�?,
        category: 'domain-specific',
        complexity: 8,
        prerequisites: ['programming-fundamentals'],
        relatedCapabilities: ['multi-platform-development', 'performance-optimization']
      }
    ];
    
    for (const capability of defaultCapabilities) {
      this.capabilities.set(capability.id, capability);
    }
    
    this.logger.debug('Default capabilities initialized', {
      count: defaultCapabilities.length
    });
  }

  /**
   * 估算初始熟练�?   */
  private estimateInitialProficiency(roleType: RoleType, capabilityId: string): number {
    // 基于角色类型和能力的匹配度估算初始熟练度
    const roleCapabilityMap: Record<RoleType, Record<string, number>> = {
      'architect': {
        'system-architecture': 90,
        'system-design': 85,
        'team-collaboration': 80,
        'technical-analysis': 85
      },
      'designer': {
        'ui-design': 90,
        'ux-optimization': 85,
        'visual-design': 90,
        'user-experience': 80
      },
      'developer': {
        'frontend-development': 85,
        'backend-development': 85,
        'system-integration': 80,
        'code-quality': 75
      },
      'tester': {
        'quality-assurance': 90,
        'automation-testing': 85,
        'performance-testing': 80,
        'bug-tracking': 85
      },
      'product-manager': {
        'requirement-analysis': 90,
        'project-management': 85,
        'stakeholder-management': 80,
        'business-analysis': 85
      },
      'devops': {
        'deployment-automation': 90,
        'infrastructure-management': 85,
        'monitoring-alerting': 80,
        'ci-cd': 85
      },
      'specialist': {
        'cangjie-language': 95,
        'domain-expertise': 90,
        'specialized-tools': 85,
        'performance-optimization': 80
      }
    };
    
    return roleCapabilityMap[roleType]?.[capabilityId] || 50;
  }

  /**
   * 计算工作负载容量
   */
  private calculateWorkloadCapacity(role: RoleConfig): number {
    // 基于角色优先级和能力数量计算工作负载容量
    const basCapacity = 100;
    const priorityFactor = (11 - role.priority) / 10; // 优先级越高，容量越大
    const capabilityFactor = Math.min(role.capabilities.length / 5, 1.5); // 能力越多，容量越�?    
    return Math.round(basCapacity * priorityFactor * capabilityFactor);
  }

  /**
   * 分析角色特征
   */
  private analyzeRoleCharacteristics(profile: RoleCapabilityProfile, role: RoleConfig): void {
    const capabilities = Array.from(profile.capabilities.entries());
    
    // 识别优势
    profile.strengths = capabilities
      .filter(([_, level]) => level.proficiency > 80)
      .map(([capId, _]) => capId);
    
    // 识别弱点
    profile.weaknesses = capabilities
      .filter(([_, level]) => level.proficiency < 50)
      .map(([capId, _]) => capId);
    
    // 分析协作亲和�?    profile.collaborationAffinities = this.findCollaborationAffinities(role.type);
  }

  /**
   * 查找协作亲和�?   */
  private findCollaborationAffinities(roleType: RoleType): string[] {
    const affinityMap: Record<RoleType, string[]> = {
      'architect': ['designer', 'developer', 'product-manager'],
      'designer': ['architect', 'developer', 'product-manager'],
      'developer': ['architect', 'designer', 'tester'],
      'tester': ['developer', 'devops'],
      'product-manager': ['architect', 'designer', 'tester'],
      'devops': ['developer', 'tester'],
      'specialist': ['architect', 'developer']
    };
    
    return affinityMap[roleType] || [];
  }

  /**
   * 查找最佳角�?   */
  private findBestRoleForCapability(capabilityId: string): RoleCapabilityProfile | undefined {
    let bestRole: RoleCapabilityProfile | undefined;
    let bestProficiency = 0;
    
    for (const profile of this.roleProfiles.values()) {
      const level = profile.capabilities.get(capabilityId);
      if (level && level.proficiency > bestProficiency) {
        bestProficiency = level.proficiency;
        bestRole = profile;
      }
    }
    
    return bestRole;
  }

  /**
   * 查找具有特定能力的角�?   */
  private findRolesWithCapability(capabilityId: string, minProficiency: number): string[] {
    const roles: string[] = [];
    
    for (const profile of this.roleProfiles.values()) {
      const level = profile.capabilities.get(capabilityId);
      if (level && level.proficiency >= minProficiency) {
        roles.push(profile.roleId);
      }
    }
    
    return roles.sort((a, b) => {
      const aLevel = this.roleProfiles.get(a)?.capabilities.get(capabilityId)?.proficiency || 0;
      const bLevel = this.roleProfiles.get(b)?.capabilities.get(capabilityId)?.proficiency || 0;
      return bLevel - aLevel;
    });
  }

  /**
   * 查找支持角色
   */
  private findSupportingRoles(
    primaryRole: string,
    taskCapabilities: string[],
    maxSupporting: number
  ): string[] {
    const primaryProfile = this.roleProfiles.get(primaryRole);
    if (!primaryProfile) return [];
    
    const candidates: Array<{ roleId: string; score: number }> = [];
    
    for (const [roleId, profile] of this.roleProfiles) {
      if (roleId === primaryRole) continue;
      
      let score = 0;
      
      // 协作亲和力得�?      if (primaryProfile.collaborationAffinities.includes(roleId)) {
        score += 20;
      }
      
      // 能力互补得分
      for (const capabilityId of taskCapabilities) {
        const primaryLevel = primaryProfile.capabilities.get(capabilityId)?.proficiency || 0;
        const supportLevel = profile.capabilities.get(capabilityId)?.proficiency || 0;
        
        if (supportLevel > primaryLevel) {
          score += (supportLevel - primaryLevel) / 10;
        }
      }
      
      candidates.push({ roleId, score });
    }
    
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSupporting)
      .map(c => c.roleId);
  }

  /**
   * 计算协作置信�?   */
  private calculateCollaborationConfidence(
    primaryRole: string,
    supportingRoles: string[],
    taskCapabilities: string[]
  ): number {
    let totalConfidence = 0;
    let capabilityCount = 0;
    
    for (const capabilityId of taskCapabilities) {
      let bestProficiency = 0;
      
      // 检查主要角�?      const primaryLevel = this.roleProfiles.get(primaryRole)?.capabilities.get(capabilityId)?.proficiency || 0;
      bestProficiency = Math.max(bestProficiency, primaryLevel);
      
      // 检查支持角�?      for (const supportRole of supportingRoles) {
        const supportLevel = this.roleProfiles.get(supportRole)?.capabilities.get(capabilityId)?.proficiency || 0;
        bestProficiency = Math.max(bestProficiency, supportLevel);
      }
      
      totalConfidence += bestProficiency;
      capabilityCount++;
    }
    
    return capabilityCount > 0 ? totalConfidence / capabilityCount : 0;
  }

  /**
   * 生成协作原因
   */
  private generateCollaborationReason(
    primaryRole: string,
    supportingRoles: string[],
    taskCapabilities: string[]
  ): string {
    const primaryProfile = this.roleProfiles.get(primaryRole);
    if (!primaryProfile) return 'Unknown reason';
    
    const strengths = primaryProfile.strengths.filter(s => taskCapabilities.includes(s));
    const reason = `${primaryRole} leads with strengths in ${strengths.join(', ')}`;
    
    if (supportingRoles.length > 0) {
      return `${reason}, supported by ${supportingRoles.join(', ')} for complementary capabilities`;
    }
    
    return reason;
  }

  /**
   * 预测协作结果
   */
  private predictCollaborationOutcome(primaryRole: string, supportingRoles: string[]): string {
    const teamSize = 1 + supportingRoles.length;
    
    if (teamSize === 1) {
      return 'Individual execution with focused expertise';
    } else if (teamSize <= 3) {
      return 'Efficient small team collaboration with clear role division';
    } else {
      return 'Complex team coordination with diverse expertise coverage';
    }
  }

  /**
   * 更新效果�?   */
  private updateEffectiveness(
    currentEffectiveness: number,
    newEffectiveness: number,
    experience: number
  ): number {
    // 使用加权平均，经验越多权重越�?    const weight = Math.min(experience / 10, 0.8);
    return currentEffectiveness * (1 - weight) + newEffectiveness * weight;
  }

  /**
   * 更新角色特征
   */
  private updateRoleCharacteristics(profile: RoleCapabilityProfile): void {
    const capabilities = Array.from(profile.capabilities.entries());
    
    // 重新计算优势和弱�?    profile.strengths = capabilities
      .filter(([_, level]) => level.proficiency > 80)
      .map(([capId, _]) => capId);
    
    profile.weaknesses = capabilities
      .filter(([_, level]) => level.proficiency < 50)
      .map(([capId, _]) => capId);
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听角色激活事�?    this.eventBus.subscribeEvent('role.activated', (event) => {
      const { roleId } = event.payload;
      this.logger.debug('Role activated in capability matrix', { roleId });
    });

    // 监听任务完成事件
    this.eventBus.subscribeEvent('task.completed', (event) => {
      const { roleId, capabilities, effectiveness } = event.payload;
      
      if (Array.isArray(capabilities)) {
        for (const capabilityId of capabilities) {
          this.recordCapabilityUsage(roleId, capabilityId, effectiveness);
        }
      }
    });
  }
}
