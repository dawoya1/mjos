/**
 * MMPT Role Registry
 * Magic Multi-role Prompt Toolkit 角色注册�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { RoleConfig, RoleType, MJOSError } from './types/index';

export interface RoleDefinition extends RoleConfig {
  prompts: RolePrompts;
  constraints: RoleConstraints;
  behaviors: RoleBehaviors;
  interactions: RoleInteractions;
  version: string;
  status: RoleStatus;
  metadata: RoleMetadata;
}

export interface RolePrompts {
  system: string;
  initialization: string;
  taskExecution: string;
  collaboration: string;
  reflection: string;
  templates: Map<string, string>;
}

export interface RoleConstraints {
  maxTokens?: number;
  timeoutMs?: number;
  memoryLimit?: number;
  allowedActions: string[];
  forbiddenActions: string[];
  accessLevels: string[];
}

export interface RoleBehaviors {
  decisionMaking: 'autonomous' | 'collaborative' | 'guided';
  communicationStyle: 'formal' | 'casual' | 'technical' | 'adaptive';
  learningMode: 'passive' | 'active' | 'continuous';
  errorHandling: 'strict' | 'tolerant' | 'adaptive';
  workflowPreference: 'sequential' | 'parallel' | 'flexible';
}

export interface RoleInteractions {
  preferredPartners: string[];
  conflictResolution: 'escalate' | 'negotiate' | 'defer';
  collaborationPatterns: string[];
  communicationProtocols: string[];
}

export type RoleStatus = 'draft' | 'active' | 'deprecated' | 'archived';

export interface RoleMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  tags: string[];
  description: string;
  usageCount: number;
  successRate: number;
  lastUsed?: Date;
}

export interface RoleTemplate {
  id: string;
  name: string;
  category: RoleCategory;
  basePrompts: Partial<RolePrompts>;
  defaultConstraints: Partial<RoleConstraints>;
  defaultBehaviors: Partial<RoleBehaviors>;
  customizationPoints: string[];
}

export type RoleCategory = 
  | 'technical' 
  | 'creative' 
  | 'analytical' 
  | 'management' 
  | 'support' 
  | 'specialized';

/**
 * 角色注册表类
 * 管理所有角色定义、模板和生命周期
 */
export class RoleRegistry {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private roleDefinitions = new Map<string, RoleDefinition>();
  private roleTemplates = new Map<string, RoleTemplate>();
  private roleVersions = new Map<string, RoleDefinition[]>(); // roleId -> versions
  private activeRoles = new Set<string>();

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.initializeDefaultTemplates();
    this.initializeDefaultRoles();
    this.setupEventListeners();
    
