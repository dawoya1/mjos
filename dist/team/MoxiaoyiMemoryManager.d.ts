/**
 * 莫小忆 - 记忆管理专家系统
 * Moxiaoyi - Memory Management Expert System
 */
import { MJOS } from '../index';
export interface MemoryRecord {
    id: string;
    content: string;
    tags: string[];
    importance: number;
    timestamp: Date;
    projectId?: string;
    category: 'meeting' | 'decision' | 'knowledge' | 'task' | 'insight' | 'summary';
    source: string;
    relatedMemories: string[];
}
export interface MeetingMinutes {
    id: string;
    title: string;
    date: Date;
    participants: string[];
    agenda: string[];
    discussions: Array<{
        topic: string;
        speaker: string;
        content: string;
        decisions: string[];
    }>;
    actionItems: Array<{
        task: string;
        assignee: string;
        deadline: Date;
        status: 'pending' | 'in-progress' | 'completed';
    }>;
    summary: string;
}
export interface ArchiveReport {
    id: string;
    title: string;
    period: {
        start: Date;
        end: Date;
    };
    totalMemories: number;
    categorySummary: Record<string, number>;
    keyInsights: string[];
    recommendations: string[];
    generatedAt: Date;
}
export declare class MoxiaoyiMemoryManager {
    private mjos;
    private memoryIndex;
    private tagIndex;
    private projectIndex;
    constructor(mjos: MJOS);
    /**
     * 智能记忆存储 - 莫小忆的核心功能
     */
    storeMemory(content: string, options?: {
        tags?: string[];
        importance?: number;
        projectId?: string;
        category?: MemoryRecord['category'];
        source?: string;
    }): Promise<string>;
    /**
     * 智能记忆检索
     */
    recallMemories(query: {
        content?: string;
        tags?: string[];
        projectId?: string;
        category?: MemoryRecord['category'];
        timeRange?: {
            start: Date;
            end: Date;
        };
        importance?: {
            min: number;
            max: number;
        };
        limit?: number;
    }): Promise<MemoryRecord[]>;
    /**
     * 生成会议纪要
     */
    generateMeetingMinutes(meetingData: {
        title: string;
        participants: string[];
        discussions: string[];
        decisions: string[];
        actionItems: Array<{
            task: string;
            assignee: string;
            deadline: Date;
        }>;
    }): Promise<MeetingMinutes>;
    /**
     * 生成档案报告
     */
    generateArchiveReport(period: {
        start: Date;
        end: Date;
    }): Promise<ArchiveReport>;
    /**
     * 智能标签提取
     */
    private extractSmartTags;
    /**
     * 智能重要性评估
     */
    private assessImportance;
    /**
     * 查找相关记忆
     */
    private findRelatedMemories;
    /**
     * 更新索引
     */
    private updateIndexes;
    /**
     * 生成记忆ID
     */
    private generateMemoryId;
    private extractAgenda;
    private generateMeetingSummary;
    private extractKeyInsights;
    private generateRecommendations;
}
export default MoxiaoyiMemoryManager;
//# sourceMappingURL=MoxiaoyiMemoryManager.d.ts.map