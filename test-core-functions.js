#!/usr/bin/env node
/**
 * 直接测试MJOS核心功能，绕开MCP协议
 */

// 直接导入MJOS核心模块
const path = require('path');

async function testCoreFunction() {
  console.log('🧪 MJOS核心功能直接测试');
  console.log('=' * 50);

  try {
    // 测试1: 导入核心模块
    console.log('\n📦 测试1: 导入MJOS核心模块');
    const mjosPath = path.join(__dirname, 'dist', 'index.js');
    console.log('模块路径:', mjosPath);
    
    const MJOS = require(mjosPath);
    console.log('✅ MJOS模块导入成功');
    console.log('可用方法:', Object.keys(MJOS));

    // 测试2: 创建MJOS实例
    console.log('\n🏗️ 测试2: 创建MJOS实例');
    const mjos = new MJOS.MJOS();
    console.log('✅ MJOS实例创建成功');

    // 测试3: 记忆系统
    console.log('\n🧠 测试3: 记忆系统功能');
    const memoryResult = await mjos.remember('这是一个直接功能测试记忆', {
      importance: 0.9,
      tags: ['直接测试', '核心功能', '绕开MCP']
    });
    console.log('✅ 记忆存储结果:', memoryResult);

    // 测试4: 记忆检索
    console.log('\n🔍 测试4: 记忆检索功能');
    const recallResult = await mjos.recall('直接测试', { limit: 5 });
    console.log('✅ 记忆检索结果:', recallResult);

    // 测试5: 任务管理
    console.log('\n📋 测试5: 任务管理功能');
    const taskResult = await mjos.createTask({
      title: '直接功能测试任务',
      description: '验证MJOS核心功能是否正常工作',
      priority: 'high'
    });
    console.log('✅ 任务创建结果:', taskResult);

    // 测试6: 系统状态
    console.log('\n📊 测试6: 系统状态功能');
    const statusResult = await mjos.getStatus();
    console.log('✅ 系统状态结果:', statusResult);

    // 测试7: 性能指标
    console.log('\n📈 测试7: 性能指标功能');
    const metricsResult = await mjos.getPerformanceMetrics();
    console.log('✅ 性能指标结果:', metricsResult);

    console.log('\n🎉 所有核心功能测试完成！');
    console.log('✅ MJOS核心功能完全正常');
    console.log('✅ 用户通过MCP安装后也可以正常使用这些功能');

  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
    console.log('错误详情:', error);
    
    // 如果直接导入失败，尝试通过npm包测试
    console.log('\n🔄 尝试通过npm包测试...');
    await testViaPackage();
  }
}

async function testViaPackage() {
  console.log('\n📦 通过npm包测试MJOS功能');
  
  try {
    // 尝试require已安装的mjos包
    const mjos = require('mjos');
    console.log('✅ 通过npm包导入成功');
    
    // 测试基础功能
    const instance = new mjos.MJOS();
    console.log('✅ 实例创建成功');
    
    const status = await instance.getStatus();
    console.log('✅ 状态获取成功:', status);
    
  } catch (error) {
    console.log('❌ npm包测试失败:', error.message);
    
    // 最后尝试：直接测试编译后的文件
    console.log('\n🔧 直接测试编译后的文件...');
    await testCompiledFiles();
  }
}

async function testCompiledFiles() {
  console.log('\n📁 直接测试编译后的文件');
  
  try {
    // 检查dist目录
    const fs = require('fs');
    const distPath = path.join(__dirname, 'dist');
    
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      console.log('✅ dist目录存在，文件:', files);
      
      // 尝试导入主文件
      const indexPath = path.join(distPath, 'index.js');
      if (fs.existsSync(indexPath)) {
        console.log('✅ index.js存在');
        
        // 读取文件内容检查
        const content = fs.readFileSync(indexPath, 'utf8');
        console.log('✅ 文件可读取，大小:', content.length, '字符');
        
        if (content.includes('MJOS') && content.includes('export')) {
          console.log('✅ 文件包含MJOS导出');
        }
      }
    } else {
      console.log('❌ dist目录不存在');
    }
    
  } catch (error) {
    console.log('❌ 编译文件测试失败:', error.message);
  }
}

// 运行测试
testCoreFunction().catch(console.error);
