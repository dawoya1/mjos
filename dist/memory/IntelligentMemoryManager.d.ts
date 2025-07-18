import { EventEmitter } from 'events';
import { MemoryItem } from './index';
/**
 * 记忆类型枚举
 */
export declare enum MemoryType {
    LONG_TERM = "long_term",// 长期记忆
    WORKING = "working"
}
/**
 * 记忆分类规则
 */
export interface MemoryClassificationRule {
    name: string;
    condition: (content: string, tags?: string[]) => boolean;
    memoryType: MemoryType;
    importance: number;
    autoStore: boolean;
}
/**
 * 深度思考方法枚举
 */
export declare enum ThinkingMethod {
    MCKINSEY_7_STEPS = "mckinsey_7_steps",
    GLOBAL_OVERVIEW = "global_overview",
    CONTRADICTION_ANALYSIS = "contradiction_analysis"
}
/**
 * 智能记忆管理器
 * 实现记忆系统分层策略和自动调用机制
 */
export declare class IntelligentMemoryManager extends EventEmitter {
    private logger;
    private longTermMemory;
    private workingMemory;
    private classificationRules;
    private autoRetrievalEnabled;
    constructor();
    /**
     * 初始化分类规则
     */
    private initializeClassificationRules;
    /**
     * 智能存储记忆
     * 根据分层策略自动分类和存储
     */
    smartStore(content: string, options?: {
        tags?: string[];
        importance?: number;
        forceType?: MemoryType;
    }): Promise<string>;
    /**
     * 分类记忆
     */
    private classifyMemory;
    /**
     * 自动检索相关记忆
     * 根据查询内容智能检索相关信息
     */
    autoRetrieve(query: string, context?: {
        includeWorkingMemory?: boolean;
        maxResults?: number;
        minImportance?: number;
    }): Promise<MemoryItem[]>;
    /**
     * 提取关键词
     */
    private extractKeywords;
    /**
     * 排序结果
     */
    private rankResults;
    /**
     * 计算相关性得分
     */
    private calculateRelevanceScore;
    /**
     * 深度思考
     * 集成麦肯锡七步法、纵览全局法、矛盾分析法
     */
    deepThink(problem: string, method?: ThinkingMethod): Promise<{
        analysis: string;
        solution: string;
        relatedMemories: MemoryItem[];
    }>;
    /**
     * 应用麦肯锡七步法
     */
    private applyMcKinsey7Steps;
    /**
     * 应用纵览全局法
     */
    private applyGlobalOverview;
    /**
     * 应用矛盾分析法
     */
    private applyContradictionAnalysis;
    /**
     * 清理工作记忆
     * 定期清理过期的工作记忆
     */
    cleanupWorkingMemory(maxAge?: number): Promise<number>;
    /**
     * 获取记忆统计
     */
    getMemoryStats(): {
        longTerm: {
            total: number;
            avgImportance: number;
        };
        working: {
            total: number;
            avgImportance: number;
        };
    };
    /**
     * 启用/禁用自动检索
     */
    setAutoRetrievalEnabled(enabled: boolean): void;
    /**
     * 销毁管理器
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=IntelligentMemoryManager.d.ts.map