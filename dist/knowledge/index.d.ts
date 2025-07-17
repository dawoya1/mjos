/**
 * MJOS Knowledge Management System
 * 魔剑工作室操作系统知识管理系统
 */
import { EventEmitter } from 'events';
import { KnowledgeItem, KnowledgeType, RelationshipType } from '../types/index';
export interface KnowledgeQuery {
    type?: KnowledgeType[];
    tags?: string[];
    domain?: string;
    content?: string;
    minConfidence?: number;
    minImportance?: number;
    limit?: number;
    includeRelated?: boolean;
}
export interface KnowledgeGraphOptions {
    maxNodes?: number;
    enableSemanticSearch?: boolean;
    persistencePath?: string;
    autoSave?: boolean;
    compressionEnabled?: boolean;
}
export declare class KnowledgeGraph extends EventEmitter {
    private knowledge;
    private typeIndex;
    private tagIndex;
    private domainIndex;
    private relationshipIndex;
    private logger;
    private options;
    constructor(options?: KnowledgeGraphOptions);
    private initializeIndices;
    add(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): string;
    update(id: string, updates: Partial<KnowledgeItem>): boolean;
    get(id: string): KnowledgeItem | undefined;
    delete(id: string): boolean;
    query(query: KnowledgeQuery): KnowledgeItem[];
    addRelationship(fromId: string, toId: string, type: RelationshipType, strength?: number): boolean;
    getRelated(id: string, maxDepth?: number): KnowledgeItem[];
    private updateIndices;
    private removeFromIndices;
    private removeRelationshipsTo;
    private evictLeastImportant;
    private generateId;
    save(): void;
    load(): void;
    getStats(): {
        totalItems: number;
        byType: Record<KnowledgeType, number>;
        byDomain: Record<string, number>;
        totalRelationships: number;
        averageConfidence: number;
        averageImportance: number;
    };
    clear(): void;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map