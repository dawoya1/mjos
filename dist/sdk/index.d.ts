/**
 * MJOS Software Development Kit
 * 魔剑工作室操作系统软件开发工具包
 */
export interface SDKOptions {
    apiEndpoint?: string;
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
    enableLogging?: boolean;
}
export interface SDKResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
    requestId?: string;
}
export interface CodeGeneratorOptions {
    language: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp';
    outputPath?: string;
    includeTypes?: boolean;
    includeExamples?: boolean;
    packageName?: string;
}
export interface DocumentationOptions {
    format: 'markdown' | 'html' | 'pdf';
    outputPath?: string;
    includeExamples?: boolean;
    includeAPI?: boolean;
    theme?: string;
}
export declare class MJOSSDK {
    private options;
    private logger;
    private mjos?;
    constructor(options?: SDKOptions);
    storeMemory(content: any, tags?: string[], importance?: number, type?: string): Promise<string>;
    queryMemory(query: any): Promise<any[]>;
    getMemory(id: string): Promise<any>;
    addKnowledge(knowledgeData: any): Promise<string>;
    searchKnowledge(query: any): Promise<any[]>;
    createSession(userId?: string): Promise<string>;
    getSession(sessionId: string): Promise<any>;
    addMessage(sessionId: string, role: string, content: string): Promise<boolean>;
    reason(type: string, input: any, context?: any): Promise<any>;
    getTeamMembers(): Promise<any[]>;
    createTask(title: string, description: string): Promise<string>;
    getTasks(): Promise<any[]>;
    getPerformanceMetrics(): Promise<any>;
    getPerformanceSummary(): Promise<any>;
    getSystemStatus(): Promise<any>;
    executeWorkflow(workflowId: string, variables?: Record<string, any>): Promise<string>;
    createAgent(definition: any): Promise<string>;
    assignTaskToAgent(taskId: string, agentId?: string): Promise<string>;
    sendMessage(from: string, to: string, content: any, type?: string): Promise<string>;
    createChannel(name: string, participants: string[], type?: string): Promise<string>;
    private makeAPICall;
    generateCode(options: CodeGeneratorOptions): string;
    private generateTypeScriptCode;
    private generateJavaScriptCode;
    private generatePythonCode;
    private generateJavaCode;
    private generateCSharpCode;
    generateDocumentation(options: DocumentationOptions): string;
    private generateMarkdownDocs;
    private generateHTMLDocs;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map