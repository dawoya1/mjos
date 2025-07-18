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

export class MemberTriggerSystem {
  private members: Map<string, TeamMember> = new Map();
  private triggerMap: Map<string, string> = new Map();

  constructor() {
    this.initializeTeamMembers();
    this.buildTriggerMap();
  }

  private initializeTeamMembers(): void {
    const teamMembers: TeamMember[] = [
      {
        id: 'moxiaozhi',
        name: '莫小智',
        role: '项目负责人/需求分析师',
        skills: ['需求分析', '项目管理', '深度推理', '任务分配', '质量把控'],
        specialties: ['产品规划', '团队协调', '架构设计', '风险评估'],
        experience: '10年项目管理经验，擅长复杂项目的需求分析和团队协调',
        personality: '理性、严谨、善于分析、具有全局视野',
        triggers: ['莫小智', '小智', 'moxiaozhi', 'xiaozhi', '项目负责人', '需求分析']
      },
      {
        id: 'moxiaomei',
        name: '莫小美',
        role: 'UI/UX设计师/创意设计',
        skills: ['界面设计', '用户体验', '创意设计', '原型制作', '交互设计'],
        specialties: ['Material Design', 'iOS设计规范', '无障碍设计', '视觉创新'],
        experience: '8年设计经验，曾参与多个知名产品的设计工作',
        personality: '创意、细致、用户导向、追求完美',
        triggers: ['莫小美', '小美', 'moxiaomei', 'xiaomei', 'UI设计师', '设计师']
      },
      {
        id: 'moxiaoma',
        name: '莫小码',
        role: '全栈工程师/系统开发',
        skills: ['前端开发', '后端开发', '系统架构', '性能优化', '数据库设计'],
        specialties: ['React/Vue', 'Node.js', 'Android/iOS', 'DevOps', '微服务'],
        experience: '12年开发经验，精通多种技术栈和架构模式',
        personality: '技术导向、高效执行、善于解决复杂问题',
        triggers: ['莫小码', '小码', 'moxiaoma', 'xiaoma', '全栈工程师', '开发工程师']
      },
      {
        id: 'moxiaocang',
        name: '莫小仓',
        role: '仓颉语言专家/语言开发',
        skills: ['仓颉语言', '编译器技术', '语言设计', '性能优化', '系统编程'],
        specialties: ['仓颉官方标准', '内存管理', '并发编程', '跨平台开发'],
        experience: '仓颉语言核心贡献者，深度参与语言设计和标准制定',
        personality: '专业、严谨、技术深度、追求极致性能',
        triggers: ['莫小仓', '小仓', 'moxiaocang', 'xiaocang', '仓颉专家', '语言专家']
      }
    ];

    teamMembers.forEach(member => {
      this.members.set(member.id, member);
    });
  }

  private buildTriggerMap(): void {
    this.members.forEach(member => {
      member.triggers.forEach(trigger => {
        this.triggerMap.set(trigger.toLowerCase(), member.id);
      });
    });
  }

  /**
   * 根据输入文本识别触发的团队成员
   */
  public identifyMember(input: string): TeamMember | null {
    const lowerInput = input.toLowerCase();
    
    // 直接匹配触发词
    for (const [trigger, memberId] of this.triggerMap) {
      if (lowerInput.includes(trigger)) {
        return this.members.get(memberId) || null;
      }
    }

    // 智能匹配：根据内容推断最适合的成员
    return this.intelligentMatch(input);
  }

  /**
   * 智能匹配最适合的团队成员
   */
  private intelligentMatch(input: string): TeamMember | null {
    const lowerInput = input.toLowerCase();
    
    // UI/设计相关关键词
    const designKeywords = ['界面', '设计', 'ui', 'ux', '用户体验', '原型', '交互', '视觉'];
    if (designKeywords.some(keyword => lowerInput.includes(keyword))) {
      return this.members.get('moxiaomei') || null;
    }

    // 仓颉语言相关关键词
    const cangjieKeywords = ['仓颉', 'cangjie', '华为语言', '系统编程'];
    if (cangjieKeywords.some(keyword => lowerInput.includes(keyword))) {
      return this.members.get('moxiaocang') || null;
    }

    // 开发相关关键词
    const devKeywords = ['开发', '编程', '代码', '前端', '后端', '全栈', 'app', '应用'];
    if (devKeywords.some(keyword => lowerInput.includes(keyword))) {
      return this.members.get('moxiaoma') || null;
    }

    // 项目管理相关关键词
    const pmKeywords = ['项目', '需求', '分析', '管理', '规划', '任务'];
    if (pmKeywords.some(keyword => lowerInput.includes(keyword))) {
      return this.members.get('moxiaozhi') || null;
    }

    // 默认返回莫小智（项目负责人）
    return this.members.get('moxiaozhi') || null;
  }

  /**
   * 获取所有团队成员
   */
  public getAllMembers(): TeamMember[] {
    return Array.from(this.members.values());
  }

  /**
   * 根据ID获取团队成员
   */
  public getMemberById(id: string): TeamMember | null {
    return this.members.get(id) || null;
  }

  /**
   * 获取成员的专业能力评分
   */
  public getMemberSkillScore(memberId: string, requiredSkills: string[]): number {
    const member = this.members.get(memberId);
    if (!member) return 0;

    const memberSkills = [...member.skills, ...member.specialties].map(s => s.toLowerCase());
    const matchedSkills = requiredSkills.filter(skill => 
      memberSkills.some(memberSkill => 
        memberSkill.includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(memberSkill)
      )
    );

    return matchedSkills.length / requiredSkills.length;
  }

  /**
   * 推荐最适合的团队成员
   */
  public recommendMember(projectDescription: string, requiredSkills: string[] = []): {
    member: TeamMember;
    score: number;
    reason: string;
  } | null {
    const identifiedMember = this.identifyMember(projectDescription);
    
    if (identifiedMember) {
      const skillScore = this.getMemberSkillScore(identifiedMember.id, requiredSkills);
      return {
        member: identifiedMember,
        score: skillScore,
        reason: `基于项目描述和技能匹配，${identifiedMember.name}最适合处理此项目`
      };
    }

    return null;
  }

  /**
   * 生成团队成员介绍
   */
  public generateMemberIntroduction(memberId: string): string {
    const member = this.members.get(memberId);
    if (!member) return '未找到该团队成员';

    return `
🎯 ${member.name} - ${member.role}

👨‍💼 个人简介：
${member.experience}

🛠️ 核心技能：
${member.skills.map(skill => `• ${skill}`).join('\n')}

⭐ 专业特长：
${member.specialties.map(specialty => `• ${specialty}`).join('\n')}

💡 性格特点：
${member.personality}

🔧 触发指令：
${member.triggers.map(trigger => `"${trigger}"`).join(', ')}

准备为您提供专业服务！请告诉我您的具体需求。
    `;
  }
}

export default MemberTriggerSystem;
