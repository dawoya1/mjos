/**
 * MJOS工作流引擎 - 仿公司标准操作程序（SOP）
 * Workflow Engine - Mimicking Company Standard Operating Procedures
 */
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    steps: WorkflowStep[];
    qualityGates: QualityGate[];
    approvalNodes: ApprovalNode[];
    rolePermissions: Map<string, string[]>;
    config: {
        timeout: number;
        retryCount: number;
        parallelExecution: boolean;
        autoApproval: boolean;
    };
    metadata: {
        createdBy: string;
        createdAt: Date;
        updatedBy: string;
        updatedAt: Date;
        usageCount: number;
        successRate: number;
    };
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'task' | 'decision' | 'parallel' | 'merge' | 'wait' | 'notification';
    description: string;
    executor: string;
    estimatedDuration: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    inputs: WorkflowInput[];
    outputs: WorkflowOutput[];
    preconditions: string[];
    postconditions: string[];
    businessRules: string[];
    nextSteps: string[];
    errorHandling: {
        retryCount: number;
        fallbackStep?: string;
        escalationRole?: string;
    };
}
export interface QualityGate {
    id: string;
    name: string;
    position: string;
    criteria: QualityCriteria[];
    autoCheck: boolean;
    reviewer?: string;
    passAction: 'continue' | 'skip' | 'notify';
    failAction: 'retry' | 'escalate' | 'terminate';
}
export interface QualityCriteria {
    name: string;
    type: 'metric' | 'checklist' | 'review' | 'test';
    threshold: any;
    weight: number;
    mandatory: boolean;
}
export interface ApprovalNode {
    id: string;
    name: string;
    position: string;
    approvers: string[];
    approvalType: 'any' | 'all' | 'majority';
    timeout: number;
    rules: {
        autoApprovalConditions?: string[];
        escalationRules?: string[];
        delegationRules?: string[];
    };
}
export interface WorkflowInput {
    name: string;
    type: string;
    required: boolean;
    description: string;
    validation?: string;
}
export interface WorkflowOutput {
    name: string;
    type: string;
    description: string;
    target?: string;
}
export interface WorkflowInstance {
    id: string;
    templateId: string;
    name: string;
    status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
    startedBy: string;
    startedAt: Date;
    completedAt?: Date;
    currentStep: string;
    context: Map<string, any>;
    variables: Map<string, any>;
    executionHistory: StepExecution[];
    approvalHistory: ApprovalRecord[];
    qualityCheckHistory: QualityCheckRecord[];
    metrics: {
        totalDuration: number;
        stepCount: number;
        errorCount: number;
        approvalCount: number;
    };
}
export interface StepExecution {
    stepId: string;
    executor: string;
    startedAt: Date;
    completedAt?: Date;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    inputs: any;
    outputs?: any;
    error?: string;
    duration: number;
}
export interface ApprovalRecord {
    nodeId: string;
    approver: string;
    decision: 'approved' | 'rejected' | 'delegated';
    timestamp: Date;
    comments?: string;
    reason?: string;
}
export interface QualityCheckRecord {
    gateId: string;
    checker: string;
    result: 'passed' | 'failed';
    timestamp: Date;
    score: number;
    details: any;
    recommendations?: string[];
}
export declare class WorkflowEngine {
    private templates;
    private instances;
    private executionQueue;
    private isProcessing;
    constructor();
    /**
     * 创建工作流模板
     */
    createTemplate(template: Omit<WorkflowTemplate, 'metadata'>): string;
    /**
     * 启动工作流实例
     */
    startWorkflow(templateId: string, initiator: string, context?: any): Promise<string>;
    /**
     * 执行工作流步骤
     */
    executeStep(instanceId: string, stepId: string): Promise<boolean>;
    /**
     * 获取工作流状态
     */
    getWorkflowStatus(instanceId: string): WorkflowInstance | null;
    /**
     * 暂停工作流
     */
    pauseWorkflow(instanceId: string): boolean;
    /**
     * 恢复工作流
     */
    resumeWorkflow(instanceId: string): boolean;
    /**
     * 取消工作流
     */
    cancelWorkflow(instanceId: string, reason: string): boolean;
    /**
     * 生成工作流报告
     */
    generateWorkflowReport(): string;
    private initializeStandardWorkflows;
    private startProcessingEngine;
    private processNextWorkflow;
    private createStandardTemplates;
    private checkPreconditions;
    private checkPostconditions;
    private prepareStepInputs;
    private executeStepByType;
    private performQualityCheck;
    private performApproval;
    private handleStepError;
    private updateTemplateSuccessRate;
    private calculateAverageDuration;
    private getTopUsedTemplates;
    private calculatePerformanceMetrics;
    private generateOptimizationSuggestions;
}
export default WorkflowEngine;
//# sourceMappingURL=WorkflowEngine.d.ts.map