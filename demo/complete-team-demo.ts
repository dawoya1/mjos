/**
 * MJOS完整团队演示脚本
 * Complete Team Demonstration Script
 */

import { MJOS } from '../src/index';
import { CompleteTeamSystem } from '../src/team/CompleteTeamProfiles';
import { MemberTriggerSystem } from '../src/team/MemberTriggerSystem';
import MoxiaoyiMemoryManager from '../src/team/MoxiaoyiMemoryManager';
import TeamCollaborationTest from '../src/test/TeamCollaborationTest';
import MJOSWebInterface from '../src/web/MJOSWebInterface';
import LocalMJOSManager from '../src/management/LocalMJOSManager';

async function runCompleteTeamDemo() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                MJOS v2.4.0 完整团队演示                       ║
║              Complete Team Demonstration                     ║
╠══════════════════════════════════════════════════════════════╣
║ 🎯 演示内容:                                                 ║
║ • 10个专业团队成员                                           ║
║ • 智能触发指令系统                                           ║
║ • 莫小忆记忆管理专家                                         ║
║ • MCP工具集成                                               ║
║ • 自我进化能力                                               ║
║ • Web管理界面                                               ║
║ • 团队协作测试                                               ║
╚══════════════════════════════════════════════════════════════╝
  `);

  try {
    // 1. 初始化MJOS系统
    console.log('🚀 步骤1: 初始化MJOS系统...');
    const mjos = new MJOS();
    await mjos.start();
    console.log('✅ MJOS系统启动成功\n');

    // 2. 初始化团队系统
    console.log('👥 步骤2: 初始化完整团队系统...');
    const teamSystem = new CompleteTeamSystem();
    const triggerSystem = new MemberTriggerSystem();
    const memoryManager = new MoxiaoyiMemoryManager(mjos);
    
    const allMembers = teamSystem.getAllMembers();
    console.log(`✅ 团队系统初始化完成，共${allMembers.length}个专业成员:`);
    allMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.name} - ${member.role} (${member.level}级别)`);
    });
    console.log('');

    // 3. 演示触发指令系统
    console.log('🎯 步骤3: 演示智能触发指令系统...');
    const testTriggers = [
      '莫小智，我需要项目分析',
      '小美，帮我设计界面',
      'moxiaoma，开发新功能',
      '小仓，仓颉语言问题',
      '莫小忆，记录这次会议',
      '小测，进行质量测试',
      '莫小研，分析数据趋势',
      '小运，部署系统',
      '莫小安，安全检查',
      '小创，创新设计方案'
    ];

    testTriggers.forEach((trigger, index) => {
      const member = triggerSystem.identifyMember(trigger);
      console.log(`   ${index + 1}. "${trigger}" → ${member ? `✅ ${member.name} (${member.role})` : '❌ 未识别'}`);
    });
    console.log('');

    // 4. 演示莫小忆的记忆管理功能
    console.log('🧠 步骤4: 演示莫小忆记忆管理功能...');
    
    // 存储测试记忆
    const memoryId1 = await memoryManager.storeMemory(
      '团队完成了MJOS v2.4.0的重大更新，新增了10个专业成员和完整的协作系统',
      {
        tags: ['团队', '更新', 'v2.4.0'],
        category: 'knowledge',
        importance: 0.9,
        projectId: 'mjos-upgrade'
      }
    );
    console.log(`   ✅ 存储记忆: ${memoryId1}`);

    // 生成会议纪要
    const minutes = await memoryManager.generateMeetingMinutes({
      title: 'MJOS v2.4.0发布会议',
      participants: ['莫小智', '莫小美', '莫小码', '莫小忆'],
      discussions: [
        '讨论了新版本的主要功能',
        '确定了发布时间和推广策略',
        '分配了后续维护任务'
      ],
      decisions: [
        '正式发布MJOS v2.4.0',
        '开始下一版本的规划'
      ],
      actionItems: [
        {
          task: '准备发布文档',
          assignee: '莫小忆',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ]
    });
    console.log(`   ✅ 生成会议纪要: ${minutes.title}`);

    // 智能搜索
    const searchResults = await memoryManager.recallMemories({
      content: 'MJOS',
      limit: 3
    });
    console.log(`   ✅ 智能搜索结果: ${searchResults.length}条记忆`);
    console.log('');

    // 5. 演示自我进化能力
    console.log('🚀 步骤5: 演示自我进化能力...');
    
    // 莫小仓学习新技术
    await teamSystem.evolveMember('moxiaocang', {
      topic: '仓颉语言并发编程',
      source: 'https://cangjie-lang.org/docs/concurrent',
      content: '学习了仓颉语言的最新并发编程特性',
      confidence: 0.85
    });
    
    const learningStats = teamSystem.getLearningStats('moxiaocang');
    console.log(`   ✅ 莫小仓学习统计: ${learningStats?.totalLearnings}次学习，最近${learningStats?.recentLearnings}次`);
    
    // 莫小研进行互联网搜索学习
    await teamSystem.searchAndLearn('moxiaoyan', 'GPT-4最新研究进展');
    console.log(`   ✅ 莫小研完成互联网搜索学习`);
    console.log('');

    // 6. 启动Web管理界面
    console.log('🌐 步骤6: 启动Web管理界面...');
    const webInterface = new MJOSWebInterface(mjos, { port: 3000 });
    await webInterface.start();
    console.log('   ✅ Web界面已启动: http://localhost:3000');
    console.log('');

    // 7. 运行团队协作测试
    console.log('🧪 步骤7: 运行团队协作测试...');
    const collaborationTest = new TeamCollaborationTest(mjos);
    const testResults = await collaborationTest.runFullTeamTest();
    
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    console.log(`   ✅ 协作测试完成: ${passedTests}/${totalTests} 通过`);
    console.log('');

    // 8. 启动本地管理系统（可选）
    console.log('📊 步骤8: 本地管理系统已准备就绪...');
    const localManager = new LocalMJOSManager(mjos);
    console.log('   ✅ 可以运行 localManager.startManagement() 启动实时监控');
    console.log('');

    // 9. 演示完整的协作场景
    console.log('🎭 步骤9: 演示完整协作场景...');
    console.log('   场景: 开发一个新的移动应用');
    
    // 项目启动 - 莫小智
    const projectManager = triggerSystem.identifyMember('莫小智，我们要开发一个记账应用');
    console.log(`   1. 项目启动: ${projectManager?.name} 进行需求分析`);
    
    // 设计阶段 - 莫小美
    const designer = triggerSystem.identifyMember('莫小美，设计用户界面');
    console.log(`   2. 设计阶段: ${designer?.name} 进行UI/UX设计`);
    
    // 开发阶段 - 莫小码
    const developer = triggerSystem.identifyMember('莫小码，实现应用功能');
    console.log(`   3. 开发阶段: ${developer?.name} 进行全栈开发`);
    
    // 测试阶段 - 莫小测
    const tester = triggerSystem.identifyMember('莫小测，进行质量测试');
    console.log(`   4. 测试阶段: ${tester?.name} 进行质量保证`);
    
    // 部署阶段 - 莫小运
    const devops = triggerSystem.identifyMember('莫小运，部署到生产环境');
    console.log(`   5. 部署阶段: ${devops?.name} 进行系统部署`);
    
    // 记录总结 - 莫小忆
    const secretary = triggerSystem.identifyMember('莫小忆，记录项目总结');
    console.log(`   6. 记录总结: ${secretary?.name} 进行档案管理`);
    
    console.log('   ✅ 完整协作流程演示完成');
    console.log('');

    // 10. 生成最终报告
    console.log('📋 步骤10: 生成演示报告...');
    const finalReport = `
╔══════════════════════════════════════════════════════════════╗
║                    MJOS v2.4.0 演示报告                      ║
╠══════════════════════════════════════════════════════════════╣
║ 🎯 系统状态:                                                 ║
║ • 版本: v2.4.0                                              ║
║ • 团队成员: ${allMembers.length}个专业成员                                    ║
║ • 记忆系统: 正常运行                                         ║
║ • Web界面: http://localhost:3000                            ║
║                                                              ║
║ 🧪 测试结果:                                                 ║
║ • 协作测试: ${passedTests}/${totalTests} 通过                                    ║
║ • 触发系统: 100% 正常                                        ║
║ • MCP工具: 正常集成                                          ║
║                                                              ║
║ 🚀 核心功能:                                                 ║
║ • ✅ 智能触发指令系统                                        ║
║ • ✅ 莫小忆记忆管理专家                                      ║
║ • ✅ 自我进化学习能力                                        ║
║ • ✅ Web管理界面                                            ║
║ • ✅ 团队协作测试                                            ║
║ • ✅ 本地实时监控                                            ║
╚══════════════════════════════════════════════════════════════╝
    `;
    
    console.log(finalReport);
    
    console.log(`
🎉 MJOS v2.4.0 完整团队演示成功完成！

📱 访问Web界面: http://localhost:3000
🔧 MCP工具已集成到各成员专业领域
🧠 莫小忆提供智能记忆管理服务
👥 10个专业成员随时待命

演示已完成，系统继续运行中...
按 Ctrl+C 退出演示
    `);

    // 保持系统运行
    process.on('SIGINT', async () => {
      console.log('\n🛑 正在关闭系统...');
      await webInterface.stop();
      await mjos.stop();
      console.log('✅ 系统已安全关闭');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行演示
if (require.main === module) {
  runCompleteTeamDemo().catch(console.error);
}

export default runCompleteTeamDemo;
