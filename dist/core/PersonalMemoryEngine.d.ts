/**
 * MJOS个人记忆引擎 - 每个成员的独立记忆系统
 * Personal Memory Engine - Independent Memory System for Each Member
 */
export interface PersonalExperience {
    id: string;
    timestamp: Date;
    type: 'project' | 'problem-solving' | 'learning' | 'collaboration' | 'decision';
    title: string;
    description: string;
    context: Record<string, any>;
    outcome: string;
    lessons: string[];
    emotions: string[];
    importance: number;
    tags: string[];
    relatedExperiences: string[];
}
export interface SkillEvolution {
    skillName: string;
    initialLevel: number;
    currentLevel: number;
    evolutionHistory: Array<{
        timestamp: Date;
        level: number;
        trigger: string;
        evidence: string;
    }>;
    practiceHours: number;
    projectsApplied: string[];
    mentorFeedback: string[];
}
export interface LearningMilestone {
    id: string;
    timestamp: Date;
    topic: string;
    source: string;
    learningMethod: 'reading' | 'practice' | 'mentoring' | 'experimentation' | 'collaboration';
    knowledgeGained: string;
    skillsImproved: string[];
    applicationPlan: string;
    validationResult?: string;
    confidence: number;
    retention: number;
}
export interface CollaborationMemory {
    id: string;
    timestamp: Date;
    collaborators: string[];
    project: string;
    role: string;
    contributions: string[];
    challenges: string[];
    resolutions: string[];
    feedback: Array<{
        from: string;
        content: string;
        sentiment: 'positive' | 'neutral' | 'negative';
    }>;
    learnings: string[];
    relationshipImpact: Record<string, number>;
}
export declare class PersonalMemoryEngine {
    private memberId;
    private experiences;
    private skillEvolutions;
    private learningMilestones;
    private collaborationMemories;
    private memoryIndex;
    constructor(memberId: string);
    /**
     * 记录个人经验
     */
    recordExperience(experience: Omit<PersonalExperience, 'id' | 'timestamp'>): string;
    /**
     * 记录技能进化
     */
    recordSkillEvolution(skillName: string, newLevel: number, trigger: string, evidence: string): void;
    /**
     * 记录学习里程碑
     */
    recordLearningMilestone(milestone: Omit<LearningMilestone, 'id' | 'timestamp'>): string;
    /**
     * 记录协作记忆
     */
    recordCollaboration(collaboration: Omit<CollaborationMemory, 'id' | 'timestamp'>): string;
    /**
     * 检索个人记忆
     */
    recallMemories(query: {
        type?: string;
        tags?: string[];
        timeRange?: {
            start: Date;
            end: Date;
        };
        importance?: {
            min: number;
            max: number;
        };
        limit?: number;
    }): Array<PersonalExperience | LearningMilestone | CollaborationMemory>;
    /**
     * 获取技能成长轨迹
     */
    getSkillGrowthTrajectory(skillName?: string): SkillEvolution[];
    /**
     * 分析个人成长模式
     */
    analyzeGrowthPatterns(): {
        learningVelocity: number;
        preferredLearningMethods: string[];
        skillGrowthRate: Record<string, number>;
        collaborationEffectiveness: number;
        knowledgeRetention: number;
    };
    /**
     * 生成个人成长报告
     */
    generateGrowthReport(): string;
    private loadPersonalMemories;
    private generateId;
    private updateIndex;
    private findRelatedExperiences;
    private matchesQuery;
    private calculateCollaborationEffectiveness;
    private calculateKnowledgeRetention;
    private generateGrowthRecommendations;
}
export default PersonalMemoryEngine;
//# sourceMappingURL=PersonalMemoryEngine.d.ts.map