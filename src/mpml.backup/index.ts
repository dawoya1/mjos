/**
 * MPML Module Exports
 * Magic Persistent Memory Language 模块导出
 */

export {
  MemoryPersistenceLayer,
  PersistenceConfig,
  StorageType,
  RetentionPolicy,
  MemorySnapshot,
  MemoryQuery,
  PersistenceMetrics,
  StorageAdapter
} from './MemoryPersistenceLayer';

export {
  MemoryQueryEngine,
  QueryExpression,
  QueryType,
  QueryOperator,
  QueryOptions,
  QueryResult,
  QueryPlan,
  QueryStep,
  IndexDefinition,
  IndexType,
  IndexOptions,
  SemanticSearchConfig,
  QueryBuilder
} from './MemoryQueryEngine';

export {
  MemoryVersionControl,
  MemoryVersion,
  VersionMetadata,
  ChangeType,
  VersionDiff,
  MemoryBranch,
  BranchStatus,
  MergeRequest,
  MergeStatus,
  MergeConflict,
  VersionHistory
} from './MemoryVersionControl';

// 便捷函数
export { createMPMLEngine, MPMLEngine } from './MPMLEngine';