    this.logger.info('Role Registry initialized');
  }

  /**
   * 注册角色定义
   */
  public async registerRole(roleDefinition: RoleDefinition): Promise<boolean> {
    try {
      // 验证角色定义
      this.validateRoleDefinition(roleDefinition);

      // 检查是否已存在
      if (this.roleDefinitions.has(roleDefinition.id)) {
        // 创建新版�?        await this.createRoleVersion(roleDefinition);
      } else {
        // 新角�?        this.roleDefinitions.set(roleDefinition.id, roleDefinition);
        this.roleVersions.set(roleDefinition.id, [roleDefinition]);
      }

      this.logger.info('Role registered', {
        roleId: roleDefinition.id,
        name: roleDefinition.name,
        type: roleDefinition.type,
        version: roleDefinition.version
      });

      // 发布角色注册事件
      this.eventBus.publishEvent('role.registered', {
        roleDefinition
      }, 'RoleRegistry');

      return true;

    } catch (error) {
      this.logger.error('Failed to register role', {
        roleId: roleDefinition.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 获取角色定义
   */
  public getRoleDefinition(roleId: string, version?: string): RoleDefinition | undefined {
    if (version) {
      const versions = this.roleVersions.get(roleId);
      return versions?.find(r => r.version === version);
    }
    return this.roleDefinitions.get(roleId);
  }

  /**
   * 获取所有角色定�?   */
  public getAllRoles(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values());
  }

  /**
   * 获取活跃角色
   */
  public getActiveRoles(): RoleDefinition[] {
    return Array.from(this.activeRoles)
      .map(roleId => this.roleDefinitions.get(roleId))
      .filter(role => role !== undefined) as RoleDefinition[];
  }

  /**
   * 激活角�?   */
  public async activateRole(roleId: string): Promise<boolean> {
    try {
      const roleDefinition = this.roleDefinitions.get(roleId);
      if (!roleDefinition) {
        throw new Error(`Role not found: ${roleId}`);
      }

      if (roleDefinition.status !== 'active') {
        throw new Error(`Role is not in active status: ${roleDefinition.status}`);
      }

      this.activeRoles.add(roleId);
      
      // 更新使用统计
      roleDefinition.metadata.usageCount += 1;
      roleDefinition.metadata.lastUsed = new Date();

      this.logger.info('Role activated', {
        roleId,
        name: roleDefinition.name
      });

      // 发布角色激活事�?      this.eventBus.publishEvent('role.activated', {
        roleId,
        roleDefinition
      }, 'RoleRegistry');

      return true;

    } catch (error) {
      this.logger.error('Failed to activate role', {
        roleId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 停用角色
   */
  public async deactivateRole(roleId: string): Promise<boolean> {
    try {
      if (!this.activeRoles.has(roleId)) {
        this.logger.debug('Role not active', { roleId });
        return true;
      }

      this.activeRoles.delete(roleId);

      this.logger.info('Role deactivated', { roleId });

      // 发布角色停用事件
      this.eventBus.publishEvent('role.deactivated', {
        roleId
      }, 'RoleRegistry');

      return true;

    } catch (error) {
      this.logger.error('Failed to deactivate role', {
        roleId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 从模板创建角�?   */
  public createRoleFromTemplate(
    templateId: string,
    roleId: string,
    customizations: {
      name: string;
      prompts?: Partial<RolePrompts>;
      constraints?: Partial<RoleConstraints>;
      behaviors?: Partial<RoleBehaviors>;
      interactions?: Partial<RoleInteractions>;
    }
  ): RoleDefinition {
    const template = this.roleTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const roleDefinition: RoleDefinition = {
      id: roleId,
      name: customizations.name,
      type: this.inferRoleType(template.category),
      capabilities: [],
      priority: 5,
      initialState: 'READY',
      memoryAccess: 'shared',
      prompts: {
        ...template.basePrompts,
        ...customizations.prompts,
        templates: new Map()
      } as RolePrompts,
      constraints: {
        ...template.defaultConstraints,
        ...customizations.constraints,
        allowedActions: [],
        forbiddenActions: [],
        accessLevels: []
      } as RoleConstraints,
      behaviors: {
        ...template.defaultBehaviors,
        ...customizations.behaviors
      } as RoleBehaviors,
      interactions: {
        preferredPartners: [],
        conflictResolution: 'negotiate',
        collaborationPatterns: [],
        communicationProtocols: [],
        ...customizations.interactions
      },
      version: '1.0.0',
      status: 'draft',
      metadata: {
        author: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        tags: [template.category],
        description: `Role created from template: ${template.name}`,
        usageCount: 0,
        successRate: 0
      }
    };

    return roleDefinition;
  }

  /**
   * 更新角色定义
   */
  public async updateRole(
    roleId: string,
    updates: Partial<RoleDefinition>
  ): Promise<boolean> {
    try {
      const roleDefinition = this.roleDefinitions.get(roleId);
      if (!roleDefinition) {
        throw new Error(`Role not found: ${roleId}`);
      }

      // 创建新版�?      const newVersion = this.incrementVersion(roleDefinition.version);
      const updatedRole: RoleDefinition = {
        ...roleDefinition,
        ...updates,
        version: newVersion,
        metadata: {
          ...roleDefinition.metadata,
          ...updates.metadata,
          updatedAt: new Date(),
          version: newVersion
        }
      };

      // 验证更新后的角色
      this.validateRoleDefinition(updatedRole);

      // 更新注册�?      this.roleDefinitions.set(roleId, updatedRole);
      
      // 添加到版本历�?      const versions = this.roleVersions.get(roleId) || [];
      versions.push(updatedRole);
      this.roleVersions.set(roleId, versions);

      this.logger.info('Role updated', {
        roleId,
        newVersion,
        changes: Object.keys(updates)
      });

      // 发布角色更新事件
      this.eventBus.publishEvent('role.updated', {
        roleId,
        roleDefinition: updatedRole,
        previousVersion: roleDefinition.version
      }, 'RoleRegistry');

      return true;

    } catch (error) {
      this.logger.error('Failed to update role', {
        roleId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 删除角色
   */
  public async deleteRole(roleId: string): Promise<boolean> {
    try {
      const roleDefinition = this.roleDefinitions.get(roleId);
      if (!roleDefinition) {
        this.logger.debug('Role not found for deletion', { roleId });
        return true;
      }

      // 检查是否正在使�?      if (this.activeRoles.has(roleId)) {
        throw new Error(`Cannot delete active role: ${roleId}`);
      }

      // 标记为已归档而不是直接删�?      roleDefinition.status = 'archived';
      roleDefinition.metadata.updatedAt = new Date();

      this.logger.info('Role archived', { roleId });

      // 发布角色删除事件
      this.eventBus.publishEvent('role.deleted', {
        roleId,
        roleDefinition
      }, 'RoleRegistry');

      return true;

    } catch (error) {
      this.logger.error('Failed to delete role', {
        roleId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 搜索角色
   */
  public searchRoles(criteria: {
    name?: string;
    type?: RoleType;
    category?: RoleCategory;
    capabilities?: string[];
    tags?: string[];
    status?: RoleStatus;
  }): RoleDefinition[] {
    let results = Array.from(this.roleDefinitions.values());

    if (criteria.name) {
      const namePattern = new RegExp(criteria.name, 'i');
      results = results.filter(role => namePattern.test(role.name));
    }

    if (criteria.type) {
      results = results.filter(role => role.type === criteria.type);
    }

    if (criteria.capabilities) {
      results = results.filter(role => 
        criteria.capabilities!.every(cap => role.capabilities.includes(cap))
      );
    }

    if (criteria.tags) {
      results = results.filter(role => 
        criteria.tags!.some(tag => role.metadata.tags.includes(tag))
      );
    }

    if (criteria.status) {
      results = results.filter(role => role.status === criteria.status);
    }

    return results.sort((a, b) => b.metadata.usageCount - a.metadata.usageCount);
  }

  /**
   * 获取角色统计
   */
  public getRoleStatistics(): {
    totalRoles: number;
    activeRoles: number;
    rolesByType: Record<RoleType, number>;
    rolesByStatus: Record<RoleStatus, number>;
    averageSuccessRate: number;
    mostUsedRoles: Array<{ roleId: string; usageCount: number }>;
  } {
    const allRoles = Array.from(this.roleDefinitions.values());
    const rolesByType: Record<RoleType, number> = {} as any;
    const rolesByStatus: Record<RoleStatus, number> = {} as any;
    
    let totalSuccessRate = 0;

    for (const role of allRoles) {
      rolesByType[role.type] = (rolesByType[role.type] || 0) + 1;
      rolesByStatus[role.status] = (rolesByStatus[role.status] || 0) + 1;
      totalSuccessRate += role.metadata.successRate;
    }

    const averageSuccessRate = allRoles.length > 0 ? totalSuccessRate / allRoles.length : 0;

    const mostUsedRoles = allRoles
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, 10)
      .map(role => ({
        roleId: role.id,
        usageCount: role.metadata.usageCount
      }));

    return {
      totalRoles: allRoles.length,
      activeRoles: this.activeRoles.size,
      rolesByType,
      rolesByStatus,
      averageSuccessRate,
      mostUsedRoles
    };
  }

  /**
   * 验证角色定义
   */
  private validateRoleDefinition(roleDefinition: RoleDefinition): void {
    if (!roleDefinition.id) {
      throw new Error('Role ID is required');
    }

    if (!roleDefinition.name) {
      throw new Error('Role name is required');
    }

    if (!roleDefinition.type) {
      throw new Error('Role type is required');
    }

    if (!roleDefinition.prompts.system) {
      throw new Error('System prompt is required');
    }

    if (!roleDefinition.version) {
      throw new Error('Role version is required');
    }

    // 验证版本格式
    if (!/^\d+\.\d+\.\d+$/.test(roleDefinition.version)) {
      throw new Error('Invalid version format. Use semantic versioning (x.y.z)');
    }
  }

  /**
   * 创建角色版本
   */
  private async createRoleVersion(roleDefinition: RoleDefinition): Promise<void> {
    const existingRole = this.roleDefinitions.get(roleDefinition.id)!;
    const newVersion = this.incrementVersion(existingRole.version);
    
    roleDefinition.version = newVersion;
    roleDefinition.metadata.version = newVersion;
    roleDefinition.metadata.updatedAt = new Date();

    this.roleDefinitions.set(roleDefinition.id, roleDefinition);
    
    const versions = this.roleVersions.get(roleDefinition.id) || [];
    versions.push(roleDefinition);
    this.roleVersions.set(roleDefinition.id, versions);
  }

  /**
   * 递增版本�?   */
  private incrementVersion(currentVersion: string): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * 推断角色类型
   */
  private inferRoleType(category: RoleCategory): RoleType {
    const categoryToType: Record<RoleCategory, RoleType> = {
      'technical': 'developer',
      'creative': 'designer',
      'analytical': 'architect',
      'management': 'product-manager',
      'support': 'devops',
      'specialized': 'specialist'
    };

    return categoryToType[category] || 'specialist';
  }

  /**
   * 初始化默认模�?   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: RoleTemplate[] = [
      {
        id: 'architect-template',
        name: '架构师模�?,
        category: 'technical',
        basePrompts: {
          system: '你是一位经验丰富的系统架构师，专注于设计可扩展、可维护的系统架构�?,
          initialization: '开始分析系统需求和约束条件�?,
          taskExecution: '基于最佳实践设计系统架构�?,
          collaboration: '与团队成员协作，确保架构决策的一致性�?,
          reflection: '回顾架构决策，识别改进机会�?
        },
        defaultConstraints: {
          maxTokens: 4000,
          timeoutMs: 30000,
          allowedActions: ['design', 'analyze', 'review', 'document'],
          forbiddenActions: ['implement', 'deploy'],
          accessLevels: ['global', 'project']
        },
        defaultBehaviors: {
          decisionMaking: 'collaborative',
          communicationStyle: 'technical',
          learningMode: 'continuous',
          errorHandling: 'strict',
          workflowPreference: 'sequential'
        },
        customizationPoints: ['domain-expertise', 'technology-stack', 'scale-requirements']
      },
      {
        id: 'developer-template',
        name: '开发者模�?,
        category: 'technical',
        basePrompts: {
          system: '你是一位技能全面的软件开发者，能够进行前端和后端开发�?,
          initialization: '了解开发任务和技术要求�?,
          taskExecution: '编写高质量、可维护的代码�?,
          collaboration: '与设计师和其他开发者协作�?,
          reflection: '回顾代码质量和开发过程�?
        },
        defaultConstraints: {
          maxTokens: 3000,
          timeoutMs: 25000,
          allowedActions: ['code', 'test', 'debug', 'refactor'],
          forbiddenActions: ['deploy-production'],
          accessLevels: ['project', 'shared']
        },
        defaultBehaviors: {
          decisionMaking: 'autonomous',
          communicationStyle: 'technical',
          learningMode: 'active',
          errorHandling: 'tolerant',
          workflowPreference: 'parallel'
        },
        customizationPoints: ['programming-languages', 'frameworks', 'specialization']
      }
    ];

    for (const template of defaultTemplates) {
      this.roleTemplates.set(template.id, template);
    }

    this.logger.debug('Default role templates initialized', {
      templateCount: defaultTemplates.length
    });
  }

  /**
   * 初始化默认角�?   */
  private initializeDefaultRoles(): void {
    // 创建魔剑工作室默认角�?    const defaultRoles = [
      {
        templateId: 'architect-template',
        roleId: 'moxiaozhi',
        name: '莫小�?,
        customizations: {
          capabilities: ['role-creation', 'system-architecture', 'team-collaboration'],
          prompts: {
            system: '你是莫小智，魔剑工作室的首席架构师和团队协调者。你具备创建新角色、设计系统架构和协调团队协作的能力�?
          }
        }
      },
      {
        templateId: 'developer-template',
        roleId: 'moxiaoma',
        name: '莫小�?,
        customizations: {
          capabilities: ['frontend-development', 'backend-development', 'system-integration'],
          prompts: {
            system: '你是莫小码，魔剑工作室的全栈开发工程师。你专注于前端和后端开发，以及系统集成工作�?
          }
        }
      }
    ];

    for (const roleConfig of defaultRoles) {
      try {
        const roleDefinition = this.createRoleFromTemplate(
          roleConfig.templateId,
          roleConfig.roleId,
          {
            name: roleConfig.name,
            ...roleConfig.customizations
          }
        );
        
        roleDefinition.status = 'active';
        this.registerRole(roleDefinition);
      } catch (error) {
        this.logger.warn('Failed to create default role', {
          roleId: roleConfig.roleId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听角色使用事件
    this.eventBus.subscribeEvent('role.task_completed', (event) => {
      const { roleId, success } = event.payload;
      const roleDefinition = this.roleDefinitions.get(roleId);
      
      if (roleDefinition) {
        // 更新成功�?        const totalTasks = roleDefinition.metadata.usageCount;
        const currentSuccessRate = roleDefinition.metadata.successRate;
        const newSuccessRate = (currentSuccessRate * (totalTasks - 1) + (success ? 100 : 0)) / totalTasks;
        
        roleDefinition.metadata.successRate = newSuccessRate;
        roleDefinition.metadata.lastUsed = new Date();
      }
    });

    // 监听团队配置变化
    this.eventBus.subscribeEvent('team.config_updated', (event) => {
      const { teamConfig } = event.payload;
      
      // 同步团队配置中的角色
      for (const role of teamConfig.roles) {
        if (!this.roleDefinitions.has(role.id)) {
          this.logger.info('Creating role from team config', { roleId: role.id });
          // 这里可以基于团队配置创建角色定义
        }
      }
    });
  }
}
