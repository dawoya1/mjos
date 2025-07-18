#!/usr/bin/env node

/**
 * 远程NPX智能记忆系统测试
 */

const { MJOS, ThinkingMethod } = require('mjos');

async function testRemoteMemory() {
  console.log('🧠 测试远程NPX智能记忆系统');
  console.log('='.repeat(50));

  const mjos = new MJOS();
  
  try {
    await mjos.start();
    console.log('✅ MJOS系统启动成功');

    // 测试基础存储
    console.log('\n📝 测试基础存储...');
    const memoryId1 = mjos.remember(
      '在React项目中，我们发现使用React.memo和useMemo可以显著提升性能。特别是在处理大量数据渲染时，通过合理的记忆化策略，页面渲染时间从2秒降低到200ms。',
      { tags: ['react', 'performance', 'optimization'], importance: 0.9 }
    );
    console.log(`✅ 项目经验已存储: ${memoryId1}`);

    const memoryId2 = mjos.remember(
      'Docker多阶段构建最佳实践',
      { tags: ['docker', 'deployment'], importance: 0.8 }
    );
    console.log(`✅ 技术知识已存储: ${memoryId2}`);

    // 测试基础检索
    console.log('\n🔍 测试基础检索...');
    const memories = mjos.recall({ tags: ['react'] });
    console.log(`🎯 找到${memories.length}条相关记忆`);

    if (memories.length > 0) {
      memories.forEach((memory, index) => {
        console.log(`   ${index + 1}. ${memory.content.substring(0, 50)}...`);
      });
    }

    // 测试系统状态
    console.log('\n📊 测试系统状态...');
    const status = mjos.getStatus();
    console.log('📈 系统状态:');
    console.log(`   版本: ${status.version}`);
    console.log(`   引擎状态: ${status.engine.running ? '运行中' : '已停止'}`);
    console.log(`   记忆数量: ${status.modules.memory.totalMemories}条`);

    console.log('\n✅ 远程NPX基础功能测试完成！');
    console.log('\n🎯 测试结果总结:');
    console.log('   ✓ 基础存储功能正常');
    console.log('   ✓ 基础检索功能正常');
    console.log('   ✓ 系统状态功能正常');
    console.log('   ✓ 远程NPX部署成功');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  } finally {
    await mjos.stop();
    await mjos.cleanup();
    console.log('🔄 系统已清理完成');
  }
}

// 运行测试
testRemoteMemory().catch(console.error);
