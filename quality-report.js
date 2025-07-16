const { MJOS } = require('./dist/index.js');
const fs = require('fs');
const path = require('path');

async function generateQualityReport() {
  console.log('=== MJOS Quality Verification Report ===\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks: [],
    summary: {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      overallScore: 0
    }
  };

  // Helper function to add check result
  function addCheck(name, passed, details = '') {
    const check = { name, passed, details };
    report.checks.push(check);
    report.summary.totalChecks++;
    if (passed) {
      report.summary.passedChecks++;
      console.log(`✅ ${name}`);
    } else {
      report.summary.failedChecks++;
      console.log(`❌ ${name}: ${details}`);
    }
    if (details && passed) {
      console.log(`   ${details}`);
    }
  }

  try {
    // 1. Basic System Functionality
    console.log('--- Basic System Functionality ---');
    
    const mjos = new MJOS();
    addCheck('MJOS Instance Creation', true, 'Successfully created MJOS instance');
    
    await mjos.start();
    addCheck('System Startup', true, 'System started without errors');
    
    const version = mjos.getVersion();
    addCheck('Version Access', version === '1.0.0', `Version: ${version}`);
    
    const status = mjos.getStatus();
    addCheck('Status Reporting', status && status.version, 'Status object contains required fields');
    
    await mjos.stop();
    addCheck('System Shutdown', true, 'System stopped gracefully');

    // 2. Memory System Tests
    console.log('\n--- Memory System Tests ---');
    
    await mjos.start();
    
    const memoryId = mjos.remember('Test memory', ['test'], 0.8);
    addCheck('Memory Storage', memoryId && typeof memoryId === 'string', `Memory ID: ${memoryId}`);
    
    const memories = mjos.recall({ tags: ['test'] });
    addCheck('Memory Retrieval', memories.length > 0, `Retrieved ${memories.length} memories`);
    
    const memorySystem = mjos.getMemorySystem();
    const memStats = memorySystem.getStats();
    addCheck('Memory Statistics', memStats.totalMemories > 0, `Total memories: ${memStats.totalMemories}`);

    // 3. Team Management Tests
    console.log('\n--- Team Management Tests ---');
    
    const taskId = mjos.createTask('Quality Test Task', 'Test task for quality verification', 'high');
    addCheck('Task Creation', taskId && typeof taskId === 'string', `Task ID: ${taskId}`);
    
    const assigned = mjos.assignTask(taskId, 'moxiaozhi');
    addCheck('Task Assignment', assigned === true, 'Task assigned successfully');
    
    const teamManager = mjos.getTeamManager();
    const members = teamManager.getAllMembers();
    addCheck('Team Members', members.length === 4, `Found ${members.length} team members`);
    
    const tasks = teamManager.getTasks();
    addCheck('Task Retrieval', tasks.length > 0, `Found ${tasks.length} tasks`);

    // 4. Context Management Tests
    console.log('\n--- Context Management Tests ---');
    
    const contextManager = mjos.getContextManager();
    contextManager.set('test-key', 'test-value');
    
    const contextValue = contextManager.get('test-key');
    addCheck('Context Storage/Retrieval', contextValue === 'test-value', 'Context value matches');
    
    const hasKey = contextManager.has('test-key');
    addCheck('Context Key Check', hasKey === true, 'Context key exists');

    // 5. Performance Monitoring Tests
    console.log('\n--- Performance Monitoring Tests ---');
    
    const perfMonitor = mjos.getPerformanceMonitor();
    addCheck('Performance Monitor Access', perfMonitor !== undefined, 'Performance monitor accessible');
    
    const metrics = mjos.getPerformanceMetrics();
    addCheck('Performance Metrics', metrics && metrics.operationCounts, 'Metrics contain operation counts');
    
    const perfSummary = mjos.getPerformanceSummary();
    addCheck('Performance Summary', perfSummary && perfSummary.status, `Status: ${perfSummary.status}`);

    // 6. Event System Tests
    console.log('\n--- Event System Tests ---');
    
    const engine = mjos.getEngine();
    const eventBus = engine.getEventBus();
    addCheck('Event Bus Access', eventBus !== undefined, 'Event bus accessible');
    
    let eventReceived = false;
    eventBus.on('test-event', () => { eventReceived = true; });
    eventBus.emit('test-event');
    
    addCheck('Event Emission/Reception', eventReceived === true, 'Event system working');

    // 7. Integration Tests
    console.log('\n--- Integration Tests ---');
    
    // Test cross-system integration
    const integrationTaskId = mjos.createTask('Integration Test', 'Cross-system test', 'medium');
    mjos.remember(`Task created: ${integrationTaskId}`, ['integration', 'test'], 0.7);
    mjos.assignTask(integrationTaskId, 'moxiaochuang');
    
    const integrationMemories = mjos.recall({ tags: ['integration'] });
    addCheck('Cross-System Integration', integrationMemories.length > 0, 'Systems work together');

    await mjos.stop();

    // 8. File Structure Tests
    console.log('\n--- File Structure Tests ---');
    
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'README.md',
      'src/index.ts',
      'src/core/index.ts',
      'src/memory/index.ts',
      'src/team/index.ts',
      'src/performance/index.ts',
      'src/types/index.ts'
    ];
    
    requiredFiles.forEach(file => {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      addCheck(`File: ${file}`, exists, exists ? 'File exists' : 'File missing');
    });

    // 9. Documentation Tests
    console.log('\n--- Documentation Tests ---');
    
    const docFiles = [
      'docs/API.md',
      'docs/EXAMPLES.md',
      'docs/QUICKSTART.md'
    ];
    
    docFiles.forEach(file => {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      addCheck(`Documentation: ${file}`, exists, exists ? 'Documentation exists' : 'Documentation missing');
    });

    // 10. Build and Distribution Tests
    console.log('\n--- Build and Distribution Tests ---');
    
    const distExists = fs.existsSync(path.join(process.cwd(), 'dist'));
    addCheck('Build Output', distExists, 'Dist directory exists');
    
    if (distExists) {
      const indexJsExists = fs.existsSync(path.join(process.cwd(), 'dist', 'index.js'));
      addCheck('Main Distribution File', indexJsExists, 'index.js exists in dist');
    }

  } catch (error) {
    addCheck('Error Handling', false, `Unexpected error: ${error.message}`);
  }

  // Calculate overall score
  report.summary.overallScore = report.summary.totalChecks > 0 
    ? Math.round((report.summary.passedChecks / report.summary.totalChecks) * 100)
    : 0;

  // Generate summary
  console.log('\n=== Quality Report Summary ===');
  console.log(`Total Checks: ${report.summary.totalChecks}`);
  console.log(`Passed: ${report.summary.passedChecks}`);
  console.log(`Failed: ${report.summary.failedChecks}`);
  console.log(`Overall Score: ${report.summary.overallScore}%`);
  
  // Determine quality level
  let qualityLevel;
  if (report.summary.overallScore >= 95) {
    qualityLevel = 'EXCELLENT';
  } else if (report.summary.overallScore >= 85) {
    qualityLevel = 'GOOD';
  } else if (report.summary.overallScore >= 70) {
    qualityLevel = 'ACCEPTABLE';
  } else {
    qualityLevel = 'NEEDS IMPROVEMENT';
  }
  
  console.log(`Quality Level: ${qualityLevel}`);
  
  // Save report to file
  fs.writeFileSync('quality-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to quality-report.json');
  
  // Final recommendations
  console.log('\n=== Recommendations ===');
  if (report.summary.failedChecks === 0) {
    console.log('🎉 All quality checks passed! The project is ready for production.');
  } else {
    console.log('⚠️  Some quality checks failed. Please review and fix the issues above.');
    
    // List failed checks
    const failedChecks = report.checks.filter(check => !check.passed);
    failedChecks.forEach(check => {
      console.log(`- Fix: ${check.name} - ${check.details}`);
    });
  }
  
  return report;
}

// Run quality verification
generateQualityReport()
  .then(report => {
    process.exit(report.summary.failedChecks === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('Quality verification failed:', error);
    process.exit(1);
  });
