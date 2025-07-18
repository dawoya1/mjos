/**
 * MJOS Main Entry Point - Performance Enhanced
 * 魔剑工作室操作系统主入口 - 性能增强版本
 */
import { MJOSEngine, ConfigManager } from './core/index';
import { MemorySystem, ThinkingMethod } from './memory/index';
import { TeamManager } from './team/index';
import { KnowledgeGraph } from './knowledge/index';
import { ContextManager } from './context/index';
import { ReasoningEngine } from './reasoning/index';
import { AgentManager } from './agents/index';
import { RoleManager } from './roles/index';
import { CommunicationManager } from './communication/index';
import { MCPManager } from './mcp/index';
import { WorkflowEngine } from './workflow/index';
import { APIServer } from './api/index';
import { StorageManager } from './storage/index';
import { SecurityManager } from './security/index';
interface SimplePerformanceMetrics {
    memoryUsage: {
        used: number;
        total: number;
        percentage: number;
    };
    systemUptime: number;
}
export * from './types/index';
export * from './core/index';
export * from './memory/index';
export * from './team/index';
export * from './knowledge/index';
export { ContextManager as SessionContextManager } from './context/index';
export * from './reasoning/index';
export * from './agents/index';
export * from './roles/index';
export * from './communication/index';
export { MCPManager, MCPSession } from './mcp/index';
export { WorkflowEngine, WorkflowDefinition, WorkflowExecution } from './workflow/index';
export * from './api/index';
export * from './storage/index';
export * from './security/index';
export declare class MJOS {
    private version;
    private _running;
    private engine;
    private logger;
    private config;
    private coreContextManager;
    private memorySystem;
    private intelligentMemoryManager;
    private teamManager;
    private performanceMonitor;
    private knowledgeGraph;
    private contextManager;
    private reasoningEngine;
    private agentManager;
    private roleManager;
    private communicationManager;
    private mcpManager;
    private workflowEngine;
    private apiServer?;
    private storageManager;
    private securityManager;
    constructor();
    private setupModuleIntegration;
    getVersion(): string;
    get running(): boolean;
    start(): Promise<void>;
    stop(): Promise<void>;
    cleanup(): Promise<void>;
    getStatus(): {
        version: string;
        running: boolean;
        engine: any;
        memory: any;
        knowledge: any;
        context: any;
        reasoning: any;
        team: any;
        performance: any;
    };
    getEngine(): MJOSEngine;
    getContextManager(): ContextManager;
    getMemorySystem(): MemorySystem;
    getTeamManager(): TeamManager;
    getKnowledgeGraph(): KnowledgeGraph;
    getReasoningEngine(): ReasoningEngine;
    getConfig(): ConfigManager;
    getAgentManager(): AgentManager;
    getRoleManager(): RoleManager;
    getCommunicationManager(): CommunicationManager;
    getMCPManager(): MCPManager;
    getWorkflowEngine(): WorkflowEngine;
    getAPIServer(): APIServer | undefined;
    getStorageManager(): StorageManager;
    getSecurityManager(): SecurityManager;
    remember(content: any, options?: {
        tags?: string[];
        importance?: number;
    }): string;
    smartRemember(content: any, options?: {
        tags?: string[];
        importance?: number;
    }): Promise<string>;
    smartRecall(query: string, options?: {
        includeWorkingMemory?: boolean;
        maxResults?: number;
        minImportance?: number;
    }): Promise<import("./memory/index").MemoryItem[]>;
    deepThink(problem: string, method?: ThinkingMethod): Promise<{
        analysis: string;
        solution: string;
        relatedMemories: import("./memory/index").MemoryItem[];
    }>;
    recall(query: any): any[];
    createTask(title: string, description: string, priority?: 'low' | 'medium' | 'high' | 'urgent'): string;
    assignTask(taskId: string, memberId: string): boolean;
    addKnowledge(content: any, type?: any, domain?: string, tags?: string[]): string;
    queryKnowledge(query: any): any[];
    createSession(userId?: string): string;
    addMessage(sessionId: string, role: string, content: any): boolean;
    getConversationHistory(sessionId: string, limit?: number): any[];
    reason(type: any, input: any, context?: any): Promise<any>;
    rememberWithContext(content: any, sessionId?: string, tags?: string[], importance?: number): string;
    intelligentRecall(query: any, useReasoning?: boolean): Promise<any>;
    createIntelligentTask(title: string, description: string, domain?: string): string;
    startAPIServer(options?: any): Promise<void>;
    stopAPIServer(): Promise<void>;
    executeWorkflow(workflowId: string, variables?: Record<string, any>): Promise<string>;
    createAgent(definition: any): string;
    assignTaskToAgent(taskId: string, agentId?: string): string;
    getPerformanceMetrics(): SimplePerformanceMetrics;
    getPerformanceSummary(): {
        status: string;
        metrics: SimplePerformanceMetrics;
    };
    resetPerformanceMetrics(): void;
    createRole(definition: any): string;
    assignRoleToAgent(roleId: string, agentId: string): string;
    sendMessage(from: string, to: string, content: any, type?: any): Promise<string>;
    createCommunicationChannel(name: string, participants: string[], type?: any): string;
}
export default MJOS;
//# sourceMappingURL=index.d.ts.map