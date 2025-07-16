/**
 * MMPT Toolkit
 * Magic Multi-role Prompt Toolkit 工具�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, TeamConfig, MJOSError } from './types/index';
import { RoleRegistry } from './RoleRegistry';
import { PromptTemplateEngine } from './PromptTemplateEngine';
import { WorkflowScheduler } from './WorkflowScheduler';
import { ContextualPromptGenerator } from './ContextualPromptGenerator';
import { IntelligentStateEngine } from '../advanced-state/IntelligentStateEngine';
import { DualModeReasoning } from '../advanced-reasoning/DualModeReasoning';
import { EngramMemorySystem } from '../advanced-memory/EngramMemorySystem';

export interface MMPTToolkitOptions {
  enableRoleRegistry?: boolean;
  enableTemplateEngine?: boolean;
  enableWorkflowScheduler?: boolean;
  enableContextualGenerator?: boolean;
  enableIntelligentState?: boolean;
  enableDualModeReasoning?: boolean;
  autoLoadDefaults?: boolean;
}

/**
 * MMPT工具包类
 * 整合所有MMPT组件，提供统一的多角色提示词工具包
 */
export class MMPTToolkit {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly options: MMPTToolkitOptions;
  
  private roleRegistry?: RoleRegistry;
  private templateEngine?: PromptTemplateEngine;
  private workflowScheduler?: WorkflowScheduler;
  private contextualGenerator?: ContextualPromptGenerator;
  private stateEngine?: IntelligentStateEngine;
  private reasoningSystem?: DualModeReasoning;

  private isInitialized = false;

  constructor(
    logger: Logger,
    eventBus: EventBus,
    options: MMPTToolkitOptions = {}
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.options = {
      enableRoleRegistry: true,
      enableTemplateEngine: true,
      enableWorkflowScheduler: true,
      enableContextualGenerator: true,
      enableIntelligentState: true,
      enableDualModeReasoning: true,
      autoLoadDefaults: true,
      ...options
    };
    
    this.logger.info('MMPT Toolkit created', { options: this.options });
  }

