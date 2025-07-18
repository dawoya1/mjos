/**
 * MJOS主系统 - 完整的系统级架构和生命周期管理
 * MJOS Main System - Complete System-level Architecture and Lifecycle Management
 */
export interface MJOSConfig {
    system: {
        maxConcurrentProjects: number;
        agentPoolSize: number;
        resourceLimits: {
            memory: number;
            cpu: number;
            storage: number;
        };
    };
    quality: {
        minQualityScore: number;
        maxErrorRate: number;
    };
    timeouts: {
        projectTimeout: number;
        taskTimeout: number;
        agentResponseTimeout: number;
    };
    features: {
        enableWebInterface: boolean;
        enableRealTimeMonitoring: boolean;
        enableAutoScaling: boolean;
    };
}
export interface ProjectSubmission {
    id: string;
    title: string;
    description: string;
    type: 'development' | 'design' | 'analysis' | 'testing' | 'deployment' | 'research';
    requirements: string[];
    constraints?: {
        deadline?: Date;
        budget?: number;
        resources?: string[];
    };
    priority: 'low' | 'medium' | 'high' | 'urgent';
    context?: Record<string, any>;
}
export interface SystemStatus {
    overall: 'healthy' | 'degraded' | 'critical' | 'offline';
    components: {
        orchestrator: 'online' | 'offline' | 'error';
        agentManagement: 'online' | 'offline' | 'error';
        workflowEngine: 'online' | 'offline' | 'error';
        projectManager: 'online' | 'offline' | 'error';
        memorySystem: 'online' | 'offline' | 'error';
    };
    metrics: {
        activeProjects: number;
        availableAgents: number;
        systemLoad: number;
        averageResponseTime: number;
        successRate: number;
    };
    uptime: number;
    lastHealthCheck: Date;
}
export declare class MJOSSystem {
    private config;
    private orchestrator;
    private projectManager;
    private agentManagement;
    private workflowEngine;
    private teamSystem;
    private memoryManager;
    private mjos;
    private isInitialized;
    private startTime;
    constructor(config?: Partial<MJOSConfig>);
    /**
     * 系统完整启动流程
     */
    startup(): Promise<void>;
    /**
     * 项目提交接口 - 系统的主要入口
     */
    submitProject(submission: ProjectSubmission): Promise<{
        projectId: string;
        status: string;
        estimatedCompletion?: Date;
        assignedTeam?: string[];
    }>;
    /**
     * 获取项目状态
     */
    getProjectStatus(projectId: string): {
        orchestratorStatus: any;
        lifecycleStatus: any;
        overallProgress: number;
        currentPhase: string;
        issues: string[];
    };
    /**
     * 获取系统状态
     */
    getSystemStatus(): SystemStatus;
    /**
     * 系统关闭
     */
    shutdown(): Promise<void>;
    /**
     * 系统重启
     */
    restart(): Promise<void>;
    private mergeConfig;
    private initializeComponents;
    private initializeCoreSystem;
    private startAgentEcosystem;
    private startWorkflowEngine;
    private startProjectManagement;
    private performSystemHealthCheck;
    private startMonitoring;
    private startWebInterface;
    private validateProjectSubmission;
    private determineOverallHealth;
    private waitForActiveProjects;
    private shutdownSubsystems;
    private cleanup;
}
export default MJOSSystem;
//# sourceMappingURL=MJOSSystem.d.ts.map