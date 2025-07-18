/**
 * MJOS团队成员触发指令系统
 * Team Member Trigger Command System
 */
export interface TeamMember {
    id: string;
    name: string;
    role: string;
    skills: string[];
    specialties: string[];
    experience: string;
    personality: string;
    triggers: string[];
}
export declare class MemberTriggerSystem {
    private members;
    private triggerMap;
    constructor();
    private initializeTeamMembers;
    private buildTriggerMap;
    /**
     * 根据输入文本识别触发的团队成员
     */
    identifyMember(input: string): TeamMember | null;
    /**
     * 智能匹配最适合的团队成员
     */
    private intelligentMatch;
    /**
     * 获取所有团队成员
     */
    getAllMembers(): TeamMember[];
    /**
     * 根据ID获取团队成员
     */
    getMemberById(id: string): TeamMember | null;
    /**
     * 获取成员的专业能力评分
     */
    getMemberSkillScore(memberId: string, requiredSkills: string[]): number;
    /**
     * 推荐最适合的团队成员
     */
    recommendMember(projectDescription: string, requiredSkills?: string[]): {
        member: TeamMember;
        score: number;
        reason: string;
    } | null;
    /**
     * 生成团队成员介绍
     */
    generateMemberIntroduction(memberId: string): string;
}
export default MemberTriggerSystem;
//# sourceMappingURL=MemberTriggerSystem.d.ts.map