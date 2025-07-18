/**
 * MJOS个人工具管理器 - 每个成员的专业工具库
 * Personal Tool Manager - Professional Tool Library for Each Member
 */
export interface Tool {
    id: string;
    name: string;
    category: 'mcp' | 'local' | 'api' | 'script';
    description: string;
    version: string;
    author: string;
    tags: string[];
    config: ToolConfig;
    dependencies: Dependency[];
    usage: ToolUsage;
    status: ToolStatus;
}
export interface ToolConfig {
    mcpEndpoint?: string;
    mcpProtocol?: string;
    executablePath?: string;
    workingDirectory?: string;
    environment?: Record<string, string>;
    apiEndpoint?: string;
    apiKey?: string;
    headers?: Record<string, string>;
    scriptPath?: string;
    interpreter?: string;
    arguments?: string[];
    timeout?: number;
    retryCount?: number;
    customSettings?: Record<string, any>;
}
export interface Dependency {
    name: string;
    version: string;
    type: 'npm' | 'pip' | 'system' | 'binary';
    required: boolean;
    installCommand?: string;
    checkCommand?: string;
}
export interface ToolUsage {
    totalInvocations: number;
    successfulInvocations: number;
    failedInvocations: number;
    averageExecutionTime: number;
    lastUsed: Date;
    usageHistory: Array<{
        timestamp: Date;
        duration: number;
        success: boolean;
        context: string;
        result?: any;
        error?: string;
    }>;
}
export interface ToolStatus {
    installed: boolean;
    enabled: boolean;
    healthy: boolean;
    lastHealthCheck: Date;
    issues: string[];
    performance: {
        reliability: number;
        speed: number;
        resourceUsage: number;
    };
}
export interface ToolInvocation {
    toolId: string;
    parameters: Record<string, any>;
    context: string;
    timeout?: number;
}
export interface ToolResult {
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
    metadata?: Record<string, any>;
}
export declare class PersonalToolManager {
    private memberId;
    private tools;
    private categoryIndex;
    private tagIndex;
    constructor(memberId: string);
    /**
     * 安装工具
     */
    installTool(toolDefinition: Omit<Tool, 'id' | 'usage' | 'status'>): Promise<boolean>;
    /**
     * 调用工具
     */
    invokeTool(invocation: ToolInvocation): Promise<ToolResult>;
    /**
     * 获取工具列表
     */
    getTools(filter?: {
        category?: string;
        tags?: string[];
        enabled?: boolean;
        healthy?: boolean;
    }): Tool[];
    /**
     * 推荐工具
     */
    recommendTools(context: {
        task: string;
        domain: string;
        requirements: string[];
    }): Tool[];
    /**
     * 生成工具使用报告
     */
    generateUsageReport(): string;
    private loadPersonalTools;
    private startHealthMonitoring;
    private generateToolId;
    private checkDependencies;
    private checkSingleDependency;
    private performInstallation;
    private performHealthCheck;
    private updateUsageStats;
    private updateIndexes;
    private updatePerformanceMetrics;
    private getCategoryDistribution;
    private generateOptimizationSuggestions;
    private installMCPTool;
    private installLocalTool;
    private installAPITool;
    private installScriptTool;
    private invokeMCPTool;
    private invokeLocalTool;
    private invokeAPITool;
    private invokeScriptTool;
    private checkMCPToolHealth;
    private checkLocalToolHealth;
    private checkAPIToolHealth;
    private checkScriptToolHealth;
}
export default PersonalToolManager;
//# sourceMappingURL=PersonalToolManager.d.ts.map