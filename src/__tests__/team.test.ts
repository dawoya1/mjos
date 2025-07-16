/**
 * Team System Tests
 * 团队系统测试
 */

import { TeamManager, TeamMember } from '../team/index';
import { EventBus } from '../core/index';

describe('TeamManager', () => {
  let teamManager: TeamManager;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    teamManager = new TeamManager(eventBus);
  });

  describe('Team Member Management', () => {
    test('should initialize with default team members', () => {
      const members = teamManager.getAllMembers();
      
      expect(members).toHaveLength(4);
      expect(members.map(m => m.name)).toContain('莫小智');
      expect(members.map(m => m.name)).toContain('莫小创');
      expect(members.map(m => m.name)).toContain('莫小仓');
      expect(members.map(m => m.name)).toContain('莫小测');
    });

    test('should add new team member', () => {
      const newMember: TeamMember = {
        id: 'test-member',
        name: '测试成员',
        role: '测试角色',
        capabilities: ['testing'],
        status: 'active',
        expertise: ['测试专业']
      };

      teamManager.addMember(newMember);
      
      const member = teamManager.getMember('test-member');
      expect(member).toEqual(newMember);
      
      const allMembers = teamManager.getAllMembers();
      expect(allMembers).toHaveLength(5);
    });

    test('should update member status', () => {
      const updated = teamManager.updateMemberStatus('moxiaozhi', 'busy');
      
      expect(updated).toBe(true);
      
      const member = teamManager.getMember('moxiaozhi');
      expect(member!.status).toBe('busy');
    });

    test('should return false when updating non-existent member', () => {
      const updated = teamManager.updateMemberStatus('non-existent', 'busy');
      expect(updated).toBe(false);
    });
  });

  describe('Task Management', () => {
    test('should create task', () => {
      const taskId = teamManager.createTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'high'
      });

      expect(taskId).toBeDefined();
      expect(taskId).toMatch(/^task_\d+_[a-z0-9]+$/);

      const tasks = teamManager.getTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Test Task');
      expect(tasks[0].priority).toBe('high');
    });

    test('should assign task to member', () => {
      const taskId = teamManager.createTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium'
      });

      const assigned = teamManager.assignTask(taskId, 'moxiaozhi');
      
      expect(assigned).toBe(true);
      
      const tasks = teamManager.getTasks();
      expect(tasks[0].assignedTo).toBe('moxiaozhi');
      expect(tasks[0].status).toBe('in_progress');
    });

    test('should not assign task to non-existent member', () => {
      const taskId = teamManager.createTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium'
      });

      const assigned = teamManager.assignTask(taskId, 'non-existent');
      expect(assigned).toBe(false);
    });

    test('should update task status', () => {
      const taskId = teamManager.createTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium'
      });

      const updated = teamManager.updateTaskStatus(taskId, 'completed');
      
      expect(updated).toBe(true);
      
      const tasks = teamManager.getTasks();
      expect(tasks[0].status).toBe('completed');
    });

    test('should filter tasks by assignee', () => {
      const taskId1 = teamManager.createTask({
        title: 'Task 1',
        description: 'Description 1',
        status: 'pending',
        priority: 'medium'
      });

      const taskId2 = teamManager.createTask({
        title: 'Task 2',
        description: 'Description 2',
        status: 'pending',
        priority: 'medium'
      });

      teamManager.assignTask(taskId1, 'moxiaozhi');
      teamManager.assignTask(taskId2, 'moxiaochuang');

      const zhiTasks = teamManager.getTasks({ assignedTo: 'moxiaozhi' });
      const chuangTasks = teamManager.getTasks({ assignedTo: 'moxiaochuang' });

      expect(zhiTasks).toHaveLength(1);
      expect(zhiTasks[0].title).toBe('Task 1');
      
      expect(chuangTasks).toHaveLength(1);
      expect(chuangTasks[0].title).toBe('Task 2');
    });

    test('should filter tasks by status', () => {
      const taskId1 = teamManager.createTask({
        title: 'Task 1',
        description: 'Description 1',
        status: 'pending',
        priority: 'medium'
      });

      const taskId2 = teamManager.createTask({
        title: 'Task 2',
        description: 'Description 2',
        status: 'pending',
        priority: 'medium'
      });

      teamManager.updateTaskStatus(taskId1, 'completed');

      const completedTasks = teamManager.getTasks({ status: 'completed' });
      const pendingTasks = teamManager.getTasks({ status: 'pending' });

      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].title).toBe('Task 1');
      
      expect(pendingTasks).toHaveLength(1);
      expect(pendingTasks[0].title).toBe('Task 2');
    });
  });

  describe('Collaboration Sessions', () => {
    test('should start collaboration session', () => {
      const sessionId = teamManager.startCollaboration('Test Topic', ['moxiaozhi', 'moxiaochuang']);
      
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      
      const activeSessions = teamManager.getActiveSessions();
      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].topic).toBe('Test Topic');
      expect(activeSessions[0].participants).toEqual(['moxiaozhi', 'moxiaochuang']);
    });

    test('should end collaboration session', () => {
      const sessionId = teamManager.startCollaboration('Test Topic', ['moxiaozhi']);
      
      const ended = teamManager.endCollaboration(sessionId);
      
      expect(ended).toBe(true);
      
      const activeSessions = teamManager.getActiveSessions();
      expect(activeSessions).toHaveLength(0);
    });

    test('should not end non-existent session', () => {
      const ended = teamManager.endCollaboration('non-existent');
      expect(ended).toBe(false);
    });
  });

  describe('Statistics', () => {
    test('should return correct team statistics', () => {
      // Create some tasks
      const taskId1 = teamManager.createTask({
        title: 'Task 1',
        description: 'Description 1',
        status: 'pending',
        priority: 'medium'
      });

      const taskId2 = teamManager.createTask({
        title: 'Task 2',
        description: 'Description 2',
        status: 'pending',
        priority: 'medium'
      });

      teamManager.updateTaskStatus(taskId1, 'completed');
      
      // Start a collaboration session
      teamManager.startCollaboration('Test Topic', ['moxiaozhi']);

      const stats = teamManager.getTeamStats();

      expect(stats.totalMembers).toBe(4);
      expect(stats.activeMembers).toBe(4);
      expect(stats.totalTasks).toBe(2);
      expect(stats.completedTasks).toBe(1);
      expect(stats.activeSessions).toBe(1);
    });
  });

  describe('Event Emission', () => {
    test('should emit events for member actions', () => {
      const memberAddedSpy = jest.fn();
      eventBus.on('team:member:added', memberAddedSpy);

      const newMember: TeamMember = {
        id: 'test-member',
        name: '测试成员',
        role: '测试角色',
        capabilities: ['testing'],
        status: 'active',
        expertise: ['测试专业']
      };

      teamManager.addMember(newMember);
      
      expect(memberAddedSpy).toHaveBeenCalledWith(newMember);
    });

    test('should emit events for task actions', () => {
      const taskCreatedSpy = jest.fn();
      const taskAssignedSpy = jest.fn();
      
      eventBus.on('team:task:created', taskCreatedSpy);
      eventBus.on('team:task:assigned', taskAssignedSpy);

      const taskId = teamManager.createTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium'
      });

      expect(taskCreatedSpy).toHaveBeenCalled();

      teamManager.assignTask(taskId, 'moxiaozhi');
      
      expect(taskAssignedSpy).toHaveBeenCalled();
    });
  });
});
