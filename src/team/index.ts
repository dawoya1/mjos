/**
 * MJOS Team System
 * 魔剑工作室操作系统团队系统
 */

import { EventBus, Logger } from '../core/index';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  status: 'active' | 'busy' | 'offline';
  expertise: string[];
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
}

export interface CollaborationSession {
  id: string;
  participants: string[];
  topic: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed';
}

export class TeamManager {
  private members: Map<string, TeamMember> = new Map();
  private tasks: Map<string, Task> = new Map();
  private sessions: Map<string, CollaborationSession> = new Map();
  private logger: Logger;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.logger = new Logger('TeamManager');
    this.eventBus = eventBus;
    this.initializeDefaultTeam();
  }

  // Team Member Management
  addMember(member: TeamMember): void {
    this.members.set(member.id, member);
    this.logger.info(`Team member added: ${member.name} (${member.role})`);
    this.eventBus.emit('team:member:added', member);
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
      status: 'active'
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

  // Statistics
  getTeamStats(): {
    totalMembers: number;
    activeMembers: number;
    totalTasks: number;
    completedTasks: number;
    activeSessions: number;
  } {
    const members = Array.from(this.members.values());
    const tasks = Array.from(this.tasks.values());
    const sessions = Array.from(this.sessions.values());

    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'active').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      activeSessions: sessions.filter(s => s.status === 'active').length
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
        expertise: ['AI分析', '系统协调', '智能决策']
      },
      {
        id: 'moxiaochuang',
        name: '莫小创',
        role: '创新设计专家',
        capabilities: ['design', 'innovation', 'creativity'],
        status: 'active',
        expertise: ['创新设计', '产品规划', '用户体验']
      },
      {
        id: 'moxiaocang',
        name: '莫小仓',
        role: 'Cangjie编程专家',
        capabilities: ['programming', 'cangjie', 'development'],
        status: 'active',
        expertise: ['仓颉编程', '系统开发', '代码优化']
      },
      {
        id: 'moxiaoce',
        name: '莫小测',
        role: '质量测试专家',
        capabilities: ['testing', 'quality', 'validation'],
        status: 'active',
        expertise: ['质量测试', '系统验证', '性能优化']
      }
    ];

    defaultMembers.forEach(member => this.addMember(member));
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
