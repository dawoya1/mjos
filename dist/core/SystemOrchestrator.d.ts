/**
 * MJOS系统编排器 - 系统级生命周期管理和协调
 * System Orchestrator - System-level Lifecycle Management and Coordination
 */
import { EventEmitter } from 'events';
export interface SystemConfig {
    maxConcurrentProjects: number;
    agentPoolSize: number;
    resourceLimits: {
        memory: number;
        cpu: number;
        storage: number;
    };
    qualityThresholds: {
        minQualityScore: number;
        maxErrorRate: number;
    };
    timeouts: {
        projectTimeout: number;
        taskTimeout: number;
        agentResponseTimeout: number;
    };
}
export interface ProjectRequest {
    id: string;
    type: string;
    description: string;
    requirements: string[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deadline?: Date;
    constraints?: any;
    context?: any;
}
export interface SystemState {
    status: 'starting' | 'ready' | 'busy' | 'maintenance' | 'shutdown';
    activeProjects: number;
    availableAgents: number;
    systemLoad: number;
    healthScore: number;
    lastUpdate: Date;
}
export interface ProjectExecution {
    projectId: string;
    status: 'pending' | 'analyzing' | 'planning' | 'executing' | 'reviewing' | 'completed' | 'failed';
    startTime: Date;
    estimatedCompletion?: Date;
    actualCompletion?: Date;
    assignedTeam: string[];
    currentPhase: string;
    progress: number;
    qualityScore: number;
    issues: string[];
}
export declare class SystemOrchestrator extends EventEmitter {
    private config;
    private systemState;
    private activeProjects;
    private projectQueue;
    private subsystems;
    private isInitialized;
    constructor(config: SystemConfig);
    /**
     * 系统启动流程
     */
    startup(): Promise<void>;
    /**
     * 项目接入处理
     */
    submitProject(request: ProjectRequest): Promise<string>;
    /**
     * 启动项目执行
     */
    private startProjectExecution;
    /**
     * 执行项目阶段
     */
    private executePhase;
    /**
     * 获取系统状态
     */
    getSystemState(): SystemState;
    /**
     * 获取项目状态
     */
    getProjectStatus(projectId: string): ProjectExecution | null;
    /**
     * 获取所有活跃项目
     */
    getActiveProjects(): ProjectExecution[];
    /**
     * 系统关闭
     */
    shutdown(): Promise<void>;
    private initializeSystem;
    private loadSubsystems;
    private activateAgentPool;
    private startMonitoring;
    private performHealthCheck;
    private startProjectEngine;
    private validateProjectRequest;
    private updateSystemState;
    private updateSystemMetrics;
    private processNextProject;
    private analyzeProject;
    private planExecution;
    private executeProject;
    private reviewProject;
    private consolidateKnowledge;
    private releaseResources;
    private waitForProjectsCompletion;
    private shutdownSubsystems;
    private cleanup;
}
export default SystemOrchestrator;
//# sourceMappingURL=SystemOrchestrator.d.ts.map