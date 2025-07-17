/**
 * MJOS Integration Tests
 * 魔剑工作室操作系统集成测试
 */

import { MJOS } from '../src/index';

describe('MJOS Integration Tests', () => {
  let mjos: MJOS;

  beforeAll(async () => {
    mjos = new MJOS();
    await mjos.start();
  });

  afterAll(async () => {
    await mjos.stop();
    mjos.cleanup();
  });

  describe('Core System', () => {
    test('should initialize successfully', () => {
      expect(mjos).toBeDefined();
      expect(mjos.getVersion()).toBeDefined();
    });

    test('should provide system status', () => {
      const status = mjos.getStatus();
      expect(status).toBeDefined();
      expect(status.version).toBeDefined();
      expect(status.engine).toBeDefined();
    });
  });

  describe('Memory System', () => {
    test('should store and retrieve memories', () => {
      const memorySystem = mjos.getMemorySystem();
      
      const memoryId = memorySystem.store('Test memory', ['test'], 0.8);
      expect(memoryId).toBeDefined();
      
      const memory = memorySystem.retrieve(memoryId);
      expect(memory).toBeDefined();
      expect(memory?.content).toBe('Test memory');
    });

    test('should query memories by tags', () => {
      const memorySystem = mjos.getMemorySystem();
      
      memorySystem.store('Memory 1', ['test', 'integration'], 0.7);
      memorySystem.store('Memory 2', ['test', 'unit'], 0.6);
      
      const results = memorySystem.query({ tags: ['test'] });
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Knowledge Graph', () => {
    test('should add and query knowledge', () => {
      const knowledgeGraph = mjos.getKnowledgeGraph();
      
      const knowledgeId = knowledgeGraph.add({
        type: 'fact',
        content: 'Test knowledge',
        metadata: {
          domain: 'test',
          confidence: 0.9,
          importance: 0.8,
          tags: ['test'],
          version: 1,
          source: 'test'
        },
        relationships: []
      });
      
      expect(knowledgeId).toBeDefined();
      
      const results = knowledgeGraph.query({ content: 'Test' });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Context Management', () => {
    test('should create and manage sessions', () => {
      const contextManager = mjos.getContextManager();
      
      const sessionId = contextManager.createSession('test-user');
      expect(sessionId).toBeDefined();
      
      const success = contextManager.addMessage(sessionId, {
        role: 'user',
        content: 'Test message'
      });
      expect(success).toBe(true);
      
      const session = contextManager.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.state.conversationHistory.length).toBe(1);
    });
  });

  describe('Reasoning Engine', () => {
    test('should perform deductive reasoning', async () => {
      const result = await mjos.reason('deductive', {
        premises: ['All tests should pass', 'This is a test'],
        conclusion: 'This should pass'
      });

      expect(result).toBeDefined();
      expect(result.metadata.reasoningType).toBe('deductive');
    });

    test('should perform inductive reasoning', async () => {
      const result = await mjos.reason('inductive', ['Test 1 passed', 'Test 2 passed']);

      expect(result).toBeDefined();
      expect(result.metadata.reasoningType).toBe('inductive');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Team Management', () => {
    test('should manage team members', () => {
      const teamManager = mjos.getTeamManager();
      
      const members = teamManager.getAllMembers();
      expect(members).toBeDefined();
      expect(members.length).toBeGreaterThan(0);
    });

    test('should create and manage tasks', () => {
      const taskId = mjos.createTask('Test task', 'Test description');
      expect(taskId).toBeDefined();
      
      const teamManager = mjos.getTeamManager();
      const tasks = teamManager.getTasks();
      expect(tasks.length).toBeGreaterThan(0);
    });
  });

  describe('Agent Management', () => {
    test('should create and manage agents', () => {
      const agentId = mjos.createAgent({
        name: 'Test Agent',
        type: 'reactive',
        capabilities: [
          { name: 'test', type: 'cognitive', parameters: {}, constraints: {} }
        ],
        configuration: {
          maxConcurrentTasks: 1,
          memoryLimit: 100,
          collaborationMode: 'collaboration',
          preferences: {}
        }
      });
      
      expect(agentId).toBeDefined();
      
      const agentManager = mjos.getAgentManager();
      const agent = agentManager.getAgent(agentId);
      expect(agent).toBeDefined();
      expect(agent?.name).toBe('Test Agent');
    });
  });

  describe('Communication System', () => {
    test('should create channels and send messages', async () => {
      const channelId = mjos.createCommunicationChannel(
        'test-channel',
        ['user1', 'user2'],
        'multicast'
      );
      expect(channelId).toBeDefined();
      
      const messageId = await mjos.sendMessage(
        'user1',
        'user2',
        'Test message',
        'notification'
      );
      expect(messageId).toBeDefined();
    });
  });

  describe('Workflow Engine', () => {
    test('should execute workflows', async () => {
      const executionId = await mjos.executeWorkflow('task_assignment', {
        task: { id: 'test-task', title: 'Test Task' }
      });
      
      expect(executionId).toBeDefined();
      
      const workflowEngine = mjos.getWorkflowEngine();
      const execution = workflowEngine.getExecution(executionId);
      expect(execution).toBeDefined();
    });
  });

  describe('Storage System', () => {
    test('should store and retrieve data', async () => {
      const storageManager = mjos.getStorageManager();
      
      await storageManager.set('test-key', { value: 'test-data' });
      const retrieved = await storageManager.get('test-key');
      
      expect(retrieved).toBeDefined();
      expect(retrieved.value).toBe('test-data');
    });

    test('should handle non-existent keys', async () => {
      const storageManager = mjos.getStorageManager();
      const result = await storageManager.get('non-existent-key');
      expect(result).toBeUndefined();
    });
  });

  describe('Security System', () => {
    test('should create users and authenticate', async () => {
      const securityManager = mjos.getSecurityManager();
      
      const userId = await securityManager.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        roles: ['user']
      });
      
      expect(userId).toBeDefined();
      
      const authToken = await securityManager.authenticateUser('testuser', 'TestPass123!');
      expect(authToken).toBeDefined();
      expect(authToken?.token).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const securityManager = mjos.getSecurityManager();
      
      const authToken = await securityManager.authenticateUser('testuser', 'wrongpassword');
      expect(authToken).toBeNull();
    });
  });

  describe('Monitoring System', () => {
    test('should record and retrieve metrics', () => {
      const monitoringSystem = mjos.getMonitoringSystem();
      
      monitoringSystem.recordMetric('test.metric', 42, 'count');
      
      const metrics = monitoringSystem.getMetrics('test.metric');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]?.value).toBe(42);
    });

    test('should provide system health', () => {
      const monitoringSystem = mjos.getMonitoringSystem();
      
      const health = monitoringSystem.getSystemHealth();
      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(['healthy', 'warning', 'critical']).toContain(health.overall);
    });
  });

  describe('Performance Monitoring', () => {
    test('should provide performance metrics', () => {
      const performanceMonitor = mjos.getPerformanceMonitor();
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toBeDefined();
      
      const summary = performanceMonitor.getSummary();
      expect(summary).toBeDefined();
    });
  });

  describe('System Integration', () => {
    test('should handle complex workflows', async () => {
      // Create a task
      const taskId = mjos.createTask('Integration test task', 'Complex workflow test');
      
      // Create an agent
      const agentId = mjos.createAgent({
        name: 'Integration Agent',
        type: 'collaborative',
        capabilities: [
          { name: 'execution', type: 'cognitive', parameters: {}, constraints: {} }
        ],
        configuration: {
          maxConcurrentTasks: 1,
          memoryLimit: 500,
          collaborationMode: 'collaboration',
          preferences: {}
        }
      });
      
      // Assign task to agent
      const assignmentId = mjos.assignTaskToAgent(taskId, agentId);
      expect(assignmentId).toBeDefined();
      
      // Store memory about the task
      const memorySystem = mjos.getMemorySystem();
      const memoryId = memorySystem.store(
        { task: taskId, agent: agentId, status: 'assigned' },
        ['integration', 'task', 'assignment'],
        0.8
      );
      expect(memoryId).toBeDefined();
      
      // Record metrics
      const monitoringSystem = mjos.getMonitoringSystem();
      monitoringSystem.recordMetric('integration.tasks', 1, 'count');
      
      // Verify everything is connected
      const status = mjos.getStatus();
      expect(status.team.totalTasks).toBeGreaterThan(0);
      expect(status.memory.totalMemories).toBeGreaterThan(0);
    });
  });
});
