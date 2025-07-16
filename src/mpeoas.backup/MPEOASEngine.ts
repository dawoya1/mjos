/**
 * MPEOAS Engine
 * Magic Process Engine of AI State 状态引�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, TeamConfig, MJOSError } from './types/index';
import { TeamStateManager } from './TeamStateManager';
import { RoleStateSynchronizer } from './RoleStateSynchronizer';
import { CollaborationStateTracker } from './CollaborationStateTracker';
import { ProjectMemoryIntegrator, ProjectMemoryContext } from './ProjectMemoryIntegrator';
import { IntelligentStateEngine } from '../advanced-state/IntelligentStateEngine';
import { EngramMemorySystem } from '../advanced-memory/EngramMemorySystem';

export interface MPEOASEngineOptions {
  enableStateManagement?: boolean;
  enableRoleSync?: boolean;
  enableCollaborationTracking?: boolean;
  enableMemoryIntegration?: boolean;
  enableIntelligentState?: boolean;
  stateTransitionTimeout?: number;
  syncBatchSize?: number;
}

/**
 * MPEOAS引擎�? * 整合所有MPEOAS组件，提供统一的状态管理引�? */
export class MPEOASEngine {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly options: MPEOASEngineOptions;
  
  private teamStateManager?: TeamStateManager;
  private roleStateSynchronizer?: RoleStateSynchronizer;
  private collaborationTracker?: CollaborationStateTracker;
  private memoryIntegrator?: ProjectMemoryIntegrator;
  private intelligentStateEngine?: IntelligentStateEngine;

  private isInitialized = false;
  private isRunning = false;

  constructor(
    logger: Logger,
    eventBus: EventBus,
    options: MPEOASEngineOptions = {}
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.options = {
      enableStateManagement: true,
      enableRoleSync: true,
      enableCollaborationTracking: true,
      enableIntelligentState: true,
      enableMemoryIntegration: true,
      stateTransitionTimeout: 30000,
      syncBatchSize: 10,
      ...options
    };
    
    this.logger.info('MPEOAS Engine created', { options: this.options });
  }

