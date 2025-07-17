/**
 * MJOS Role Management System
 * 魔剑工作室操作系统角色管理系统
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/index';
import { 
  AgentCapability, 
  CapabilityType,
  CollaborationMode 
} from '../types/index';

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
  defaultExpiration?: number; // milliseconds
}

export class RoleManager extends EventEmitter {
  private roles: Map<string, RoleDefinition> = new Map();
  private assignments: Map<string, RoleAssignment> = new Map();
  private agentRoles: Map<string, Set<string>> = new Map(); // agentId -> roleIds
  private roleHierarchy: Map<string, Set<string>> = new Map(); // parentRole -> childRoles
  private templates: Map<string, RoleTemplate> = new Map();
  private logger: Logger;
  private options: RoleManagerOptions;

  constructor(options: RoleManagerOptions = {}) {
    super();
    
    this.options = {
      maxRoles: options.maxRoles || 100,
      maxAssignments: options.maxAssignments || 1000,
      enableHierarchy: options.enableHierarchy || true,
      enableInheritance: options.enableInheritance || true,
      defaultExpiration: options.defaultExpiration || 0, // No expiration by default
      ...options
    };

    this.logger = new Logger('RoleManager');
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: RoleTemplate[] = [
      {
        name: 'Administrator',
        description: 'Full system administration capabilities',
        capabilities: ['perception', 'reasoning', 'planning', 'execution', 'communication', 'learning'],
        responsibilities: ['System management', 'User management', 'Security oversight'],
        defaultPermissions: [
          { resource: '*', actions: ['*'] }
        ],
        collaborationMode: 'planning',
        priority: 10
      },
      {
        name: 'Analyst',
        description: 'Data analysis and reasoning specialist',
        capabilities: ['perception', 'reasoning', 'communication'],
        responsibilities: ['Data analysis', 'Report generation', 'Pattern recognition'],
        defaultPermissions: [
          { resource: 'data', actions: ['read', 'analyze'] },
          { resource: 'reports', actions: ['create', 'read', 'update'] }
        ],
        collaborationMode: 'collaboration',
        priority: 7
      },
      {
        name: 'Executor',
        description: 'Task execution specialist',
        capabilities: ['execution', 'communication'],
        responsibilities: ['Task execution', 'Status reporting'],
        defaultPermissions: [
          { resource: 'tasks', actions: ['read', 'execute', 'update'] }
        ],
        collaborationMode: 'development',
        priority: 5
      },
      {
        name: 'Communicator',
        description: 'Communication and coordination specialist',
        capabilities: ['communication', 'planning'],
        responsibilities: ['Message routing', 'Coordination', 'Information dissemination'],
        defaultPermissions: [
          { resource: 'messages', actions: ['create', 'read', 'route'] },
          { resource: 'channels', actions: ['create', 'manage'] }
        ],
        collaborationMode: 'collaboration',
        priority: 6
      },
      {
        name: 'Learner',
        description: 'Learning and adaptation specialist',
        capabilities: ['learning', 'reasoning', 'perception'],
        responsibilities: ['Knowledge acquisition', 'Model training', 'Adaptation'],
        defaultPermissions: [
          { resource: 'knowledge', actions: ['create', 'read', 'update'] },
          { resource: 'models', actions: ['train', 'update'] }
        ],
        collaborationMode: 'collaboration',
        priority: 6
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.name, template);
    });

    this.logger.info(`Initialized ${defaultTemplates.length} default role templates`);
  }

  // Create role from template
  createRoleFromTemplate(templateName: string, customizations?: Partial<RoleDefinition>): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const roleId = this.generateRoleId();
    const role: RoleDefinition = {
      id: roleId,
      name: customizations?.name || template.name,
      description: customizations?.description || template.description,
      capabilities: template.capabilities.map(capType => ({
        name: capType,
        type: capType,
        parameters: {},
        constraints: {}
      })),
      responsibilities: [...template.responsibilities],
      permissions: [...template.defaultPermissions],
      collaborationMode: template.collaborationMode,
      priority: template.priority,
      metadata: customizations?.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...customizations
    };

    if (this.roles.size >= this.options.maxRoles!) {
      throw new Error('Maximum number of roles reached');
    }

    this.roles.set(roleId, role);

    this.emit('role-created', role);
    this.logger.info(`Role created from template: ${roleId} (${template.name})`);

    return roleId;
  }

  // Create custom role
  createRole(definition: Omit<RoleDefinition, 'id' | 'createdAt' | 'updatedAt'>): string {
    if (this.roles.size >= this.options.maxRoles!) {
      throw new Error('Maximum number of roles reached');
    }

    const roleId = this.generateRoleId();
    const role: RoleDefinition = {
      id: roleId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...definition
    };

    this.roles.set(roleId, role);

    this.emit('role-created', role);
    this.logger.info(`Custom role created: ${roleId} (${definition.name})`);

    return roleId;
  }

  // Get role by ID
  getRole(roleId: string): RoleDefinition | undefined {
    return this.roles.get(roleId);
  }

  // Update role
  updateRole(roleId: string, updates: Partial<RoleDefinition>): boolean {
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }

    const updatedRole: RoleDefinition = {
      ...role,
      ...updates,
      id: roleId, // Preserve ID
      updatedAt: new Date()
    };

    this.roles.set(roleId, updatedRole);

    this.emit('role-updated', updatedRole);
    this.logger.debug(`Role updated: ${roleId}`);

    return true;
  }

  // Delete role
  deleteRole(roleId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }

    // Remove all assignments for this role
    this.removeAllRoleAssignments(roleId);

    // Remove from hierarchy
    this.removeFromHierarchy(roleId);

    // Delete role
    this.roles.delete(roleId);

    this.emit('role-deleted', roleId);
    this.logger.info(`Role deleted: ${roleId}`);

    return true;
  }

  // Assign role to agent
  assignRole(roleId: string, agentId: string, assignedBy: string, expiresAt?: Date): string {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    if (this.assignments.size >= this.options.maxAssignments!) {
      throw new Error('Maximum number of role assignments reached');
    }

    const assignmentId = this.generateAssignmentId();
    const assignment: RoleAssignment = {
      id: assignmentId,
      roleId,
      agentId,
      assignedBy,
      assignedAt: new Date(),
      status: 'active',
      metadata: {},
      ...(expiresAt ? { expiresAt } : {}),
      ...(this.options.defaultExpiration && !expiresAt ? {
        expiresAt: new Date(Date.now() + this.options.defaultExpiration)
      } : {})
    };

    this.assignments.set(assignmentId, assignment);

    // Update agent roles index
    if (!this.agentRoles.has(agentId)) {
      this.agentRoles.set(agentId, new Set());
    }
    this.agentRoles.get(agentId)!.add(roleId);

    this.emit('role-assigned', { assignment, role });
    this.logger.info(`Role assigned: ${roleId} -> ${agentId}`);

    return assignmentId;
  }

  // Revoke role assignment
  revokeRole(assignmentId: string): boolean {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      return false;
    }

    // Update assignment status
    assignment.status = 'suspended';

    // Remove from agent roles index
    const agentRoles = this.agentRoles.get(assignment.agentId);
    if (agentRoles) {
      agentRoles.delete(assignment.roleId);
      if (agentRoles.size === 0) {
        this.agentRoles.delete(assignment.agentId);
      }
    }

    this.emit('role-revoked', assignment);
    this.logger.info(`Role revoked: ${assignment.roleId} from ${assignment.agentId}`);

    return true;
  }

  // Get roles for agent
  getAgentRoles(agentId: string): RoleDefinition[] {
    const roleIds = this.agentRoles.get(agentId) || new Set();
    return Array.from(roleIds)
      .map(roleId => this.roles.get(roleId))
      .filter(role => role !== undefined) as RoleDefinition[];
  }

  // Get agents with specific role
  getAgentsWithRole(roleId: string): string[] {
    const agents: string[] = [];
    
    for (const [agentId, roleIds] of this.agentRoles) {
      if (roleIds.has(roleId)) {
        agents.push(agentId);
      }
    }
    
    return agents;
  }

  // Check if agent has permission
  hasPermission(agentId: string, resource: string, action: string): boolean {
    const roles = this.getAgentRoles(agentId);
    
    for (const role of roles) {
      for (const permission of role.permissions) {
        if (this.matchesResource(permission.resource, resource) &&
            this.matchesAction(permission.actions, action)) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Get effective capabilities for agent (combining all roles)
  getAgentCapabilities(agentId: string): AgentCapability[] {
    const roles = this.getAgentRoles(agentId);
    const capabilityMap = new Map<string, AgentCapability>();
    
    roles.forEach(role => {
      role.capabilities.forEach(capability => {
        const key = `${capability.type}_${capability.name}`;
        if (!capabilityMap.has(key)) {
          capabilityMap.set(key, capability);
        }
      });
    });
    
    return Array.from(capabilityMap.values());
  }

  // Set role hierarchy (parent -> child relationship)
  setRoleHierarchy(parentRoleId: string, childRoleId: string): boolean {
    if (!this.options.enableHierarchy) {
      return false;
    }

    const parentRole = this.roles.get(parentRoleId);
    const childRole = this.roles.get(childRoleId);
    
    if (!parentRole || !childRole) {
      return false;
    }

    // Prevent circular dependencies
    if (this.wouldCreateCircularDependency(parentRoleId, childRoleId)) {
      this.logger.warn(`Circular dependency detected: ${parentRoleId} -> ${childRoleId}`);
      return false;
    }

    if (!this.roleHierarchy.has(parentRoleId)) {
      this.roleHierarchy.set(parentRoleId, new Set());
    }
    this.roleHierarchy.get(parentRoleId)!.add(childRoleId);

    this.emit('hierarchy-updated', { parentRoleId, childRoleId });
    this.logger.debug(`Role hierarchy set: ${parentRoleId} -> ${childRoleId}`);

    return true;
  }

  // Get role templates
  getTemplates(): RoleTemplate[] {
    return Array.from(this.templates.values());
  }

  // Add custom template
  addTemplate(template: RoleTemplate): void {
    this.templates.set(template.name, template);
    this.emit('template-added', template);
    this.logger.info(`Template added: ${template.name}`);
  }

  private matchesResource(permissionResource: string, requestedResource: string): boolean {
    if (permissionResource === '*') return true;
    if (permissionResource === requestedResource) return true;
    
    // Support wildcard patterns
    const pattern = permissionResource.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(requestedResource);
  }

  private matchesAction(permissionActions: string[], requestedAction: string): boolean {
    return permissionActions.includes('*') || permissionActions.includes(requestedAction);
  }

  private wouldCreateCircularDependency(parentId: string, childId: string): boolean {
    // Simple cycle detection - in practice, would use more sophisticated algorithm
    const visited = new Set<string>();
    
    const hasPath = (from: string, to: string): boolean => {
      if (from === to) return true;
      if (visited.has(from)) return false;
      
      visited.add(from);
      const children = this.roleHierarchy.get(from) || new Set();
      
      for (const child of children) {
        if (hasPath(child, to)) return true;
      }
      
      return false;
    };
    
    return hasPath(childId, parentId);
  }

  private removeAllRoleAssignments(roleId: string): void {
    const assignmentsToRemove: string[] = [];
    
    for (const [assignmentId, assignment] of this.assignments) {
      if (assignment.roleId === roleId) {
        assignmentsToRemove.push(assignmentId);
      }
    }
    
    assignmentsToRemove.forEach(assignmentId => {
      this.revokeRole(assignmentId);
      this.assignments.delete(assignmentId);
    });
  }

  private removeFromHierarchy(roleId: string): void {
    // Remove as parent
    this.roleHierarchy.delete(roleId);
    
    // Remove as child
    for (const [parentId, children] of this.roleHierarchy) {
      children.delete(roleId);
      if (children.size === 0) {
        this.roleHierarchy.delete(parentId);
      }
    }
  }

  private generateRoleId(): string {
    return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAssignmentId(): string {
    return `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get statistics
  getStats(): {
    totalRoles: number;
    totalAssignments: number;
    activeAssignments: number;
    totalTemplates: number;
    hierarchyRelations: number;
    } {
    const assignments = Array.from(this.assignments.values());
    const activeAssignments = assignments.filter(a => a.status === 'active').length;
    
    let hierarchyRelations = 0;
    for (const children of this.roleHierarchy.values()) {
      hierarchyRelations += children.size;
    }

    return {
      totalRoles: this.roles.size,
      totalAssignments: assignments.length,
      activeAssignments,
      totalTemplates: this.templates.size,
      hierarchyRelations
    };
  }

  // Clear all roles and assignments
  clear(): void {
    this.roles.clear();
    this.assignments.clear();
    this.agentRoles.clear();
    this.roleHierarchy.clear();
    
    // Keep default templates
    this.initializeDefaultTemplates();
    
    this.emit('cleared');
    this.logger.info('All roles and assignments cleared');
  }
}