  /**
   * 初始化工具包
   */
  public async initialize(teamConfig?: TeamConfig): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug('MMPT Toolkit already initialized');
      return;
    }

    try {
      this.logger.info('Initializing MMPT Toolkit');

      // 初始化角色注册表
      if (this.options.enableRoleRegistry) {
        this.roleRegistry = new RoleRegistry(this.logger, this.eventBus);
      }

      // 初始化提示词模板引擎
      if (this.options.enableTemplateEngine) {
        this.templateEngine = new PromptTemplateEngine(this.logger, this.eventBus);
      }

      // 初始化工作流调度�?      if (this.options.enableWorkflowScheduler) {
        this.workflowScheduler = new WorkflowScheduler(this.logger, this.eventBus);
      }

      // 初始化智能状态引�?      if (this.options.enableIntelligentState) {
        this.stateEngine = new IntelligentStateEngine(
          this.logger,
          this.eventBus,
          {
            maxActiveStates: 15,
            adaptationThreshold: 0.6,
            learningEnabled: true
          }
        );
      }

      // 初始化双模式推理系统
      if (this.options.enableDualModeReasoning) {
        this.reasoningSystem = new DualModeReasoning(
          this.logger,
          this.eventBus
        );
      }

      // 初始化上下文提示词生成器（与高级系统集成�?      if (this.options.enableContextualGenerator && this.templateEngine && this.roleRegistry) {
        this.contextualGenerator = new ContextualPromptGenerator(
          this.logger,
          this.eventBus,
          this.templateEngine,
          this.roleRegistry,
          this.stateEngine,
          this.reasoningSystem
        );
      }

      // 如果有团队配置，同步角色
      if (teamConfig && this.roleRegistry) {
        await this.syncTeamRoles(teamConfig);
      }

      this.isInitialized = true;
      
      this.logger.info('MMPT Toolkit initialized successfully');

      // 发布初始化完成事�?      this.eventBus.publishEvent('mmpt.initialized', {
        components: this.getEnabledComponents(),
        teamConfig
      }, 'MMPTToolkit');

    } catch (error) {
      const toolkitError = this.createToolkitError(error, 'initialize', { teamConfig });
      this.logger.error('MMPT Toolkit initialization failed', { error: toolkitError });
      throw toolkitError;
    }
  }

  /**
   * 获取角色注册�?   */
  public getRoleRegistry(): RoleRegistry | undefined {
    return this.roleRegistry;
  }

  /**
   * 获取提示词模板引�?   */
  public getTemplateEngine(): PromptTemplateEngine | undefined {
    return this.templateEngine;
  }

  /**
   * 获取工作流调度器
   */
  public getWorkflowScheduler(): WorkflowScheduler | undefined {
    return this.workflowScheduler;
  }

  /**
   * 获取上下文提示词生成�?   */
  public getContextualGenerator(): ContextualPromptGenerator | undefined {
    return this.contextualGenerator;
  }

  /**
   * 获取智能状态引�?   */
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
   * 生成角色提示�?   */
  public async generateRolePrompt(
    roleId: string,
    taskType: string,
    context: StateContext,
    options?: {
      adaptationLevel?: 'minimal' | 'moderate' | 'extensive' | 'dynamic';
      requirements?: string[];
      constraints?: string[];
    }
  ): Promise<string | null> {
    if (!this.contextualGenerator) {
      throw new Error('Contextual generator not enabled');
    }

    const request = {
      roleId,
      taskType,
      context,
      adaptationLevel: options?.adaptationLevel || 'moderate',
      requirements: options?.requirements,
      constraints: options?.constraints
    };

    const generatedPrompt = await this.contextualGenerator.generateContextualPrompt(request);
    return generatedPrompt ? generatedPrompt.content : null;
  }

  /**
   * 执行工作�?   */
  public async executeWorkflow(
    workflowId: string,
    context: StateContext
  ): Promise<string | null> {
    if (!this.workflowScheduler) {
      throw new Error('Workflow scheduler not enabled');
    }

    return await this.workflowScheduler.executeWorkflow(workflowId, context);
  }

  /**
   * 激活角�?   */
  public async activateRole(roleId: string): Promise<boolean> {
    if (!this.roleRegistry) {
      throw new Error('Role registry not enabled');
    }

    return await this.roleRegistry.activateRole(roleId);
  }

  /**
   * 获取工具包状�?   */
  public getStatus(): {
    initialized: boolean;
    components: string[];
    roleRegistry?: any;
    templateEngine?: any;
    workflowScheduler?: any;
    contextualGenerator?: any;
  } {
    const status = {
      initialized: this.isInitialized,
      components: this.getEnabledComponents()
    };

    if (this.roleRegistry) {
      (status as any).roleRegistry = this.roleRegistry.getRoleStatistics();
    }

    if (this.templateEngine) {
      (status as any).templateEngine = this.templateEngine.getTemplateStatistics();
    }

    if (this.workflowScheduler) {
      (status as any).workflowScheduler = this.workflowScheduler.getSchedulerStatistics();
    }

    if (this.contextualGenerator) {
      (status as any).contextualGenerator = { available: true };
    }

    return status;
  }

  /**
   * 同步团队角色
   */
  private async syncTeamRoles(teamConfig: TeamConfig): Promise<void> {
    if (!this.roleRegistry) return;

    for (const role of teamConfig.roles) {
      const existingRole = this.roleRegistry.getRoleDefinition(role.id);
      if (!existingRole) {
        // 从团队配置创建角色定�?        const roleDefinition = this.createRoleDefinitionFromConfig(role);
        await this.roleRegistry.registerRole(roleDefinition);
      }
    }
  }

  /**
   * 从配置创建角色定�?   */
  private createRoleDefinitionFromConfig(role: any): any {
    return {
      id: role.id,
      name: role.name || role.id,
      type: role.type,
      capabilities: role.capabilities || [],
      priority: role.priority || 5,
      initialState: role.initialState || 'READY',
      memoryAccess: role.memoryAccess || 'shared',
      prompts: {
        system: `你是${role.name || role.id}，负�?{role.capabilities?.join('�?) || '各种任务'}。`,
        initialization: '准备开始工作�?,
        taskExecution: '执行分配的任务�?,
        collaboration: '与团队成员协作�?,
        reflection: '反思工作过程和结果�?,
        templates: new Map()
      },
      constraints: {
        maxTokens: 4000,
        timeoutMs: 30000,
        allowedActions: ['analyze', 'create', 'collaborate', 'review'],
        forbiddenActions: [],
        accessLevels: ['project', 'shared']
      },
      behaviors: {
        decisionMaking: 'collaborative',
        communicationStyle: 'professional',
        learningMode: 'active',
        errorHandling: 'tolerant',
        workflowPreference: 'flexible'
      },
      interactions: {
        preferredPartners: [],
        conflictResolution: 'negotiate',
        collaborationPatterns: [],
        communicationProtocols: []
      },
      version: '1.0.0',
      status: 'active',
      metadata: {
        author: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        tags: [role.type],
        description: `Role created from team configuration`,
        usageCount: 0,
        successRate: 0
      }
    };
  }

  /**
   * 获取已启用的组件
   */
  private getEnabledComponents(): string[] {
    const components: string[] = [];

    if (this.roleRegistry) components.push('RoleRegistry');
    if (this.templateEngine) components.push('TemplateEngine');
    if (this.workflowScheduler) components.push('WorkflowScheduler');
    if (this.contextualGenerator) components.push('ContextualGenerator');
    if (this.stateEngine) components.push('IntelligentStateEngine');
    if (this.reasoningSystem) components.push('DualModeReasoning');

    return components;
  }

  /**
   * 创建工具包错�?   */
  private createToolkitError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const toolkitError = new Error(`MMPT Toolkit ${operation} failed: ${message}`) as MJOSError;
    
    toolkitError.code = 'MMPTToolkitError';
    toolkitError.component = 'MMPTToolkit';
    toolkitError.context = context;
    toolkitError.recoverable = true;
    toolkitError.timestamp = new Date();
    
    return toolkitError;
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    if (this.workflowScheduler) {
      this.workflowScheduler.destroy();
    }

    this.logger.info('MMPT Toolkit destroyed');
  }
}

/**
 * 创建MMPT工具包的便捷函数
 */
export function createMMPTToolkit(
  logger: Logger,
  eventBus: EventBus,
  options?: MMPTToolkitOptions
): MMPTToolkit {
  return new MMPTToolkit(logger, eventBus, options);
}
