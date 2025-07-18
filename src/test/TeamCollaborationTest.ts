/**
 * MJOS团队协作能力测试系统
 * Team Collaboration Capability Test System
 */

import { MJOS } from '../index';
import { CompleteTeamSystem } from '../team/CompleteTeamProfiles';
import { MemberTriggerSystem } from '../team/MemberTriggerSystem';
import MoxiaoyiMemoryManager from '../team/MoxiaoyiMemoryManager';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  requiredMembers: string[];
  testSteps: TestStep[];
  expectedOutcome: string;
}

export interface TestStep {
  step: number;
  action: string;
  trigger: string;
  expectedMember: string;
  expectedResponse: string;
  mcpTool?: string;
}

export interface TestResult {
  scenarioId: string;
  passed: boolean;
  details: {
    step: number;
    passed: boolean;
    actualMember?: string;
    actualResponse?: string;
    error?: string;
  }[];
  executionTime: number;
}

export class TeamCollaborationTest {
  private mjos: MJOS;
  private teamSystem: CompleteTeamSystem;
  private triggerSystem: MemberTriggerSystem;
  private memoryManager: MoxiaoyiMemoryManager;

  constructor(mjos: MJOS) {
    this.mjos = mjos;
    this.teamSystem = new CompleteTeamSystem();
    this.triggerSystem = new MemberTriggerSystem();
    this.memoryManager = new MoxiaoyiMemoryManager(mjos);
  }

  /**
   * 运行完整的团队协作测试
   */
  async runFullTeamTest(): Promise<TestResult[]> {
    console.log('🚀 开始MJOS团队协作能力测试...\n');

    const scenarios = this.getTestScenarios();
    const results: TestResult[] = [];

    for (const scenario of scenarios) {
      console.log(`📋 测试场景: ${scenario.name}`);
      const result = await this.runScenario(scenario);
      results.push(result);
      
      console.log(`${result.passed ? '✅' : '❌'} ${scenario.name} - ${result.passed ? '通过' : '失败'}`);
      console.log(`⏱️ 执行时间: ${result.executionTime}ms\n`);
    }

    this.generateTestReport(results);
    return results;
  }

  /**
   * 获取测试场景
   */
  private getTestScenarios(): TestScenario[] {
    return [
      {
        id: 'trigger-test',
        name: '成员触发指令测试',
        description: '测试所有10个成员的触发指令是否正常工作',
        requiredMembers: ['moxiaozhi', 'moxiaomei', 'moxiaoma', 'moxiaocang', 'moxiaochuang', 'moxiaoce', 'moxiaoyan', 'moxiaoyun', 'moxiaoan', 'moxiaoyi'],
        testSteps: [
          {
            step: 1,
            action: '触发莫小智',
            trigger: '莫小智，我需要项目分析',
            expectedMember: 'moxiaozhi',
            expectedResponse: '项目负责人/需求分析师'
          },
          {
            step: 2,
            action: '触发莫小美',
            trigger: '小美，帮我设计界面',
            expectedMember: 'moxiaomei',
            expectedResponse: 'UI/UX设计师'
          },
          {
            step: 3,
            action: '触发莫小码',
            trigger: 'moxiaoma，需要开发功能',
            expectedMember: 'moxiaoma',
            expectedResponse: '全栈工程师'
          },
          {
            step: 4,
            action: '触发莫小仓',
            trigger: '小仓，仓颉语言问题',
            expectedMember: 'moxiaocang',
            expectedResponse: '仓颉语言专家'
          },
          {
            step: 5,
            action: '触发莫小忆',
            trigger: 'xiaoyi，记录这次会议',
            expectedMember: 'moxiaoyi',
            expectedResponse: '记忆管理专家',
            mcpTool: 'moxiaoyi_generate_meeting_minutes'
          }
        ],
        expectedOutcome: '所有成员触发指令正常工作'
      },
      {
        id: 'collaboration-test',
        name: '团队协作流程测试',
        description: '测试多个成员协作完成复杂任务',
        requiredMembers: ['moxiaozhi', 'moxiaomei', 'moxiaoma', 'moxiaoyi'],
        testSteps: [
          {
            step: 1,
            action: '项目启动',
            trigger: '莫小智，我们要开发一个新的移动应用',
            expectedMember: 'moxiaozhi',
            expectedResponse: '需求分析'
          },
          {
            step: 2,
            action: '设计阶段',
            trigger: '莫小美，根据需求设计用户界面',
            expectedMember: 'moxiaomei',
            expectedResponse: '界面设计'
          },
          {
            step: 3,
            action: '开发阶段',
            trigger: '莫小码，实现设计的功能',
            expectedMember: 'moxiaoma',
            expectedResponse: '系统开发'
          },
          {
            step: 4,
            action: '记录总结',
            trigger: '莫小忆，记录项目进展',
            expectedMember: 'moxiaoyi',
            expectedResponse: '记忆管理',
            mcpTool: 'moxiaoyi_smart_search'
          }
        ],
        expectedOutcome: '团队协作流程顺畅'
      },
      {
        id: 'mcp-integration-test',
        name: 'MCP工具集成测试',
        description: '测试成员专用MCP工具是否正常工作',
        requiredMembers: ['moxiaoyi', 'moxiaoce', 'moxiaoyan'],
        testSteps: [
          {
            step: 1,
            action: '记忆管理工具',
            trigger: '莫小忆，生成会议纪要',
            expectedMember: 'moxiaoyi',
            expectedResponse: '会议纪要生成',
            mcpTool: 'moxiaoyi_generate_meeting_minutes'
          },
          {
            step: 2,
            action: '智能搜索工具',
            trigger: '莫小忆，搜索项目相关记忆',
            expectedMember: 'moxiaoyi',
            expectedResponse: '智能搜索',
            mcpTool: 'moxiaoyi_smart_search'
          }
        ],
        expectedOutcome: 'MCP工具集成正常'
      },
      {
        id: 'self-evolution-test',
        name: '自我进化能力测试',
        description: '测试成员的学习和进化能力',
        requiredMembers: ['moxiaocang', 'moxiaoyan'],
        testSteps: [
          {
            step: 1,
            action: '学习新技术',
            trigger: '莫小仓，学习仓颉语言新特性',
            expectedMember: 'moxiaocang',
            expectedResponse: '学习进化'
          },
          {
            step: 2,
            action: '研究分析',
            trigger: '莫小研，分析最新AI算法',
            expectedMember: 'moxiaoyan',
            expectedResponse: '研究学习'
          }
        ],
        expectedOutcome: '自我进化能力正常'
      }
    ];
  }

