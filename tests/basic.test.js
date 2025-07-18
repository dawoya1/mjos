/**
 * Basic MJOS Tests
 * 基础MJOS测试
 */

const { MJOS } = require('../dist/index.js');
const { getVersion } = require('../dist/utils/version.js');

describe('MJOS Basic Tests', () => {
  let mjos;

  beforeEach(() => {
    mjos = new MJOS();
  });

  afterEach(async () => {
    if (mjos.getStatus().engine.running) {
      await mjos.stop();
    }
    // Clean up all resources to prevent timer leaks
    mjos.cleanup();
  });

  describe('Initialization', () => {
    test('should initialize correctly', () => {
      expect(mjos).toBeDefined();
      expect(mjos.getVersion()).toBe(getVersion());
    });

    test('should have all subsystems', () => {
      expect(mjos.getEngine()).toBeDefined();
      expect(mjos.getContextManager()).toBeDefined();
      expect(mjos.getMemorySystem()).toBeDefined();
      expect(mjos.getTeamManager()).toBeDefined();
    });
  });

  describe('Lifecycle', () => {
    test('should start and stop', async () => {
      expect(mjos.getStatus().engine.running).toBe(false);
      
      await mjos.start();
      expect(mjos.getStatus().engine.running).toBe(true);
      
      await mjos.stop();
      expect(mjos.getStatus().engine.running).toBe(false);
    });
  });

  describe('Memory System', () => {
    test('should remember and recall', () => {
      const memoryId = mjos.remember('test content', { tags: ['test'], importance: 0.8 });
      expect(memoryId).toBeDefined();
      
      const memories = mjos.recall({ tags: ['test'] });
      expect(memories).toHaveLength(1);
      expect(memories[0].content).toBe('test content');
    });
  });

  describe('Team System', () => {
    test('should create and assign tasks', () => {
      const taskId = mjos.createTask('Test Task', 'Description', 'high');
      expect(taskId).toBeDefined();
      
      const assigned = mjos.assignTask(taskId, 'moxiaozhi');
      expect(assigned).toBe(true);
    });

    test('should have default team members', () => {
      const teamManager = mjos.getTeamManager();
      const members = teamManager.getAllMembers();
      
      expect(members).toHaveLength(4);
      expect(members.map(m => m.name)).toContain('莫小智');
    });
  });

  describe('Context Management', () => {
    test('should manage context', () => {
      const contextManager = mjos.getContextManager();

      // Create a session
      const sessionId = contextManager.createSession();
      expect(sessionId).toBeDefined();

      // Set and get working memory
      const success = contextManager.setWorkingMemory(sessionId, 'test-key', 'test-value');
      expect(success).toBe(true);

      const value = contextManager.getWorkingMemory(sessionId, 'test-key');
      expect(value).toBe('test-value');

      // Check session exists
      const session = contextManager.getSession(sessionId);
      expect(session).toBeDefined();
    });
  });

  describe('Status Reporting', () => {
    test('should provide comprehensive status', () => {
      const status = mjos.getStatus();
      
      expect(status.version).toBe(getVersion());
      expect(status.engine).toBeDefined();
      expect(status.memory).toBeDefined();
      expect(status.team).toBeDefined();
      
      expect(status.team.totalMembers).toBe(4);
    });
  });

  describe('Integration', () => {
    test('should coordinate between systems', async () => {
      // Start the system
      await mjos.start();

      // Create a task and remember it
      const taskId = mjos.createTask('Integration Task', 'Test integration', 'medium');
      mjos.remember(`Task created: ${taskId}`, { tags: ['task', 'integration'], importance: 0.7 });

      // Assign the task
      const assigned = mjos.assignTask(taskId, 'moxiaochuang');
      expect(assigned).toBe(true);

      // Verify memory
      const memories = mjos.recall({ tags: ['integration'] });
      expect(memories).toHaveLength(1);

      // Verify task
      const teamManager = mjos.getTeamManager();
      const tasks = teamManager.getTasks({ assignedTo: 'moxiaochuang' });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Integration Task');

      // Check final status
      const status = mjos.getStatus();
      expect(status.memory.totalMemories).toBeGreaterThan(0);
      expect(status.team.totalTasks).toBeGreaterThan(0);
    });
  });

  describe('Extended Coverage Tests', () => {
    test('should handle memory system edge cases', () => {
      const memorySystem = mjos.getMemorySystem();

      // Test memory deletion
      const id1 = memorySystem.store('temp content', ['temp']);
      expect(memorySystem.delete(id1)).toBe(true);
      expect(memorySystem.delete('non-existent')).toBe(false);

      // Test memory clearing
      memorySystem.store('content1', ['tag1']);
      memorySystem.store('content2', ['tag2']);
      memorySystem.clear();

      const stats = memorySystem.getStats();
      expect(stats.totalMemories).toBe(0);
      expect(stats.totalTags).toBe(0);
    });

    test('should handle team system edge cases', () => {
      const teamManager = mjos.getTeamManager();

      // Test member status updates
      expect(teamManager.updateMemberStatus('moxiaozhi', 'busy')).toBe(true);
      expect(teamManager.updateMemberStatus('non-existent', 'busy')).toBe(false);

      // Test task status updates
      const taskId = teamManager.createTask({
        title: 'Test Task',
        description: 'Description',
        status: 'pending',
        priority: 'low'
      });

      expect(teamManager.updateTaskStatus(taskId, 'completed')).toBe(true);
      expect(teamManager.updateTaskStatus('non-existent', 'completed')).toBe(false);

      // Test collaboration sessions
      const sessionId = teamManager.startCollaboration('Test Session', ['moxiaozhi']);
      expect(teamManager.endCollaboration(sessionId)).toBe(true);
      expect(teamManager.endCollaboration('non-existent')).toBe(false);
    });

    test('should handle context manager operations', () => {
      const contextManager = mjos.getContextManager();

      // Create a session for testing
      const sessionId = contextManager.createSession();

      // Test working memory operations
      contextManager.setWorkingMemory(sessionId, 'key1', 'value1');
      contextManager.setWorkingMemory(sessionId, 'key2', { nested: 'object' });

      expect(contextManager.getWorkingMemory(sessionId, 'key1')).toBe('value1');
      expect(contextManager.getWorkingMemory(sessionId, 'key2')).toEqual({ nested: 'object' });
      expect(contextManager.getWorkingMemory(sessionId, 'non-existent')).toBeUndefined();

      // Test session operations
      expect(contextManager.getSession(sessionId)).toBeDefined();
      expect(contextManager.getSession('non-existent')).toBeUndefined();

      // Test session deletion
      expect(contextManager.deleteSession(sessionId)).toBe(true);
      expect(contextManager.deleteSession('non-existent')).toBe(false);

      // Test session stats
      const stats = contextManager.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalSessions).toBe('number');
    });

    test('should handle engine lifecycle edge cases', async () => {
      const engine = mjos.getEngine();

      // Test starting already running engine
      await mjos.start();
      await mjos.start(); // Should not throw
      expect(mjos.getStatus().engine.running).toBe(true);

      // Test stopping already stopped engine
      await mjos.stop();
      await mjos.stop(); // Should not throw
      expect(mjos.getStatus().engine.running).toBe(false);
    });

    test('should handle memory queries with different parameters', () => {
      const memorySystem = mjos.getMemorySystem();

      // Create test memories
      const now = new Date();
      const past = new Date(now.getTime() - 1000);

      memorySystem.store('high importance', ['test'], 0.9);
      memorySystem.store('medium importance', ['test'], 0.5);
      memorySystem.store('low importance', ['test'], 0.1);

      // Test importance filtering
      const highImportance = memorySystem.query({
        importance: { min: 0.8, max: 1.0 }
      });
      expect(highImportance).toHaveLength(1);

      // Test time range filtering
      const recentMemories = memorySystem.query({
        timeRange: { start: past, end: new Date() }
      });
      expect(recentMemories.length).toBeGreaterThan(0);

      // Test limit
      const limitedResults = memorySystem.query({
        tags: ['test'],
        limit: 2
      });
      expect(limitedResults.length).toBeLessThanOrEqual(2);
    });
  });
});
