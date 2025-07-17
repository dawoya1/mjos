/**
 * MJOS Agent Management System
 * 魔剑工作室操作系统智能体管理系统
 */
import { EventEmitter } from 'events';
import { AgentDefinition, AgentPerformance, CapabilityType } from '../types/index';
export interface AgentManagerOptions {
    maxAgents?: number;
    defaultTimeout?: number;
    enableLearning?: boolean;
    enableCollaboration?: boolean;
    performanceTracking?: boolean;
}
export interface TaskAssignment {
    id: string;
    agentId: string;
    taskId: string;
    priority: number;
    deadline?: Date;
    status: 'pending' | 'active' | 'completed' | 'failed';
    assignedAt: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
}
export declare class AgentManager extends EventEmitter {
    private agents;
    private taskAssignments;
    private capabilityIndex;
    private logger;
    private options;
    constructor(options?: AgentManagerOptions);
    private initializeCapabilityIndex;
    createAgent(definition: Omit<AgentDefinition, 'id' | 'state'>): string;
    getAgent(agentId: string): AgentDefinition | undefined;
    getAllAgents(): AgentDefinition[];
    updateAgent(agentId: string, updates: Partial<AgentDefinition>): boolean;
    deleteAgent(agentId: string): boolean;
    findAgentsByCapability(capability: CapabilityType): AgentDefinition[];
    findBestAgent(requiredCapabilities: CapabilityType[], _taskPriority?: number): AgentDefinition | null;
    assignTask(agentId: string, taskId: string, priority?: number, deadline?: Date): string;
    completeTask(assignmentId: string, result?: any): boolean;
    failTask(assignmentId: string, error: string): boolean;
    getAgentPerformance(agentId: string): AgentPerformance | undefined;
    getActiveAssignments(): TaskAssignment[];
    getAgentAssignments(agentId: string): TaskAssignment[];
    private calculateAgentScore;
    private updateAgentPerformance;
    private updateCapabilityIndex;
    private removeFromCapabilityIndex;
    private cancelAgentTasks;
    private generateAgentId;
    private generateAssignmentId;
    getStats(): {
        totalAgents: number;
        activeAgents: number;
        idleAgents: number;
        totalAssignments: number;
        activeAssignments: number;
        completedAssignments: number;
        failedAssignments: number;
        averageSuccessRate: number;
    };
    clear(): void;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map