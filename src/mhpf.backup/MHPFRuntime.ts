/**
 * MHPF Runtime
 * Magic Human-AI Partnership Framework 运行�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { TeamConfig, StateContext, MJOSError } from './types/index';
import { TeamController, TeamControllerOptions } from './TeamController';
import { RoleCapabilityMatrix } from './RoleCapabilityMatrix';
import { CollaborationOrchestrator } from './CollaborationOrchestrator';
import { SharedKnowledgePool } from './SharedKnowledgePool';
import { EngramMemorySystem } from '../advanced-memory/EngramMemorySystem';
import { IntelligentStateEngine } from '../advanced-state/IntelligentStateEngine';
import { DualModeReasoning } from '../advanced-reasoning/DualModeReasoning';
import { ThreeLayerKnowledgeSystem } from '../advanced-knowledge/ThreeLayerKnowledgeSystem';

export interface MHPFRuntimeOptions {
  teamController?: TeamControllerOptions;
  enableKnowledgeSharing?: boolean;
  enableOrchestration?: boolean;
  enableCapabilityMatrix?: boolean;
  enableAdvancedMemory?: boolean;
  enableIntelligentState?: boolean;
  enableDualModeReasoning?: boolean;
  enableThreeLayerKnowledge?: boolean;
}

/**
 * MHPF运行时类
 * 整合所有MHPF组件，提供统一的运行时环境
 */
export class MHPFRuntime {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly options: MHPFRuntimeOptions;
  
  private teamController?: TeamController;
  private capabilityMatrix?: RoleCapabilityMatrix;
  private orchestrator?: CollaborationOrchestrator;
  private knowledgePool?: SharedKnowledgePool;

  // 高级功能组件
  private memorySystem?: EngramMemorySystem;
  private stateEngine?: IntelligentStateEngine;
  private reasoningSystem?: DualModeReasoning;
  private knowledgeSystem?: ThreeLayerKnowledgeSystem;

  private isInitialized = false;
  private isRunning = false;

  constructor(
    logger: Logger,
    eventBus: EventBus,
    options: MHPFRuntimeOptions = {}
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.options = {
      enableKnowledgeSharing: true,
      enableOrchestration: true,
      enableCapabilityMatrix: true,
      enableAdvancedMemory: true,
      enableIntelligentState: true,
      enableDualModeReasoning: true,
      enableThreeLayerKnowledge: true,
      ...options
    };
    
    this.logger.info('MHPF Runtime created', { options: this.options });
  }

