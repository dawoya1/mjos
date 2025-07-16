/**
 * System Monitoring Demo
 * 系统监控演示 - 展示MJOS系统监控和健康检查功能
 */

import { createMJOS } from '../src/index';

async function systemMonitoringDemo() {
  console.log('📊 MJOS System Monitoring Demo\n');
  console.log('🔍 Demonstrating system monitoring, health checks, and alerting\n');

  try {
    // 1. 创建MJOS实例（会自动启动系统监控）
    console.log('📦 Creating MJOS instance with system monitoring...');
    const mjos = createMJOS({
      logLevel: 'info',
      enableMPML: true,
      enableMHPF: true,
      enableMPEOAS: true,
      enableMMPT: true,
      enableMCP: true
    });

    // 2. 初始化系统
    console.log('🚀 Initializing MJOS system...');
    await mjos.initialize();
    console.log('✅ MJOS system initialized with monitoring enabled');

    // 3. 获取系统监控器
    const systemMonitor = mjos.getSystemMonitor();
    if (!systemMonitor) {
      throw new Error('System Monitor not available');
    }

    console.log('\n📊 System monitoring started automatically');

    // 4. 等待一些监控数据收集
    console.log('\n⏳ Collecting initial monitoring data...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. 展示系统状态
    console.log('\n🏥 System Health Status:');
    console.log('========================');
    
    const systemStatus = mjos.getSystemStatus();
    console.log(`   🎯 Overall Status: ${getStatusEmoji(systemStatus.overall)} ${systemStatus.overall.toUpperCase()}`);
    console.log(`   🚨 Active Alerts: ${systemStatus.activeAlerts}`);
    
    console.log('\n🔧 Component Health:');
    Object.entries(systemStatus.components).forEach(([component, status]) => {
      console.log(`   ${getStatusEmoji(status)} ${component}: ${status}`);
    });

    // 6. 展示系统指标
    console.log('\n📈 System Metrics:');
    console.log('==================');
    
    const latestMetrics = systemStatus.metrics;
    if (latestMetrics) {
      console.log(`   💻 CPU Usage: ${latestMetrics.cpu.usage.toFixed(1)}% (${latestMetrics.cpu.cores} cores)`);
      console.log(`   🧠 Memory Usage: ${latestMetrics.memory.usage.toFixed(1)}% (${formatBytes(latestMetrics.memory.used)}/${formatBytes(latestMetrics.memory.total)})`);
      console.log(`   📦 Heap Usage: ${latestMetrics.memory.heap.usage.toFixed(1)}% (${formatBytes(latestMetrics.memory.heap.used)}/${formatBytes(latestMetrics.memory.heap.total)})`);
      console.log(`   ⏱️  System Uptime: ${formatDuration(latestMetrics.system.uptime)}`);
      console.log(`   🔄 Process Uptime: ${formatDuration(latestMetrics.process.uptime)}`);
      console.log(`   🖥️  Platform: ${latestMetrics.system.platform} ${latestMetrics.system.arch}`);
      console.log(`   🏠 Hostname: ${latestMetrics.system.hostname}`);
    }

    // 7. 展示MJOS特定指标
    if (latestMetrics?.mjos) {
      console.log('\n🎯 MJOS Metrics:');
      console.log('================');
      console.log(`   🔧 Active Components: ${latestMetrics.mjos.activeComponents.join(', ')}`);
      console.log(`   📚 Memory System: ${latestMetrics.mjos.memorySystemStats.totalMemories} memories`);
      console.log(`   🤝 Collaboration: ${latestMetrics.mjos.collaborationStats.activeProjects} active projects`);
      console.log(`   📊 Context: ${latestMetrics.mjos.contextStats.totalContextSnapshots} snapshots`);
    }

    // 8. 展示健康检查结果
    console.log('\n🏥 Health Check Results:');
    console.log('========================');
    
    const healthChecks = mjos.getHealthChecks();
    healthChecks.forEach(check => {
      console.log(`   ${getStatusEmoji(check.status)} ${check.component}:`);
      console.log(`      Status: ${check.status}`);
      console.log(`      Message: ${check.message}`);
      console.log(`      Response Time: ${check.responseTime}ms`);
      console.log(`      Last Check: ${check.timestamp.toLocaleString()}`);
      console.log('');
    });

    // 9. 展示告警信息
    console.log('\n🚨 Alert Management:');
    console.log('====================');
    
    const activeAlerts = mjos.getActiveAlerts();
    if (activeAlerts.length > 0) {
      console.log(`   📢 Active Alerts (${activeAlerts.length}):`);
      activeAlerts.forEach(alert => {
        console.log(`      ${getSeverityEmoji(alert.severity)} ${alert.type.toUpperCase()}: ${alert.message}`);
        console.log(`         Component: ${alert.component}`);
        console.log(`         Severity: ${alert.severity}`);
        console.log(`         Time: ${alert.timestamp.toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('   ✅ No active alerts - system is healthy');
    }

    // 10. 模拟一些系统活动来生成更多数据
    console.log('\n🔄 Simulating system activity...');
    
    // 启动一个协作项目来增加系统负载
    const projectId = await mjos.startCollaborationProject(
      'System Monitoring Test',
      '测试系统监控功能的演示项目',
      ['验证监控数据收集', '测试健康检查', '验证告警机制'],
      {
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    );

    console.log(`   ✅ Started test project: ${projectId}`);

    // 存储一些测试记忆
    for (let i = 0; i < 5; i++) {
      await mjos.storeMemory({
        id: `monitoring-test-${i}`,
        type: 'knowledge',
        content: `系统监控测试记忆 ${i + 1} - 验证记忆系统在监控环境下的表现`,
        metadata: {
          source: 'monitoring-demo',
          importance: Math.floor(Math.random() * 10) + 1,
          tags: ['monitoring', 'test', 'demo'],
          accessLevel: 'team',
          relatedEntries: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('   ✅ Stored test memories');

    // 11. 等待更多监控数据
    console.log('\n⏳ Collecting updated monitoring data...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 12. 展示监控历史数据
    console.log('\n📊 Monitoring History:');
    console.log('======================');
    
    const metricsHistory = mjos.getSystemMetrics(5); // 最近5个数据点
    console.log(`   📈 Collected ${metricsHistory.length} data points:`);
    
    metricsHistory.forEach((metrics, index) => {
      console.log(`      ${index + 1}. ${metrics.timestamp.toLocaleTimeString()}: CPU ${metrics.cpu.usage.toFixed(1)}%, Memory ${metrics.memory.usage.toFixed(1)}%`);
    });

    // 13. 展示监控统计
    console.log('\n📊 Monitoring Statistics:');
    console.log('=========================');
    
    const stats = mjos.getCollaborationStatistics();
    console.log(`   🤝 Collaboration Efficiency: ${stats.collaborationEfficiency.toFixed(1)}%`);
    console.log(`   📋 Total Tasks: ${stats.totalTasks} (${stats.completedTasks} completed)`);
    console.log(`   👥 Team Utilization:`);
    Object.entries(stats.agentUtilization).forEach(([name, utilization]) => {
      console.log(`      ${name}: ${utilization.toFixed(1)}%`);
    });

    // 14. 展示监控功能总结
    console.log('\n🎯 Monitoring Features Summary:');
    console.log('===============================');
    
    console.log('\n✅ Implemented Features:');
    console.log('   📊 Real-time system metrics collection');
    console.log('   🏥 Automated health checks');
    console.log('   🚨 Intelligent alerting system');
    console.log('   📈 Historical data tracking');
    console.log('   🔍 Component-level monitoring');
    console.log('   💾 Memory and performance tracking');
    console.log('   🤝 MJOS-specific metrics');
    console.log('   📱 System status dashboard');

    console.log('\n🚀 Benefits:');
    console.log('   ⚡ Proactive issue detection');
    console.log('   📈 Performance optimization insights');
    console.log('   🛡️  System reliability improvement');
    console.log('   📊 Data-driven decision making');
    console.log('   🔧 Automated maintenance alerts');
    console.log('   📱 Real-time system visibility');

    console.log('\n💡 Use Cases:');
    console.log('   🏢 Production environment monitoring');
    console.log('   🧪 Development and testing oversight');
    console.log('   📊 Performance benchmarking');
    console.log('   🚨 Incident response and debugging');
    console.log('   📈 Capacity planning and scaling');
    console.log('   🔍 System optimization and tuning');

    // 15. 清理资源
    console.log('\n🧹 Cleaning up...');
    await mjos.destroy();
    console.log('✅ MJOS system and monitoring stopped successfully');

  } catch (error) {
    console.error('❌ System Monitoring Demo failed:', error);
    process.exit(1);
  }
}

/**
 * 获取状态表情符号
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'healthy': return '✅';
    case 'warning': return '⚠️';
    case 'critical': return '🚨';
    case 'unknown': return '❓';
    default: return '⚪';
  }
}

/**
 * 获取严重程度表情符号
 */
function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'low': return '🟢';
    case 'medium': return '🟡';
    case 'high': return '🟠';
    case 'critical': return '🔴';
    default: return '⚪';
  }
}

/**
 * 格式化字节数
 */
function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 格式化持续时间
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// 运行演示
if (require.main === module) {
  systemMonitoringDemo()
    .then(() => {
      console.log('\n🏁 System Monitoring Demo completed successfully!');
      console.log('\n🚀 Next Steps:');
      console.log('   1. Integrate monitoring into production deployments');
      console.log('   2. Set up custom alerting rules and thresholds');
      console.log('   3. Create monitoring dashboards and visualizations');
      console.log('   4. Implement automated response to common issues');
      console.log('   5. Extend monitoring to cover additional metrics');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo failed:', error);
      process.exit(1);
    });
}

export { systemMonitoringDemo };
