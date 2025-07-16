/**
 * MHPF Module Exports
 * Magic Human-AI Partnership Framework 模块导出
 */

export { TeamController, TeamControllerOptions, TeamActivationResult, RoleActivationContext } from './TeamController';
export { 
  RoleCapabilityMatrix, 
  CapabilityDefinition, 
  CapabilityCategory,
  RoleCapabilityProfile,
  CapabilityLevel,
  CapabilityGap,
  CollaborationRecommendation 
} from './RoleCapabilityMatrix';
export { 
  CollaborationOrchestrator,
  OrchestrationContext,
  OrchestrationConstraints,
  OrchestrationPlan,
  OrchestrationPhase,
  OrchestrationTask,
  ThinkingOrchestration,
  ThinkingParticipant,
  QualityGate
} from './CollaborationOrchestrator';
export { 
  SharedKnowledgePool,
  KnowledgeEntry,
  KnowledgeCategory,
  ValidationStatus,
  KnowledgeQuery,
  KnowledgeInsight,
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeCluster
} from './SharedKnowledgePool';

// 便捷函数
export { createMHPFRuntime, MHPFRuntime } from './MHPFRuntime';
