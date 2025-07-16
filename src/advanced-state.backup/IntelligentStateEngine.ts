/**
 * Intelligent State Engine
 * 智能状态引�?- 告别system prompt地狱，实现状态驱动的动态提示词生成
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, MJOSError } from './types/index';
import { EngramMemorySystem, EngramTrace } from '../advanced-memory/EngramMemorySystem';

export interface StateDefinition {
  id: string;
  name: string;
  description: string;
  category: StateCategory;
  triggers: StateTrigger[];
  conditions: StateCondition[];
  actions: StateAction[];
  promptTemplate: PromptTemplate;
  transitions: StateTransition[];
  metadata: StateMetadata;
}

export type StateCategory =
  | 'cognitive' // 认知状�?  | 'emotional' // 情感状�?  | 'contextual' // 上下文状�?  | 'collaborative' // 协作状�?  | 'task-specific' // 任务特定状�?  | 'meta'; // 元状�?
export interface StateTrigger {
  id: string;
  type: TriggerType;
  condition: string; // 触发条件表达�?  priority: number;
  cooldown?: number; // 冷却时间(ms)
}

export type TriggerType =
  | 'event' // 事件触发
  | 'time' // 时间触发
  | 'context' // 上下文变化触�?  | 'memory' // 记忆触发
  | 'user-input' // 用户输入触发
  | 'system'; // 系统触发

export interface StateCondition {
  id: string;
  expression: string; // 条件表达�?  weight: number; // 权重
  required: boolean; // 是否必需
}

export interface StateAction {
  id: string;
  type: ActionType;
  parameters: Record<string, any>;
  priority: number;
  async: boolean;
}

export type ActionType =
  | 'generate-prompt' // 生成提示�?  | 'update-context' // 更新上下�?  | 'trigger-memory' // 触发记忆
  | 'send-event' // 发送事�?  | 'modify-behavior' // 修改行为
  | 'adjust-parameters'; // 调整参数

export interface PromptTemplate {
  id: string;
  baseTemplate: string;
  dynamicSections: DynamicSection[];
  variables: TemplateVariable[];
  adaptationRules: AdaptationRule[];
  contextualModifiers: ContextualModifier[];
}

export interface DynamicSection {
  id: string;
  name: string;
  template: string;
  conditions: string[]; // 显示条件
  priority: number;
  optional: boolean;
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  source: VariableSource;
  defaultValue?: any;
  transformer?: string; // 转换函数�?}

export type VariableType = 'string' | 'number' | 'boolean' | 'object' | 'array';
export type VariableSource = 'context' | 'memory' | 'user' | 'system' | 'computed';

export interface AdaptationRule {
  id: string;
  condition: string;
  modification: PromptModification;
  priority: number;
}

export interface PromptModification {
  type: ModificationType;
  target: string; // 目标部分
  content: string; // 修改内容
  operation: 'replace' | 'append' | 'prepend' | 'insert' | 'remove';
}

export type ModificationType =
  | 'tone-adjustment' // 语调调整
  | 'detail-level' // 详细程度
  | 'formality' // 正式程度
  | 'creativity' // 创造�?  | 'focus-area' // 关注领域
  | 'constraint-addition'; // 约束添加

export interface ContextualModifier {
  id: string;
  contextType: string;
  modifier: string;
  weight: number;
}

export interface StateTransition {
  id: string;
  fromState: string;
  toState: string;
  condition: string;
  probability: number;
  cost: number; // 转换成本
}

export interface StateMetadata {
  version: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  usage: StateUsage;
  effectiveness: StateEffectiveness;
}

export interface StateUsage {
  activationCount: number;
  totalDuration: number; // 总持续时�?ms)
  averageDuration: number;
  lastActivated?: Date;
}

export interface StateEffectiveness {
  successRate: number; // 成功�?  userSatisfaction: number; // 用户满意�?  taskCompletion: number; // 任务完成�?  adaptationAccuracy: number; // 适应准确�?}

export interface ActiveState {
  stateId: string;
  definition: StateDefinition;
  activatedAt: Date;
  context: StateContext;
  generatedPrompt: string;
  variables: Map<string, any>;
  adaptations: PromptAdaptation[];
  metrics: StateMetrics;
}

export interface PromptAdaptation {
  ruleId: string;
  modification: PromptModification;
  appliedAt: Date;
  effectiveness?: number;
}

export interface StateMetrics {
  responseTime: number;
  memoryAccess: number;
  contextUpdates: number;
  adaptationCount: number;
  userInteractions: number;
}

export interface StateEngineConfig {
  maxActiveStates: number;
  defaultStateTimeout: number;
  adaptationThreshold: number;
  memoryIntegration: boolean;
  learningEnabled: boolean;
  debugMode: boolean;
}

/**
 * 智能状态引擎类
 * 实现状态驱动的动态提示词生成，告别传统的system prompt地狱
 */
