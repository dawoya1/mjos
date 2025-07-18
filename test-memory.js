#!/usr/bin/env node

const { MJOS } = require('mjos');

async function testMemoryFunction() {
  console.log('🧠 测试MJOS记忆功能...\n');

  try {
    // 创建MJOS实例
    console.log('1. 创建MJOS实例...');
    const mjos = new MJOS();
    console.log('✅ MJOS实例创建成功\n');

    // 启动系统
    console.log('2. 启动MJOS系统...');
    await mjos.start();
    console.log('✅ MJOS系统启动成功\n');

    // 检查系统状态
    console.log('3. 检查系统状态...');
    const status = mjos.getStatus();
    console.log('系统状态:', JSON.stringify(status, null, 2));
    console.log();

    // 检查存储系统
    console.log('4. 检查存储系统...');
    console.log('存储管理器存在:', !!mjos.storage);
    if (mjos.storage) {
      console.log('存储提供者:', Object.keys(mjos.storage.providers || {}));
    }
    console.log();

    // 检查记忆系统
    console.log('5. 检查记忆系统...');
    console.log('记忆系统存在:', !!mjos.memory);
    if (mjos.memory) {
      console.log('记忆存储存在:', !!mjos.memory.storage);
      if (mjos.memory.storage) {
        console.log('记忆存储类型:', mjos.memory.storage.constructor.name);
        console.log('记忆存储方法:', Object.getOwnPropertyNames(mjos.memory.storage).filter(name => typeof mjos.memory.storage[name] === 'function'));
      }
    }
    console.log();

    // 测试记忆存储
    console.log('6. 测试记忆存储...');
    try {
      const memoryId = mjos.remember('这是一个测试记忆', ['test', 'memory']);
      console.log('✅ 记忆存储成功, ID:', memoryId);
    } catch (error) {
      console.error('❌ 记忆存储失败:', error.message);
      console.error('错误堆栈:', error.stack);
      
      // 深入检查错误
      console.log('\n🔍 深入检查错误...');
      if (mjos.memory && mjos.memory.storage) {
        console.log('记忆存储对象:', mjos.memory.storage);
        console.log('store方法存在:', typeof mjos.memory.storage.store === 'function');
      }
    }

    // 停止系统
    console.log('\n7. 停止MJOS系统...');
    await mjos.stop();
    console.log('✅ MJOS系统停止成功');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

testMemoryFunction().catch(console.error);