  /**
   * 初始化引�?   */
  public async initialize(teamConfig?: TeamConfig): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug('MPEOAS Engine already initialized');
      return;
    }

    try {
      this.logger.info('Initializing MPEOAS Engine');

      // 初始化团队状态管理器
      if (this.options.enableStateManagement) {
        this.teamStateManager = new TeamStateManager(this.logger, this.eventBus);
      }

      // 初始化角色状态同步器
      if (this.options.enableRoleSync) {
        this.roleStateSynchronizer = new RoleStateSynchronizer(this.logger, this.eventBus);
        
        // 如果有团队配置，注册角色状�?        if (teamConfig) {
          for (const role of teamConfig.roles) {
            this.roleStateSynchronizer.registerRoleState(
              role.id,
              role.initialState,
              {
                sessionId: `init-${Date.now()}`,
                teamId: teamConfig.name,
                currentState: 'initializing',
                timestamp: new Date(),
                metadata: { role: role.id }
              }
            );
          }
        }
      }

      // 初始化协作状态追踪器
      if (this.options.enableCollaborationTracking) {
        this.collaborationTracker = new CollaborationStateTracker(this.logger, this.eventBus);
      }

      // 初始化项目记忆集成器
      if (this.options.enableMemoryIntegration) {
        this.memoryIntegrator = new ProjectMemoryIntegrator(this.logger, this.eventBus);
      }

      // 初始化智能状态引�?      if (this.options.enableIntelligentState) {
        this.intelligentStateEngine = new IntelligentStateEngine(
          this.logger,
          this.eventBus,
          {
            maxActiveStates: 10,
            adaptationThreshold: 0.7,
            learningEnabled: true
          }
        );
      }

      this.isInitialized = true;
      
      this.logger.info('MPEOAS Engine initialized successfully');

      // 发布初始化完成事�?      this.eventBus.publishEvent('mpeoas.initialized', {
        components: this.getEnabledComponents(),
        teamConfig
      }, 'MPEOASEngine');

    } catch (error) {
      const engineError = this.createEngineError(error, 'initialize', { teamConfig });
      this.logger.error('MPEOAS Engine initialization failed', { error: engineError });
      throw engineError;
    }
  }

  /**
   * 启动引擎
   */
  public async start(context: StateContext): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MPEOAS Engine must be initialized before starting');
    }

    if (this.isRunning) {
      this.logger.debug('MPEOAS Engine already running');
      return;
    }

    try {
      this.logger.info('Starting MPEOAS Engine', { sessionId: context.sessionId });

      this.isRunning = true;
      
      this.logger.info('MPEOAS Engine started successfully');

      // 发布启动完成事件
      this.eventBus.publishEvent('mpeoas.started', {
        context,
        components: this.getEnabledComponents()
      }, 'MPEOASEngine');

    } catch (error) {
      const engineError = this.createEngineError(error, 'start', { context });
      this.logger.error('MPEOAS Engine start failed', { error: engineError });
      throw engineError;
    }
  }

  /**
   * 停止引擎
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.debug('MPEOAS Engine not running');
      return;
    }

    try {
      this.logger.info('Stopping MPEOAS Engine');

      this.isRunning = false;
      
      this.logger.info('MPEOAS Engine stopped successfully');

      // 发布停止完成事件
      this.eventBus.publishEvent('mpeoas.stopped', {
        timestamp: new Date()
      }, 'MPEOASEngine');

    } catch (error) {
      const engineError = this.createEngineError(error, 'stop', {});
      this.logger.error('MPEOAS Engine stop failed', { error: engineError });
      throw engineError;
    }
  }

  /**
   * 设置项目上下�?   */
  public setProjectContext(context: ProjectMemoryContext): void {
    if (this.memoryIntegrator) {
      this.memoryIntegrator.setProjectContext(context);
    }
  }

  /**
   * 执行状态转�?   */
  public async transitionState(
    trigger: string,
    context: StateContext,
    targetState?: string
  ) {
    if (!this.teamStateManager) {
      throw new Error('Team state management not enabled');
    }

    return await this.teamStateManager.transition(trigger, context, targetState);
  }

  /**
   * 获取PATEOAS响应
   */
  public generatePATEOASResponse(context: StateContext) {
    if (!this.teamStateManager) {
      throw new Error('Team state management not enabled');
    }

    return this.teamStateManager.generatePATEOASResponse(context);
  }

  /**
   * 开始协作会�?   */
  public async startCollaboration(
    name: string,
    participants: string[],
    initiator: string,
    type: any,
    context: StateContext,
    metadata: any
  ): Promise<string | null> {
    if (!this.collaborationTracker) {
      throw new Error('Collaboration tracking not enabled');
    }

    return await this.collaborationTracker.startCollaboration(
      name,
      participants,
      initiator,
      type,
      context,
      metadata
    );
  }

  /**
   * 获取团队状态管理器
   */
  public getTeamStateManager(): TeamStateManager | undefined {
    return this.teamStateManager;
  }

  /**
   * 获取角色状态同步器
   */
  public getRoleStateSynchronizer(): RoleStateSynchronizer | undefined {
    return this.roleStateSynchronizer;
  }

  /**
   * 获取协作状态追踪器
   */
  public getCollaborationTracker(): CollaborationStateTracker | undefined {
    return this.collaborationTracker;
  }

  /**
   * 获取项目记忆集成�?   */
  public getMemoryIntegrator(): ProjectMemoryIntegrator | undefined {
    return this.memoryIntegrator;
  }

  /**
   * 获取引擎状�?   */
  public getStatus(): {
    initialized: boolean;
    running: boolean;
    components: string[];
    teamState?: any;
    roleStates?: any;
    activeSessions?: any;
    memoryStats?: any;
  } {
    const status = {
      initialized: this.isInitialized,
      running: this.isRunning,
      components: this.getEnabledComponents()
    };

    if (this.teamStateManager) {
      (status as any).teamState = this.teamStateManager.getCurrentState();
    }

    if (this.roleStateSynchronizer) {
      (status as any).roleStates = this.roleStateSynchronizer.getSyncStatus();
    }

    if (this.collaborationTracker) {
      (status as any).activeSessions = this.collaborationTracker.getActiveSessions();
    }

    if (this.memoryIntegrator) {
      // 需要项目ID来获取统计信息，这里简化处�?      (status as any).memoryStats = { available: true };
    }

    return status;
  }

  /**
   * 获取已启用的组件
   */
  private getEnabledComponents(): string[] {
    const components: string[] = [];
    
    if (this.teamStateManager) components.push('TeamStateManager');
    if (this.roleStateSynchronizer) components.push('RoleStateSynchronizer');
    if (this.collaborationTracker) components.push('CollaborationTracker');
    if (this.memoryIntegrator) components.push('MemoryIntegrator');
    
    return components;
  }

  /**
   * 创建引擎错误
   */
  private createEngineError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const engineError = new Error(`MPEOAS Engine ${operation} failed: ${message}`) as MJOSError;
    
    engineError.code = 'MPEOASEngineError';
    engineError.component = 'MPEOASEngine';
    engineError.context = context;
    engineError.recoverable = true;
    engineError.timestamp = new Date();
    
    return engineError;
  }
}

/**
 * 创建MPEOAS引擎的便捷函�? */
export function createMPEOASEngine(
  logger: Logger,
  eventBus: EventBus,
  options?: MPEOASEngineOptions
): MPEOASEngine {
  return new MPEOASEngine(logger, eventBus, options);
}
