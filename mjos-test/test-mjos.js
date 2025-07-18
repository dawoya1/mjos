#!/usr/bin/env node

const { MJOS } = require('mjos');

async function testMJOS() {
  console.log('🚀 开始测试 MJOS npm 包...\n');

  try {
    // 创建 MJOS 实例
    console.log('1. 创建 MJOS 实例...');
    const mjos = new MJOS();
    console.log('✅ MJOS 实例创建成功\n');

    // 启动系统
    console.log('2. 启动 MJOS 系统...');
    await mjos.start();
    console.log('✅ MJOS 系统启动成功\n');

    // 获取系统状态
    console.log('3. 获取系统状态...');
    const status = mjos.getStatus();
    console.log('✅ 系统状态:', {
      version: status.version,
      running: status.running,
      modules: Object.keys(status).filter(key => key !== 'version' && key !== 'running').length
    });
    console.log();

    // 测试记忆系统
    console.log('4. 测试记忆系统...');
    const memoryId = mjos.remember('这是一个测试记忆', ['test', 'npm']);
    console.log('✅ 记忆存储成功, ID:', memoryId);
    
    const memories = mjos.recall({ tags: ['test'] });
    console.log('✅ 记忆查询成功, 找到', memories.length, '条记忆');
    console.log();

    // 测试团队管理
    console.log('5. 测试团队管理...');
    const teamStatus = mjos.getStatus().team;
    console.log('✅ 团队成员数量:', teamStatus.totalMembers);
    console.log('✅ 团队任务数量:', teamStatus.totalTasks);
    console.log();

    // 测试任务创建
    console.log('6. 测试任务创建...');
    const taskId = mjos.createTask('测试任务', '这是一个npm包测试任务');
    console.log('✅ 任务创建成功, ID:', taskId);
    console.log();

    // 测试性能指标
    console.log('7. 测试性能指标...');
    const metrics = mjos.getPerformanceMetrics();
    console.log('✅ 性能指标获取成功:', {
      memoryUsage: metrics.memoryUsage,
      systemUptime: metrics.systemUptime
    });
    console.log();

    // 停止系统
    console.log('8. 停止 MJOS 系统...');
    await mjos.stop();
    console.log('✅ MJOS 系统停止成功\n');

    console.log('🎉 所有测试通过！MJOS npm 包工作正常！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
testMJOS().catch(console.error);
