/**
 * MHPF Team Controller
 * Magic Human-AI Partnership Framework 团队控制�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { 
  TeamConfig, 
  RoleConfig, 
  TeamState, 
  CollaborationMode,
  StateContext,
  MJOSError 
} from './types/index';

export interface TeamControllerOptions {
  autoActivation?: boolean;
  maxConcurrentRoles?: number;
  collaborationTimeout?: number;
  stateTransitionDelay?: number;
}

export interface TeamActivationResult {
  success: boolean;
  activatedRoles: string[];
  collaborationMode: CollaborationMode;
  teamState: TeamState;
  error?: MJOSError;
}

export interface RoleActivationContext {
  roleId: string;
  trigger: string;
  priority: number;
  dependencies: string[];
  timeout?: number;
}

/**
 * 团队控制器类
 * 负责团队的整体协调和角色管理
 */
export class TeamController {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly options: TeamControllerOptions;
  
  private teamConfig: TeamConfig;
  private currentTeamState: TeamState;
  private activeRoles = new Set<string>();
  private roleStates = new Map<string, any>();
  private collaborationQueue: RoleActivationContext[] = [];
  
  constructor(
    teamConfig: TeamConfig,
    logger: Logger,
    eventBus: EventBus,
    options: TeamControllerOptions = {}
  ) {
    this.teamConfig = teamConfig;
    this.logger = logger;
    this.eventBus = eventBus;
    this.options = {
      autoActivation: true,
      maxConcurrentRoles: 5,
      collaborationTimeout: 30000, // 30�?      stateTransitionDelay: 100,
      ...options
    };
    
    this.currentTeamState = this.createInitialTeamState();
    this.setupEventListeners();
    
    this.logger.info('Team Controller initialized', {
      teamName: teamConfig.name,
      roleCount: teamConfig.roles.length,
      collaborationRules: teamConfig.collaborationRules.length
    });
  }

  /**
   * 激活团�?   */
  public async activateTeam(context: StateContext): Promise<TeamActivationResult> {
    try {
      this.logger.info('Activating team', {
        teamName: this.teamConfig.name,
        sessionId: context.sessionId
      });

      // 更新团队状�?      await this.updateTeamState('planning', context);
      
      // 激活初始角�?      const activatedRoles = await this.activateInitialRoles(context);
      
      // 设置协作模式
      const collaborationMode = this.determineCollaborationMode(context);
      
      // 发布团队激活事�?      this.eventBus.publishEvent('team.activated', {
        teamName: this.teamConfig.name,
        activatedRoles,
        collaborationMode,
        context
      }, 'TeamController');
      
      const result: TeamActivationResult = {
        success: true,
        activatedRoles,
        collaborationMode,
        teamState: this.currentTeamState
      };
      
