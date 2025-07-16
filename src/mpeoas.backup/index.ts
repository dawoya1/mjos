/**
 * MPEOAS Module Exports
 * Magic Process Engine of AI State 模块导出
 */

export { 
  TeamStateManager, 
  StateDefinition, 
  StateTransitionResult, 
  TeamStateSnapshot 
} from './TeamStateManager';

export { 
  RoleStateSynchronizer, 
  RoleState, 
  SyncRule, 
  SyncTrigger, 
  SyncType, 
  SyncResult, 
  SyncConflict, 
  CrossRoleContext 
} from './RoleStateSynchronizer';

export { 
  CollaborationStateTracker, 
  CollaborationSession, 
  CollaborationStatus, 
  CollaborationType, 
  CollaborationEvent, 
  CollaborationEventType, 
  CollaborationImpact, 
  CollaborationMetrics, 
  CollaborationPattern 
} from './CollaborationStateTracker';

export { 
  ProjectMemoryIntegrator, 
  ProjectMemoryContext, 
  MemoryIntegrationRule, 
  MemoryTrigger, 
  IntegrationStrategy, 
  IntegratedMemory, 
  MemoryInsight, 
  InsightCategory, 
  InsightImpact 
} from './ProjectMemoryIntegrator';

// 便捷函数
export { createMPEOASEngine, MPEOASEngine } from './MPEOASEngine';
