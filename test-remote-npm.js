#!/usr/bin/env node

// 测试远程npm包的记忆功能
async function testRemoteNPM() {
  console.log('🧠 测试远程npm包记忆功能...\n');

  try {
    // 动态导入远程npm包
    console.log('1. 导入远程MJOS包...');
    const { MJOS } = require('mjos');
    console.log('✅ 远程MJOS包导入成功\n');

    // 创建实例
    console.log('2. 创建MJOS实例...');
    const mjos = new MJOS();
    console.log('✅ MJOS实例创建成功\n');

    // 启动系统
    console.log('3. 启动MJOS系统...');
    await mjos.start();
    console.log('✅ MJOS系统启动成功\n');

    // 测试记忆功能
    console.log('4. 测试记忆存储...');
    try {
      const memoryId = mjos.remember('远程npm包测试记忆', ['remote', 'npm', 'test'], 0.8);
      console.log('✅ 记忆存储成功, ID:', memoryId);
    } catch (error) {
      console.error('❌ 记忆存储失败:', error.message);
      console.error('错误详情:', error.stack);
    }

    // 测试记忆查询
    console.log('\n5. 测试记忆查询...');
    try {
      const memories = mjos.recall({ tags: ['remote'] });
      console.log('✅ 记忆查询成功, 找到', memories.length, '条记忆');
      if (memories.length > 0) {
        console.log('记忆内容:', memories[0].content);
      }
    } catch (error) {
      console.error('❌ 记忆查询失败:', error.message);
      console.error('错误详情:', error.stack);
    }

    // 获取系统状态
    console.log('\n6. 获取系统状态...');
    const status = mjos.getStatus();
    console.log('✅ 系统状态获取成功');
    console.log('- 版本:', status.version);
    console.log('- 运行状态:', status.running);
    console.log('- 记忆总数:', status.memory.totalMemories);

    // 停止系统
    console.log('\n7. 停止MJOS系统...');
    await mjos.stop();
    console.log('✅ MJOS系统停止成功');

    console.log('\n🎉 远程npm包测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error.stack);
    process.exit(1);
  }
}

testRemoteNPM().catch(console.error);
