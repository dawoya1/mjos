/**
 * MJOS Enhanced Team System
 * 魔剑工作室操作系统增强团队系统
 */

import { EventBus, Logger } from '../core/index';
import { AgentManager } from '../agents/index';
import { RoleManager } from '../roles/index';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  status: 'active' | 'busy' | 'offline';
  expertise: string[];
  agentId?: string; // Link to agent system
  roleIds?: string[]; // Link to role system
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
  estimatedDuration?: number; // minutes
  dependencies?: string[]; // task IDs
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
  dependencies?: string[]; // step IDs
  estimatedDuration?: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  assignedTo?: string;
  completedAt?: Date;
}

export class TeamManager {
  private members: Map<string, TeamMember> = new Map();
  private tasks: Map<string, Task> = new Map();
  private sessions: Map<string, CollaborationSession> = new Map();
  private workflows: Map<string, TeamWorkflow> = new Map();
  private logger: Logger;
  private eventBus: EventBus;
  private agentManager: AgentManager | undefined;
  private roleManager: RoleManager | undefined;

  constructor(eventBus: EventBus, agentManager?: AgentManager, roleManager?: RoleManager) {
    this.logger = new Logger('TeamManager');
    this.eventBus = eventBus;
    this.agentManager = agentManager;
    this.roleManager = roleManager;
    this.initializeDefaultTeam();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for agent events if agent manager is available
    if (this.agentManager) {
      this.agentManager.on('agent-created', (agent) => {
        this.logger.debug(`Agent created: ${agent.id}, considering team integration`);
      });

      this.agentManager.on('task-completed', ({ assignment, agent, result: _result }) => {
        this.updateMemberPerformance(agent.id, true);
        this.logger.info(`Task completed by agent ${agent.id}: ${assignment.taskId}`);
      });

      this.agentManager.on('task-failed', ({ assignment, agent, error }) => {
        this.updateMemberPerformance(agent.id, false);
        this.logger.warn(`Task failed by agent ${agent.id}: ${assignment.taskId} - ${error}`);
      });
    }

    // Listen for role events if role manager is available
    if (this.roleManager) {
      this.roleManager.on('role-assigned', ({ assignment, role }) => {
        this.updateMemberRoles(assignment.agentId, [assignment.roleId]);
        this.logger.info(`Role ${role.name} assigned to agent ${assignment.agentId}`);
      });

      this.roleManager.on('role-revoked', (assignment) => {
        this.removeMemberRole(assignment.agentId, assignment.roleId);
        this.logger.info(`Role revoked from agent ${assignment.agentId}`);
      });
    }
  }

  // Enhanced Team Member Management
  addMember(member: TeamMember): void {
    // Ensure required fields are present
    if (!member.joinedAt) member.joinedAt = new Date();
    if (!member.lastActivity) member.lastActivity = new Date();
    if (!member.performance) {
      member.performance = {
        tasksCompleted: 0,
        successRate: 1.0,
        collaborationScore: 1.0
      };
    }

    this.members.set(member.id, member);
    this.logger.info(`Team member added: ${member.name} (${member.role})`);
    this.eventBus.emit('team:member:added', member);
  }

  // Add member with agent integration
  addMemberWithAgent(memberData: Omit<TeamMember, 'id' | 'joinedAt' | 'lastActivity' | 'performance'>, agentId?: string): string {
    const id = this.generateId('member');
    const member: TeamMember = {
      id,
      joinedAt: new Date(),
      lastActivity: new Date(),
      performance: {
        tasksCompleted: 0,
        successRate: 1.0,
        collaborationScore: 1.0
      },
      ...memberData,
      ...(agentId ? { agentId } : {})
    };

    this.addMember(member);

    if (agentId && this.agentManager) {
      this.logger.info(`Team member ${id} linked to agent ${agentId}`);
    }

    return id;
  }

  // Update member roles
  updateMemberRoles(memberId: string, roleIds: string[]): boolean {
    const member = this.members.get(memberId);
    if (!member) {
      return false;
    }

    member.roleIds = roleIds;
    member.lastActivity = new Date();
    this.members.set(memberId, member);

    this.eventBus.emit('member:roles-updated', { memberId, roleIds });
    return true;
  }