      this.logger.info('Team activation completed', result);
      return result;
      
    } catch (error) {
      const mjosError = this.createTeamError(error, 'activateTeam', context);
      this.logger.error('Team activation failed', { error: mjosError });
      
      return {
        success: false,
        activatedRoles: [],
        collaborationMode: 'idle',
        teamState: this.currentTeamState,
        error: mjosError
      };
    }
  }

  /**
   * 激活特定角�?   */
  public async activateRole(
    roleId: string, 
    context: StateContext,
    activationContext?: Partial<RoleActivationContext>
  ): Promise<boolean> {
    try {
      const role = this.findRole(roleId);
      if (!role) {
        throw new Error(`Role not found: ${roleId}`);
      }

      // 检查角色是否已激�?      if (this.activeRoles.has(roleId)) {
        this.logger.debug('Role already active', { roleId });
        return true;
      }

      // 检查并发限�?      if (this.activeRoles.size >= this.options.maxConcurrentRoles!) {
        this.logger.warn('Maximum concurrent roles reached', {
          current: this.activeRoles.size,
          max: this.options.maxConcurrentRoles
        });
        
        // 添加到队�?        this.collaborationQueue.push({
          roleId,
          trigger: activationContext?.trigger || 'manual',
          priority: role.priority,
          dependencies: activationContext?.dependencies || [],
          timeout: activationContext?.timeout
        });
        
        return false;
      }

      // 检查依赖关�?      if (activationContext?.dependencies) {
        const unmetDependencies = activationContext.dependencies.filter(
          dep => !this.activeRoles.has(dep)
        );
        
        if (unmetDependencies.length > 0) {
          this.logger.debug('Role dependencies not met', {
            roleId,
            unmetDependencies
          });
          return false;
        }
      }

      // 激活角�?      this.activeRoles.add(roleId);
      this.roleStates.set(roleId, {
        activatedAt: new Date(),
        context,
        state: role.initialState
      });

      this.logger.info('Role activated', {
        roleId,
        roleName: role.name,
        activeRoles: Array.from(this.activeRoles)
      });

      // 发布角色激活事�?      this.eventBus.publishEvent('role.activated', {
        roleId,
        role,
        context,
        teamState: this.currentTeamState
      }, 'TeamController');

      // 处理队列中的角色
      await this.processCollaborationQueue(context);

      return true;
      
    } catch (error) {
      this.logger.error('Role activation failed', {
        roleId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 停用角色
   */
  public async deactivateRole(roleId: string, context: StateContext): Promise<boolean> {
    try {
      if (!this.activeRoles.has(roleId)) {
        this.logger.debug('Role not active', { roleId });
        return true;
      }

      // 停用角色
      this.activeRoles.delete(roleId);
      this.roleStates.delete(roleId);

      this.logger.info('Role deactivated', {
        roleId,
        activeRoles: Array.from(this.activeRoles)
      });

      // 发布角色停用事件
      this.eventBus.publishEvent('role.deactivated', {
        roleId,
        context,
        teamState: this.currentTeamState
      }, 'TeamController');

      // 处理队列中的角色
      await this.processCollaborationQueue(context);

      return true;
      
    } catch (error) {
      this.logger.error('Role deactivation failed', {
        roleId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 获取团队状�?   */
  public getTeamState(): TeamState {
    return { ...this.currentTeamState };
  }

  /**
   * 获取活跃角色
   */
  public getActiveRoles(): string[] {
    return Array.from(this.activeRoles);
  }

  /**
   * 获取角色状�?   */
  public getRoleState(roleId: string): any {
    return this.roleStates.get(roleId);
  }

  /**
   * 更新团队状�?   */
  public async updateTeamState(
    collaborationMode: CollaborationMode,
    context: StateContext
  ): Promise<void> {
    const previousMode = this.currentTeamState.collaborationMode;
    
    this.currentTeamState = {
      ...this.currentTeamState,
      collaborationMode,
      activeRoles: Array.from(this.activeRoles),
      progress: this.calculateTeamProgress(),
      metadata: {
        ...this.currentTeamState.metadata,
        lastUpdated: new Date(),
        updateContext: context
      }
    };

    this.logger.debug('Team state updated', {
      from: previousMode,
      to: collaborationMode,
      activeRoles: this.currentTeamState.activeRoles.length
    });

    // 发布状态更新事�?    this.eventBus.publishEvent('team.state_updated', {
      previousMode,
      currentMode: collaborationMode,
      teamState: this.currentTeamState,
      context
    }, 'TeamController');
  }

  /**
   * 执行协作规则
   */
  public async executeCollaborationRule(
    ruleType: string,
    fromRoles: string[],
    toRoles: string[],
    context: StateContext
  ): Promise<boolean> {
    try {
      this.logger.debug('Executing collaboration rule', {
        ruleType,
        fromRoles,
        toRoles
      });

      switch (ruleType) {
        case 'handoff':
          return await this.executeHandoff(fromRoles, toRoles, context);
        case 'parallel':
          return await this.executeParallel(fromRoles, toRoles, context);
        case 'review':
          return await this.executeReview(fromRoles, toRoles, context);
        case 'approval':
          return await this.executeApproval(fromRoles, toRoles, context);
        default:
          throw new Error(`Unknown collaboration rule type: ${ruleType}`);
      }
      
    } catch (error) {
      this.logger.error('Collaboration rule execution failed', {
        ruleType,
        fromRoles,
        toRoles,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 创建初始团队状�?   */
  private createInitialTeamState(): TeamState {
    return {
      id: `team-${Date.now()}`,
      name: this.teamConfig.name,
      description: this.teamConfig.description,
      activeRoles: [],
      collaborationMode: 'idle',
      progress: 0,
      metadata: {
        createdAt: new Date(),
        teamConfig: this.teamConfig.name,
        totalRoles: this.teamConfig.roles.length
      }
    };
  }

  /**
   * 激活初始角�?   */
  private async activateInitialRoles(context: StateContext): Promise<string[]> {
    const activatedRoles: string[] = [];
    
    // 按优先级排序角色
    const sortedRoles = [...this.teamConfig.roles].sort((a, b) => a.priority - b.priority);
    
    // 激活高优先级角�?    for (const role of sortedRoles) {
      if (role.priority === 1) { // 最高优先级
        const activated = await this.activateRole(role.id, context);
        if (activated) {
          activatedRoles.push(role.id);
        }
      }
    }
    
    return activatedRoles;
  }

  /**
   * 确定协作模式
   */
  private determineCollaborationMode(context: StateContext): CollaborationMode {
    // 基于活跃角色数量和团队配置确定协作模�?    const activeCount = this.activeRoles.size;
    
    if (activeCount === 0) return 'idle';
    if (activeCount === 1) return 'planning';
    if (activeCount <= 3) return 'development';
    return 'collaboration';
  }

  /**
   * 处理协作队列
   */
  private async processCollaborationQueue(context: StateContext): Promise<void> {
    if (this.collaborationQueue.length === 0) return;
    
    // 按优先级排序
    this.collaborationQueue.sort((a, b) => a.priority - b.priority);
    
    const toProcess = this.collaborationQueue.splice(0, 
      this.options.maxConcurrentRoles! - this.activeRoles.size
    );
    
    for (const item of toProcess) {
      await this.activateRole(item.roleId, context, item);
    }
  }

  /**
   * 执行交接规则
   */
  private async executeHandoff(
    fromRoles: string[],
    toRoles: string[],
    context: StateContext
  ): Promise<boolean> {
    // 停用from角色
    for (const roleId of fromRoles) {
      await this.deactivateRole(roleId, context);
    }
    
    // 激活to角色
    for (const roleId of toRoles) {
      await this.activateRole(roleId, context, {
        roleId,
        trigger: 'handoff',
        priority: this.findRole(roleId)?.priority || 5,
        dependencies: []
      });
    }
    
    return true;
  }

  /**
   * 执行并行规则
   */
  private async executeParallel(
    fromRoles: string[],
    toRoles: string[],
    context: StateContext
  ): Promise<boolean> {
    // 保持from角色活跃，同时激活to角色
    for (const roleId of toRoles) {
      await this.activateRole(roleId, context, {
        roleId,
        trigger: 'parallel',
        priority: this.findRole(roleId)?.priority || 5,
        dependencies: fromRoles
      });
    }
    
    return true;
  }

  /**
   * 执行审查规则
   */
  private async executeReview(
    fromRoles: string[],
    toRoles: string[],
    context: StateContext
  ): Promise<boolean> {
    // 激活审查角�?    for (const roleId of toRoles) {
      await this.activateRole(roleId, context, {
        roleId,
        trigger: 'review',
        priority: 1, // 审查通常是高优先�?        dependencies: fromRoles
      });
    }
    
    return true;
  }

  /**
   * 执行批准规则
   */
  private async executeApproval(
    fromRoles: string[],
    toRoles: string[],
    context: StateContext
  ): Promise<boolean> {
    // 激活批准角�?    for (const roleId of toRoles) {
      await this.activateRole(roleId, context, {
        roleId,
        trigger: 'approval',
        priority: 1, // 批准通常是最高优先级
        dependencies: fromRoles
      });
    }
    
    return true;
  }

  /**
   * 计算团队进度
   */
  private calculateTeamProgress(): number {
    if (this.teamConfig.roles.length === 0) return 0;
    
    const activeRatio = this.activeRoles.size / this.teamConfig.roles.length;
    return Math.min(activeRatio * 100, 100);
  }

  /**
   * 查找角色
   */
  private findRole(roleId: string): RoleConfig | undefined {
    return this.teamConfig.roles.find(role => role.id === roleId);
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听角色状态变�?    this.eventBus.subscribeEvent('role.state_changed', async (event) => {
      const { roleId, newState, context } = event.payload;
      
      if (this.activeRoles.has(roleId)) {
        const roleState = this.roleStates.get(roleId);
        if (roleState) {
          roleState.state = newState;
          roleState.lastUpdated = new Date();
        }
      }
    });

    // 监听协作请求
    this.eventBus.subscribeEvent('collaboration.requested', async (event) => {
      const { fromRole, toRole, ruleType, context } = event.payload;
      
      await this.executeCollaborationRule(
        ruleType,
        [fromRole],
        [toRole],
        context
      );
    });
  }

  /**
   * 创建团队错误
   */
  private createTeamError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const teamError = new Error(`Team ${operation} failed: ${message}`) as MJOSError;
    
    teamError.code = 'TeamError';
    teamError.component = 'TeamController';
    teamError.context = context;
    teamError.recoverable = true;
    teamError.timestamp = new Date();
    
    return teamError;
  }
}
