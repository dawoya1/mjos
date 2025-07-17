/**
 * MJOS Enhanced Team System
 * 魔剑工作室操作系统增强团队系统
 */
import { EventBus } from '../core/index';
import { AgentManager } from '../agents/index';
import { RoleManager } from '../roles/index';
export interface TeamMember {
    id: string;
    name: string;
    role: string;
    capabilities: string[];
    status: 'active' | 'busy' | 'offline';
    expertise: string[];
    agentId?: string;
    roleIds?: string[];
    joinedAt: Date;
    lastActivity: Date;
    performance: {
        tasksCompleted: number;
        successRate: number;
        collaborationScore: number;
    };
}
export interface Task {
    id: string;
    title: string;
    description: string;
    assignedTo?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdAt: Date;
    updatedAt: Date;
    dueDate?: Date;
    requiredCapabilities?: string[];
    estimatedDuration?: number;
    dependencies?: string[];
    tags?: string[];
    result?: any;
    feedback?: string;
}
export interface CollaborationSession {
    id: string;
    participants: string[];
    topic: string;
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'completed';
    type: 'meeting' | 'brainstorm' | 'review' | 'planning';
    outcome?: string;
    decisions?: string[];
    actionItems?: string[];
}
export interface TeamWorkflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    status: 'draft' | 'active' | 'paused' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowStep {
    id: string;
    name: string;
    description: string;
    requiredRole?: string;
    requiredCapabilities?: string[];
    dependencies?: string[];
    estimatedDuration?: number;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    assignedTo?: string;
    completedAt?: Date;
}
export declare class TeamManager {
    private members;
    private tasks;
    private sessions;
    private workflows;
    private logger;
    private eventBus;
    private agentManager;
    private roleManager;
    constructor(eventBus: EventBus, agentManager?: AgentManager, roleManager?: RoleManager);
    private setupEventHandlers;
    addMember(member: TeamMember): void;
    addMemberWithAgent(memberData: Omit<TeamMember, 'id' | 'joinedAt' | 'lastActivity' | 'performance'>, agentId?: string): string;
    updateMemberRoles(memberId: string, roleIds: string[]): boolean;
    removeMemberRole(memberId: string, roleId: string): boolean;
    updateMemberPerformance(memberId: string, success: boolean): void;
    getMember(id: string): TeamMember | undefined;
    getAllMembers(): TeamMember[];
    updateMemberStatus(id: string, status: TeamMember['status']): boolean;
    createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): string;
    assignTask(taskId: string, memberId: string): boolean;
    updateTaskStatus(taskId: string, status: Task['status']): boolean;
    getTasks(filter?: {
        assignedTo?: string;
        status?: Task['status'];
    }): Task[];
    startCollaboration(topic: string, participants: string[]): string;
    endCollaboration(sessionId: string): boolean;
    getActiveSessions(): CollaborationSession[];
    createWorkflow(workflow: Omit<TeamWorkflow, 'id' | 'createdAt' | 'updatedAt'>): string;
    getWorkflow(id: string): TeamWorkflow | undefined;
    assignTaskIntelligently(taskId: string): boolean;
    getTeamStats(): {
        totalMembers: number;
        activeMembers: number;
        totalTasks: number;
        completedTasks: number;
        activeSessions: number;
        totalWorkflows: number;
        averageSuccessRate: number;
        averageCollaborationScore: number;
    };
    private initializeDefaultTeam;
    private generateId;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map