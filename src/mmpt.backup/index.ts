/**
 * MMPT Module Exports
 * Magic Multi-role Prompt Toolkit 模块导出
 */

export { 
  RoleRegistry, 
  RoleDefinition, 
  RolePrompts, 
  RoleConstraints, 
  RoleBehaviors, 
  RoleInteractions, 
  RoleStatus, 
  RoleMetadata, 
  RoleTemplate, 
  RoleCategory 
} from './RoleRegistry';

export { 
  PromptTemplateEngine, 
  PromptTemplate, 
  TemplateVariable, 
  VariableType, 
  VariableValidation, 
  TemplateCategory, 
  TemplateStatus, 
  TemplateMetadata, 
  PromptContext, 
  CompiledPrompt, 
  TemplateLibrary 
} from './PromptTemplateEngine';

export { 
  WorkflowScheduler, 
  WorkflowDefinition, 
  WorkflowTrigger, 
  TriggerType, 
  WorkflowConstraints, 
  WorkflowMetadata, 
  WorkflowExecution, 
  ExecutionStatus, 
  ExecutionError, 
  ScheduleEntry, 
  RecurrencePattern 
} from './WorkflowScheduler';

export { 
  ContextualPromptGenerator, 
  ContextualPromptRequest, 
  CollaborationContext, 
  AdaptationLevel, 
  GeneratedPrompt, 
  PromptAdaptation, 
  AdaptationType, 
  ContextualElement, 
  ElementType, 
  PromptMetadata, 
  PromptOptimization, 
  OptimizationAction, 
  OptimizationType 
} from './ContextualPromptGenerator';

// 便捷函数
export { createMMPTToolkit, MMPTToolkit } from './MMPTToolkit';
