#!/usr/bin/env node

/**
 * MJOS 智能记忆系统演示
 * 展示记忆系统分层策略和自动调用机制
 */

import { MJOS, ThinkingMethod } from '../src/index';

async function demonstrateIntelligentMemory() {
  console.log('🧠 MJOS 智能记忆系统演示');
  console.log('='.repeat(50));

  const mjos = new MJOS();
  await mjos.start();

  try {
    // 1. 自动分类存储演示
    console.log('\n📝 1. 自动分类存储演示');
    console.log('-'.repeat(30));

    // 长期记忆：项目经验
    const projectMemoryId = mjos.remember(
      '在React项目中，我们发现使用React.memo和useMemo可以显著提升性能。特别是在处理大量数据渲染时，通过合理的记忆化策略，页面渲染时间从2秒降低到200ms。关键是要识别哪些组件真正需要记忆化，避免过度优化。',
      { tags: ['project', 'react', 'performance'], importance: 0.9 }
    );
    console.log(`✅ 项目经验已存储: ${projectMemoryId}`);

    // 长期记忆：技术方案
    const techMemoryId = mjos.remember(
      'Docker多阶段构建配置：FROM node:16 AS builder -> COPY package*.json -> RUN npm ci -> COPY . -> RUN npm run build -> FROM nginx:alpine -> COPY --from=builder /app/dist /usr/share/nginx/html',
      { tags: ['docker', 'config', 'deployment'], importance: 0.8 }
    );
    console.log(`✅ 技术配置已存储: ${techMemoryId}`);

    // 长期记忆：学习知识
    const learningMemoryId = mjos.remember(
      '学习到的最佳实践：API设计应该遵循RESTful原则，使用HTTP状态码表示操作结果，GET用于查询，POST用于创建，PUT用于更新，DELETE用于删除。同时要考虑幂等性和缓存策略。',
      { tags: ['learning', 'api', 'best-practice'], importance: 0.8 }
    );
    console.log(`✅ 学习知识已存储: ${learningMemoryId}`);

    // 工作记忆：当前对话
    const contextMemoryId = mjos.remember(
      '当前正在演示MJOS智能记忆系统的分层策略',
      { tags: ['context', 'current', 'demo'], importance: 0.5 }
    );
    console.log(`✅ 对话上下文已存储: ${contextMemoryId}`);

    // 2. 智能检索演示
    console.log('\n🔍 2. 智能检索演示');
    console.log('-'.repeat(30));

    // 检索React相关经验
    const reactMemories = await mjos.smartRecall('React性能优化', {
      maxResults: 5,
      minImportance: 0.7
    });
    console.log(`🎯 找到${reactMemories.length}条React相关记忆:`);
    reactMemories.forEach((memory, index) => {
      console.log(`   ${index + 1}. ${memory.content.substring(0, 50)}...`);
    });

    // 检索技术配置
    const configMemories = await mjos.smartRecall('Docker配置部署', {
      maxResults: 3,
      minImportance: 0.6
    });
    console.log(`🎯 找到${configMemories.length}条配置相关记忆:`);
    configMemories.forEach((memory, index) => {
      console.log(`   ${index + 1}. ${memory.content.substring(0, 50)}...`);
    });

    // 3. 深度思考演示
    console.log('\n🤔 3. 深度思考演示');
    console.log('-'.repeat(30));

    // 麦肯锡七步法
    const mcKinseyResult = await mjos.deepThink(
      '如何优化前端应用的加载性能？',
      ThinkingMethod.MCKINSEY_7_STEPS
    );
    console.log('📊 麦肯锡七步法分析:');
    console.log(`   分析: ${mcKinseyResult.analysis}`);
    console.log(`   解决方案: ${mcKinseyResult.solution}`);
    console.log(`   相关记忆: ${mcKinseyResult.relatedMemories.length}条`);

    // 纵览全局法
    const globalResult = await mjos.deepThink(
      '系统架构设计中的性能瓶颈',
      ThinkingMethod.GLOBAL_OVERVIEW
    );
    console.log('\n🌐 纵览全局法分析:');
    console.log(`   分析: ${globalResult.analysis}`);
    console.log(`   解决方案: ${globalResult.solution}`);

    // 矛盾分析法
    const contradictionResult = await mjos.deepThink(
      '开发效率与代码质量的平衡',
      ThinkingMethod.CONTRADICTION_ANALYSIS
    );
    console.log('\n⚖️ 矛盾分析法:');
    console.log(`   分析: ${contradictionResult.analysis}`);
    console.log(`   解决方案: ${contradictionResult.solution}`);

    // 4. 记忆统计演示
    console.log('\n📊 4. 记忆统计演示');
    console.log('-'.repeat(30));

    const stats = mjos.intelligentMemoryManager?.getMemoryStats();
    if (stats) {
      console.log('📈 记忆系统统计:');
      console.log(`   长期记忆: ${stats.longTerm.total}条, 平均重要性: ${stats.longTerm.avgImportance.toFixed(2)}`);
      console.log(`   工作记忆: ${stats.working.total}条, 平均重要性: ${stats.working.avgImportance.toFixed(2)}`);
    }

    // 5. 自动触发机制演示
    console.log('\n🚀 5. 自动触发机制演示');
    console.log('-'.repeat(30));

    // 模拟用户询问历史问题
    console.log('💬 用户询问: "之前我们是怎么解决React性能问题的？"');
    const historyMemories = await mjos.smartRecall('React性能问题解决方案');
    console.log(`🔄 自动检索到${historyMemories.length}条相关历史记忆`);

    // 模拟遇到新项目
    console.log('\n💬 用户提到: "开始新的Vue项目"');
    const vueMemories = await mjos.smartRecall('Vue项目经验');
    console.log(`🔄 自动检索到${vueMemories.length}条Vue相关经验`);

    // 模拟遇到问题
    console.log('\n💬 用户遇到: "API响应太慢"');
    const apiMemories = await mjos.smartRecall('API性能优化');
    console.log(`🔄 自动检索到${apiMemories.length}条API优化方案`);

    console.log('\n✅ 智能记忆系统演示完成！');
    console.log('\n🎯 核心特性总结:');
    console.log('   ✓ 自动分类存储 (长期记忆 vs 工作记忆)');
    console.log('   ✓ 智能检索相关信息');
    console.log('   ✓ 深度思考方法集成');
    console.log('   ✓ 自动触发机制');
    console.log('   ✓ 记忆统计和管理');

  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error);
  } finally {
    await mjos.stop();
    await mjos.cleanup();
  }
}

// 运行演示
if (require.main === module) {
  demonstrateIntelligentMemory().catch(console.error);
}

export { demonstrateIntelligentMemory };
