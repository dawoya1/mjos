#!/usr/bin/env node

/**
 * 简单测试MJOS基础功能
 */

const { MJOS } = require('./dist/index.js');

async function simpleTest() {
  console.log('🧪 简单测试MJOS基础功能');
  console.log('='.repeat(40));

  const mjos = new MJOS();
  
  try {
    console.log('✅ MJOS实例创建成功');
    console.log(`📋 版本: ${mjos.getVersion()}`);
    
    // 测试基础记忆功能
    console.log('\n📝 测试基础记忆功能...');
    const memoryId = mjos.remember('测试内容', { tags: ['test'], importance: 0.5 });
    console.log(`✅ 记忆存储成功: ${memoryId}`);
    
    // 测试检索
    console.log('\n🔍 测试记忆检索...');
    const memories = mjos.recall({ tags: ['test'] });
    console.log(`✅ 检索到${memories.length}条记忆`);
    
    console.log('\n✅ 基础功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('Stack:', error.stack);
  }
}

// 运行测试
simpleTest().catch(console.error);
