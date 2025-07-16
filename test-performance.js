const { MJOS } = require('./dist/index.js');

async function performanceTest() {
  console.log('=== MJOS Performance Test ===\n');

  const mjos = new MJOS();
  
  try {
    // Start the system
    await mjos.start();
    console.log('✅ MJOS started with performance monitoring');
    
    // Wait a moment for monitoring to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test memory operations
    console.log('\n--- Testing Memory Operations ---');
    const memoryStartTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      mjos.remember(`Test memory ${i}`, ['test', 'performance'], Math.random());
    }
    
    const memoryEndTime = Date.now();
    console.log(`✓ Stored 100 memories in ${memoryEndTime - memoryStartTime}ms`);
    
    // Test memory queries
    const queryStartTime = Date.now();
    for (let i = 0; i < 50; i++) {
      mjos.recall({ tags: ['test'], limit: 10 });
    }
    const queryEndTime = Date.now();
    console.log(`✓ Performed 50 queries in ${queryEndTime - queryStartTime}ms`);
    
    // Test task operations
    console.log('\n--- Testing Task Operations ---');
    const taskStartTime = Date.now();
    
    const taskIds = [];
    for (let i = 0; i < 50; i++) {
      const taskId = mjos.createTask(`Performance Task ${i}`, `Description ${i}`, 'medium');
      taskIds.push(taskId);
    }
    
    const taskEndTime = Date.now();
    console.log(`✓ Created 50 tasks in ${taskEndTime - taskStartTime}ms`);
    
    // Test task assignments
    const assignStartTime = Date.now();
    const members = ['moxiaozhi', 'moxiaochuang', 'moxiaocang', 'moxiaoce'];
    
    taskIds.forEach((taskId, index) => {
      const memberId = members[index % members.length];
      mjos.assignTask(taskId, memberId);
    });
    
    const assignEndTime = Date.now();
    console.log(`✓ Assigned 50 tasks in ${assignEndTime - assignStartTime}ms`);
    
    // Test context operations
    console.log('\n--- Testing Context Operations ---');
    const contextStartTime = Date.now();
    
    const contextManager = mjos.getContextManager();
    for (let i = 0; i < 100; i++) {
      contextManager.set(`key${i}`, `value${i}`);
    }
    
    for (let i = 0; i < 100; i++) {
      contextManager.get(`key${i}`);
    }
    
    const contextEndTime = Date.now();
    console.log(`✓ Performed 200 context operations in ${contextEndTime - contextStartTime}ms`);
    
    // Wait for performance monitoring to collect data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get performance metrics
    console.log('\n--- Performance Metrics ---');
    const metrics = mjos.getPerformanceMetrics();
    
    console.log('Operation Counts:');
    console.log(`- Memory operations: ${metrics.operationCounts.memoryOperations}`);
    console.log(`- Task operations: ${metrics.operationCounts.taskOperations}`);
    console.log(`- Context operations: ${metrics.operationCounts.contextOperations}`);
    
    console.log('\nAverage Response Times:');
    console.log(`- Memory queries: ${metrics.responseTimes.averageMemoryQuery.toFixed(2)}ms`);
    console.log(`- Task creation: ${metrics.responseTimes.averageTaskCreation.toFixed(2)}ms`);
    console.log(`- Context access: ${metrics.responseTimes.averageContextAccess.toFixed(2)}ms`);
    
    console.log('\nMemory Usage:');
    console.log(`- Used: ${(metrics.memoryUsage.used / 1024 / 1024).toFixed(2)}MB`);
    console.log(`- Total: ${(metrics.memoryUsage.total / 1024 / 1024).toFixed(2)}MB`);
    console.log(`- Percentage: ${metrics.memoryUsage.percentage.toFixed(1)}%`);
    
    console.log('\nSystem Info:');
    console.log(`- Uptime: ${(metrics.systemUptime / 1000).toFixed(1)}s`);
    console.log(`- Total errors: ${metrics.errorCounts.total}`);
    
    // Get performance summary
    console.log('\n--- Performance Summary ---');
    const summary = mjos.getPerformanceSummary();
    
    console.log(`Status: ${summary.status.toUpperCase()}`);
    if (summary.issues.length > 0) {
      console.log('Issues:');
      summary.issues.forEach(issue => console.log(`- ${issue}`));
    } else {
      console.log('No performance issues detected');
    }
    
    // Test system status with performance data
    console.log('\n--- System Status ---');
    const status = mjos.getStatus();
    
    console.log(`Version: ${status.version}`);
    console.log(`Engine running: ${status.engine.running}`);
    console.log(`Memory items: ${status.memory.totalMemories}`);
    console.log(`Team tasks: ${status.team.totalTasks}`);
    console.log(`Performance status: ${status.performance.status}`);
    
    // Test performance reset
    console.log('\n--- Testing Performance Reset ---');
    mjos.resetPerformanceMetrics();
    
    const resetMetrics = mjos.getPerformanceMetrics();
    console.log(`✓ Metrics reset - Operations count: ${resetMetrics.operationCounts.memoryOperations}`);
    
    // Stop the system
    await mjos.stop();
    console.log('\n✅ MJOS stopped successfully');
    
    console.log('\n=== Performance Test Completed ===');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    
    try {
      await mjos.stop();
    } catch (stopError) {
      console.error('Failed to stop MJOS:', stopError.message);
    }
  }
}

// Run performance test
performanceTest();
