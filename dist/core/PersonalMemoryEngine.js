"use strict";
/**
 * MJOS个人记忆引擎 - 每个成员的独立记忆系统
 * Personal Memory Engine - Independent Memory System for Each Member
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalMemoryEngine = void 0;
class PersonalMemoryEngine {
    constructor(memberId) {
        this.experiences = new Map();
        this.skillEvolutions = new Map();
        this.learningMilestones = new Map();
        this.collaborationMemories = new Map();
        this.memoryIndex = new Map();
        this.memberId = memberId;
        this.loadPersonalMemories();
    }
    /**
     * 记录个人经验
     */
    recordExperience(experience) {
        const id = this.generateId('exp');
        const fullExperience = {
            id,
            timestamp: new Date(),
            ...experience
        };
        this.experiences.set(id, fullExperience);
        this.updateIndex('experience', experience.tags, id);
        this.findRelatedExperiences(fullExperience);
        return id;
    }
    /**
     * 记录技能进化
     */
    recordSkillEvolution(skillName, newLevel, trigger, evidence) {
        let evolution = this.skillEvolutions.get(skillName);
        if (!evolution) {
            evolution = {
                skillName,
                initialLevel: newLevel,
                currentLevel: newLevel,
                evolutionHistory: [],
                practiceHours: 0,
                projectsApplied: [],
                mentorFeedback: []
            };
        }
        evolution.evolutionHistory.push({
            timestamp: new Date(),
            level: newLevel,
            trigger,
            evidence
        });
        evolution.currentLevel = newLevel;
        this.skillEvolutions.set(skillName, evolution);
    }
    /**
     * 记录学习里程碑
     */
    recordLearningMilestone(milestone) {
        const id = this.generateId('learn');
        const fullMilestone = {
            id,
            timestamp: new Date(),
            ...milestone
        };
        this.learningMilestones.set(id, fullMilestone);
        this.updateIndex('learning', [milestone.topic], id);
        // 更新相关技能
        milestone.skillsImproved.forEach(skill => {
            const currentEvolution = this.skillEvolutions.get(skill);
            const newLevel = currentEvolution ? currentEvolution.currentLevel + 0.1 : 0.1;
            this.recordSkillEvolution(skill, newLevel, 'learning', `学习了${milestone.topic}`);
        });
        return id;
    }
    /**
     * 记录协作记忆
     */
    recordCollaboration(collaboration) {
        const id = this.generateId('collab');
        const fullCollaboration = {
            id,
            timestamp: new Date(),
            ...collaboration
        };
        this.collaborationMemories.set(id, fullCollaboration);
        this.updateIndex('collaboration', [collaboration.project, ...collaboration.collaborators], id);
        return id;
    }
    /**
     * 检索个人记忆
     */
    recallMemories(query) {
        const results = [];
        // 搜索经验记忆
        if (!query.type || query.type === 'experience') {
            this.experiences.forEach(exp => {
                if (this.matchesQuery(exp, query)) {
                    results.push(exp);
                }
            });
        }
        // 搜索学习记忆
        if (!query.type || query.type === 'learning') {
            this.learningMilestones.forEach(milestone => {
                if (this.matchesQuery(milestone, query)) {
                    results.push(milestone);
                }
            });
        }
        // 搜索协作记忆
        if (!query.type || query.type === 'collaboration') {
            this.collaborationMemories.forEach(collab => {
                if (this.matchesQuery(collab, query)) {
                    results.push(collab);
                }
            });
        }
        // 按重要性和时间排序
        results.sort((a, b) => {
            const importanceA = 'importance' in a ? a.importance : 0.5;
            const importanceB = 'importance' in b ? b.importance : 0.5;
            if (importanceA !== importanceB) {
                return importanceB - importanceA;
            }
            return b.timestamp.getTime() - a.timestamp.getTime();
        });
        return results.slice(0, query.limit || 20);
    }
    /**
     * 获取技能成长轨迹
     */
    getSkillGrowthTrajectory(skillName) {
        if (skillName) {
            const evolution = this.skillEvolutions.get(skillName);
            return evolution ? [evolution] : [];
        }
        return Array.from(this.skillEvolutions.values());
    }
    /**
     * 分析个人成长模式
     */
    analyzeGrowthPatterns() {
        const recentMilestones = Array.from(this.learningMilestones.values())
            .filter(m => m.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const learningVelocity = recentMilestones.length / 30; // 每天学习次数
        const methodCounts = new Map();
        recentMilestones.forEach(m => {
            methodCounts.set(m.learningMethod, (methodCounts.get(m.learningMethod) || 0) + 1);
        });
        const preferredLearningMethods = Array.from(methodCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);
        const skillGrowthRate = {};
        this.skillEvolutions.forEach((evolution, skill) => {
            if (evolution.evolutionHistory.length > 1) {
                const recent = evolution.evolutionHistory.slice(-5);
                const timeSpan = recent[recent.length - 1].timestamp.getTime() - recent[0].timestamp.getTime();
                const levelGrowth = recent[recent.length - 1].level - recent[0].level;
                skillGrowthRate[skill] = levelGrowth / (timeSpan / (24 * 60 * 60 * 1000)); // 每天成长率
            }
        });
        const collaborationEffectiveness = this.calculateCollaborationEffectiveness();
        const knowledgeRetention = this.calculateKnowledgeRetention();
        return {
            learningVelocity,
            preferredLearningMethods,
            skillGrowthRate,
            collaborationEffectiveness,
            knowledgeRetention
        };
    }
    /**
     * 生成个人成长报告
     */
    generateGrowthReport() {
        const patterns = this.analyzeGrowthPatterns();
        const totalExperiences = this.experiences.size;
        const totalLearnings = this.learningMilestones.size;
        const totalCollaborations = this.collaborationMemories.size;
        const skillCount = this.skillEvolutions.size;
        return `
🧠 ${this.memberId} 个人成长报告

📊 记忆统计:
• 个人经验: ${totalExperiences}条
• 学习里程碑: ${totalLearnings}条
• 协作记忆: ${totalCollaborations}条
• 技能追踪: ${skillCount}项

📈 成长模式分析:
• 学习速度: ${patterns.learningVelocity.toFixed(2)}次/天
• 偏好学习方式: ${patterns.preferredLearningMethods.join(', ')}
• 协作效果: ${(patterns.collaborationEffectiveness * 100).toFixed(1)}%
• 知识保持率: ${(patterns.knowledgeRetention * 100).toFixed(1)}%

🚀 技能成长率:
${Object.entries(patterns.skillGrowthRate)
            .map(([skill, rate]) => `• ${skill}: ${rate.toFixed(3)}/天`)
            .join('\n')}

💡 成长建议:
${this.generateGrowthRecommendations(patterns).join('\n')}
    `;
    }
    // 私有方法
    loadPersonalMemories() {
        // 从持久化存储加载个人记忆
        // 实际实现中应该从数据库或文件系统加载
    }
    generateId(prefix) {
        return `${prefix}_${this.memberId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    updateIndex(category, tags, id) {
        tags.forEach(tag => {
            const key = `${category}:${tag}`;
            if (!this.memoryIndex.has(key)) {
                this.memoryIndex.set(key, new Set());
            }
            this.memoryIndex.get(key).add(id);
        });
    }
    findRelatedExperiences(experience) {
        // 基于标签和内容相似性查找相关经验
        const related = [];
        this.experiences.forEach((exp, id) => {
            if (id !== experience.id) {
                const commonTags = experience.tags.filter(tag => exp.tags.includes(tag));
                if (commonTags.length > 0) {
                    related.push(id);
                }
            }
        });
        experience.relatedExperiences = related.slice(0, 5);
    }
    matchesQuery(item, query) {
        // 时间范围匹配
        if (query.timeRange) {
            if (item.timestamp < query.timeRange.start || item.timestamp > query.timeRange.end) {
                return false;
            }
        }
        // 重要性匹配
        if (query.importance && 'importance' in item) {
            if (item.importance < query.importance.min || item.importance > query.importance.max) {
                return false;
            }
        }
        // 标签匹配
        if (query.tags && query.tags.length > 0) {
            const itemTags = item.tags || [];
            if (!query.tags.some((tag) => itemTags.includes(tag))) {
                return false;
            }
        }
        return true;
    }
    calculateCollaborationEffectiveness() {
        const collaborations = Array.from(this.collaborationMemories.values());
        if (collaborations.length === 0)
            return 0;
        const totalFeedback = collaborations.reduce((sum, collab) => {
            return sum + collab.feedback.filter(f => f.sentiment === 'positive').length;
        }, 0);
        const totalFeedbackCount = collaborations.reduce((sum, collab) => sum + collab.feedback.length, 0);
        return totalFeedbackCount > 0 ? totalFeedback / totalFeedbackCount : 0;
    }
    calculateKnowledgeRetention() {
        const milestones = Array.from(this.learningMilestones.values());
        if (milestones.length === 0)
            return 0;
        const avgRetention = milestones.reduce((sum, m) => sum + m.retention, 0) / milestones.length;
        return avgRetention;
    }
    generateGrowthRecommendations(patterns) {
        const recommendations = [];
        if (patterns.learningVelocity < 0.1) {
            recommendations.push('• 建议增加学习频率，设定每日学习目标');
        }
        if (patterns.collaborationEffectiveness < 0.7) {
            recommendations.push('• 建议加强团队协作技能，多参与协作项目');
        }
        if (patterns.knowledgeRetention < 0.8) {
            recommendations.push('• 建议加强知识实践应用，提高记忆保持率');
        }
        return recommendations;
    }
}
exports.PersonalMemoryEngine = PersonalMemoryEngine;
exports.default = PersonalMemoryEngine;
//# sourceMappingURL=PersonalMemoryEngine.js.map