export class IntelligentStateEngine {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly config: StateEngineConfig;
  private readonly memorySystem?: EngramMemorySystem;

  private stateDefinitions = new Map<string, StateDefinition>();
  private activeStates = new Map<string, ActiveState>();
  private stateHistory: Array<{
    stateId: string;
    activatedAt: Date;
    deactivatedAt: Date;
    context: StateContext;
    effectiveness: number;
  }> = [];

  private triggerEvaluator: TriggerEvaluator;
  private promptGenerator: DynamicPromptGenerator;
  private adaptationEngine: PromptAdaptationEngine;

  constructor(
    logger: Logger,
    eventBus: EventBus,
    config: Partial<StateEngineConfig> = {},
    memorySystem?: EngramMemorySystem
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.memorySystem = memorySystem;
    this.config = {
      maxActiveStates: 5,
      defaultStateTimeout: 300000, // 5分钟
      adaptationThreshold: 0.7,
      memoryIntegration: true,
      learningEnabled: true,
      debugMode: false,
      ...config
    };

    this.triggerEvaluator = new TriggerEvaluator(logger, eventBus);
    this.promptGenerator = new DynamicPromptGenerator(logger, eventBus);
    this.adaptationEngine = new PromptAdaptationEngine(logger, eventBus);

    this.initializeDefaultStates();
    this.setupEventListeners();

    this.logger.info('Intelligent State Engine initialized', {
      config: this.config,
      memoryIntegration: !!this.memorySystem
    });
  }

  /**
   * 注册状态定�?   */
  public registerState(stateDefinition: StateDefinition): void {
    this.stateDefinitions.set(stateDefinition.id, stateDefinition);

    this.logger.debug('State definition registered', {
      stateId: stateDefinition.id,
      stateName: stateDefinition.name,
      category: stateDefinition.category
    });

    this.eventBus.publishEvent('state.definition_registered', {
      stateDefinition
    }, 'IntelligentStateEngine');
  }

  /**
   * 激活状�?   */
  public async activateState(
    stateId: string,
    context: StateContext,
    force: boolean = false
  ): Promise<string | null> {
    try {
      const stateDefinition = this.stateDefinitions.get(stateId);
      if (!stateDefinition) {
        throw new Error(`State definition not found: ${stateId}`);
      }

      // 检查是否已激�?      if (this.activeStates.has(stateId) && !force) {
        this.logger.debug('State already active', { stateId });
        return this.activeStates.get(stateId)!.generatedPrompt;
      }

      // 检查激活条�?      const conditionsMet = await this.evaluateStateConditions(stateDefinition, context);
      if (!conditionsMet && !force) {
        this.logger.debug('State activation conditions not met', { stateId });
        return null;
      }

      // 管理活跃状态数�?      await this.manageActiveStates();

      // 生成动态提示词
      const generatedPrompt = await this.generateDynamicPrompt(stateDefinition, context);

      // 创建活跃状�?      const activeState: ActiveState = {
        stateId,
        definition: stateDefinition,
        activatedAt: new Date(),
        context,
        generatedPrompt,
        variables: new Map(),
        adaptations: [],
        metrics: {
          responseTime: 0,
          memoryAccess: 0,
          contextUpdates: 0,
          adaptationCount: 0,
          userInteractions: 0
        }
      };

