/**
 * Context Management Demo
 * 上下文管理演示 - 展示系统性的上下文总结、存储和检索机制
 */

import { createMJOS } from '../src/index';

async function contextManagementDemo() {
  console.log('🧠 MJOS Context Management Demo\n');

  try {
    // 1. 创建MJOS实例（会自动初始化ContextManager）
    console.log('📦 Creating MJOS instance with Context Management...');
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
    console.log('✅ MJOS system initialized with Context Manager');

    // 3. 获取ContextManager
    const contextManager = mjos.getContextManager();
    if (!contextManager) {
      throw new Error('Context Manager not available');
    }

    console.log('\n📊 Initial Context Status:');
    const initialStats = contextManager.getContextStatistics();
    console.log(`   - Total Context Snapshots: ${initialStats.totalContextSnapshots}`);
    console.log(`   - Memory Utilization: ${initialStats.memoryUtilization}`);

    // 4. 演示工作阶段管理
    console.log('\n🔄 Starting Analysis Phase...');
    const analysisContextId = await mjos.startWorkPhase(
      'analysis',
      '分析MJOS系统的上下文管理需求和设计方案'
    );
    console.log(`✅ Analysis phase started with context ID: ${analysisContextId}`);

    // 5. 模拟分析工作并更新上下文
    console.log('\n📝 Performing analysis work...');
    await mjos.updateContext({
      pendingTasks: [
        '研究现有上下文管理方案',
        '设计MJOS特定的上下文结构',
        '定义上下文检索算法'
      ]
    });

    // 模拟完成一些任务
    await mjos.updateContext({
      completedTasks: ['研究现有上下文管理方案'],
      pendingTasks: [
        '设计MJOS特定的上下文结构',
        '定义上下文检索算法'
      ]
    });

    console.log('✅ Analysis work updated in context');

    // 6. 完成分析阶段，进入设计阶段
    console.log('\n🎨 Completing Analysis Phase and starting Design Phase...');
    await mjos.completeWorkPhase(
      [
        {
          id: 'analysis-complete',
          description: '完成了MJOS上下文管理的需求分析',
          category: 'milestone',
          impact: '为后续设计提供了清晰的方向',
          metrics: {
            quantitative: { 'research_hours': 4, 'documents_reviewed': 12 },
            qualitative: ['深入理解了上下文管理的核心需求', '识别了关键技术挑战']
          },
          achievedAt: new Date()
        }
      ],
      'design'
    );

    console.log('✅ Transitioned from Analysis to Design phase');

    // 7. 在设计阶段工作
    console.log('\n🏗️  Working in Design Phase...');
    await mjos.updateContext({
      currentTask: '设计ContextManager类的详细架构',
      pendingTasks: [
        '定义上下文数据结构',
        '设计记忆检索算法',
        '创建工作阶段管理机制'
      ]
    });

    // 8. 模拟存储一些相关记忆
    console.log('\n🧠 Storing context-related memories...');
    const contextMemories = [
      {
        id: 'context-design-decision-1',
        type: 'knowledge',
        content: 'ContextManager应该支持工作阶段的自动转换，以提供流畅的用户体验',
        metadata: {
          source: 'design-session',
          importance: 9,
          tags: ['context-management', 'design-decision', 'user-experience'],
          accessLevel: 'team',
          relatedEntries: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'context-technical-insight',
        type: 'knowledge',
        content: '上下文检索应该结合语义搜索和时间相关性，以提供最相关的记忆',
        metadata: {
          source: 'technical-analysis',
          importance: 8,
          tags: ['context-retrieval', 'semantic-search', 'relevance'],
          accessLevel: 'team',
          relatedEntries: ['context-design-decision-1']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const memory of contextMemories) {
      const stored = await mjos.storeMemory(memory);
      console.log(`   ✅ Stored memory: ${memory.id} (${stored ? 'success' : 'failed'})`);
    }

    // 9. 完成设计阶段
    console.log('\n🎯 Completing Design Phase...');
    await mjos.completeWorkPhase(
      [
        {
          id: 'design-complete',
          description: '完成了ContextManager的详细设计',
          category: 'milestone',
          impact: '提供了完整的实现蓝图',
          metrics: {
            quantitative: { 'design_hours': 6, 'components_designed': 8 },
            qualitative: ['创建了清晰的架构设计', '定义了完整的API接口']
          },
          achievedAt: new Date()
        }
      ],
      'implementation'
    );

    // 10. 在实现阶段工作
    console.log('\n⚙️  Working in Implementation Phase...');
    await mjos.updateContext({
      currentTask: '实现ContextManager核心功能',
      pendingTasks: [
        '实现上下文快照创建',
        '实现记忆检索机制',
        '实现工作阶段管理',
        '添加集成测试'
      ]
    });

    // 11. 展示当前上下文状态
    console.log('\n📊 Current Context Status:');
    const currentContext = contextManager.getCurrentContext();
    if (currentContext) {
      console.log(`   - Work Phase: ${currentContext.workPhase}`);
      console.log(`   - Current Task: ${currentContext.summary.currentTask}`);
      console.log(`   - Completed Tasks: ${currentContext.summary.completedTasks.length}`);
      console.log(`   - Pending Tasks: ${currentContext.summary.pendingTasks.length}`);
      console.log(`   - Key Memories: ${currentContext.keyMemories.length}`);
      console.log(`   - Achievements: ${currentContext.summary.achievements.length}`);
    }

    // 12. 展示上下文统计
    console.log('\n📈 Context Management Statistics:');
    const finalStats = contextManager.getContextStatistics();
    console.log(`   - Total Context Snapshots: ${finalStats.totalContextSnapshots}`);
    console.log(`   - Current Session Duration: ${Math.round(finalStats.currentSessionDuration / 1000)}s`);
    console.log(`   - Average Phase Completion: ${(finalStats.averagePhaseCompletion * 100).toFixed(1)}%`);
    console.log(`   - Memory Utilization: ${finalStats.memoryUtilization} memories`);

    // 13. 查询相关记忆以验证检索功能
    console.log('\n🔍 Testing memory retrieval with context...');
    const retrievedMemories = await mjos.queryMemory({
      query: '上下文管理设计决策',
      options: { 
        limit: 5, 
        semanticSearch: true,
        includeRelated: true
      }
    });

    console.log(`   📚 Retrieved ${retrievedMemories.length} context-related memories:`);
    retrievedMemories.forEach((memory, index) => {
      console.log(`   ${index + 1}. ${memory.id}: ${memory.content.substring(0, 60)}...`);
    });

    // 14. 完成实现阶段
    console.log('\n🎉 Completing Implementation Phase...');
    await mjos.completeWorkPhase([
      {
        id: 'implementation-complete',
        description: '成功实现了ContextManager的核心功能',
        category: 'milestone',
        impact: '提供了完整的上下文管理能力',
        metrics: {
          quantitative: { 'implementation_hours': 8, 'lines_of_code': 500, 'tests_written': 15 },
          qualitative: ['实现了所有设计的功能', '通过了集成测试', '提供了完整的API']
        },
        achievedAt: new Date()
      }
    ]);

    console.log('\n🎯 Context Management Demo Results:');
    console.log('   ✅ Successfully demonstrated systematic context management');
    console.log('   ✅ Showed automatic context summarization and storage');
    console.log('   ✅ Demonstrated memory retrieval with context awareness');
    console.log('   ✅ Validated work phase transitions and tracking');
    console.log('   ✅ Proved integration with MJOS memory system');

    console.log('\n💡 Key Benefits Demonstrated:');
    console.log('   🧠 Systematic context summarization for Augment Context Engine');
    console.log('   🔍 Intelligent memory retrieval based on current context');
    console.log('   🔄 Seamless work phase management and transitions');
    console.log('   📊 Comprehensive context statistics and monitoring');
    console.log('   🎯 Deep thinking workflow integration');

    // 15. 清理资源
    console.log('\n🧹 Cleaning up...');
    await mjos.destroy();
    console.log('✅ MJOS system cleaned up successfully');

  } catch (error) {
    console.error('❌ Context Management Demo failed:', error);
    process.exit(1);
  }
}

// 运行演示
if (require.main === module) {
  contextManagementDemo()
    .then(() => {
      console.log('\n🏁 Context Management Demo completed successfully!');
      console.log('\n🚀 Next Steps:');
      console.log('   1. Integrate ContextManager with all MJOS workflows');
      console.log('   2. Enhance memory retrieval algorithms');
      console.log('   3. Add real-time context synchronization');
      console.log('   4. Implement context-aware prompt generation');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo failed:', error);
      process.exit(1);
    });
}

export { contextManagementDemo };
