/**
 * MJOS Model Context Protocol (MCP) Integration
 * 魔剑工作室操作系统模型上下文协议集成
 */
import { EventEmitter } from 'events';
import { ContextManager } from '../context/index';
import { KnowledgeGraph } from '../knowledge/index';
import { MemorySystem } from '../memory/index';
export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    metadata?: Record<string, any>;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
    handler: (args: any) => Promise<any>;
}
export interface MCPPrompt {
    name: string;
    description: string;
    arguments?: Array<{
        name: string;
        description: string;
        required?: boolean;
    }>;
    template: string;
}
export interface MCPServerCapabilities {
    resources?: {
        subscribe?: boolean;
        listChanged?: boolean;
    };
    tools?: {
        listChanged?: boolean;
    };
    prompts?: {
        listChanged?: boolean;
    };
    logging?: {
        level?: string;
    };
}
export interface MCPClientCapabilities {
    roots?: {
        listChanged?: boolean;
    };
    sampling?: {};
}
export interface MCPSession {
    id: string;
    clientId: string;
    serverCapabilities: MCPServerCapabilities;
    clientCapabilities: MCPClientCapabilities;
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
    createdAt: Date;
    lastActivity: Date;
    metadata: Record<string, any>;
}
export interface MCPManagerOptions {
    enableResourceSync?: boolean;
    enableToolSharing?: boolean;
    enablePromptSharing?: boolean;
    maxSessions?: number;
    syncInterval?: number;
}
export declare class MCPManager extends EventEmitter {
    private sessions;
    private resources;
    private tools;
    private prompts;
    private logger;
    private options;
    private contextManager;
    private knowledgeGraph;
    private memorySystem;
    private syncTimer?;
    constructor(options?: MCPManagerOptions, contextManager?: ContextManager, knowledgeGraph?: KnowledgeGraph, memorySystem?: MemorySystem);
    private initializeDefaultResources;
    private initializeDefaultTools;
    private initializeDefaultPrompts;
    createSession(clientId: string, clientCapabilities: MCPClientCapabilities): string;
    getSession(sessionId: string): MCPSession | undefined;
    closeSession(sessionId: string): boolean;
    listResources(_sessionId?: string): MCPResource[];
    getResource(uri: string): MCPResource | undefined;
    addResource(resource: MCPResource): void;
    listTools(_sessionId?: string): MCPTool[];
    getTool(name: string): MCPTool | undefined;
    callTool(name: string, args: any, sessionId?: string): Promise<any>;
    addTool(tool: MCPTool): void;
    listPrompts(_sessionId?: string): MCPPrompt[];
    getPrompt(name: string): MCPPrompt | undefined;
    renderPrompt(name: string, args?: Record<string, any>): string;
    addPrompt(prompt: MCPPrompt): void;
    syncContext(sessionId: string, contextData: any): Promise<void>;
    private getServerCapabilities;
    private startSyncTimer;
    private performPeriodicSync;
    private generateSessionId;
    getStats(): {
        totalSessions: number;
        activeSessions: number;
        totalResources: number;
        totalTools: number;
        totalPrompts: number;
    };
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map