/**
 * MJOS完整团队成员档案系统 - 9个专业成员
 * Complete Team Member Profiles System - 9 Professional Members
 */
export interface ProfessionalTool {
    name: string;
    category: 'development' | 'design' | 'analysis' | 'testing' | 'management' | 'research';
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    lastUsed: Date;
    usageCount: number;
}
export interface LearningRecord {
    topic: string;
    source: string;
    timestamp: Date;
    confidence: number;
    applied: boolean;
}
export interface WorkOutput {
    type: 'code' | 'design' | 'document' | 'analysis' | 'test' | 'plan';
    title: string;
    description: string;
    quality: number;
    timestamp: Date;
    projectId?: string;
}
export interface EvolutionCapability {
    selfLearning: boolean;
    internetSearch: boolean;
    knowledgeUpdate: boolean;
    skillImprovement: boolean;
    adaptability: number;
}
export interface CompleteMember {
    id: string;
    name: string;
    role: string;
    department: string;
    level: 'junior' | 'intermediate' | 'senior' | 'expert' | 'master';
    coreSkills: string[];
    specialties: string[];
    tools: ProfessionalTool[];
    certifications: string[];
    responsibilities: string[];
    workOutputTypes: string[];
    qualityStandards: Record<string, number>;
    learningHistory: LearningRecord[];
    evolutionCapability: EvolutionCapability;
    knowledgeBase: Map<string, any>;
    collaborationStyle: string;
    communicationPreference: string;
    workingHours: string;
    performance: {
        productivity: number;
        quality: number;
        innovation: number;
        collaboration: number;
        learning: number;
    };
    triggers: string[];
    personality: string;
    workStyle: string;
    motivation: string[];
}
export declare class CompleteTeamSystem {
    private members;
    private knowledgeGraph;
    constructor();
    private initializeCompleteTeam;
    /**
     * 自我进化系统 - 成员学习和能力提升
     */
    evolveMember(memberId: string, learningData: {
        topic: string;
        source: string;
        content: any;
        confidence: number;
    }): Promise<boolean>;
    /**
     * 互联网搜索学习
     */
    searchAndLearn(memberId: string, query: string): Promise<boolean>;
    /**
     * 技能改进
     */
    private improveSkills;
    /**
     * 模拟互联网搜索
     */
    private simulateInternetSearch;
    /**
     * 获取所有团队成员
     */
    getAllMembers(): CompleteMember[];
    /**
     * 根据ID获取团队成员
     */
    getMemberById(id: string): CompleteMember | undefined;
    /**
     * 生成成员能力报告
     */
    generateCapabilityReport(memberId: string): any;
}
//# sourceMappingURL=CompleteTeamProfiles.d.ts.map