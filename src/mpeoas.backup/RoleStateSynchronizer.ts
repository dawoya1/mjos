/**
 * MPEOAS Role State Synchronizer
 * Magic Process Engine of AI State 角色状态同步器
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, MJOSError } from './types/index';

export interface RoleState {
  roleId: string;
  currentState: string;
  previousState?: string;
  stateData: any;
  lastUpdated: Date;
  version: number;
  metadata: {
    sessionId: string;
    context: any;
    capabilities: string[];
    workload: number;
  };
}

export interface SyncRule {
  id: string;
  name: string;
  sourceRole: string;
  targetRoles: string[];
  trigger: SyncTrigger;
  syncType: SyncType;
  condition?: (sourceState: RoleState, targetState: RoleState) => boolean;
  transformation?: (sourceState: RoleState) => Partial<RoleState>;
  priority: number;
}

export type SyncTrigger = 
  | 'state_change' 
  | 'data_update' 
  | 'capability_change' 
  | 'workload_change' 
  | 'manual';

export type SyncType = 
  | 'immediate' 
  | 'batched' 
  | 'scheduled' 
  | 'conditional';

export interface SyncResult {
  success: boolean;
  syncId: string;
  sourceRole: string;
  targetRoles: string[];
  syncedStates: string[];
  conflicts: SyncConflict[];
  timestamp: Date;
  error?: MJOSError;
}

export interface SyncConflict {
  roleId: string;
  conflictType: 'version' | 'state' | 'data' | 'capability';
  description: string;
  resolution: 'source_wins' | 'target_wins' | 'merge' | 'manual';
  resolvedValue?: any;
}

export interface CrossRoleContext {
  sessionId: string;
  projectId?: string;
  collaborationMode: string;
  sharedData: Map<string, any>;
  dependencies: Map<string, string[]>;
  constraints: Map<string, any>;
}

/**
 * 角色状态同步器�? * 管理多角色间的状态同步和一致�? */
export class RoleStateSynchronizer {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private roleStates = new Map<string, RoleState>();
  private syncRules = new Map<string, SyncRule>();
  private syncQueue: Array<{
    ruleId: string;
    sourceRole: string;
    targetRoles: string[];
    timestamp: Date;
    priority: number;
  }> = [];
  private syncHistory: SyncResult[] = [];
  private crossRoleContext?: CrossRoleContext;
  private syncInProgress = false;

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.setupDefaultSyncRules();
    this.setupEventListeners();
    
