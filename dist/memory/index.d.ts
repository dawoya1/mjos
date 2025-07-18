/**
 * MJOS Memory System - Multi-layered Memory Architecture
 * 魔剑工作室操作系统记忆系统 - 多层次记忆架构
 */
import { EventEmitter } from 'events';
export declare enum MemoryType {
    SHORT_TERM = "short_term",// 短期记忆 - 工作记忆，快速访问
    LONG_TERM = "long_term",// 长期记忆 - 持久化存储
    EPISODIC = "episodic",// 情景记忆 - 特定事件和经历
    PROCEDURAL = "procedural"
}
export interface MemoryItem {
    id: string;
    content: any;
    timestamp: Date;
    lastAccessed: Date;
    accessCount: number;
    tags?: string[];
    importance: number;
    type: MemoryType;
    metadata?: Record<string, any>;
    embedding?: number[];
    associations?: string[];
    decay?: number;
}
export interface MemoryQuery {
    tags?: string[];
    types?: MemoryType[];
    timeRange?: {
        start: Date;
        end: Date;
    };
    importance?: {
        min: number;
        max: number;
    };
    content?: string;
    limit?: number;
    sortBy?: 'timestamp' | 'importance' | 'relevance' | 'access_count';
    includeDecayed?: boolean;
}
export interface MemorySystemOptions {
    shortTermCapacity?: number;
    longTermCapacity?: number;
    decayRate?: number;
    consolidationThreshold?: number;
    enableSemantic?: boolean;
    persistencePath?: string;
}
export declare class MemorySystem extends EventEmitter {
    private shortTerm;
    private longTerm;
    private tagIndex;
    private typeIndex;
    private logger;
    private options;
    private consolidationTimer?;
    constructor(options?: MemorySystemOptions);
    private setupEventHandlers;
    private startConsolidationProcess;
    private consolidateMemories;
    store(content: any, tags?: string[], importance?: number, type?: MemoryType): string;
    retrieve(id: string): MemoryItem | undefined;
    query(query: MemoryQuery): MemoryItem[];
    private queryLayer;
    private applyFilters;
    private sortResults;
    delete(id: string): boolean;
    clear(): void;
    associate(id1: string, id2: string): boolean;
    getAssociations(id: string): MemoryItem[];
    applyDecay(): void;
    getStats(): {
        totalMemories: number;
        shortTermCount: number;
        longTermCount: number;
        totalTags: number;
        averageImportance: number;
        memoryTypes: Record<MemoryType, number>;
    };
    private updateIndices;
    private removeFromIndices;
    private generateId;
    destroy(): void;
}
export { IntelligentMemoryManager, MemoryType as IntelligentMemoryType, ThinkingMethod, type MemoryClassificationRule } from './IntelligentMemoryManager';
//# sourceMappingURL=index.d.ts.map