/**
 * MJOS Role Management System
 * 魔剑工作室操作系统角色管理系统
 */
import { EventEmitter } from 'events';
import { AgentCapability, CapabilityType, CollaborationMode } from '../types/index';
export interface RoleDefinition {
    id: string;
    name: string;
    description: string;
    capabilities: AgentCapability[];
    responsibilities: string[];
    permissions: RolePermission[];
    collaborationMode: CollaborationMode;
    priority: number;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface RolePermission {
    resource: string;
    actions: string[];
    conditions?: Record<string, any>;
}
export interface RoleAssignment {
    id: string;
    roleId: string;
    agentId: string;
    assignedBy: string;
    assignedAt: Date;
    expiresAt?: Date;
    status: 'active' | 'suspended' | 'expired';
    metadata: Record<string, any>;
}
export interface RoleTemplate {
    name: string;
    description: string;
    capabilities: CapabilityType[];
    responsibilities: string[];
    defaultPermissions: RolePermission[];
    collaborationMode: CollaborationMode;
    priority: number;
}
export interface RoleManagerOptions {
    maxRoles?: number;
    maxAssignments?: number;
    enableHierarchy?: boolean;
    enableInheritance?: boolean;
    defaultExpiration?: number;
}
export declare class RoleManager extends EventEmitter {
    private roles;
    private assignments;
    private agentRoles;
    private roleHierarchy;
    private templates;
    private logger;
    private options;
    constructor(options?: RoleManagerOptions);
    private initializeDefaultTemplates;
    createRoleFromTemplate(templateName: string, customizations?: Partial<RoleDefinition>): string;
    createRole(definition: Omit<RoleDefinition, 'id' | 'createdAt' | 'updatedAt'>): string;
    getRole(roleId: string): RoleDefinition | undefined;
    updateRole(roleId: string, updates: Partial<RoleDefinition>): boolean;
    deleteRole(roleId: string): boolean;
    assignRole(roleId: string, agentId: string, assignedBy: string, expiresAt?: Date): string;
    revokeRole(assignmentId: string): boolean;
    getAgentRoles(agentId: string): RoleDefinition[];
    getAgentsWithRole(roleId: string): string[];
    hasPermission(agentId: string, resource: string, action: string): boolean;
    getAgentCapabilities(agentId: string): AgentCapability[];
    setRoleHierarchy(parentRoleId: string, childRoleId: string): boolean;
    getTemplates(): RoleTemplate[];
    addTemplate(template: RoleTemplate): void;
    private matchesResource;
    private matchesAction;
    private wouldCreateCircularDependency;
    private removeAllRoleAssignments;
    private removeFromHierarchy;
    private generateRoleId;
    private generateAssignmentId;
    getStats(): {
        totalRoles: number;
        totalAssignments: number;
        activeAssignments: number;
        totalTemplates: number;
        hierarchyRelations: number;
    };
    clear(): void;
}
//# sourceMappingURL=index.d.ts.map