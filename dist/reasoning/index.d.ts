/**
 * MJOS Reasoning Engine
 * 魔剑工作室操作系统推理引擎
 */
import { EventEmitter } from 'events';
import { ReasoningRequest, ReasoningResult } from '../types/index';
export interface Rule {
    id: string;
    name: string;
    condition: (context: any) => boolean;
    action: (context: any) => any;
    confidence: number;
    priority: number;
    metadata?: Record<string, any>;
}
export interface ReasoningEngineOptions {
    maxSteps?: number;
    timeout?: number;
    enableProbabilistic?: boolean;
    enableLearning?: boolean;
    confidenceThreshold?: number;
}
export declare class ReasoningEngine extends EventEmitter {
    private rules;
    private facts;
    private logger;
    private options;
    private activeRequests;
    constructor(options?: ReasoningEngineOptions);
    addRule(rule: Omit<Rule, 'id'>): string;
    removeRule(ruleId: string): boolean;
    addFact(key: string, value: any): void;
    removeFact(key: string): boolean;
    reason(request: ReasoningRequest): Promise<ReasoningResult>;
    private performReasoning;
    private deductiveReasoning;
    private inductiveReasoning;
    private abductiveReasoning;
    private analogicalReasoning;
    private causalReasoning;
    private probabilisticReasoning;
    private findPatterns;
    private calculateExplanationLikelihood;
    private findSimilarities;
    private applyAnalogy;
    private findCausalChains;
    private calculateLikelihood;
    private calculateNormalizationConstant;
    private generateAlternatives;
    private generateRuleId;
    private generateResultId;
    getStats(): {
        totalRules: number;
        totalFacts: number;
        activeRequests: number;
        completedReasoning: number;
    };
    clear(): void;
}
//# sourceMappingURL=index.d.ts.map