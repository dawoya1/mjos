/**
 * MJOS Collaborative Workflow Engine
 * 魔剑工作室操作系统协作工作流引擎
 */
import { EventEmitter } from 'events';
import { AgentManager } from '../agents/index';
import { RoleManager } from '../roles/index';
import { TeamManager } from '../team/index';
import { CommunicationManager } from '../communication/index';
export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    version: string;
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
    variables: Record<string, any>;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: WorkflowStepType;
    description?: string;
    config: WorkflowStepConfig;
    dependencies: string[];
    conditions?: WorkflowCondition[];
    timeout?: number;
    retryPolicy?: RetryPolicy;
    onSuccess?: WorkflowAction[];
    onFailure?: WorkflowAction[];
}
export type WorkflowStepType = 'task' | 'decision' | 'parallel' | 'loop' | 'wait' | 'notification' | 'integration' | 'human_approval';
export interface WorkflowStepConfig {
    [key: string]: any;
}
export interface WorkflowTrigger {
    id: string;
    type: 'manual' | 'scheduled' | 'event' | 'webhook';
    config: Record<string, any>;
    enabled: boolean;
}
export interface WorkflowCondition {
    expression: string;
    variables: string[];
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: 'fixed' | 'exponential' | 'linear';
    baseDelay: number;
    maxDelay?: number;
}
export interface WorkflowAction {
    type: 'set_variable' | 'send_notification' | 'call_webhook' | 'assign_task';
    config: Record<string, any>;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: WorkflowExecutionStatus;
    currentStep?: string;
    variables: Record<string, any>;
    stepExecutions: Map<string, StepExecution>;
    startedAt: Date;
    completedAt?: Date;
    triggeredBy: string;
    metadata: Record<string, any>;
}
export type WorkflowExecutionStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export interface StepExecution {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
    retryCount: number;
    assignedTo?: string;
}
export interface WorkflowEngineOptions {
    maxConcurrentExecutions?: number;
    defaultTimeout?: number;
    enablePersistence?: boolean;
    persistencePath?: string;
    enableMetrics?: boolean;
}
export declare class WorkflowEngine extends EventEmitter {
    private workflows;
    private executions;
    private activeExecutions;
    private logger;
    private options;
    private agentManager;
    private roleManager;
    private teamManager;
    private communicationManager;
    constructor(options?: WorkflowEngineOptions, agentManager?: AgentManager, roleManager?: RoleManager, teamManager?: TeamManager, communicationManager?: CommunicationManager);
    private initializeDefaultWorkflows;
    createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): string;
    getWorkflow(id: string): WorkflowDefinition | undefined;
    updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): boolean;
    deleteWorkflow(id: string): boolean;
    executeWorkflow(workflowId: string, variables?: Record<string, any>, triggeredBy?: string): Promise<string>;
    private runExecution;
    private executeStep;
    private executeTaskStep;
    private executeDecisionStep;
    private executeParallelStep;
    private executeWaitStep;
    private executeNotificationStep;
    private executeHumanApprovalStep;
    private executeActions;
    private calculateExecutionOrder;
    private shouldExecuteStep;
    private evaluateCondition;
    private skipStep;
    private failExecution;
    private cancelWorkflowExecutions;
    getExecution(id: string): WorkflowExecution | undefined;
    getActiveExecutions(): WorkflowExecution[];
    private generateWorkflowId;
    private generateExecutionId;
    getStats(): {
        totalWorkflows: number;
        totalExecutions: number;
        activeExecutions: number;
        completedExecutions: number;
        failedExecutions: number;
    };
    clear(): void;
    destroy(): void;
    /**
     * Resolve variables in step configuration
     */
    private resolveStepVariables;
    /**
     * Replace variables in an object recursively
     */
    private replaceVariables;
}
//# sourceMappingURL=index.d.ts.map