  // Remove role from member
  removeMemberRole(memberId: string, roleId: string): boolean {
    const member = this.members.get(memberId);
    if (!member || !member.roleIds) {
      return false;
    }

    member.roleIds = member.roleIds.filter(id => id !== roleId);
    member.lastActivity = new Date();
    this.members.set(memberId, member);

    this.eventBus.emit('member:role-removed', { memberId, roleId });
    return true;
  }

  // Update member performance
  updateMemberPerformance(memberId: string, success: boolean): void {
    const member = this.members.get(memberId);
    if (!member) {
      return;
    }

    member.performance.tasksCompleted++;

    // Update success rate using exponential moving average
    const alpha = 0.1;
    member.performance.successRate = (1 - alpha) * member.performance.successRate + alpha * (success ? 1 : 0);

    member.lastActivity = new Date();
    this.members.set(memberId, member);

    this.eventBus.emit('member:performance-updated', { memberId, performance: member.performance });
  }

  getMember(id: string): TeamMember | undefined {
    return this.members.get(id);
  }

  getAllMembers(): TeamMember[] {
    return Array.from(this.members.values());
  }

  updateMemberStatus(id: string, status: TeamMember['status']): boolean {
    const member = this.members.get(id);
    if (member) {
      member.status = status;
      this.logger.debug(`Member ${member.name} status updated to ${status}`);
      this.eventBus.emit('team:member:status_updated', { id, status });
      return true;
    }
    return false;
  }

  // Task Management
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId('task');
    const newTask: Task = {
      ...task,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(id, newTask);
    this.logger.info(`Task created: ${task.title}`);
    this.eventBus.emit('team:task:created', newTask);
    return id;
  }

  assignTask(taskId: string, memberId: string): boolean {
    const task = this.tasks.get(taskId);
    const member = this.members.get(memberId);

    if (task && member) {
      task.assignedTo = memberId;
      task.status = 'in_progress';
      task.updatedAt = new Date();
      
      this.logger.info(`Task "${task.title}" assigned to ${member.name}`);
      this.eventBus.emit('team:task:assigned', { task, member });
      return true;
    }
    return false;
  }

  updateTaskStatus(taskId: string, status: Task['status']): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.updatedAt = new Date();
      
