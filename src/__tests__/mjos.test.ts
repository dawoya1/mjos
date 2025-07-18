/**
 * MJOS Integration Tests
 * MJOS集成测试
 */

import { MJOS } from '../index';
import { getVersion } from '../utils/version';

describe('MJOS Integration', () => {
  let mjos: MJOS;

  beforeEach(() => {
    mjos = new MJOS();
  });

  afterEach(async () => {
    if (mjos.getStatus().engine.running) {
      await mjos.stop();
    }
    // Cleanup resources to prevent leaks
    mjos.cleanup();
  });

  describe('Initialization', () => {
    test('should initialize with correct version', () => {
      expect(mjos.getVersion()).toBe(getVersion());
    });

    test('should initialize with all subsystems', () => {
      expect(mjos.getEngine()).toBeDefined();
      expect(mjos.getContextManager()).toBeDefined();
      expect(mjos.getMemorySystem()).toBeDefined();
      expect(mjos.getTeamManager()).toBeDefined();
    });

    test('should start in stopped state', () => {
      const status = mjos.getStatus();
      expect(status.engine.running).toBe(false);
    });
  });

  describe('Lifecycle Management', () => {
    test('should start and stop correctly', async () => {
      await mjos.start();
      expect(mjos.getStatus().engine.running).toBe(true);

      await mjos.stop();
      expect(mjos.getStatus().engine.running).toBe(false);
    });

    test('should store startup and shutdown events in memory', async () => {
      await mjos.start();

      // Check startup events before stopping
      const startupEvents = mjos.recall({ tags: ['startup'] });
      expect(startupEvents).toHaveLength(1);

      await mjos.stop();

      // Check shutdown events immediately after stopping but before destroy
      const shutdownEvents = mjos.recall({ tags: ['shutdown'] });
      expect(shutdownEvents).toHaveLength(1);

      const systemEvents = mjos.recall({ tags: ['system'] });
      expect(systemEvents.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Memory System Integration', () => {
    test('should remember and recall information', () => {
      const memoryId = mjos.remember('test content', { tags: ['test'], importance: 0.8 });
      
      expect(memoryId).toBeDefined();
      
      const memories = mjos.recall({ tags: ['test'] });
      expect(memories).toHaveLength(1);
      expect(memories[0].content).toBe('test content');
      expect(memories[0].importance).toBe(0.8);
    });

    test('should use memory system directly', () => {
      const memorySystem = mjos.getMemorySystem();
      const id = memorySystem.store('direct access', ['direct']);
      
      const memory = memorySystem.retrieve(id);
      expect(memory).toBeDefined();
      expect(memory!.content).toBe('direct access');
    });
  });

  describe('Team System Integration', () => {
    test('should create and assign tasks', () => {
      const taskId = mjos.createTask('Integration Test Task', 'Test task description', 'high');
      
      expect(taskId).toBeDefined();
      
      const assigned = mjos.assignTask(taskId, 'moxiaozhi');
      expect(assigned).toBe(true);
      
      const teamManager = mjos.getTeamManager();
      const tasks = teamManager.getTasks({ assignedTo: 'moxiaozhi' });
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0]?.title).toBe('Integration Test Task');
      expect(tasks[0]?.status).toBe('in_progress');
    });

    test('should access team manager directly', () => {
      const teamManager = mjos.getTeamManager();
      const members = teamManager.getAllMembers();
      
      expect(members).toHaveLength(4);
      expect(members.map(m => m.name)).toContain('莫小智');
    });
  });

  describe('Context Management Integration', () => {
    test('should manage context through context manager', () => {
      const contextManager = mjos.getContextManager();

      // Ensure default session exists
      if (!contextManager.getSession('default')) {
        contextManager.createSession('default');
      }

      contextManager.set('project', 'MJOS Testing');
      contextManager.set('phase', 'integration');

      expect(contextManager.get('project')).toBe('MJOS Testing');
      expect(contextManager.get('phase')).toBe('integration');
      
      const allContext = contextManager.getAll();
      expect(allContext).toEqual({
        project: 'MJOS Testing',
        phase: 'integration'
      });
    });
  });

  describe('Status Reporting', () => {
    test('should provide comprehensive status', async () => {
      // Add some data to systems
      mjos.remember('test memory', { tags: ['test'] });
      mjos.createTask('test task', 'description');
      
      await mjos.start();
      
      const status = mjos.getStatus();

      expect(status.version).toBe(getVersion());
      expect(status.engine.running).toBe(true);
      expect(status.memory.totalMemories).toBeGreaterThan(0);
      expect(status.team.totalMembers).toBe(4);
      expect(status.team.totalTasks).toBeGreaterThan(0);
    });

    test('should update status as systems change', () => {
      const initialStatus = mjos.getStatus();
      
      mjos.remember('memory 1', { tags: ['tag1'] });
      mjos.remember('memory 2', { tags: ['tag2'] });
      mjos.createTask('task 1', 'description 1');
      
      const updatedStatus = mjos.getStatus();
      
      expect(updatedStatus.memory.totalMemories).toBe(initialStatus.memory.totalMemories + 2);
      expect(updatedStatus.team.totalTasks).toBe(initialStatus.team.totalTasks + 1);
    });
  });

  describe('Cross-System Integration', () => {
    test('should coordinate between memory and team systems', () => {
      // Create a task and remember it
      const taskId = mjos.createTask('Important Task', 'Critical task description', 'urgent');
      mjos.remember(`Task created: ${taskId}`, { tags: ['task', 'creation'], importance: 0.9 });

      // Assign the task and remember the assignment
      mjos.assignTask(taskId, 'moxiaozhi');
      mjos.remember(`Task ${taskId} assigned to 莫小智`, { tags: ['task', 'assignment'], importance: 0.8 });
      
      // Verify both systems have the information
      const taskMemories = mjos.recall({ tags: ['task'] });
      expect(taskMemories).toHaveLength(2);
      
      const teamManager = mjos.getTeamManager();
      const tasks = teamManager.getTasks({ assignedTo: 'moxiaozhi' });
      expect(tasks).toHaveLength(1);
      expect(tasks[0]?.priority).toBe('urgent');
    });

    test('should maintain context across operations', () => {
      const contextManager = mjos.getContextManager();

      // Ensure default session exists
      if (!contextManager.getSession('default')) {
        contextManager.createSession('default');
      }

      contextManager.set('current-user', 'test-user');
      contextManager.set('session-id', 'test-session');

      // Perform operations that might use context
      mjos.createTask('Context Task', 'Task with context');
      mjos.remember('Context memory', { tags: ['context'] });

      // Verify context is maintained
      expect(contextManager.get('current-user')).toBe('test-user');
      expect(contextManager.get('session-id')).toBe('test-session');
      
      // Verify operations completed successfully
      const teamManager = mjos.getTeamManager();
      const tasks = teamManager.getTasks();
      expect(tasks.some(t => t.title === 'Context Task')).toBe(true);
      
      const memories = mjos.recall({ tags: ['context'] });
      expect(memories).toHaveLength(1);
    });
  });
});
