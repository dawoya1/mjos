#!/usr/bin/env ts-node

/**
 * MJOS Complete System Demo
 * 魔剑工作室操作系统完整系统演示
 */

import { MJOS } from '../src/index';

async function runCompleteDemo() {
  console.log('🚀 Starting MJOS Complete System Demo...\n');

  // Initialize MJOS
  const mjos = new MJOS();

  try {
    // Start the system
    console.log('📦 Starting MJOS system...');
    await mjos.start();
    console.log('✅ MJOS system started successfully!\n');

    // Demo 1: Memory System
    console.log('🧠 === Memory System Demo ===');
    const memorySystem = mjos.getMemorySystem();
    
    // Store various types of memories
    const memoryId1 = memorySystem.store('MJOS is an advanced AI operating system', ['system', 'description'], 0.9);
    const memoryId2 = memorySystem.store({ task: 'Complete system demo', status: 'in_progress' }, ['demo', 'task'], 0.8);
    const memoryId3 = memorySystem.store('User interaction patterns show high engagement', ['analytics', 'user'], 0.7);
    
    console.log(`📝 Stored 3 memories: ${memoryId1}, ${memoryId2}, ${memoryId3}`);
    
    // Query memories
    const systemMemories = memorySystem.query({ tags: ['system'] });
    console.log(`🔍 Found ${systemMemories.length} system-related memories`);
    
    // Demo 2: Knowledge Graph
    console.log('\n🌐 === Knowledge Graph Demo ===');
    const knowledgeGraph = mjos.getKnowledgeGraph();
    
    // Add knowledge items
    const knowledgeId1 = knowledgeGraph.add({
      type: 'concept',
      content: 'Artificial Intelligence',
      metadata: {
        source: 'demo',
        domain: 'technology',
        confidence: 0.95,
        importance: 0.9,
        tags: ['AI', 'technology', 'intelligence'],
        version: 1
      },
      relationships: []
    });
    
    const knowledgeId2 = knowledgeGraph.add({
      type: 'fact',
      content: 'MJOS integrates multiple AI capabilities',
      metadata: {
        source: 'demo',
        domain: 'system',
        confidence: 1.0,
        importance: 0.8,
        tags: ['MJOS', 'integration', 'AI'],
        version: 1
      },
      relationships: [{ type: 'related-to', targetId: knowledgeId1, strength: 0.8 }]
    });
    
    console.log(`📚 Added knowledge items: ${knowledgeId1}, ${knowledgeId2}`);
    
    // Search knowledge
    const aiKnowledge = knowledgeGraph.query({ content: 'AI' });
    console.log(`🔍 Found ${aiKnowledge.length} AI-related knowledge items`);

    // Demo 3: Context Management
    console.log('\n💬 === Context Management Demo ===');
    const contextManager = mjos.getContextManager();
    
    // Create a session
    const sessionId = contextManager.createSession('demo-user');
    console.log(`🆔 Created session: ${sessionId}`);
    
    // Add messages to context
    contextManager.addMessage(sessionId, { role: 'user', content: 'Hello MJOS!' });
    contextManager.addMessage(sessionId, { role: 'assistant', content: 'Hello! I\'m MJOS, ready to help you.' });
    contextManager.addMessage(sessionId, { role: 'user', content: 'Show me system capabilities' });
    
    const session = contextManager.getSession(sessionId);
    console.log(`💬 Session has ${session?.state.conversationHistory.length} messages`);

    // Demo 4: Reasoning Engine
    console.log('\n🤔 === Reasoning Engine Demo ===');
    
    // Deductive reasoning
    const deductiveResult = await mjos.reason('deductive', {
      premises: [
        'All AI systems need data to function',
        'MJOS is an AI system'
      ],
      conclusion: 'MJOS needs data to function'
    });
    console.log('🔍 Deductive reasoning result:', deductiveResult.valid ? 'Valid' : 'Invalid');
    
    // Inductive reasoning
    const inductiveResult = await mjos.reason('inductive', [
      'User A finds MJOS helpful',
      'User B finds MJOS helpful',
      'User C finds MJOS helpful'
    ]);
    console.log('📊 Inductive reasoning confidence:', inductiveResult.confidence);

    // Demo 5: Team Management
    console.log('\n👥 === Team Management Demo ===');
    const teamManager = mjos.getTeamManager();
    
    // Get team members
    const members = teamManager.getAllMembers();
    console.log(`👤 Team has ${members.length} members`);
    
    // Create a task
    const taskId = mjos.createTask('Demonstrate MJOS capabilities', 'Show all major system features in action');
    console.log(`📋 Created task: ${taskId}`);
    
    // Get tasks
    const tasks = teamManager.getTasks();
    console.log(`📝 Total tasks: ${tasks.length}`);

    // Demo 6: Agent Management
    console.log('\n🤖 === Agent Management Demo ===');
    const agentManager = mjos.getAgentManager();
    
    // Create an agent
    const agentId = mjos.createAgent({
      name: 'Demo Assistant',
      type: 'collaborative',
      capabilities: [
        { name: 'analysis', type: 'cognitive', parameters: {}, constraints: {} },
        { name: 'communication', type: 'social', parameters: {}, constraints: {} }
      ],
      configuration: {
        maxConcurrentTasks: 3,
        memoryLimit: 1000,
        collaborationMode: 'collaboration',
        preferences: { responseStyle: 'helpful' }
      }
    });
    console.log(`🤖 Created agent: ${agentId}`);
    
    // Assign task to agent
    const assignmentId = mjos.assignTaskToAgent(taskId, agentId);
    console.log(`📋 Assigned task to agent: ${assignmentId}`);

    // Demo 7: Communication System
    console.log('\n📡 === Communication System Demo ===');
    const communicationManager = mjos.getCommunicationManager();
    
    // Create a communication channel
    const channelId = mjos.createCommunicationChannel('demo-channel', ['user1', 'user2', agentId], 'multicast');
    console.log(`📢 Created communication channel: ${channelId}`);
    
    // Send a message
    const messageId = await mjos.sendMessage('system', agentId, 'Welcome to the demo!', 'notification');
    console.log(`💌 Sent message: ${messageId}`);

    // Demo 8: Workflow Engine
    console.log('\n⚙️ === Workflow Engine Demo ===');
    const workflowEngine = mjos.getWorkflowEngine();
    
    // Execute the default task assignment workflow
    const executionId = await mjos.executeWorkflow('task_assignment', {
      task: { id: taskId, title: 'Demo Task', priority: 'high' }
    });
    console.log(`🔄 Started workflow execution: ${executionId}`);

    // Demo 9: Storage System
    console.log('\n💾 === Storage System Demo ===');
    const storageManager = mjos.getStorageManager();
    
    // Store data
    await storageManager.set('demo:config', { theme: 'dark', language: 'en' });
    await storageManager.set('demo:stats', { users: 100, sessions: 250 });
    
    // Retrieve data
    const config = await storageManager.get('demo:config');
    const stats = await storageManager.get('demo:stats');
    console.log('💾 Retrieved config:', config);
    console.log('📊 Retrieved stats:', stats);

    // Demo 10: Security System
    console.log('\n🔒 === Security System Demo ===');
    const securityManager = mjos.getSecurityManager();
    
    // Create a user
    const userId = await securityManager.createUser({
      username: 'demo-user',
      email: 'demo@example.com',
      password: 'SecurePass123!',
      roles: ['user']
    });
    console.log(`👤 Created user: ${userId}`);
    
    // Authenticate user
    const authToken = await securityManager.authenticateUser('demo-user', 'SecurePass123!');
    console.log(`🔑 Authentication token: ${authToken?.token.substring(0, 16)}...`);

    // Demo 11: Monitoring System
    console.log('\n📊 === Monitoring System Demo ===');
    const monitoringSystem = mjos.getMonitoringSystem();
    
    // Record custom metrics
    monitoringSystem.recordMetric('demo.operations', 11, 'count');
    monitoringSystem.recordMetric('demo.success_rate', 100, '%');
    
    // Get system health
    const systemHealth = monitoringSystem.getSystemHealth();
    console.log(`🏥 System health: ${systemHealth.overall}`);
    console.log(`📈 Active health checks: ${systemHealth.checks.length}`);
    console.log(`🚨 Active alerts: ${systemHealth.alerts.length}`);

    // Demo 12: Performance Monitoring
    console.log('\n⚡ === Performance Monitoring Demo ===');
    const performanceMonitor = mjos.getPerformanceMonitor();
    
    // Get performance metrics
    const metrics = performanceMonitor.getMetrics();
    const summary = performanceMonitor.getSummary();
    
    console.log(`📊 Performance metrics collected: ${Object.keys(metrics).length}`);
    console.log(`⚡ System status: ${summary.status}`);
    console.log(`💾 Memory usage: ${summary.metrics.memoryUsage?.percentage?.toFixed(1)}%`);

    // Demo 13: System Status
    console.log('\n📋 === System Status Demo ===');
    const status = mjos.getStatus();
    
    console.log('🔍 System Status:');
    console.log(`  Version: ${status.version}`);
    console.log(`  Engine Running: ${status.engine.running}`);
    console.log(`  Uptime: ${Math.floor((status.engine.uptime || 0) / 1000)}s`);
    console.log(`  Memory Items: ${status.memory.totalMemories}`);
    console.log(`  Knowledge Items: ${status.knowledge.totalItems}`);
    console.log(`  Context Sessions: ${status.context.totalSessions}`);
    console.log(`  Team Members: ${status.team.totalMembers}`);
    console.log(`  Team Tasks: ${status.team.totalTasks}`);

    // Demo 14: API Server (optional)
    console.log('\n🌐 === API Server Demo ===');
    try {
      await mjos.startAPIServer({ port: 3001 });
      console.log('🌐 API Server started on http://localhost:3001');
      console.log('📖 API Documentation available at http://localhost:3001/api/v1/status');
      
      // Stop API server after demo
      setTimeout(async () => {
        await mjos.stopAPIServer();
        console.log('🛑 API Server stopped');
      }, 2000);
    } catch (error) {
      console.log('⚠️ API Server demo skipped (port may be in use)');
    }

    // Final Statistics
    console.log('\n📊 === Final System Statistics ===');
    const finalStats = {
      memory: memorySystem.getStats(),
      knowledge: knowledgeGraph.getStats(),
      context: contextManager.getStats(),
      team: teamManager.getTeamStats(),
      agents: agentManager.getStats(),
      communication: communicationManager.getStats(),
      workflow: workflowEngine.getStats(),
      storage: await storageManager.getStats(),
      security: securityManager.getSecurityStats(),
      monitoring: monitoringSystem.getMonitoringStats(),
      performance: performanceMonitor.getSummary()
    };

    console.log('📈 System Statistics:');
    Object.entries(finalStats).forEach(([module, stats]) => {
      console.log(`  ${module}:`, JSON.stringify(stats, null, 2).substring(0, 100) + '...');
    });

    console.log('\n🎉 === Demo Complete ===');
    console.log('✅ All MJOS modules demonstrated successfully!');
    console.log('🚀 MJOS is ready for production use!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Clean shutdown
    console.log('\n🛑 Shutting down MJOS...');
    await mjos.stop();
    console.log('✅ MJOS shutdown complete');
  }
}

// Run the demo
if (require.main === module) {
  runCompleteDemo().catch(console.error);
}

export { runCompleteDemo };