      this.logger.info(`Task "${task.title}" status updated to ${status}`);
      this.eventBus.emit('team:task:status_updated', { taskId, status });
      return true;
    }
    return false;
  }

  getTasks(filter?: { assignedTo?: string; status?: Task['status'] }): Task[] {
    let tasks = Array.from(this.tasks.values());

    if (filter) {
      if (filter.assignedTo) {
        tasks = tasks.filter(task => task.assignedTo === filter.assignedTo);
      }
      if (filter.status) {
        tasks = tasks.filter(task => task.status === filter.status);
      }
    }

    return tasks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Collaboration Sessions
  startCollaboration(topic: string, participants: string[]): string {
    const id = this.generateId('session');
    const session: CollaborationSession = {
      id,
      participants,
      topic,
      startTime: new Date(),
      status: 'active',
      type: 'meeting'
    };

    this.sessions.set(id, session);
    this.logger.info(`Collaboration session started: ${topic}`);
    this.eventBus.emit('team:collaboration:started', session);
    return id;
  }

  endCollaboration(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'active') {
      session.status = 'completed';
      session.endTime = new Date();
      
      this.logger.info(`Collaboration session ended: ${session.topic}`);
      this.eventBus.emit('team:collaboration:ended', session);
      return true;
    }
    return false;
  }

  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.status === 'active');
  }

  // Workflow Management
  createWorkflow(workflow: Omit<TeamWorkflow, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId('workflow');
    const newWorkflow: TeamWorkflow = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...workflow
    };

    this.workflows.set(id, newWorkflow);
    this.eventBus.emit('workflow:created', newWorkflow);
    this.logger.info(`Workflow created: ${workflow.name}`);

    return id;
  }

  getWorkflow(id: string): TeamWorkflow | undefined {
    return this.workflows.get(id);
  }

  // Enhanced collaboration with intelligent task assignment
  assignTaskIntelligently(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.assignedTo) {
      return false;
    }

    // Find best member based on capabilities and workload
    let bestMember: TeamMember | undefined;
    let bestScore = -1;

    for (const member of this.members.values()) {
      if (member.status !== 'active') continue;

      let score = 0;

      // Check capability match
      if (task.requiredCapabilities) {
        const matchingCapabilities = task.requiredCapabilities.filter(cap =>
          member.capabilities.includes(cap)
        );
        score += (matchingCapabilities.length / task.requiredCapabilities.length) * 50;
      }

      // Performance bonus
      score += member.performance.successRate * 20;

      // Workload penalty
      const memberTasks = Array.from(this.tasks.values()).filter(t =>
        t.assignedTo === member.id && t.status === 'in_progress'
      );
      score -= memberTasks.length * 5;

      if (score > bestScore) {
        bestScore = score;
        bestMember = member;
      }
    }

    if (bestMember) {
      return this.assignTask(taskId, bestMember.id);
    }

    return false;
  }

  // Statistics
  getTeamStats(): {
    totalMembers: number;
    activeMembers: number;
    totalTasks: number;
    completedTasks: number;
    activeSessions: number;
    totalWorkflows: number;
    averageSuccessRate: number;
    averageCollaborationScore: number;
    } {
    const members = Array.from(this.members.values());
    const tasks = Array.from(this.tasks.values());
    const sessions = Array.from(this.sessions.values());

    const averageSuccessRate = members.length > 0
      ? members.reduce((sum, m) => sum + m.performance.successRate, 0) / members.length
      : 0;

    const averageCollaborationScore = members.length > 0
      ? members.reduce((sum, m) => sum + m.performance.collaborationScore, 0) / members.length
      : 0;

    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'active').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      totalWorkflows: this.workflows.size,
      averageSuccessRate,
      averageCollaborationScore
    };
  }

  private initializeDefaultTeam(): void {
    // Initialize with MJOS team members
    const defaultMembers: TeamMember[] = [
      {
        id: 'moxiaozhi',
        name: '莫小智',
        role: '智能分析专家',
        capabilities: ['analysis', 'reasoning', 'coordination'],
        status: 'active',
        expertise: ['AI分析', '系统协调', '智能决策'],
        joinedAt: new Date(),
        lastActivity: new Date(),
        performance: {
          tasksCompleted: 0,
          successRate: 1.0,
          collaborationScore: 1.0
        }
      },
      {
        id: 'moxiaochuang',
        name: '莫小创',
        role: '创新设计专家',
        capabilities: ['design', 'innovation', 'creativity'],
        status: 'active',
        expertise: ['创新设计', '产品规划', '用户体验'],
        joinedAt: new Date(),
        lastActivity: new Date(),
        performance: {
          tasksCompleted: 0,
          successRate: 1.0,
          collaborationScore: 1.0
        }
      },
      {
        id: 'moxiaocang',
        name: '莫小仓',
        role: 'Cangjie编程专家',
        capabilities: ['programming', 'cangjie', 'development'],
        status: 'active',
        expertise: ['仓颉编程', '系统开发', '代码优化'],
        joinedAt: new Date(),
        lastActivity: new Date(),
        performance: {
          tasksCompleted: 0,
          successRate: 1.0,
          collaborationScore: 1.0
        }
      },
      {
        id: 'moxiaoce',
        name: '莫小测',
        role: '质量测试专家',
        capabilities: ['testing', 'quality', 'validation'],
        status: 'active',
        expertise: ['质量测试', '系统验证', '性能优化'],
        joinedAt: new Date(),
        lastActivity: new Date(),
        performance: {
          tasksCompleted: 0,
          successRate: 1.0,
          collaborationScore: 1.0
        }
      }
    ];

    defaultMembers.forEach(member => this.addMember(member));
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Destroy and cleanup all resources
  destroy(): void {
    this.members.clear();
    this.tasks.clear();
    this.sessions.clear();
    this.workflows.clear();
    this.logger.info('Team manager destroyed');
  }
}
