"use strict";
/**
 * MJOS智能体管理系统 - 仿人力资源管理
 * Agent Management System - Mimicking Human Resource Management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentManagement = void 0;
class AgentManagement {
    constructor() {
        this.agents = new Map();
        this.teams = new Map();
        this.skillMatrix = new Map(); // 技能 -> 拥有该技能的成员
        this.departmentIndex = new Map(); // 部门 -> 成员
        this.performanceRankings = new Map(); // 技能 -> 排序的成员列表
        this.initializeAgents();
        this.buildIndexes();
    }
    /**
     * 智能组队 - 根据项目需求组建最优团队
     */
    formOptimalTeam(requirements) {
        // 1. 分析项目需求
        const requiredRoles = this.analyzeRequiredRoles(requirements);
        // 2. 为每个角色找到最佳候选人
        const candidates = this.findCandidatesForRoles(requiredRoles, requirements);
        // 3. 考虑团队协作效果
        const optimalCombination = this.optimizeTeamCombination(candidates, requirements);
        // 4. 选择团队领导
        const leader = this.selectTeamLeader(optimalCombination, requirements);
        // 5. 评估团队风险
        const riskFactors = this.assessTeamRisks(optimalCombination);
        // 6. 计算团队协同效应
        const synergy = this.calculateTeamSynergy(optimalCombination);
        const teamId = `team_${requirements.projectId}_${Date.now()}`;
        const team = {
            teamId,
            projectId: requirements.projectId,
            leader,
            members: optimalCombination,
            roles: this.assignRoles(optimalCombination, requiredRoles),
            formationReason: `基于项目${requirements.projectType}的需求，组建专业团队`,
            expectedSynergy: synergy,
            riskFactors
        };
        this.teams.set(teamId, team);
        this.updateAgentStatus(optimalCombination, 'busy');
        return team;
    }
    /**
     * 专业匹配 - 根据任务类型找到最合适的专家
     */
    matchExpertise(taskType, count = 3) {
        const relevantSkills = this.getRelevantSkills(taskType);
        const candidates = [];
        this.agents.forEach(agent => {
            if (agent.status === 'available') {
                const score = this.calculateExpertiseScore(agent, relevantSkills, taskType);
                if (score > 0.3) { // 最低匹配阈值
                    candidates.push({ agent, score });
                }
            }
        });
        return candidates
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(c => c.agent);
    }
    /**
     * 负载均衡 - 平衡团队成员的工作负载
     */
    balanceWorkload() {
        const overloaded = [];
        const underutilized = [];
        const recommendations = [];
        this.agents.forEach(agent => {
            if (agent.workload > 0.8) {
                overloaded.push(agent);
            }
            else if (agent.workload < 0.3 && agent.status === 'available') {
                underutilized.push(agent);
            }
        });
        // 生成负载均衡建议
        if (overloaded.length > 0) {
            recommendations.push(`${overloaded.length}个成员工作负载过重，建议重新分配任务`);
        }
        if (underutilized.length > 0) {
            recommendations.push(`${underutilized.length}个成员可以承担更多工作`);
        }
        // 自动负载均衡
        this.performLoadBalancing(overloaded, underutilized);
        return { overloaded, underutilized, recommendations };
    }
    /**
     * 绩效评估 - 全面评估成员表现
     */
    evaluatePerformance(agentId, period) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`成员 ${agentId} 不存在`);
        }
        // 收集绩效数据
        const metrics = this.collectPerformanceMetrics(agent, period);
        // 分析成就和改进点
        const achievements = this.identifyAchievements(agent, period);
        const improvements = this.identifyImprovements(agent, period);
        // 设定下期目标
        const goals = this.setPerformanceGoals(agent, metrics);
        const record = {
            period,
            metrics,
            achievements,
            improvements,
            goals
        };
        // 更新成员绩效历史
        agent.performanceHistory.push(record);
        // 更新绩效排名
        this.updatePerformanceRankings();
        return record;
    }
    /**
     * 人才发展 - 制定成员发展计划
     */
    developTalent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`成员 ${agentId} 不存在`);
        }
        // 评估当前水平
        const currentLevel = this.assessCurrentLevel(agent);
        // 制定发展计划
        const developmentPlan = this.createDevelopmentPlan(agent);
        // 设计学习路径
        const learningPath = this.designLearningPath(agent);
        // 推荐导师
        const mentorRecommendation = this.recommendMentor(agent);
        // 估算时间框架
        const timeframe = this.estimateTimeframe(developmentPlan);
        return {
            currentLevel,
            developmentPlan,
            learningPath,
            mentorRecommendation,
            timeframe
        };
    }
    /**
     * 团队解散 - 项目完成后解散团队
     */
    disbandTeam(teamId) {
        const team = this.teams.get(teamId);
        if (!team) {
            throw new Error(`团队 ${teamId} 不存在`);
        }
        // 更新成员状态
        team.members.forEach(member => {
            member.status = 'available';
            member.workload = 0;
            member.currentTasks = [];
        });
        // 记录项目参与历史
        this.recordProjectParticipation(team);
        // 删除团队记录
        this.teams.delete(teamId);
    }
    /**
     * 生成人力资源报告
     */
    generateHRReport() {
        const totalAgents = this.agents.size;
        const availableAgents = Array.from(this.agents.values()).filter(a => a.status === 'available').length;
        const activeTeams = this.teams.size;
        const departmentStats = this.getDepartmentStatistics();
        const skillStats = this.getSkillStatistics();
        const performanceStats = this.getPerformanceStatistics();
        return `
🏢 MJOS人力资源报告

📊 人员概况:
• 总成员数: ${totalAgents}
• 可用成员: ${availableAgents}
• 活跃团队: ${activeTeams}
• 平均工作负载: ${this.getAverageWorkload().toFixed(2)}

🏛️ 部门分布:
${Array.from(departmentStats.entries())
            .map(([dept, count]) => `• ${dept}: ${count}人`)
            .join('\n')}

🛠️ 技能分布:
${Array.from(skillStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([skill, count]) => `• ${skill}: ${count}人`)
            .join('\n')}

📈 绩效统计:
• 平均生产力: ${performanceStats.avgProductivity.toFixed(2)}
• 平均质量: ${performanceStats.avgQuality.toFixed(2)}
• 平均协作: ${performanceStats.avgCollaboration.toFixed(2)}

💡 建议:
${this.generateHRRecommendations().join('\n')}
    `;
    }
    // 私有方法实现
    initializeAgents() {
        // 初始化10个AI成员
        const memberData = [
            { id: 'moxiaozhi', name: '莫小智', role: '项目负责人', department: '项目管理部' },
            { id: 'moxiaomei', name: '莫小美', role: 'UI/UX设计师', department: '设计部' },
            { id: 'moxiaoma', name: '莫小码', role: '全栈工程师', department: '技术部' },
            { id: 'moxiaocang', name: '莫小仓', role: '仓颉语言专家', department: '技术部' },
            { id: 'moxiaochuang', name: '莫小创', role: '创新设计专家', department: '创新部' },
            { id: 'moxiaoce', name: '莫小测', role: '质量测试专家', department: '质量部' },
            { id: 'moxiaoyan', name: '莫小研', role: '研究分析专家', department: '研发部' },
            { id: 'moxiaoyun', name: '莫小运', role: '运维专家', department: '运维部' },
            { id: 'moxiaoan', name: '莫小安', role: '安全专家', department: '安全部' },
            { id: 'moxiaoyi', name: '莫小忆', role: '记忆管理专家', department: '信息管理部' }
        ];
        memberData.forEach(data => {
            const agent = {
                ...data,
                expertise: this.getDefaultExpertise(data.role),
                skills: this.getDefaultSkills(data.role),
                certifications: [],
                experience: Math.floor(Math.random() * 60) + 12, // 12-72个月经验
                status: 'available',
                currentTasks: [],
                workload: 0,
                performance: {
                    productivity: 0.7 + Math.random() * 0.3,
                    quality: 0.7 + Math.random() * 0.3,
                    collaboration: 0.7 + Math.random() * 0.3,
                    innovation: 0.7 + Math.random() * 0.3,
                    reliability: 0.7 + Math.random() * 0.3
                },
                collaborationStyle: this.getCollaborationStyle(data.role),
                preferredTeamSize: Math.floor(Math.random() * 5) + 3,
                workingHours: '9:00-18:00',
                learningGoals: [],
                mentorshipRole: 'peer',
                projectHistory: [],
                performanceHistory: []
            };
            this.agents.set(data.id, agent);
        });
    }
    buildIndexes() {
        this.agents.forEach(agent => {
            // 构建技能索引
            agent.skills.forEach((level, skill) => {
                if (!this.skillMatrix.has(skill)) {
                    this.skillMatrix.set(skill, new Set());
                }
                this.skillMatrix.get(skill).add(agent.id);
            });
            // 构建部门索引
            if (!this.departmentIndex.has(agent.department)) {
                this.departmentIndex.set(agent.department, new Set());
            }
            this.departmentIndex.get(agent.department).add(agent.id);
        });
    }
    // 其他私有方法的简化实现
    analyzeRequiredRoles(requirements) { return []; }
    findCandidatesForRoles(roles, requirements) { return []; }
    optimizeTeamCombination(candidates, requirements) { return []; }
    selectTeamLeader(members, requirements) { return members[0]; }
    assessTeamRisks(members) { return []; }
    calculateTeamSynergy(members) { return 0.8; }
    assignRoles(members, roles) { return new Map(); }
    updateAgentStatus(agents, status) { }
    getRelevantSkills(taskType) { return []; }
    calculateExpertiseScore(agent, skills, taskType) { return 0.5; }
    performLoadBalancing(overloaded, underutilized) { }
    collectPerformanceMetrics(agent, period) { return {}; }
    identifyAchievements(agent, period) { return []; }
    identifyImprovements(agent, period) { return []; }
    setPerformanceGoals(agent, metrics) { return []; }
    updatePerformanceRankings() { }
    assessCurrentLevel(agent) { return 'intermediate'; }
    createDevelopmentPlan(agent) { return []; }
    designLearningPath(agent) { return []; }
    recommendMentor(agent) { return 'moxiaozhi'; }
    estimateTimeframe(plan) { return '3个月'; }
    recordProjectParticipation(team) { }
    getDepartmentStatistics() { return new Map(); }
    getSkillStatistics() { return new Map(); }
    getPerformanceStatistics() { return {}; }
    getAverageWorkload() { return 0.6; }
    generateHRRecommendations() { return []; }
    getDefaultExpertise(role) { return []; }
    getDefaultSkills(role) { return new Map(); }
    getCollaborationStyle(role) { return 'collaborative'; }
}
exports.AgentManagement = AgentManagement;
exports.default = AgentManagement;
//# sourceMappingURL=AgentManagement.js.map