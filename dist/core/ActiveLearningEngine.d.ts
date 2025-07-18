/**
 * MJOS主动学习引擎 - 让AI成员具备主动学习和自我成长能力
 * Active Learning Engine - Enable AI Members with Proactive Learning and Self-Growth
 */
import PersonalMemoryEngine from './PersonalMemoryEngine';
export interface LearningOpportunity {
    id: string;
    type: 'github-project' | 'documentation' | 'tutorial' | 'research-paper' | 'community-discussion';
    title: string;
    description: string;
    url: string;
    relevanceScore: number;
    estimatedLearningTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    tags: string[];
    prerequisites: string[];
    learningObjectives: string[];
}
export interface GitHubProjectAnalysis {
    repoUrl: string;
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    lastUpdate: Date;
    codeStructure: {
        directories: string[];
        mainFiles: string[];
        architecturePattern: string;
        designPatterns: string[];
    };
    techStack: {
        frameworks: string[];
        libraries: string[];
        tools: string[];
        databases: string[];
    };
    bestPractices: Array<{
        category: string;
        practice: string;
        example: string;
        reasoning: string;
    }>;
    innovations: Array<{
        aspect: string;
        innovation: string;
        impact: string;
        applicability: string;
    }>;
    learningValue: {
        technicalDepth: number;
        practicalUtility: number;
        innovationLevel: number;
        codeQuality: number;
        overallScore: number;
    };
}
export interface LearningPlan {
    id: string;
    title: string;
    objective: string;
    duration: number;
    phases: LearningPhase[];
    prerequisites: string[];
    expectedOutcomes: string[];
    successMetrics: string[];
}
export interface LearningPhase {
    name: string;
    duration: number;
    activities: LearningActivity[];
    milestones: string[];
}
export interface LearningActivity {
    type: 'study' | 'practice' | 'experiment' | 'build' | 'review';
    description: string;
    resources: string[];
    estimatedTime: number;
    deliverables: string[];
}
export interface SelfCritique {
    timestamp: Date;
    aspect: 'knowledge' | 'skills' | 'performance' | 'collaboration' | 'learning';
    currentLevel: number;
    targetLevel: number;
    gaps: string[];
    strengths: string[];
    improvementPlan: string[];
    timeline: string;
}
export declare class ActiveLearningEngine {
    private memberId;
    private domain;
    private memoryEngine;
    private learningHistory;
    private knowledgeGaps;
    private learningGoals;
    constructor(memberId: string, domain: string, memoryEngine: PersonalMemoryEngine);
    /**
     * 主动发现学习机会
     */
    discoverLearningOpportunities(): Promise<LearningOpportunity[]>;
    /**
     * 分析GitHub项目
     */
    analyzeGitHubProject(repoUrl: string): Promise<GitHubProjectAnalysis>;
    /**
     * 制定学习计划
     */
    createLearningPlan(objective: string, timeframe: number): LearningPlan;
    /**
     * 执行自我批判
     */
    performSelfCritique(): Promise<SelfCritique[]>;
    /**
     * 消化学习内容
     */
    digestLearning(content: {
        source: string;
        type: string;
        rawContent: any;
        context: string;
    }): Promise<{
        keyInsights: string[];
        practicalApplications: string[];
        relatedConcepts: string[];
        actionItems: string[];
    }>;
    /**
     * 跟踪技术趋势
     */
    trackTechnologyTrends(): Promise<{
        emergingTechnologies: string[];
        growingFrameworks: string[];
        industryShifts: string[];
        learningRecommendations: string[];
    }>;
    private initializeLearningSystem;
    private loadLearningHistory;
    private identifyInitialKnowledgeGaps;
    private setInitialLearningGoals;
    private assessCurrentSkills;
    private getRequiredSkillsForDomain;
    private calculatePriority;
    private estimateTimeline;
    private findGapBasedOpportunities;
    private findTrendBasedOpportunities;
    private findGitHubLearningOpportunities;
    private findCommunityOpportunities;
    private fetchGitHubBasicInfo;
    private analyzeCodeStructure;
    private analyzeTechStack;
    private extractBestPractices;
    private identifyInnovations;
    private assessLearningValue;
    private identifyLearningPath;
    private createLearningPhases;
    private identifyPrerequisites;
    private defineExpectedOutcomes;
    private defineSuccessMetrics;
    private analyzeAspect;
    private extractKeyInsights;
    private identifyPracticalApplications;
    private findRelatedConcepts;
    private generateActionItems;
    private integrateKnowledge;
    private analyzeTrendData;
    private identifyEmergingTechnologies;
    private identifyGrowingFrameworks;
    private identifyIndustryShifts;
    private generateTrendBasedRecommendations;
}
export default ActiveLearningEngine;
//# sourceMappingURL=ActiveLearningEngine.d.ts.map