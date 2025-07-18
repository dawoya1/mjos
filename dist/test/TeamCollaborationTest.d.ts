/**
 * MJOS团队协作能力测试系统
 * Team Collaboration Capability Test System
 */
import { MJOS } from '../index';
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
export declare class TeamCollaborationTest {
    private mjos;
    private teamSystem;
    private triggerSystem;
    private memoryManager;
    constructor(mjos: MJOS);
    /**
     * 运行完整的团队协作测试
     */
    runFullTeamTest(): Promise<TestResult[]>;
    /**
     * 获取测试场景
     */
    private getTestScenarios;
    /**
     * 运行单个测试场景
     */
    private runScenario;
    /**
     * 执行单个测试步骤
     */
    private executeTestStep;
    /**
     * 测试MCP工具
     */
    private testMCPTool;
    /**
     * 生成测试报告
     */
    private generateTestReport;
}
export default TeamCollaborationTest;
//# sourceMappingURL=TeamCollaborationTest.d.ts.map