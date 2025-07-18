/**
 * MJOS项目生命周期管理器 - 项目全流程管理
 * Project Lifecycle Manager - Complete Project Flow Management
 */
import { EventEmitter } from 'events';
import AgentManagement from '../organization/AgentManagement';
import WorkflowEngine from '../organization/WorkflowEngine';
export interface ProjectPhase {
    id: string;
    name: string;
    description: string;
    dependencies: string[];
    estimatedDuration: number;
    requiredRoles: string[];
    deliverables: string[];
    qualityCriteria: string[];
    status: 'pending' | 'active' | 'completed' | 'blocked' | 'failed';
    startTime?: Date;
    endTime?: Date;
    progress: number;
}
export interface ProjectPlan {
    projectId: string;
    phases: ProjectPhase[];
    totalEstimatedDuration: number;
    criticalPath: string[];
    resourceRequirements: {
        agents: string[];
        tools: string[];
        dependencies: string[];
    };
    riskFactors: Array<{
        risk: string;
        probability: number;
        impact: number;
        mitigation: string;
    }>;
}
export interface ProjectDeliverable {
    id: string;
    name: string;
    type: 'code' | 'document' | 'design' | 'test' | 'deployment';
    description: string;
    creator: string;
    createdAt: Date;
    version: string;
    status: 'draft' | 'review' | 'approved' | 'delivered';
    content: any;
    metadata: Record<string, any>;
}
export interface ProjectMetrics {
    projectId: string;
    startTime: Date;
    endTime?: Date;
    plannedDuration: number;
    actualDuration?: number;
    completedPhases: number;
    totalPhases: number;
    qualityScore: number;
    teamEfficiency: number;
    budgetUtilization: number;
    riskRealization: number;
}
export declare class ProjectLifecycleManager extends EventEmitter {
    private agentManagement;
    private workflowEngine;
    private activeProjects;
    private projectMetrics;
    private deliverables;
    constructor(agentManagement: AgentManagement, workflowEngine: WorkflowEngine);
    /**
     * 项目需求分析
     */
    analyzeRequirements(projectRequest: any): Promise<{
        analyzedRequirements: string[];
        technicalSpecs: any;
        constraints: any;
        successCriteria: string[];
    }>;
    /**
     * 项目执行规划
     */
    createExecutionPlan(projectRequest: any, requirements: any): Promise<ProjectPlan>;
    /**
     * 项目执行协调
     */
    executeProject(projectId: string): Promise<void>;
    /**
     * 执行项目阶段
     */
    private executePhase;
    /**
     * 项目质量审查
     */
    reviewProject(projectId: string): Promise<{
        qualityScore: number;
        deliverables: ProjectDeliverable[];
        issues: string[];
        recommendations: string[];
    }>;
    /**
     * 项目交付
     */
    deliverProject(projectId: string): Promise<{
        deliveryPackage: any;
        documentation: any;
        handoverNotes: string[];
    }>;
    /**
     * 获取项目状态
     */
    getProjectStatus(projectId: string): {
        plan: ProjectPlan | null;
        metrics: ProjectMetrics | null;
        currentPhase: ProjectPhase | null;
        overallProgress: number;
    };
    private parseRequirements;
    private generateTechnicalSpecs;
    private identifyConstraints;
    private defineSuccessCriteria;
    private decomposeIntoPhases;
    private analyzeDependencies;
    private assessResourceRequirements;
    private calculateCriticalPath;
    private assessRisks;
    private calculateTotalDuration;
    private formProjectTeam;
    private allocateResources;
    private getWorkflowTemplate;
    private finalizeProject;
    private updateProjectMetrics;
    private decomposePhaseIntoTasks;
    private assignTasks;
    private executeTasksInParallel;
    private integrateResults;
    private performPhaseQualityCheck;
    private generatePhaseDeliverables;
    private assessDeliverableQuality;
    private identifyProjectIssues;
    private generateRecommendations;
    private packageDeliverables;
    private generateProjectDocumentation;
    private generateHandoverNotes;
    private performFinalQualityCheck;
}
export default ProjectLifecycleManager;
//# sourceMappingURL=ProjectLifecycleManager.d.ts.map