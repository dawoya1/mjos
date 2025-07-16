/**
 * MPEOAS Team State Manager
 * Magic Process Engine of AI State 团队状态管理器
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { 
  TeamState, 
  StateTransition, 
  StateContext, 
  CollaborationMode,
  MJOSError 
} from './types/index';

export interface StateDefinition {
  id: string;
  name: string;
  description: string;
  entryConditions: string[];
  exitConditions: string[];
  allowedTransitions: Map<string, string>; // trigger -> target state
  stateActions: {
    onEnter?: (context: StateContext) => Promise<void>;
    onExit?: (context: StateContext) => Promise<void>;
    onUpdate?: (context: StateContext) => Promise<void>;
  };
  metadata: {
    category: 'operational' | 'collaborative' | 'transitional';
    priority: number;
    timeout?: number;
  };
}

export interface StateTransitionResult {
  success: boolean;
  fromState: string;
  toState: string;
  trigger: string;
  timestamp: Date;
  context: StateContext;
  error?: MJOSError;
  sideEffects: string[];
}

export interface TeamStateSnapshot {
  id: string;
  timestamp: Date;
  teamState: TeamState;
  context: StateContext;
  checksum: string;
}

/**
 * 团队状态管理器�? * 基于PATEOAS原理管理团队状态转换和连续�? */
export class TeamStateManager {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private stateDefinitions = new Map<string, StateDefinition>();
  private currentState: TeamState;
  private stateHistory: StateTransitionResult[] = [];
  private stateSnapshots: TeamStateSnapshot[] = [];
  private transitionInProgress = false;

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.initializeDefaultStates();
    this.currentState = this.createInitialState();
    this.setupEventListeners();
    