    this.logger.info('Role State Synchronizer initialized');
  }

  /**
   * 注册角色状�?   */
  public registerRoleState(roleId: string, initialState: string, context: StateContext): void {
    const roleState: RoleState = {
      roleId,
      currentState: initialState,
      stateData: {},
      lastUpdated: new Date(),
      version: 1,
      metadata: {
        sessionId: context.sessionId,
        context: context,
        capabilities: [],
        workload: 0
      }
    };

    this.roleStates.set(roleId, roleState);
    
    this.logger.info('Role state registered', {
      roleId,
      initialState,
      sessionId: context.sessionId
    });

    // 发布角色注册事件
    this.eventBus.publishEvent('role_state.registered', {
      roleId,
      roleState
    }, 'RoleStateSynchronizer');
  }

  /**
   * 更新角色状�?   */
  public async updateRoleState(
    roleId: string,
    newState: string,
    stateData?: any,
    context?: StateContext
  ): Promise<boolean> {
    try {
      const roleState = this.roleStates.get(roleId);
      if (!roleState) {
        throw new Error(`Role state not found: ${roleId}`);
      }

      const previousState = roleState.currentState;
      
      // 更新状�?      roleState.previousState = previousState;
      roleState.currentState = newState;
      roleState.stateData = { ...roleState.stateData, ...stateData };
      roleState.lastUpdated = new Date();
      roleState.version += 1;

      if (context) {
        roleState.metadata.context = context;
      }

      this.logger.debug('Role state updated', {
        roleId,
        from: previousState,
        to: newState,
        version: roleState.version
      });

      // 触发同步
      await this.triggerSync(roleId, 'state_change');

      // 发布状态更新事�?      this.eventBus.publishEvent('role_state.updated', {
        roleId,
        previousState,
        currentState: newState,
        roleState
      }, 'RoleStateSynchronizer');

      return true;

    } catch (error) {
      this.logger.error('Failed to update role state', {
        roleId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 获取角色状�?   */
  public getRoleState(roleId: string): RoleState | undefined {
    return this.roleStates.get(roleId);
  }

  /**
   * 获取所有角色状�?   */
  public getAllRoleStates(): Map<string, RoleState> {
    return new Map(this.roleStates);
  }

  /**
   * 添加同步规则
   */
  public addSyncRule(rule: SyncRule): void {
    this.syncRules.set(rule.id, rule);
    
    this.logger.info('Sync rule added', {
      ruleId: rule.id,
      sourceRole: rule.sourceRole,
      targetRoles: rule.targetRoles,
      trigger: rule.trigger
    });
  }

  /**
   * 执行手动同步
   */
  public async manualSync(
    sourceRole: string,
    targetRoles: string[],
    syncType: SyncType = 'immediate'
  ): Promise<SyncResult> {
    const syncId = `manual-${Date.now()}`;
    
    return await this.executeSync({
      syncId,
      sourceRole,
      targetRoles,
      syncType,
      trigger: 'manual',
      ruleId: 'manual'
    });
  }

  /**
   * 设置跨角色上下文
   */
  public setCrossRoleContext(context: CrossRoleContext): void {
    this.crossRoleContext = context;
    
    this.logger.info('Cross-role context set', {
      sessionId: context.sessionId,
      collaborationMode: context.collaborationMode,
      sharedDataKeys: Array.from(context.sharedData.keys())
    });
  }

  /**
   * 获取同步状�?   */
  public getSyncStatus(): {
    totalRoles: number;
    syncRules: number;
    queueSize: number;
    lastSyncTime?: Date;
    syncInProgress: boolean;
    recentConflicts: number;
  } {
    const recentConflicts = this.syncHistory
      .filter(h => h.timestamp > new Date(Date.now() - 3600000)) // 1 hour
      .reduce((sum, h) => sum + h.conflicts.length, 0);

    const lastSyncTime = this.syncHistory.length > 0 ? 
      this.syncHistory[this.syncHistory.length - 1].timestamp : undefined;

    return {
      totalRoles: this.roleStates.size,
      syncRules: this.syncRules.size,
      queueSize: this.syncQueue.length,
      lastSyncTime,
      syncInProgress: this.syncInProgress,
      recentConflicts
    };
  }

  /**
   * 获取同步历史
   */
  public getSyncHistory(filter?: {
    sourceRole?: string;
    targetRole?: string;
    since?: Date;
    limit?: number;
  }): SyncResult[] {
    let history = [...this.syncHistory];

    if (filter) {
      if (filter.sourceRole) {
        history = history.filter(h => h.sourceRole === filter.sourceRole);
      }
      if (filter.targetRole) {
        history = history.filter(h => h.targetRoles.includes(filter.targetRole!));
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
   * 触发同步
   */
  private async triggerSync(roleId: string, trigger: SyncTrigger): Promise<void> {
    // 查找适用的同步规�?    const applicableRules = Array.from(this.syncRules.values()).filter(rule => 
      rule.sourceRole === roleId && rule.trigger === trigger
    );

    for (const rule of applicableRules) {
      if (rule.syncType === 'immediate') {
        await this.executeSync({
          syncId: `${rule.id}-${Date.now()}`,
          sourceRole: roleId,
          targetRoles: rule.targetRoles,
          syncType: rule.syncType,
          trigger,
          ruleId: rule.id
        });
      } else {
        // 添加到队�?        this.syncQueue.push({
          ruleId: rule.id,
          sourceRole: roleId,
          targetRoles: rule.targetRoles,
          timestamp: new Date(),
          priority: rule.priority
        });
      }
    }

    // 处理队列
    await this.processSyncQueue();
  }

  /**
   * 执行同步
   */
  private async executeSync(params: {
    syncId: string;
    sourceRole: string;
    targetRoles: string[];
    syncType: SyncType;
    trigger: SyncTrigger;
    ruleId: string;
  }): Promise<SyncResult> {
    const { syncId, sourceRole, targetRoles, trigger, ruleId } = params;

    try {
      this.logger.debug('Executing sync', {
        syncId,
        sourceRole,
        targetRoles,
        trigger
      });

      const sourceState = this.roleStates.get(sourceRole);
      if (!sourceState) {
        throw new Error(`Source role state not found: ${sourceRole}`);
      }

      const syncRule = this.syncRules.get(ruleId);
      const syncedStates: string[] = [];
      const conflicts: SyncConflict[] = [];

      for (const targetRole of targetRoles) {
        const targetState = this.roleStates.get(targetRole);
        if (!targetState) {
          this.logger.warn('Target role state not found', { targetRole });
          continue;
        }

        // 检查同步条�?        if (syncRule?.condition && !syncRule.condition(sourceState, targetState)) {
          this.logger.debug('Sync condition not met', { sourceRole, targetRole });
          continue;
        }

        // 检测冲�?        const conflict = this.detectConflict(sourceState, targetState);
        if (conflict) {
          conflicts.push(conflict);
          await this.resolveConflict(conflict, sourceState, targetState);
        }

        // 应用同步
        await this.applySyncToTarget(sourceState, targetState, syncRule);
        syncedStates.push(targetRole);
      }

      const result: SyncResult = {
        success: true,
        syncId,
        sourceRole,
        targetRoles,
        syncedStates,
        conflicts,
        timestamp: new Date()
      };

      this.syncHistory.push(result);

      this.logger.info('Sync completed', {
        syncId,
        syncedCount: syncedStates.length,
        conflictCount: conflicts.length
      });

      // 发布同步完成事件
      this.eventBus.publishEvent('role_state.synced', {
        result
      }, 'RoleStateSynchronizer');

      return result;

    } catch (error) {
      const syncError = this.createSyncError(error, 'executeSync', params);
      
      const result: SyncResult = {
        success: false,
        syncId,
        sourceRole,
        targetRoles,
        syncedStates: [],
        conflicts: [],
        timestamp: new Date(),
        error: syncError
      };

      this.syncHistory.push(result);
      this.logger.error('Sync failed', { error: syncError });

      return result;
    }
  }

  /**
   * 检测冲�?   */
  private detectConflict(sourceState: RoleState, targetState: RoleState): SyncConflict | null {
    // 版本冲突
    if (targetState.version > sourceState.version) {
      return {
        roleId: targetState.roleId,
        conflictType: 'version',
        description: `Target version (${targetState.version}) is newer than source (${sourceState.version})`,
        resolution: 'target_wins'
      };
    }

    // 状态冲�?    if (targetState.currentState !== sourceState.currentState && 
        targetState.lastUpdated > sourceState.lastUpdated) {
      return {
        roleId: targetState.roleId,
        conflictType: 'state',
        description: `State conflict: target=${targetState.currentState}, source=${sourceState.currentState}`,
        resolution: 'merge'
      };
    }

    return null;
  }

  /**
   * 解决冲突
   */
  private async resolveConflict(
    conflict: SyncConflict,
    sourceState: RoleState,
    targetState: RoleState
  ): Promise<void> {
    switch (conflict.resolution) {
      case 'source_wins':
        // 源状态获胜，不需要额外操�?        break;
      
      case 'target_wins':
        // 目标状态获胜，跳过同步
        return;
      
      case 'merge':
        // 合并状�?        conflict.resolvedValue = this.mergeStates(sourceState, targetState);
        break;
      
      case 'manual':
        // 需要手动解�?        this.logger.warn('Manual conflict resolution required', { conflict });
        break;
    }
  }

  /**
   * 合并状�?   */
  private mergeStates(sourceState: RoleState, targetState: RoleState): any {
    return {
      ...targetState.stateData,
      ...sourceState.stateData,
      mergedAt: new Date(),
      mergeSource: [sourceState.roleId, targetState.roleId]
    };
  }

  /**
   * 应用同步到目�?   */
  private async applySyncToTarget(
    sourceState: RoleState,
    targetState: RoleState,
    syncRule?: SyncRule
  ): Promise<void> {
    let syncData = sourceState.stateData;

    // 应用转换
    if (syncRule?.transformation) {
      const transformed = syncRule.transformation(sourceState);
      syncData = { ...syncData, ...transformed.stateData };
    }

    // 更新目标状�?    targetState.stateData = { ...targetState.stateData, ...syncData };
    targetState.lastUpdated = new Date();
    targetState.version += 1;
    targetState.metadata.context = {
      ...targetState.metadata.context,
      syncedFrom: sourceState.roleId,
      syncedAt: new Date()
    };
  }

  /**
   * 处理同步队列
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      // 按优先级排序
      this.syncQueue.sort((a, b) => b.priority - a.priority);

      const batch = this.syncQueue.splice(0, 10); // 批量处理10�?
      for (const item of batch) {
        await this.executeSync({
          syncId: `queued-${item.ruleId}-${Date.now()}`,
          sourceRole: item.sourceRole,
          targetRoles: item.targetRoles,
          syncType: 'batched',
          trigger: 'state_change',
          ruleId: item.ruleId
        });
      }

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 设置默认同步规则
   */
  private setupDefaultSyncRules(): void {
    const defaultRules: SyncRule[] = [
      {
        id: 'architect-to-team',
        name: '架构师到团队同步',
        sourceRole: 'moxiaozhi',
        targetRoles: ['moxiaomei', 'moxiaoma', 'moxiaocang'],
        trigger: 'state_change',
        syncType: 'immediate',
        priority: 10,
        condition: (source, target) => source.currentState === 'planning_complete'
      },
      {
        id: 'designer-to-developers',
        name: '设计师到开发者同�?,
        sourceRole: 'moxiaomei',
        targetRoles: ['moxiaoma', 'moxiaocang'],
        trigger: 'state_change',
        syncType: 'immediate',
        priority: 8,
        condition: (source, target) => source.currentState === 'design_complete'
      },
      {
        id: 'developer-collaboration',
        name: '开发者协作同�?,
        sourceRole: 'moxiaoma',
        targetRoles: ['moxiaocang'],
        trigger: 'data_update',
        syncType: 'batched',
        priority: 6
      },
      {
        id: 'workload-balancing',
        name: '工作负载平衡',
        sourceRole: '*',
        targetRoles: ['*'],
        trigger: 'workload_change',
        syncType: 'scheduled',
        priority: 4
      }
    ];

    for (const rule of defaultRules) {
      this.syncRules.set(rule.id, rule);
    }

    this.logger.debug('Default sync rules setup', {
      ruleCount: defaultRules.length
    });
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听角色激活事�?    this.eventBus.subscribeEvent('role.activated', (event) => {
      const { roleId, context } = event.payload;
      this.registerRoleState(roleId, 'active', context);
    });

    // 监听角色停用事件
    this.eventBus.subscribeEvent('role.deactivated', (event) => {
      const { roleId } = event.payload;
      this.updateRoleState(roleId, 'inactive');
    });

    // 监听团队状态变�?    this.eventBus.subscribeEvent('team.state_updated', (event) => {
      const { teamState } = event.payload;
      
      // 同步团队状态到所有角�?      for (const roleId of teamState.activeRoles) {
        this.updateRoleState(roleId, 'team_state_updated', {
          teamCollaborationMode: teamState.collaborationMode
        });
      }
    });

    // 监听协作事件
    this.eventBus.subscribeEvent('collaboration.started', (event) => {
      const { participants } = event.payload;
      
      // 同步协作状�?      for (const roleId of participants) {
        this.updateRoleState(roleId, 'collaborating', {
          collaborationParticipants: participants
        });
      }
    });
  }

  /**
   * 创建同步错误
   */
  private createSyncError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const syncError = new Error(`Sync ${operation} failed: ${message}`) as MJOSError;
    
    syncError.code = 'SyncError';
    syncError.component = 'RoleStateSynchronizer';
    syncError.context = context;
    syncError.recoverable = true;
    syncError.timestamp = new Date();
    
    return syncError;
  }
}
