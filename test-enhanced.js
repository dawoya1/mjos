const { MJOS } = require('./dist/index.js');

async function testEnhancedMJOS() {
  console.log('=== Testing Enhanced MJOS ===\n');

  const mjos = new MJOS();
  console.log('✓ MJOS initialized');
  console.log('Version:', mjos.getVersion());
  
  // Test initial status
  console.log('\n--- Initial Status ---');
  console.log(JSON.stringify(mjos.getStatus(), null, 2));

  // Start the system
  console.log('\n--- Starting System ---');
  await mjos.start();
  
  // Test memory system
  console.log('\n--- Testing Memory System ---');
  const memoryId1 = mjos.remember('First memory item', ['test', 'demo'], 0.8);
  const memoryId2 = mjos.remember('Second memory item', ['test', 'example'], 0.6);
  console.log('✓ Stored memories:', memoryId1, memoryId2);
  
  const memories = mjos.recall({ tags: ['test'], limit: 10 });
  console.log('✓ Recalled memories:', memories.length);
  
  // Test team system
  console.log('\n--- Testing Team System ---');
  const taskId1 = mjos.createTask('Test Task 1', 'This is a test task', 'high');
  const taskId2 = mjos.createTask('Test Task 2', 'Another test task', 'medium');
  console.log('✓ Created tasks:', taskId1, taskId2);
  
  const assigned1 = mjos.assignTask(taskId1, 'moxiaozhi');
  const assigned2 = mjos.assignTask(taskId2, 'moxiaochuang');
  console.log('✓ Assigned tasks:', assigned1, assigned2);
  
  // Test team manager directly
  const teamManager = mjos.getTeamManager();
  const allMembers = teamManager.getAllMembers();
  console.log('✓ Team members:', allMembers.map(m => `${m.name} (${m.role})`));
  
  const allTasks = teamManager.getTasks();
  console.log('✓ All tasks:', allTasks.map(t => `${t.title} - ${t.status}`));
  
  // Start a collaboration session
  const sessionId = teamManager.startCollaboration('Test Collaboration', ['moxiaozhi', 'moxiaochuang']);
  console.log('✓ Started collaboration session:', sessionId);
  
  // Test context manager
  console.log('\n--- Testing Context Manager ---');
  const contextManager = mjos.getContextManager();
  contextManager.set('current-project', 'MJOS Enhancement');
  contextManager.set('phase', 'testing');
  console.log('✓ Context set');
  console.log('Current project:', contextManager.get('current-project'));
  console.log('All context:', contextManager.getAll());
  
  // Final status
  console.log('\n--- Final Status ---');
  const finalStatus = mjos.getStatus();
  console.log(JSON.stringify(finalStatus, null, 2));
  
  // Stop the system
  console.log('\n--- Stopping System ---');
  await mjos.stop();
  
  console.log('\n=== Enhanced MJOS Test Completed Successfully! ===');
}

testEnhancedMJOS().catch(console.error);
