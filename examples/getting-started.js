/**
 * MJOS Getting Started Example
 * MJOS入门示例 - 展示基本功能和使用方法
 */

const { MJOS } = require('../dist/index.js');

async function gettingStartedExample() {
  console.log('🚀 MJOS Getting Started Example');
  console.log('================================\n');

  // 1. 创建MJOS实例
  console.log('1️⃣ Creating MJOS instance...');
  const mjos = new MJOS();
  console.log('✅ MJOS instance created successfully\n');

  try {
    // 2. 启动系统
    console.log('2️⃣ Starting MJOS system...');
    await mjos.start();
    console.log('✅ MJOS system started successfully\n');

    // 3. 基本信息
    console.log('3️⃣ System Information:');
    console.log(`   Version: ${mjos.getVersion()}`);
    const status = mjos.getStatus();
    console.log(`   Engine Running: ${status.engine.running}`);
    console.log(`   Team Members: ${status.team.totalMembers}`);
    console.log('');

    // 4. 记忆系统演示
    console.log('4️⃣ Memory System Demo:');
    console.log('   Storing memories...');
    
    const memory1 = mjos.remember('学习MJOS框架', ['学习', '框架'], 0.9);
    const memory2 = mjos.remember('团队协作项目', ['团队', '项目'], 0.8);
    const memory3 = mjos.remember('性能优化任务', ['性能', '优化'], 0.7);
    
    console.log(`   ✓ Stored memory: ${memory1}`);
    console.log(`   ✓ Stored memory: ${memory2}`);
    console.log(`   ✓ Stored memory: ${memory3}`);

    // 检索记忆
    const learningMemories = mjos.recall({ tags: ['学习'] });
    const teamMemories = mjos.recall({ tags: ['团队'] });
    
    console.log(`   📚 Learning memories found: ${learningMemories.length}`);
    console.log(`   👥 Team memories found: ${teamMemories.length}`);
    console.log('');

    // 5. 团队管理演示
    console.log('5️⃣ Team Management Demo:');
    console.log('   Creating tasks...');
    
    const task1 = mjos.createTask('完成项目文档', '编写完整的项目文档', 'high');
    const task2 = mjos.createTask('代码审查', '审查核心模块代码', 'medium');
    const task3 = mjos.createTask('性能测试', '进行系统性能测试', 'high');
    
    console.log(`   ✓ Created task: ${task1}`);
    console.log(`   ✓ Created task: ${task2}`);
    console.log(`   ✓ Created task: ${task3}`);

    // 分配任务
    console.log('   Assigning tasks...');
    const assigned1 = mjos.assignTask(task1, 'moxiaozhi');
    const assigned2 = mjos.assignTask(task2, 'moxiaocang');
    const assigned3 = mjos.assignTask(task3, 'moxiaoce');
    
    console.log(`   ✓ Task assigned to 莫小智: ${assigned1}`);
    console.log(`   ✓ Task assigned to 莫小仓: ${assigned2}`);
    console.log(`   ✓ Task assigned to 莫小测: ${assigned3}`);

    // 查看团队状态
    const teamManager = mjos.getTeamManager();
    const allTasks = teamManager.getTasks();
    const allMembers = teamManager.getAllMembers();
    
    console.log(`   📋 Total tasks: ${allTasks.length}`);
    console.log(`   👥 Team members: ${allMembers.map(m => m.name).join(', ')}`);
    console.log('');

    // 6. 上下文管理演示
    console.log('6️⃣ Context Management Demo:');
    const contextManager = mjos.getContextManager();
    
    contextManager.set('project', 'MJOS学习项目');
    contextManager.set('phase', '入门阶段');
    contextManager.set('priority', 'high');
    
    console.log(`   ✓ Project: ${contextManager.get('project')}`);
    console.log(`   ✓ Phase: ${contextManager.get('phase')}`);
    console.log(`   ✓ Priority: ${contextManager.get('priority')}`);
    
    const allContext = contextManager.getAll();
    console.log(`   📊 Total context items: ${Object.keys(allContext).length}`);
    console.log('');

    // 7. 性能监控演示
    console.log('7️⃣ Performance Monitoring Demo:');
    const perfMonitor = mjos.getPerformanceMonitor();
    const metrics = mjos.getPerformanceMetrics();
    
    console.log(`   📊 Memory operations: ${metrics.operationCounts.memoryOperations}`);
    console.log(`   📊 Task operations: ${metrics.operationCounts.taskOperations}`);
    console.log(`   📊 Context operations: ${metrics.operationCounts.contextOperations}`);
    console.log(`   ⚡ Avg memory query time: ${metrics.responseTimes.averageMemoryQuery.toFixed(2)}ms`);
    console.log(`   ⚡ Avg task creation time: ${metrics.responseTimes.averageTaskCreation.toFixed(2)}ms`);
    
    const perfSummary = mjos.getPerformanceSummary();
    console.log(`   🎯 Performance status: ${perfSummary.status}`);
    console.log('');

    // 8. 系统状态总览
    console.log('8️⃣ Final System Status:');
    const finalStatus = mjos.getStatus();
    console.log('   📊 Complete Status:');
    console.log(`      Version: ${finalStatus.version}`);
    console.log(`      Engine: ${finalStatus.engine.running ? 'Running' : 'Stopped'}`);
    console.log(`      Memories: ${finalStatus.memory.totalMemories}`);
    console.log(`      Tasks: ${finalStatus.team.totalTasks}`);
    console.log(`      Performance: ${finalStatus.performance.status}`);
    console.log('');

    // 9. 停止系统
    console.log('9️⃣ Stopping MJOS system...');
    await mjos.stop();
    console.log('✅ MJOS system stopped successfully\n');

    // 10. 总结
    console.log('🎉 Getting Started Example Completed!');
    console.log('=====================================');
    console.log('✅ You have successfully:');
    console.log('   • Created and started MJOS');
    console.log('   • Used the memory system');
    console.log('   • Managed team and tasks');
    console.log('   • Handled context data');
    console.log('   • Monitored performance');
    console.log('   • Stopped the system gracefully');
    console.log('');
    console.log('📚 Next Steps:');
    console.log('   • Check out docs/EXAMPLES.md for more examples');
    console.log('   • Read docs/API.md for detailed API reference');
    console.log('   • Explore examples/ directory for advanced usage');
    console.log('');
    console.log('🚀 Happy coding with MJOS!');

  } catch (error) {
    console.error('❌ Error during demo:', error.message);
    
    try {
      await mjos.stop();
      console.log('✅ System stopped after error');
    } catch (stopError) {
      console.error('❌ Failed to stop system:', stopError.message);
    }
  }
}

// 运行示例
if (require.main === module) {
  gettingStartedExample()
    .then(() => {
      console.log('\n🎊 Demo completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

module.exports = { gettingStartedExample };
