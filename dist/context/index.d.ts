/**
 * MJOS Context Management System
 * 魔剑工作室操作系统上下文管理系统
 */
import { EventEmitter } from 'events';
import { ContextSession, ContextState, ContextMessage } from '../types/index';
export interface ContextManagerOptions {
    maxSessions?: number;
    sessionTimeout?: number;
    compressionThreshold?: number;
    persistencePath?: string;
    enableCompression?: boolean;
    enableSharing?: boolean;
}
export interface ContextCompressionResult {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    summary: string;
    keyPoints: string[];
}
export declare class ContextManager extends EventEmitter {
    private sessions;
    private sharedContexts;
    private logger;
    private options;
    private cleanupInterval?;
    constructor(options?: ContextManagerOptions);
    createSession(userIdOrSessionId?: string): string;
    getSession(sessionId: string): ContextSession | undefined;
    updateSession(sessionId: string, updates: Partial<ContextState>): boolean;
    addMessage(sessionId: string, message: Omit<ContextMessage, 'id' | 'timestamp'>): boolean;
    getConversationHistory(sessionId: string, limit?: number): ContextMessage[];
    setWorkingMemory(sessionId: string, key: string, value: any): boolean;
    getWorkingMemory(sessionId: string, key?: string): any;
    private defaultSessionId;
    set(key: string, value: any): void;
    get(key: string): any;
    getAll(): any;
    shareContext(fromSessionId: string, toSessionId: string, contextKey: string): boolean;
    private compressConversationHistory;
    private generateSummary;
    private extractKeyPoints;
    restoreContext(sessionId: string): boolean;
    deleteSession(sessionId: string): boolean;
    private cleanup;
    private evictOldestSession;
    private startCleanupTimer;
    private generateSessionId;
    private generateMessageId;
    getStats(): {
        totalSessions: number;
        activeSessions: number;
        totalMessages: number;
        averageMessagesPerSession: number;
        compressionEvents: number;
    };
    save(): void;
    load(): void;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map