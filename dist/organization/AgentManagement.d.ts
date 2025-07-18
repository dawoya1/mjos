/**
 * MJOS智能体管理系统 - 仿人力资源管理
 * Agent Management System - Mimicking Human Resource Management
 */
export interface AIAgent {
    id: string;
    name: string;
    role: string;
    department: string;
    expertise: string[];
    skills: Map<string, number>;
    certifications: string[];
    experience: number;
    status: 'available' | 'busy' | 'offline' | 'learning';
    currentTasks: string[];
    workload: number;
    performance: {
        productivity: number;
        quality: number;
        collaboration: number;
        innovation: number;
        reliability: number;
    };
    collaborationStyle: string;
    preferredTeamSize: number;
    workingHours: string;
    learningGoals: string[];
    mentorshipRole: 'mentor' | 'mentee' | 'peer';
    projectHistory: ProjectParticipation[];
    performanceHistory: PerformanceRecord[];
}
export interface ProjectRequirements {
    projectId: string;
    projectType: string;
    requiredSkills: string[];
    teamSize: number;
    duration: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    complexity: number;
    deadline: Date;
    budget?: number;
}
export interface TeamComposition {
    teamId: string;
    projectId: string;
    leader: AIAgent;
    members: AIAgent[];
    roles: Map<string, AIAgent>;
    formationReason: string;
    expectedSynergy: number;
    riskFactors: string[];
}
export interface ProjectParticipation {
    projectId: string;
    role: string;
    startDate: Date;
    endDate?: Date;
    contribution: string[];
    outcome: string;
    rating: number;
    feedback: string[];
}
export interface PerformanceRecord {
    period: string;
    metrics: {
        tasksCompleted: number;
        qualityScore: number;
        collaborationRating: number;
        innovationCount: number;
        learningProgress: number;
    };
    achievements: string[];
    improvements: string[];
    goals: string[];
}
export declare class AgentManagement {
    private agents;
    private teams;
    private skillMatrix;
    private departmentIndex;
    private performanceRankings;
    constructor();
    /**
     * 智能组队 - 根据项目需求组建最优团队
     */
    formOptimalTeam(requirements: ProjectRequirements): TeamComposition;
    /**
     * 专业匹配 - 根据任务类型找到最合适的专家
     */
    matchExpertise(taskType: string, count?: number): AIAgent[];
    /**
     * 负载均衡 - 平衡团队成员的工作负载
     */
    balanceWorkload(): {
        overloaded: AIAgent[];
        underutilized: AIAgent[];
        recommendations: string[];
    };
    /**
     * 绩效评估 - 全面评估成员表现
     */
    evaluatePerformance(agentId: string, period: string): PerformanceRecord;
    /**
     * 人才发展 - 制定成员发展计划
     */
    developTalent(agentId: string): {
        currentLevel: string;
        developmentPlan: string[];
        learningPath: string[];
        mentorRecommendation?: string;
        timeframe: string;
    };
    /**
     * 团队解散 - 项目完成后解散团队
     */
    disbandTeam(teamId: string): void;
    /**
     * 生成人力资源报告
     */
    generateHRReport(): string;
    private initializeAgents;
    private buildIndexes;
    private analyzeRequiredRoles;
    private findCandidatesForRoles;
    private optimizeTeamCombination;
    private selectTeamLeader;
    private assessTeamRisks;
    private calculateTeamSynergy;
    private assignRoles;
    private updateAgentStatus;
    private getRelevantSkills;
    private calculateExpertiseScore;
    private performLoadBalancing;
    private collectPerformanceMetrics;
    private identifyAchievements;
    private identifyImprovements;
    private setPerformanceGoals;
    private updatePerformanceRankings;
    private assessCurrentLevel;
    private createDevelopmentPlan;
    private designLearningPath;
    private recommendMentor;
    private estimateTimeframe;
    private recordProjectParticipation;
    private getDepartmentStatistics;
    private getSkillStatistics;
    private getPerformanceStatistics;
    private getAverageWorkload;
    private generateHRRecommendations;
    private getDefaultExpertise;
    private getDefaultSkills;
    private getCollaborationStyle;
}
export default AgentManagement;
//# sourceMappingURL=AgentManagement.d.ts.map