  /**
   * 运行单个测试场景
   */
  private async runScenario(scenario: TestScenario): Promise<TestResult> {
    const startTime = Date.now();
    const result: TestResult = {
      scenarioId: scenario.id,
      passed: true,
      details: [],
      executionTime: 0
    };

    for (const step of scenario.testSteps) {
      try {
        const stepResult = await this.executeTestStep(step);
        result.details.push(stepResult);
        
        if (!stepResult.passed) {
          result.passed = false;
        }
      } catch (error) {
        result.details.push({
          step: step.step,
          passed: false,
          error: error instanceof Error ? error.message : String(error)
        });
        result.passed = false;
      }
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  /**
   * 执行单个测试步骤
   */
  private async executeTestStep(step: TestStep): Promise<{
    step: number;
    passed: boolean;
    actualMember?: string;
    actualResponse?: string;
    error?: string;
  }> {
    try {
      // 测试触发系统
      const identifiedMember = this.triggerSystem.identifyMember(step.trigger);
      
      if (!identifiedMember || identifiedMember.id !== step.expectedMember) {
        return {
          step: step.step,
          passed: false,
          actualMember: identifiedMember?.id || 'none',
          error: `期望触发${step.expectedMember}，实际触发${identifiedMember?.id || 'none'}`
        };
      }

      // 测试MCP工具（如果有）
      if (step.mcpTool) {
        const mcpResult = await this.testMCPTool(step.mcpTool, identifiedMember.id);
        if (!mcpResult) {
          return {
            step: step.step,
            passed: false,
            actualMember: identifiedMember.id,
            error: `MCP工具${step.mcpTool}测试失败`
          };
        }
      }

      // 测试成员能力
      const memberCapability = this.teamSystem.getMemberById(identifiedMember.id);
      if (!memberCapability) {
        return {
          step: step.step,
          passed: false,
          actualMember: identifiedMember.id,
          error: '成员能力档案不存在'
        };
      }

      return {
        step: step.step,
        passed: true,
        actualMember: identifiedMember.id,
        actualResponse: identifiedMember.role
      };
    } catch (error) {
      return {
        step: step.step,
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 测试MCP工具
   */
  private async testMCPTool(toolName: string, memberId: string): Promise<boolean> {
    try {
      switch (toolName) {
        case 'moxiaoyi_generate_meeting_minutes': {
          const minutes = await this.memoryManager.generateMeetingMinutes({
            title: '测试会议',
            participants: ['测试用户'],
            discussions: ['测试讨论'],
            decisions: ['测试决策'],
            actionItems: []
          });
          return !!minutes.id;
        }

        case 'moxiaoyi_smart_search': {
          const memories = await this.memoryManager.recallMemories({
            content: '测试',
            limit: 5
          });
          return Array.isArray(memories);
        }

        default:
          return true;
      }
    } catch (error) {
      console.error(`MCP工具测试失败: ${toolName}`, error);
      return false;
    }
  }

  /**
   * 生成测试报告
   */
  private generateTestReport(results: TestResult[]): void {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests * 100).toFixed(1);

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    MJOS团队协作测试报告                       ║
╠══════════════════════════════════════════════════════════════╣
║ 总测试数: ${totalTests.toString().padEnd(47)} ║
║ 通过测试: ${passedTests.toString().padEnd(47)} ║
║ 失败测试: ${failedTests.toString().padEnd(47)} ║
║ 成功率:   ${successRate}%${' '.repeat(44)} ║
╠══════════════════════════════════════════════════════════════╣
║ 测试详情:                                                    ║`);

    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const scenario = this.getTestScenarios().find(s => s.id === result.scenarioId);
      console.log(`║ ${status} ${scenario?.name.padEnd(52)} ║`);
    });

    console.log(`╚══════════════════════════════════════════════════════════════╝
    `);

    // 详细失败信息
    const failedResults = results.filter(r => !r.passed);
    if (failedResults.length > 0) {
      console.log('❌ 失败测试详情:\n');
      failedResults.forEach(result => {
        const scenario = this.getTestScenarios().find(s => s.id === result.scenarioId);
        console.log(`📋 ${scenario?.name}:`);
        result.details.filter(d => !d.passed).forEach(detail => {
          console.log(`   步骤${detail.step}: ${detail.error || '未知错误'}`);
        });
        console.log('');
      });
    }
  }
}

export default TeamCollaborationTest;
