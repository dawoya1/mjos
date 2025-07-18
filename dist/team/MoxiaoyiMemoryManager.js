"use strict";
/**
 * 莫小忆 - 记忆管理专家系统
 * Moxiaoyi - Memory Management Expert System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoxiaoyiMemoryManager = void 0;
class MoxiaoyiMemoryManager {
    constructor(mjos) {
        this.memoryIndex = new Map();
        this.tagIndex = new Map();
        this.projectIndex = new Map();
        this.mjos = mjos;
    }
    /**
     * 智能记忆存储 - 莫小忆的核心功能
     */
    async storeMemory(content, options = {}) {
        const memoryId = this.generateMemoryId(options.category || 'knowledge', options.projectId);
        // 智能标签提取
        const extractedTags = this.extractSmartTags(content);
        const allTags = [...(options.tags || []), ...extractedTags];
        // 智能重要性评估
        const importance = options.importance || this.assessImportance(content, allTags);
        const memoryRecord = {
            id: memoryId,
            content,
            tags: allTags,
            importance,
            timestamp: new Date(),
            projectId: options.projectId,
            category: options.category || 'knowledge',
            source: options.source || 'moxiaoyi',
            relatedMemories: this.findRelatedMemories(content, allTags)
        };
        // 存储到MJOS记忆系统
        this.mjos.remember(content, { tags: allTags, importance });
        // 建立索引
        this.memoryIndex.set(memoryId, memoryRecord);
        this.updateIndexes(memoryRecord);
        return memoryId;
    }
    /**
     * 智能记忆检索
     */
    async recallMemories(query) {
        let results = Array.from(this.memoryIndex.values());
        // 内容匹配
        if (query.content) {
            results = results.filter(memory => memory.content.toLowerCase().includes(query.content.toLowerCase()));
        }
        // 标签匹配
        if (query.tags && query.tags.length > 0) {
            results = results.filter(memory => query.tags.some(tag => memory.tags.includes(tag)));
        }
        // 项目匹配
        if (query.projectId) {
            results = results.filter(memory => memory.projectId === query.projectId);
        }
        // 分类匹配
        if (query.category) {
            results = results.filter(memory => memory.category === query.category);
        }
        // 时间范围匹配
        if (query.timeRange) {
            results = results.filter(memory => memory.timestamp >= query.timeRange.start &&
                memory.timestamp <= query.timeRange.end);
        }
        // 重要性匹配
        if (query.importance) {
            results = results.filter(memory => memory.importance >= query.importance.min &&
                memory.importance <= query.importance.max);
        }
        // 按重要性和时间排序
        results.sort((a, b) => {
            const importanceDiff = b.importance - a.importance;
            if (importanceDiff !== 0)
                return importanceDiff;
            return b.timestamp.getTime() - a.timestamp.getTime();
        });
        return results.slice(0, query.limit || 20);
    }
    /**
     * 生成会议纪要
     */
    async generateMeetingMinutes(meetingData) {
        const minutesId = this.generateMemoryId('meeting');
        const minutes = {
            id: minutesId,
            title: meetingData.title,
            date: new Date(),
            participants: meetingData.participants,
            agenda: this.extractAgenda(meetingData.discussions),
            discussions: meetingData.discussions.map((discussion, index) => ({
                topic: `讨论主题 ${index + 1}`,
                speaker: meetingData.participants[index % meetingData.participants.length],
                content: discussion,
                decisions: meetingData.decisions.filter(d => d.includes(discussion.substring(0, 20)))
            })),
            actionItems: meetingData.actionItems.map(item => ({
                ...item,
                status: 'pending'
            })),
            summary: this.generateMeetingSummary(meetingData)
        };
        // 存储会议纪要到记忆系统
        await this.storeMemory(`会议纪要: ${minutes.title}\n${minutes.summary}`, {
            tags: ['会议', '纪要', ...meetingData.participants],
            category: 'meeting',
            importance: 0.8,
            source: 'meeting-minutes'
        });
        return minutes;
    }
    /**
     * 生成档案报告
     */
    async generateArchiveReport(period) {
        const memories = await this.recallMemories({
            timeRange: period
        });
        const categorySummary = {};
        memories.forEach(memory => {
            categorySummary[memory.category] = (categorySummary[memory.category] || 0) + 1;
        });
        const keyInsights = this.extractKeyInsights(memories);
        const recommendations = this.generateRecommendations(memories);
        const report = {
            id: this.generateMemoryId('summary'),
            title: `档案报告 ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`,
            period,
            totalMemories: memories.length,
            categorySummary,
            keyInsights,
            recommendations,
            generatedAt: new Date()
        };
        // 存储报告到记忆系统
        await this.storeMemory(`档案报告: ${report.title}\n关键洞察: ${keyInsights.join('; ')}`, {
            tags: ['档案', '报告', '总结'],
            category: 'summary',
            importance: 0.9,
            source: 'archive-report'
        });
        return report;
    }
    /**
     * 智能标签提取
     */
    extractSmartTags(content) {
        const tags = [];
        // 技术关键词
        const techKeywords = ['API', '数据库', '前端', '后端', '测试', '部署', '安全', '性能'];
        techKeywords.forEach(keyword => {
            if (content.includes(keyword)) {
                tags.push(keyword);
            }
        });
        // 项目关键词
        const projectKeywords = ['需求', '设计', '开发', '测试', '发布', '维护'];
        projectKeywords.forEach(keyword => {
            if (content.includes(keyword)) {
                tags.push(keyword);
            }
        });
        // 团队成员名字
        const memberNames = ['莫小智', '莫小美', '莫小码', '莫小仓', '莫小创', '莫小测', '莫小研', '莫小运', '莫小安', '莫小忆'];
        memberNames.forEach(name => {
            if (content.includes(name)) {
                tags.push(name);
            }
        });
        return [...new Set(tags)]; // 去重
    }
    /**
     * 智能重要性评估
     */
    assessImportance(content, tags) {
        let importance = 0.5; // 基础重要性
        // 根据内容长度调整
        if (content.length > 500)
            importance += 0.1;
        if (content.length > 1000)
            importance += 0.1;
        // 根据标签数量调整
        importance += Math.min(tags.length * 0.05, 0.2);
        // 关键词权重
        const highImportanceKeywords = ['紧急', '重要', '决策', '问题', '风险', '关键'];
        highImportanceKeywords.forEach(keyword => {
            if (content.includes(keyword)) {
                importance += 0.1;
            }
        });
        return Math.min(importance, 1.0);
    }
    /**
     * 查找相关记忆
     */
    findRelatedMemories(content, tags) {
        const related = [];
        this.memoryIndex.forEach((memory, id) => {
            // 标签匹配
            const commonTags = tags.filter(tag => memory.tags.includes(tag));
            if (commonTags.length > 0) {
                related.push(id);
            }
            // 内容相似性（简化版）
            const contentWords = content.toLowerCase().split(' ');
            const memoryWords = memory.content.toLowerCase().split(' ');
            const commonWords = contentWords.filter(word => memoryWords.includes(word));
            if (commonWords.length > 3) {
                related.push(id);
            }
        });
        return [...new Set(related)].slice(0, 5); // 最多5个相关记忆
    }
    /**
     * 更新索引
     */
    updateIndexes(memory) {
        // 更新标签索引
        if (memory.tags && Array.isArray(memory.tags)) {
            memory.tags.forEach(tag => {
                if (!this.tagIndex.has(tag)) {
                    this.tagIndex.set(tag, new Set());
                }
                this.tagIndex.get(tag).add(memory.id);
            });
        }
        // 更新项目索引
        if (memory.projectId) {
            if (!this.projectIndex.has(memory.projectId)) {
                this.projectIndex.set(memory.projectId, new Set());
            }
            this.projectIndex.get(memory.projectId).add(memory.id);
        }
    }
    /**
     * 生成记忆ID
     */
    generateMemoryId(category, projectId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        if (projectId) {
            return `mem_${category}_${projectId}_${timestamp}_${random}`;
        }
        return `mem_${category}_${timestamp}_${random}`;
    }
    // 辅助方法
    extractAgenda(discussions) {
        return discussions.map((d, i) => `议题${i + 1}: ${d.substring(0, 50)}...`);
    }
    generateMeetingSummary(meetingData) {
        return `会议讨论了${meetingData.discussions.length}个主题，做出了${meetingData.decisions.length}个决策，分配了${meetingData.actionItems.length}个行动项。`;
    }
    extractKeyInsights(memories) {
        // 简化的洞察提取
        const insights = [];
        const categories = [...new Set(memories.map(m => m.category))];
        categories.forEach(category => {
            const count = memories.filter(m => m.category === category).length;
            insights.push(`${category}类记忆共${count}条，占比${(count / memories.length * 100).toFixed(1)}%`);
        });
        return insights;
    }
    generateRecommendations(memories) {
        return [
            '建议定期整理和归档重要记忆',
            '加强项目相关记忆的关联性',
            '提高记忆标签的标准化程度'
        ];
    }
}
exports.MoxiaoyiMemoryManager = MoxiaoyiMemoryManager;
exports.default = MoxiaoyiMemoryManager;
//# sourceMappingURL=MoxiaoyiMemoryManager.js.map