  /**
   * 初始化运行时
   */
  public async initialize(teamConfig: TeamConfig): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug('MHPF Runtime already initialized');
      return;
    }

    try {
      this.logger.info('Initializing MHPF Runtime', {
        teamName: teamConfig.name,
        roleCount: teamConfig.roles.length
      });

      // 初始化高级记忆系�?      if (this.options.enableAdvancedMemory) {
        this.memorySystem = new EngramMemorySystem(this.logger, this.eventBus);
      }

      // 初始化智能状态引�?      if (this.options.enableIntelligentState) {
        this.stateEngine = new IntelligentStateEngine(
          this.logger,
          this.eventBus,
          {},
          this.memorySystem
        );
      }

      // 初始化双模式推理系统
      if (this.options.enableDualModeReasoning) {
        this.reasoningSystem = new DualModeReasoning(
          this.logger,
          this.eventBus,
          this.memorySystem
        );
      }

      // 初始化三层知识体�?      if (this.options.enableThreeLayerKnowledge) {
        this.knowledgeSystem = new ThreeLayerKnowledgeSystem(
          this.logger,
          this.eventBus,
          this.memorySystem
        );
      }

      // 初始化能力矩�?      if (this.options.enableCapabilityMatrix) {
        this.capabilityMatrix = new RoleCapabilityMatrix(this.logger, this.eventBus);

        // 注册所有角�?        for (const role of teamConfig.roles) {
          this.capabilityMatrix.registerRole(role);
        }
      }

      // 初始化知识池（与三层知识体系集成�?      if (this.options.enableKnowledgeSharing) {
        this.knowledgePool = new SharedKnowledgePool(
          this.logger,
          this.eventBus,
          this.knowledgeSystem
        );
      }

      // 初始化协作编排器（与推理系统集成�?      if (this.options.enableOrchestration) {
        this.orchestrator = new CollaborationOrchestrator(
          this.logger,
          this.eventBus,
          this.reasoningSystem
        );
      }

      // 初始化团队控制器（与所有高级系统集成）
      this.teamController = new TeamController(
        teamConfig,
        this.logger,
        this.eventBus,
        this.options.teamController,
        this.memorySystem,
        this.stateEngine
      );

      this.isInitialized = true;
      
      this.logger.info('MHPF Runtime initialized successfully');

      // 发布初始化完成事�?      this.eventBus.publishEvent('mhpf.initialized', {
        teamConfig,
        components: this.getEnabledComponents()
      }, 'MHPFRuntime');

    } catch (error) {
      const runtimeError = this.createRuntimeError(error, 'initialize', { teamConfig });
      this.logger.error('MHPF Runtime initialization failed', { error: runtimeError });
      throw runtimeError;
    }
  }

  /**
   * 启动运行�?   */
  public async start(context: StateContext): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MHPF Runtime must be initialized before starting');
    }

    if (this.isRunning) {
      this.logger.debug('MHPF Runtime already running');
      return;
    }

    try {
      this.logger.info('Starting MHPF Runtime', { sessionId: context.sessionId });

      // 激活团�?      if (this.teamController) {
        const activationResult = await this.teamController.activateTeam(context);
        if (!activationResult.success) {
          throw new Error(`Team activation failed: ${activationResult.error?.message}`);
        }
      }

      this.isRunning = true;
      
      this.logger.info('MHPF Runtime started successfully');

      // 发布启动完成事件
      this.eventBus.publishEvent('mhpf.started', {
        context,
        components: this.getEnabledComponents()
      }, 'MHPFRuntime');

    } catch (error) {
      const runtimeError = this.createRuntimeError(error, 'start', { context });
      this.logger.error('MHPF Runtime start failed', { error: runtimeError });
      throw runtimeError;
    }
  }

  /**
   * 停止运行�?   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.debug('MHPF Runtime not running');
      return;
    }

    try {
      this.logger.info('Stopping MHPF Runtime');

      this.isRunning = false;
      
      this.logger.info('MHPF Runtime stopped successfully');

      // 发布停止完成事件
      this.eventBus.publishEvent('mhpf.stopped', {
        timestamp: new Date()
      }, 'MHPFRuntime');

    } catch (error) {
      const runtimeError = this.createRuntimeError(error, 'stop', {});
      this.logger.error('MHPF Runtime stop failed', { error: runtimeError });
      throw runtimeError;
    }
  }

  /**
   * 获取团队控制�?   */
  public getTeamController(): TeamController | undefined {
    return this.teamController;
  }

  /**
   * 获取能力矩阵
   */
  public getCapabilityMatrix(): RoleCapabilityMatrix | undefined {
    return this.capabilityMatrix;
  }

  /**
   * 获取协作编排�?   */
  public getOrchestrator(): CollaborationOrchestrator | undefined {
    return this.orchestrator;
  }

  /**
   * 获取知识�?   */
  public getKnowledgePool(): SharedKnowledgePool | undefined {
    return this.knowledgePool;
  }

  /**
   * 获取记忆系统
   */
  public getMemorySystem(): EngramMemorySystem | undefined {
    return this.memorySystem;
  }

  /**
   * 获取状态引�?   */
  public getStateEngine(): IntelligentStateEngine | undefined {
    return this.stateEngine;
  }

  /**
   * 获取推理系统
   */
  public getReasoningSystem(): DualModeReasoning | undefined {
    return this.reasoningSystem;
  }

  /**
   * 获取知识体系
   */
  public getKnowledgeSystem(): ThreeLayerKnowledgeSystem | undefined {
    return this.knowledgeSystem;
  }

  /**
   * 获取运行时状�?   */
  public getStatus(): {
    initialized: boolean;
    running: boolean;
    components: string[];
    teamState?: any;
    capabilities?: any;
    knowledge?: any;
  } {
    const status = {
      initialized: this.isInitialized,
      running: this.isRunning,
      components: this.getEnabledComponents()
    };

    if (this.teamController) {
      (status as any).teamState = this.teamController.getTeamState();
    }

    if (this.capabilityMatrix) {
      (status as any).capabilities = this.capabilityMatrix.getCapabilityStatistics();
    }

    if (this.knowledgePool) {
      (status as any).knowledge = this.knowledgePool.getKnowledgeStatistics();
    }

    // 高级系统状�?    if (this.memorySystem) {
      (status as any).memory = this.memorySystem.getStatistics();
    }

    if (this.stateEngine) {
      (status as any).states = this.stateEngine.getActiveStates();
    }

    if (this.reasoningSystem) {
      (status as any).reasoning = this.reasoningSystem.getReasoningStatistics();
    }

    if (this.knowledgeSystem) {
      (status as any).knowledgeSystem = {
        // 简化的知识系统状�?        layersActive: 3,
        totalQueries: 0
      };
    }

    return status;
  }

  /**
   * 获取已启用的组件
   */
  private getEnabledComponents(): string[] {
    const components: string[] = [];

    if (this.teamController) components.push('TeamController');
    if (this.capabilityMatrix) components.push('CapabilityMatrix');
    if (this.orchestrator) components.push('Orchestrator');
    if (this.knowledgePool) components.push('KnowledgePool');

    // 高级功能组件
    if (this.memorySystem) components.push('EngramMemorySystem');
    if (this.stateEngine) components.push('IntelligentStateEngine');
    if (this.reasoningSystem) components.push('DualModeReasoning');
    if (this.knowledgeSystem) components.push('ThreeLayerKnowledgeSystem');

    return components;
  }

  /**
   * 创建运行时错�?   */
  private createRuntimeError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const runtimeError = new Error(`MHPF Runtime ${operation} failed: ${message}`) as MJOSError;
    
    runtimeError.code = 'MHPFRuntimeError';
    runtimeError.component = 'MHPFRuntime';
    runtimeError.context = context;
    runtimeError.recoverable = true;
    runtimeError.timestamp = new Date();
    
    return runtimeError;
  }
}

/**
 * 创建MHPF运行时的便捷函数
 */
export function createMHPFRuntime(
  logger: Logger,
  eventBus: EventBus,
  options?: MHPFRuntimeOptions
): MHPFRuntime {
  return new MHPFRuntime(logger, eventBus, options);
}