      this.activeStates.set(stateId, activeState);

      // 更新使用统计
      stateDefinition.metadata.usage.activationCount++;
      stateDefinition.metadata.usage.lastActivated = new Date();

      this.logger.info('State activated', {
        stateId,
        stateName: stateDefinition.name,
        promptLength: generatedPrompt.length
      });

      this.eventBus.publishEvent('state.activated', {
        stateId,
        activeState,
        context
      }, 'IntelligentStateEngine');

      return generatedPrompt;

    } catch (error) {
      this.logger.error('Failed to activate state', {
        stateId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 更新状态上下文
   */
  public async updateStateContext(
    stateId: string,
    contextUpdates: Partial<StateContext>
  ): Promise<boolean> {
    try {
      const activeState = this.activeStates.get(stateId);
      if (!activeState) {
        return false;
      }

      // 更新上下�?      activeState.context = { ...activeState.context, ...contextUpdates };
      activeState.metrics.contextUpdates++;

      // 检查是否需要重新生成提示词
      const needsRegeneration = await this.checkPromptRegenerationNeed(activeState);

      if (needsRegeneration) {
        const newPrompt = await this.generateDynamicPrompt(
          activeState.definition,
          activeState.context
        );

        activeState.generatedPrompt = newPrompt;

        this.logger.debug('Prompt regenerated due to context update', {
          stateId,
          newPromptLength: newPrompt.length
        });
      }

      this.eventBus.publishEvent('state.context_updated', {
        stateId,
        contextUpdates,
        promptRegenerated: needsRegeneration
      }, 'IntelligentStateEngine');

      return true;

    } catch (error) {
      this.logger.error('Failed to update state context', {
        stateId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 停用状�?   */
  public async deactivateState(stateId: string): Promise<boolean> {
    try {
      const activeState = this.activeStates.get(stateId);
      if (!activeState) {
        return false;
      }

      // 计算状态持续时�?      const duration = Date.now() - activeState.activatedAt.getTime();

      // 更新统计信息
      const stateDefinition = activeState.definition;
      stateDefinition.metadata.usage.totalDuration += duration;
      stateDefinition.metadata.usage.averageDuration =
        stateDefinition.metadata.usage.totalDuration /
        stateDefinition.metadata.usage.activationCount;

      // 记录历史
      this.stateHistory.push({
        stateId,
        activatedAt: activeState.activatedAt,
        deactivatedAt: new Date(),
        context: activeState.context,
        effectiveness: this.calculateStateEffectiveness(activeState)
      });

      // 移除活跃状�?      this.activeStates.delete(stateId);

      this.logger.info('State deactivated', {
        stateId,
        duration,
        effectiveness: this.stateHistory[this.stateHistory.length - 1].effectiveness
      });

      this.eventBus.publishEvent('state.deactivated', {
        stateId,
        duration,
        metrics: activeState.metrics
      }, 'IntelligentStateEngine');

      return true;

    } catch (error) {
      this.logger.error('Failed to deactivate state', {
        stateId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 获取当前提示�?   */
  public getCurrentPrompt(stateId: string): string | null {
    const activeState = this.activeStates.get(stateId);
    return activeState ? activeState.generatedPrompt : null;
  }

  /**
   * 获取所有活跃状�?   */
  public getActiveStates(): Array<{
    stateId: string;
    stateName: string;
    category: StateCategory;
    activatedAt: Date;
    promptLength: number;
  }> {
    return Array.from(this.activeStates.values()).map(state => ({
      stateId: state.stateId,
      stateName: state.definition.name,
      category: state.definition.category,
      activatedAt: state.activatedAt,
      promptLength: state.generatedPrompt.length
    }));
  }
}