    this.logger.info('Team State Manager initialized');
  }

  /**
   * 执行状态转�?   */
  public async transition(
    trigger: string,
    context: StateContext,
    targetState?: string
  ): Promise<StateTransitionResult> {
    if (this.transitionInProgress) {
      throw new Error('State transition already in progress');
    }

    this.transitionInProgress = true;

    try {
      this.logger.info('Starting state transition', {
        currentState: this.currentState.collaborationMode,
        trigger,
        targetState,
        sessionId: context.sessionId
      });

      // 验证转换条件
      const validationResult = await this.validateTransition(trigger, context, targetState);
      if (!validationResult.valid) {
        throw new Error(`Invalid transition: ${validationResult.reason}`);
      }

      const fromState = this.currentState.collaborationMode;
      const toState = targetState || validationResult.targetState!;

      // 创建状态快�?      await this.createStateSnapshot(context);

      // 执行退出动�?      await this.executeExitActions(fromState, context);

      // 更新状�?      const previousState = { ...this.currentState };
      this.currentState = await this.createNewState(toState, context);

      // 执行进入动作
      await this.executeEnterActions(toState, context);

      // 记录转换结果
      const result: StateTransitionResult = {
        success: true,
        fromState,
        toState,
        trigger,
        timestamp: new Date(),
        context,
        sideEffects: await this.identifySideEffects(fromState, toState, context)
      };

      this.stateHistory.push(result);

      this.logger.info('State transition completed', {
        fromState,
        toState,
        trigger,
        sessionId: context.sessionId
      });

      // 发布状态转换事�?      this.eventBus.publishEvent('team_state.transitioned', {
        result,
        previousState,
        currentState: this.currentState
      }, 'TeamStateManager');

      return result;

    } catch (error) {
      const stateError = this.createStateError(error, 'transition', { trigger, context });
      
      const result: StateTransitionResult = {
        success: false,
        fromState: this.currentState.collaborationMode,
        toState: targetState || 'unknown',
        trigger,
        timestamp: new Date(),
        context,
        error: stateError,
        sideEffects: []
      };

      this.stateHistory.push(result);
      this.logger.error('State transition failed', { error: stateError });

      return result;

    } finally {
      this.transitionInProgress = false;
    }
  }

  /**
   * 获取当前状�?   */
  public getCurrentState(): TeamState {
    return { ...this.currentState };
  }

  /**
   * 获取可用的下一步操�?   */
  public getAvailableActions(context: StateContext): Array<{
    trigger: string;
    targetState: string;
    description: string;
    confidence: number;
    prerequisites: string[];
  }> {
    const currentStateId = this.currentState.collaborationMode;
    const stateDefinition = this.stateDefinitions.get(currentStateId);
    
    if (!stateDefinition) {
      return [];
    }

    const actions: Array<{
      trigger: string;
      targetState: string;
      description: string;
      confidence: number;
      prerequisites: string[];
    }> = [];

    for (const [trigger, targetState] of stateDefinition.allowedTransitions) {
      const targetDefinition = this.stateDefinitions.get(targetState);
      if (!targetDefinition) continue;

      const confidence = this.calculateActionConfidence(trigger, targetState, context);
      const prerequisites = this.getActionPrerequisites(trigger, targetState, context);

      actions.push({
        trigger,
        targetState,
        description: `Transition to ${targetDefinition.name}`,
        confidence,
        prerequisites
      });
    }

    return actions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 获取状态历�?   */
  public getStateHistory(filter?: {
    sessionId?: string;
    fromState?: string;
    toState?: string;
    since?: Date;
    limit?: number;
  }): StateTransitionResult[] {
    let history = [...this.stateHistory];

    if (filter) {
      if (filter.sessionId) {
        history = history.filter(h => h.context.sessionId === filter.sessionId);
      }
      if (filter.fromState) {
        history = history.filter(h => h.fromState === filter.fromState);
      }
      if (filter.toState) {
        history = history.filter(h => h.toState === filter.toState);
      }
      if (filter.since) {
        history = history.filter(h => h.timestamp >= filter.since!);
      }
      if (filter.limit) {
        history = history.slice(-filter.limit);
      }
    }

    return history;
  }

  /**
   * 恢复状态快�?   */
  public async restoreSnapshot(snapshotId: string, context: StateContext): Promise<boolean> {
    try {
      const snapshot = this.stateSnapshots.find(s => s.id === snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      // 验证快照完整�?      if (!this.validateSnapshot(snapshot)) {
        throw new Error(`Snapshot validation failed: ${snapshotId}`);
      }

      this.logger.info('Restoring state snapshot', {
        snapshotId,
        timestamp: snapshot.timestamp
      });

      // 恢复状�?      this.currentState = { ...snapshot.teamState };

      // 记录恢复操作
      const result: StateTransitionResult = {
        success: true,
        fromState: 'unknown',
        toState: this.currentState.collaborationMode,
        trigger: 'restore_snapshot',
        timestamp: new Date(),
        context,
        sideEffects: ['state_restored_from_snapshot']
      };

      this.stateHistory.push(result);

      // 发布恢复事件
      this.eventBus.publishEvent('team_state.restored', {
        snapshotId,
        snapshot,
        currentState: this.currentState
      }, 'TeamStateManager');

      return true;

    } catch (error) {
      this.logger.error('Failed to restore snapshot', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 生成PATEOAS响应
   */
  public generatePATEOASResponse(context: StateContext): {
    timestamp: string;
    current_state: {
      id: string;
      name: string;
      description: string;
      progress: number;
      metadata: any;
    };
    execution_result: {
      team_output: any;
      collaboration_insights: string[];
      quality_metrics: any;
    };
    next_actions: Array<{
      trigger: string;
      target_state: string;
      description: string;
      confidence: number;
    }>;
    navigation: {
      current_path: string[];
      possible_paths: string[];
      breadcrumbs: Array<{ state: string; timestamp: Date }>;
    };
    recovery_options: Array<{
      snapshot_id: string;
      timestamp: Date;
      description: string;
    }>;
  } {
    const stateDefinition = this.stateDefinitions.get(this.currentState.collaborationMode);
    const availableActions = this.getAvailableActions(context);

    return {
      timestamp: new Date().toISOString(),
      current_state: {
        id: this.currentState.collaborationMode,
        name: stateDefinition?.name || this.currentState.collaborationMode,
        description: stateDefinition?.description || 'Current team state',
        progress: this.currentState.progress,
        metadata: this.currentState.metadata
      },
      execution_result: {
        team_output: this.generateTeamOutput(),
        collaboration_insights: this.generateCollaborationInsights(),
        quality_metrics: this.generateQualityMetrics()
      },
      next_actions: availableActions.map(action => ({
        trigger: action.trigger,
        target_state: action.targetState,
        description: action.description,
        confidence: action.confidence
      })),
      navigation: {
        current_path: this.getCurrentPath(),
        possible_paths: this.getPossiblePaths(),
        breadcrumbs: this.generateBreadcrumbs()
      },
      recovery_options: this.getRecoveryOptions()
    };
  }

  /**
   * 初始化默认状�?   */
  private initializeDefaultStates(): void {
    const defaultStates: StateDefinition[] = [
      {
        id: 'idle',
        name: '待命状�?,
        description: '团队处于待命状态，等待任务分配',
        entryConditions: [],
        exitConditions: ['has_task', 'team_activated'],
        allowedTransitions: new Map([
          ['activate_team', 'planning'],
          ['assign_task', 'planning']
        ]),
        stateActions: {
          onEnter: async (context) => {
            this.logger.debug('Entering idle state', { sessionId: context.sessionId });
          }
        },
        metadata: {
          category: 'operational',
          priority: 1
        }
      },
      {
        id: 'planning',
        name: '规划状�?,
        description: '团队正在进行项目规划和需求分�?,
        entryConditions: ['team_activated'],
        exitConditions: ['planning_complete', 'requirements_defined'],
        allowedTransitions: new Map([
          ['complete_planning', 'development'],
          ['need_analysis', 'collaboration'],
          ['cancel_project', 'idle']
        ]),
        stateActions: {
          onEnter: async (context) => {
            this.logger.debug('Entering planning state', { sessionId: context.sessionId });
          }
        },
        metadata: {
          category: 'collaborative',
          priority: 2,
          timeout: 3600000 // 1 hour
        }
      },
      {
        id: 'development',
        name: '开发状�?,
        description: '团队正在进行开发和实现工作',
        entryConditions: ['planning_complete'],
        exitConditions: ['development_complete', 'milestone_reached'],
        allowedTransitions: new Map([
          ['complete_development', 'review'],
          ['need_collaboration', 'collaboration'],
          ['encounter_issue', 'collaboration']
        ]),
        stateActions: {
          onEnter: async (context) => {
            this.logger.debug('Entering development state', { sessionId: context.sessionId });
          }
        },
        metadata: {
          category: 'operational',
          priority: 3
        }
      },
      {
        id: 'collaboration',
        name: '协作状�?,
        description: '团队正在进行深度协作和问题解�?,
        entryConditions: ['need_collaboration'],
        exitConditions: ['issue_resolved', 'consensus_reached'],
        allowedTransitions: new Map([
          ['resolve_issue', 'development'],
          ['complete_collaboration', 'development'],
          ['escalate_issue', 'review']
        ]),
        stateActions: {
          onEnter: async (context) => {
            this.logger.debug('Entering collaboration state', { sessionId: context.sessionId });
          }
        },
        metadata: {
          category: 'collaborative',
          priority: 4
        }
      },
      {
        id: 'review',
        name: '审查状�?,
        description: '团队正在进行质量审查和验�?,
        entryConditions: ['development_complete'],
        exitConditions: ['review_complete', 'quality_approved'],
        allowedTransitions: new Map([
          ['approve_quality', 'deployment'],
          ['request_changes', 'development'],
          ['need_rework', 'planning']
        ]),
        stateActions: {
          onEnter: async (context) => {
            this.logger.debug('Entering review state', { sessionId: context.sessionId });
          }
        },
        metadata: {
          category: 'operational',
          priority: 5
        }
      },
      {
        id: 'deployment',
        name: '部署状�?,
        description: '团队正在进行部署和发�?,
        entryConditions: ['quality_approved'],
        exitConditions: ['deployment_complete'],
        allowedTransitions: new Map([
          ['complete_deployment', 'idle'],
          ['deployment_failed', 'review']
        ]),
        stateActions: {
          onEnter: async (context) => {
            this.logger.debug('Entering deployment state', { sessionId: context.sessionId });
          }
        },
        metadata: {
          category: 'operational',
          priority: 6
        }
      }
    ];

    for (const state of defaultStates) {
      this.stateDefinitions.set(state.id, state);
    }

    this.logger.debug('Default states initialized', {
      stateCount: defaultStates.length
    });
  }

  /**
   * 创建初始状�?   */
  private createInitialState(): TeamState {
    return {
      id: `team-state-${Date.now()}`,
      name: 'Initial Team State',
      description: 'Team initial state',
      activeRoles: [],
      collaborationMode: 'idle',
      progress: 0,
      metadata: {
        createdAt: new Date(),
        version: '1.0'
      }
    };
  }

  /**
   * 验证状态转�?   */
  private async validateTransition(
    trigger: string,
    context: StateContext,
    targetState?: string
  ): Promise<{ valid: boolean; reason?: string; targetState?: string }> {
    const currentStateId = this.currentState.collaborationMode;
    const stateDefinition = this.stateDefinitions.get(currentStateId);

    if (!stateDefinition) {
      return { valid: false, reason: `Unknown current state: ${currentStateId}` };
    }

    // 检查是否允许此触发�?    if (!stateDefinition.allowedTransitions.has(trigger)) {
      return { valid: false, reason: `Trigger '${trigger}' not allowed from state '${currentStateId}'` };
    }

    const resolvedTargetState = targetState || stateDefinition.allowedTransitions.get(trigger)!;
    const targetDefinition = this.stateDefinitions.get(resolvedTargetState);

    if (!targetDefinition) {
      return { valid: false, reason: `Unknown target state: ${resolvedTargetState}` };
    }

    // 检查退出条�?    const exitConditionsMet = await this.checkExitConditions(stateDefinition, context);
    if (!exitConditionsMet) {
      return { valid: false, reason: 'Exit conditions not met' };
    }

    // 检查进入条�?    const entryConditionsMet = await this.checkEntryConditions(targetDefinition, context);
    if (!entryConditionsMet) {
      return { valid: false, reason: 'Entry conditions not met' };
    }

    return { valid: true, targetState: resolvedTargetState };
  }

  /**
   * 检查退出条�?   */
  private async checkExitConditions(
    stateDefinition: StateDefinition,
    context: StateContext
  ): Promise<boolean> {
    // 简化实现：假设所有条件都满足
    return true;
  }

  /**
   * 检查进入条�?   */
  private async checkEntryConditions(
    stateDefinition: StateDefinition,
    context: StateContext
  ): Promise<boolean> {
    // 简化实现：假设所有条件都满足
    return true;
  }

  /**
   * 执行退出动�?   */
  private async executeExitActions(state: string, context: StateContext): Promise<void> {
    const stateDefinition = this.stateDefinitions.get(state);
    if (stateDefinition?.stateActions.onExit) {
      await stateDefinition.stateActions.onExit(context);
    }
  }

  /**
   * 执行进入动作
   */
  private async executeEnterActions(state: string, context: StateContext): Promise<void> {
    const stateDefinition = this.stateDefinitions.get(state);
    if (stateDefinition?.stateActions.onEnter) {
      await stateDefinition.stateActions.onEnter(context);
    }
  }

  /**
   * 创建新状�?   */
  private async createNewState(stateId: string, context: StateContext): Promise<TeamState> {
    const stateDefinition = this.stateDefinitions.get(stateId);
    
    return {
      ...this.currentState,
      collaborationMode: stateId as CollaborationMode,
      metadata: {
        ...this.currentState.metadata,
        lastTransition: new Date(),
        transitionContext: context.sessionId
      }
    };
  }

  /**
   * 识别副作�?   */
  private async identifySideEffects(
    fromState: string,
    toState: string,
    context: StateContext
  ): Promise<string[]> {
    const sideEffects: string[] = [];
    
    // 基于状态转换识别副作用
    if (fromState === 'idle' && toState === 'planning') {
      sideEffects.push('team_activated');
    }
    
    if (toState === 'collaboration') {
      sideEffects.push('increased_communication');
    }
    
    return sideEffects;
  }

  /**
   * 创建状态快�?   */
  private async createStateSnapshot(context: StateContext): Promise<void> {
    const snapshot: TeamStateSnapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: new Date(),
      teamState: { ...this.currentState },
      context: { ...context },
      checksum: this.calculateChecksum(this.currentState)
    };

    this.stateSnapshots.push(snapshot);

    // 限制快照数量
    if (this.stateSnapshots.length > 100) {
      this.stateSnapshots.splice(0, 10);
    }
  }

  /**
   * 验证快照
   */
  private validateSnapshot(snapshot: TeamStateSnapshot): boolean {
    const calculatedChecksum = this.calculateChecksum(snapshot.teamState);
    return calculatedChecksum === snapshot.checksum;
  }

  /**
   * 计算校验�?   */
  private calculateChecksum(state: TeamState): string {
    const stateString = JSON.stringify(state);
    // 简化的校验和计�?    let hash = 0;
    for (let i = 0; i < stateString.length; i++) {
      const char = stateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * 计算操作置信�?   */
  private calculateActionConfidence(
    trigger: string,
    targetState: string,
    context: StateContext
  ): number {
    // 基于历史成功率和当前条件计算置信�?    const historicalSuccess = this.getHistoricalSuccessRate(trigger, targetState);
    const contextualFactor = this.getContextualFactor(context);
    
    return Math.min(historicalSuccess * contextualFactor, 100);
  }

  /**
   * 获取历史成功�?   */
  private getHistoricalSuccessRate(trigger: string, targetState: string): number {
    const relevantHistory = this.stateHistory.filter(h => 
      h.trigger === trigger && h.toState === targetState
    );
    
    if (relevantHistory.length === 0) return 80; // 默认置信�?    
    const successCount = relevantHistory.filter(h => h.success).length;
    return (successCount / relevantHistory.length) * 100;
  }

  /**
   * 获取上下文因�?   */
  private getContextualFactor(context: StateContext): number {
    // 基于当前上下文计算因�?    return 1.0; // 简化实�?  }

  /**
   * 获取操作前提条件
   */
  private getActionPrerequisites(
    trigger: string,
    targetState: string,
    context: StateContext
  ): string[] {
    const targetDefinition = this.stateDefinitions.get(targetState);
    return targetDefinition?.entryConditions || [];
  }

  /**
   * 生成团队输出
   */
  private generateTeamOutput(): any {
    return {
      currentActivities: this.currentState.activeRoles,
      progress: this.currentState.progress,
      lastUpdate: new Date()
    };
  }

  /**
   * 生成协作洞察
   */
  private generateCollaborationInsights(): string[] {
    const insights: string[] = [];
    
    const recentTransitions = this.stateHistory.slice(-5);
    if (recentTransitions.length > 0) {
      insights.push(`Recent activity: ${recentTransitions.length} state transitions`);
    }
    
    return insights;
  }

  /**
   * 生成质量指标
   */
  private generateQualityMetrics(): any {
    return {
      transitionSuccessRate: this.calculateOverallSuccessRate(),
      averageStateTime: this.calculateAverageStateTime(),
      collaborationEfficiency: this.calculateCollaborationEfficiency()
    };
  }

  /**
   * 计算总体成功�?   */
  private calculateOverallSuccessRate(): number {
    if (this.stateHistory.length === 0) return 100;
    
    const successCount = this.stateHistory.filter(h => h.success).length;
    return (successCount / this.stateHistory.length) * 100;
  }

  /**
   * 计算平均状态时�?   */
  private calculateAverageStateTime(): number {
    // 简化实�?    return 1800; // 30分钟
  }

  /**
   * 计算协作效率
   */
  private calculateCollaborationEfficiency(): number {
    // 简化实�?    return 85;
  }

  /**
   * 获取当前路径
   */
  private getCurrentPath(): string[] {
    return this.stateHistory.slice(-5).map(h => h.toState);
  }

  /**
   * 获取可能路径
   */
  private getPossiblePaths(): string[] {
    const currentStateId = this.currentState.collaborationMode;
    const stateDefinition = this.stateDefinitions.get(currentStateId);
    
    return stateDefinition ? Array.from(stateDefinition.allowedTransitions.values()) : [];
  }

  /**
   * 生成面包�?   */
  private generateBreadcrumbs(): Array<{ state: string; timestamp: Date }> {
    return this.stateHistory.slice(-10).map(h => ({
      state: h.toState,
      timestamp: h.timestamp
    }));
  }

  /**
   * 获取恢复选项
   */
  private getRecoveryOptions(): Array<{
    snapshot_id: string;
    timestamp: Date;
    description: string;
  }> {
    return this.stateSnapshots.slice(-5).map(s => ({
      snapshot_id: s.id,
      timestamp: s.timestamp,
      description: `State snapshot from ${s.timestamp.toISOString()}`
    }));
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听团队状态变�?    this.eventBus.subscribeEvent('team.state_updated', (event) => {
      const { teamState } = event.payload;
      this.logger.debug('Team state updated externally', { teamState });
    });

    // 监听角色状态变�?    this.eventBus.subscribeEvent('role.state_changed', (event) => {
      const { roleId, newState } = event.payload;
      this.logger.debug('Role state changed', { roleId, newState });
    });
  }

  /**
   * 创建状态错�?   */
  private createStateError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const stateError = new Error(`State ${operation} failed: ${message}`) as MJOSError;
    
    stateError.code = 'StateError';
    stateError.component = 'TeamStateManager';
    stateError.context = context;
    stateError.recoverable = true;
    stateError.timestamp = new Date();
    
    return stateError;
  }
}
