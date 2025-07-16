/**
 * Dual Mode Reasoning Engine
 * 双模式推理引�?- 深度思考vs发散思考的智能切换
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { DualModeReasoning, ReasoningMode, ReasoningResult } from './DualModeReasoning';

// 推理问题类型
export enum ProblemType {
  ANALYTICAL = 'analytical',      // 分析型问�?  CREATIVE = 'creative',          // 创意型问�?  STRATEGIC = 'strategic',        // 战略型问�?  TECHNICAL = 'technical',        // 技术型问题
  COLLABORATIVE = 'collaborative', // 协作型问�?  DIAGNOSTIC = 'diagnostic'       // 诊断型问�?}

// 问题复杂�?export enum ProblemComplexity {
  SIMPLE = 'simple',       // 简单问�?  MODERATE = 'moderate',   // 中等复杂�?  COMPLEX = 'complex',     // 复杂问题
  VERY_COMPLEX = 'very_complex' // 极复杂问�?}

// 推理上下�?export interface ReasoningContext {
  problemType: ProblemType;
  complexity: ProblemComplexity;
  timeConstraint: number; // 毫秒
  qualityRequirement: number; // 0-1
  availableResources: string[];
  constraints: string[];
  stakeholders: string[];
}

// 深度思考步�?export interface DeepThinkingStep {
  stepNumber: number;
  description: string;
  reasoning: string;
  evidence: string[];
  confidence: number;
  alternatives: string[];
  nextSteps: string[];
}

// 发散思考想�?export interface DivergentIdea {
  id: string;
  description: string;
  originality: number; // 0-1
  feasibility: number; // 0-1
  impact: number; // 0-1
  associations: string[];
  buildUpon: string[];
}

// 推理策略
export interface ReasoningStrategy {
  mode: ReasoningMode;
  approach: string;
  techniques: string[];
  expectedDuration: number;
  qualityMetrics: string[];
}

/**
 * 双模式推理引擎类
 */
export class DualModeReasoningEngine extends DualModeReasoning {
  private reasoningHistory: ReasoningResult[] = [];
  private activeReasoningSessions = new Map<string, ReasoningSession>();
  
  // 模式切换参数
  private readonly COMPLEXITY_THRESHOLD = 0.7;
  private readonly TIME_PRESSURE_THRESHOLD = 30000; // 30�?  private readonly QUALITY_THRESHOLD = 0.8;

  constructor(logger: Logger, eventBus: EventBus) {
    super(logger, eventBus);
    
    this.logger.info('Dual Mode Reasoning Engine initialized');
  }

  /**
   * 智能推理 - 自动选择最佳推理模�?   */
  public async intelligentReasoning(
    problem: string,
    context: ReasoningContext,
    sessionId?: string
  ): Promise<ReasoningResult> {
    const session = sessionId || this.generateSessionId();
    
    try {
      // 1. 分析问题特征
      const problemAnalysis = await this.analyzeProblem(problem, context);
      
      // 2. 选择推理策略
      const strategy = await this.selectReasoningStrategy(problemAnalysis, context);
      
      // 3. 创建推理会话
      const reasoningSession = this.createReasoningSession(session, problem, context, strategy);
      this.activeReasoningSessions.set(session, reasoningSession);
      
      // 4. 执行推理
      const result = await this.executeReasoning(reasoningSession);
      
      // 5. 评估和优�?      const optimizedResult = await this.optimizeResult(result, context);
      
      // 6. 记录推理历史
      this.reasoningHistory.push(optimizedResult);
      this.activeReasoningSessions.delete(session);
      
      this.logger.info('Intelligent reasoning completed', {
        sessionId: session,
        mode: strategy.mode,
        duration: Date.now() - reasoningSession.startTime,
        confidence: optimizedResult.confidence
      });

      this.eventBus.publishEvent('reasoning.completed', {
        sessionId: session,
        result: optimizedResult,
        strategy
      }, 'DualModeReasoningEngine');

      return optimizedResult;

    } catch (error) {
      this.logger.error('Intelligent reasoning failed', {
        sessionId: session,
        problem: problem.substring(0, 100),
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }

  /**
   * 分析问题特征
   */
  private async analyzeProblem(problem: string, context: ReasoningContext): Promise<ProblemAnalysis> {
    const analysis: ProblemAnalysis = {
      problemType: context.problemType,
      complexity: context.complexity,
      keyWords: this.extractKeyWords(problem),
      domainIndicators: this.identifyDomainIndicators(problem),
      structureType: this.analyzeStructure(problem),
      ambiguityLevel: this.assessAmbiguity(problem),
      creativityRequired: this.assessCreativityRequirement(problem, context),
      logicalDepth: this.assessLogicalDepth(problem),
      timeConstraints: context.timeConstraint,
      qualityRequirements: context.qualityRequirement
    };

    return analysis;
  }

  /**
   * 选择推理策略
   */
  private async selectReasoningStrategy(
    analysis: ProblemAnalysis, 
    context: ReasoningContext
  ): Promise<ReasoningStrategy> {
    // 决策矩阵：基于问题特征选择推理模式
    let deepThinkingScore = 0;
    let divergentThinkingScore = 0;

    // 1. 问题类型影响
    const typeScores = {
      [ProblemType.ANALYTICAL]: { deep: 0.8, divergent: 0.2 },
      [ProblemType.CREATIVE]: { deep: 0.3, divergent: 0.9 },
      [ProblemType.STRATEGIC]: { deep: 0.7, divergent: 0.6 },
      [ProblemType.TECHNICAL]: { deep: 0.9, divergent: 0.3 },
      [ProblemType.COLLABORATIVE]: { deep: 0.5, divergent: 0.7 },
      [ProblemType.DIAGNOSTIC]: { deep: 0.8, divergent: 0.4 }
    };

    const typeScore = typeScores[analysis.problemType];
    deepThinkingScore += typeScore.deep * 0.3;
    divergentThinkingScore += typeScore.divergent * 0.3;

    // 2. 复杂度影�?    const complexityScores = {
      [ProblemComplexity.SIMPLE]: { deep: 0.4, divergent: 0.6 },
      [ProblemComplexity.MODERATE]: { deep: 0.6, divergent: 0.5 },
      [ProblemComplexity.COMPLEX]: { deep: 0.8, divergent: 0.4 },
      [ProblemComplexity.VERY_COMPLEX]: { deep: 0.9, divergent: 0.3 }
    };

    const complexityScore = complexityScores[analysis.complexity];
    deepThinkingScore += complexityScore.deep * 0.25;
    divergentThinkingScore += complexityScore.divergent * 0.25;

    // 3. 时间约束影响
    const timeUrgency = context.timeConstraint < this.TIME_PRESSURE_THRESHOLD ? 1 : 0;
    deepThinkingScore += (1 - timeUrgency) * 0.2; // 时间充裕时偏向深度思�?    divergentThinkingScore += timeUrgency * 0.2; // 时间紧迫时偏向快速发�?
    // 4. 创意需求影�?    deepThinkingScore += (1 - analysis.creativityRequired) * 0.15;
    divergentThinkingScore += analysis.creativityRequired * 0.15;

    // 5. 质量要求影响
    deepThinkingScore += context.qualityRequirement * 0.1;
    divergentThinkingScore += (1 - context.qualityRequirement) * 0.1;

    // 选择得分更高的模�?    const selectedMode = deepThinkingScore > divergentThinkingScore 
      ? ReasoningMode.DEEP_THINKING 
      : ReasoningMode.DIVERGENT_THINKING;

    // 如果得分接近，使用混合模�?    const scoreDiff = Math.abs(deepThinkingScore - divergentThinkingScore);
    const finalMode = scoreDiff < 0.2 ? ReasoningMode.HYBRID : selectedMode;

    return {
      mode: finalMode,
      approach: this.selectApproach(finalMode, analysis),
      techniques: this.selectTechniques(finalMode, analysis),
      expectedDuration: this.estimateDuration(finalMode, analysis, context),
      qualityMetrics: this.selectQualityMetrics(finalMode, context)
    };
  }

  /**
   * 选择推理方法
   */
  private selectApproach(mode: ReasoningMode, analysis: ProblemAnalysis): string {
    const approaches = {
      [ReasoningMode.DEEP_THINKING]: {
        [ProblemType.ANALYTICAL]: 'systematic-analysis',
        [ProblemType.TECHNICAL]: 'root-cause-analysis',
        [ProblemType.STRATEGIC]: 'scenario-planning',
        [ProblemType.DIAGNOSTIC]: 'differential-diagnosis'
      },
      [ReasoningMode.DIVERGENT_THINKING]: {
        [ProblemType.CREATIVE]: 'brainstorming',
        [ProblemType.COLLABORATIVE]: 'mind-mapping',
        [ProblemType.STRATEGIC]: 'blue-sky-thinking'
      },
      [ReasoningMode.HYBRID]: {
        [ProblemType.STRATEGIC]: 'design-thinking',
        [ProblemType.COLLABORATIVE]: 'structured-brainstorming'
      }
    };

    return approaches[mode]?.[analysis.problemType] || 'general-reasoning';
  }

  /**
   * 选择推理技�?   */
  private selectTechniques(mode: ReasoningMode, analysis: ProblemAnalysis): string[] {
    const techniques = {
      [ReasoningMode.DEEP_THINKING]: [
        'logical-deduction',
        'causal-analysis',
        'evidence-evaluation',
        'assumption-testing',
        'systematic-decomposition'
      ],
      [ReasoningMode.DIVERGENT_THINKING]: [
        'free-association',
        'analogical-thinking',
        'perspective-shifting',
        'constraint-removal',
        'random-stimulation'
      ],
      [ReasoningMode.HYBRID]: [
        'structured-creativity',
        'iterative-refinement',
        'convergent-divergent-cycles',
        'multi-perspective-analysis'
      ]
    };

    return techniques[mode] || [];
  }

  /**
   * 估算推理时长
   */
  private estimateDuration(
    mode: ReasoningMode, 
    analysis: ProblemAnalysis, 
    context: ReasoningContext
  ): number {
    let baseDuration = 0;

    // 基础时长（毫秒）
    const baseDurations = {
      [ReasoningMode.DEEP_THINKING]: 60000, // 1分钟
      [ReasoningMode.DIVERGENT_THINKING]: 30000, // 30�?      [ReasoningMode.HYBRID]: 90000 // 1.5分钟
    };

    baseDuration = baseDurations[mode];

    // 复杂度调�?    const complexityMultipliers = {
      [ProblemComplexity.SIMPLE]: 0.5,
      [ProblemComplexity.MODERATE]: 1.0,
      [ProblemComplexity.COMPLEX]: 2.0,
      [ProblemComplexity.VERY_COMPLEX]: 3.0
    };

    baseDuration *= complexityMultipliers[analysis.complexity];

    // 质量要求调整
    baseDuration *= (0.5 + context.qualityRequirement);

    // 时间约束限制
    return Math.min(baseDuration, context.timeConstraint * 0.8);
  }

  /**
   * 选择质量指标
   */
  private selectQualityMetrics(mode: ReasoningMode, context: ReasoningContext): string[] {
    const commonMetrics = ['accuracy', 'completeness', 'relevance'];
    
    const modeSpecificMetrics = {
      [ReasoningMode.DEEP_THINKING]: ['logical-consistency', 'evidence-strength', 'depth'],
      [ReasoningMode.DIVERGENT_THINKING]: ['originality', 'fluency', 'flexibility'],
      [ReasoningMode.HYBRID]: ['innovation', 'feasibility', 'comprehensiveness']
    };

    return [...commonMetrics, ...(modeSpecificMetrics[mode] || [])];
  }

  /**
   * 创建推理会话
   */
  private createReasoningSession(
    sessionId: string,
    problem: string,
    context: ReasoningContext,
    strategy: ReasoningStrategy
  ): ReasoningSession {
    return {
      id: sessionId,
      problem,
      context,
      strategy,
      startTime: Date.now(),
      steps: [],
      ideas: [],
      currentPhase: 'initialization',
      progress: 0
    };
  }

  /**
   * 执行推理
   */
  private async executeReasoning(session: ReasoningSession): Promise<ReasoningResult> {
    switch (session.strategy.mode) {
      case ReasoningMode.DEEP_THINKING:
        return await this.executeDeepThinking(session);
      case ReasoningMode.DIVERGENT_THINKING:
        return await this.executeDivergentThinking(session);
      case ReasoningMode.HYBRID:
        return await this.executeHybridReasoning(session);
      default:
        throw new Error(`Unsupported reasoning mode: ${session.strategy.mode}`);
    }
  }

  /**
   * 执行深度思�?   */
  private async executeDeepThinking(session: ReasoningSession): Promise<ReasoningResult> {
    const steps: DeepThinkingStep[] = [];
    
    // �?步：问题分解
    steps.push({
      stepNumber: 1,
      description: '问题分解和结构化分析',
      reasoning: '将复杂问题分解为可管理的子问�?,
      evidence: this.analyzeEvidence(session.problem),
      confidence: 0.8,
      alternatives: ['直接解决', '类比推理'],
      nextSteps: ['深入分析各子问题']
    });

    // �?步：假设生成
    steps.push({
      stepNumber: 2,
      description: '生成和评估假�?,
      reasoning: '基于现有信息生成可能的解决方案假�?,
      evidence: ['历史案例', '理论基础', '经验判断'],
      confidence: 0.7,
      alternatives: ['多个假设并行验证', '单一假设深入验证'],
      nextSteps: ['假设验证', '证据收集']
    });

    // �?步：逻辑推理
    steps.push({
      stepNumber: 3,
      description: '逻辑推理和因果分�?,
      reasoning: '运用逻辑推理验证假设的合理�?,
      evidence: ['逻辑链条', '因果关系', '必要充分条件'],
      confidence: 0.85,
      alternatives: ['演绎推理', '归纳推理', '溯因推理'],
      nextSteps: ['结论综合', '方案优化']
    });

    session.steps = steps;
    session.progress = 100;

    return {
      mode: ReasoningMode.DEEP_THINKING,
      solution: this.synthesizeDeepThinkingSolution(steps),
      confidence: this.calculateAverageConfidence(steps),
      reasoning: steps.map(step => step.reasoning).join(' �?'),
      alternatives: this.extractAlternatives(steps),
      evidence: this.consolidateEvidence(steps),
      metadata: {
        sessionId: session.id,
        duration: Date.now() - session.startTime,
        stepsCount: steps.length,
        approach: session.strategy.approach
      }
    };
  }

  /**
   * 执行发散思�?   */
  private async executeDivergentThinking(session: ReasoningSession): Promise<ReasoningResult> {
    const ideas: DivergentIdea[] = [];

    // �?阶段：自由联�?    const freeAssociationIdeas = await this.generateFreeAssociationIdeas(session.problem, 10);
    ideas.push(...freeAssociationIdeas);

    // �?阶段：类比思维
    const analogicalIdeas = await this.generateAnalogicalIdeas(session.problem, 8);
    ideas.push(...analogicalIdeas);

    // �?阶段：视角转�?    const perspectiveIdeas = await this.generatePerspectiveIdeas(session.problem, 6);
    ideas.push(...perspectiveIdeas);

    // �?阶段：约束移�?    const unconstrainedIdeas = await this.generateUnconstrainedIdeas(session.problem, 5);
    ideas.push(...unconstrainedIdeas);

    session.ideas = ideas;
    session.progress = 100;

    // 评估和排序想�?    const rankedIdeas = this.rankIdeas(ideas);
    const bestIdeas = rankedIdeas.slice(0, 5);

    return {
      mode: ReasoningMode.DIVERGENT_THINKING,
      solution: this.synthesizeDivergentSolution(bestIdeas),
      confidence: this.calculateDivergentConfidence(bestIdeas),
      reasoning: '通过发散思维生成多样化解决方案，并基于原创性、可行性和影响力进行评�?,
      alternatives: rankedIdeas.slice(1, 6).map(idea => idea.description),
      evidence: ['创意评估', '可行性分�?, '影响力评�?],
      metadata: {
        sessionId: session.id,
        duration: Date.now() - session.startTime,
        ideasGenerated: ideas.length,
        approach: session.strategy.approach,
        topIdeas: bestIdeas.map(idea => ({
          description: idea.description,
          scores: {
            originality: idea.originality,
            feasibility: idea.feasibility,
            impact: idea.impact
          }
        }))
      }
    };
  }

  /**
   * 执行混合推理
   */
  private async executeHybridReasoning(session: ReasoningSession): Promise<ReasoningResult> {
    const steps: DeepThinkingStep[] = [];
    const ideas: DivergentIdea[] = [];

    // �?阶段：发散思考生成想�?    session.currentPhase = 'divergent-generation';
    const initialIdeas = await this.generateFreeAssociationIdeas(session.problem, 15);
    ideas.push(...initialIdeas);
    session.progress = 25;

    // �?阶段：深度分析最佳想�?    session.currentPhase = 'deep-analysis';
    const topIdeas = this.rankIdeas(ideas).slice(0, 3);

    for (let i = 0; i < topIdeas.length; i++) {
      const idea = topIdeas[i];
      steps.push({
        stepNumber: i + 1,
        description: `深度分析想法�?{idea.description}`,
        reasoning: `对创意想法进行可行性和实施路径分析`,
        evidence: [`原创性评分：${idea.originality}`, `可行性评分：${idea.feasibility}`, `影响力评分：${idea.impact}`],
        confidence: (idea.originality + idea.feasibility + idea.impact) / 3,
        alternatives: idea.buildUpon,
        nextSteps: ['实施计划制定', '风险评估']
      });
    }
    session.progress = 75;

    // �?阶段：收敛整�?    session.currentPhase = 'convergent-integration';
    const integratedSolution = await this.integrateHybridSolutions(topIdeas, steps);
    session.progress = 100;

    session.steps = steps;
    session.ideas = ideas;

    return {
      mode: ReasoningMode.HYBRID,
      solution: integratedSolution,
      confidence: this.calculateHybridConfidence(steps, topIdeas),
      reasoning: '结合发散思维的创意生成和深度思考的逻辑分析，形成创新且可行的解决方�?,
      alternatives: topIdeas.slice(1).map(idea => idea.description),
      evidence: this.consolidateEvidence(steps),
      metadata: {
        sessionId: session.id,
        duration: Date.now() - session.startTime,
        stepsCount: steps.length,
        ideasGenerated: ideas.length,
        approach: session.strategy.approach,
        phases: ['divergent-generation', 'deep-analysis', 'convergent-integration']
      }
    };
  }

  /**
   * 生成自由联想想法
   */
  private async generateFreeAssociationIdeas(problem: string, count: number): Promise<DivergentIdea[]> {
    const ideas: DivergentIdea[] = [];
    const keywords = this.extractKeyWords(problem);

    for (let i = 0; i < count; i++) {
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      const associations = this.generateAssociations(randomKeyword);

      ideas.push({
        id: `free-${i}`,
        description: `基于"${randomKeyword}"的联想：${associations[0]}`,
        originality: Math.random() * 0.4 + 0.6, // 0.6-1.0
        feasibility: Math.random() * 0.6 + 0.2, // 0.2-0.8
        impact: Math.random() * 0.8 + 0.2, // 0.2-1.0
        associations,
        buildUpon: []
      });
    }

    return ideas;
  }

  /**
   * 生成类比想法
   */
  private async generateAnalogicalIdeas(problem: string, count: number): Promise<DivergentIdea[]> {
    const ideas: DivergentIdea[] = [];
    const domains = ['nature', 'technology', 'sports', 'art', 'history', 'science'];

    for (let i = 0; i < count; i++) {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const analogy = this.generateAnalogy(problem, domain);

      ideas.push({
        id: `analogy-${i}`,
        description: `${domain}领域类比�?{analogy}`,
        originality: Math.random() * 0.3 + 0.7, // 0.7-1.0
        feasibility: Math.random() * 0.5 + 0.3, // 0.3-0.8
        impact: Math.random() * 0.6 + 0.4, // 0.4-1.0
        associations: [domain, 'analogy'],
        buildUpon: []
      });
    }

    return ideas;
  }

  /**
   * 生成视角转换想法
   */
  private async generatePerspectiveIdeas(problem: string, count: number): Promise<DivergentIdea[]> {
    const ideas: DivergentIdea[] = [];
    const perspectives = ['user', 'competitor', 'investor', 'regulator', 'future-generation', 'alien'];

    for (let i = 0; i < count; i++) {
      const perspective = perspectives[Math.floor(Math.random() * perspectives.length)];
      const viewpoint = this.generatePerspectiveViewpoint(problem, perspective);

      ideas.push({
        id: `perspective-${i}`,
        description: `�?{perspective}角度�?{viewpoint}`,
        originality: Math.random() * 0.4 + 0.5, // 0.5-0.9
        feasibility: Math.random() * 0.7 + 0.3, // 0.3-1.0
        impact: Math.random() * 0.5 + 0.5, // 0.5-1.0
        associations: [perspective, 'viewpoint'],
        buildUpon: []
      });
    }

    return ideas;
  }

  /**
   * 生成无约束想�?   */
  private async generateUnconstrainedIdeas(problem: string, count: number): Promise<DivergentIdea[]> {
    const ideas: DivergentIdea[] = [];

    for (let i = 0; i < count; i++) {
      const unconstrainedSolution = this.generateUnconstrainedSolution(problem);

      ideas.push({
        id: `unconstrained-${i}`,
        description: `无约束解决方案：${unconstrainedSolution}`,
        originality: Math.random() * 0.2 + 0.8, // 0.8-1.0
        feasibility: Math.random() * 0.4 + 0.1, // 0.1-0.5
        impact: Math.random() * 0.3 + 0.7, // 0.7-1.0
        associations: ['unconstrained', 'breakthrough'],
        buildUpon: []
      });
    }

    return ideas;
  }

  /**
   * 排序想法
   */
  private rankIdeas(ideas: DivergentIdea[]): DivergentIdea[] {
    return ideas.sort((a, b) => {
      const scoreA = (a.originality * 0.4 + a.feasibility * 0.4 + a.impact * 0.2);
      const scoreB = (b.originality * 0.4 + b.feasibility * 0.4 + b.impact * 0.2);
      return scoreB - scoreA;
    });
  }

  /**
   * 整合混合解决方案
   */
  private async integrateHybridSolutions(ideas: DivergentIdea[], steps: DeepThinkingStep[]): Promise<string> {
    const bestIdea = ideas[0];
    const analysisInsights = steps.map(step => step.reasoning).join('; ');

    return `整合方案�?{bestIdea.description}。基于深度分析：${analysisInsights}。实施建议：结合创新性和可行性，采用渐进式实施策略。`;
  }

  /**
   * 辅助方法
   */
  private extractKeyWords(text: string): string[] {
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10);
  }

  private generateAssociations(keyword: string): string[] {
    const associations = {
      'system': ['network', 'integration', 'automation'],
      'team': ['collaboration', 'synergy', 'diversity'],
      'problem': ['challenge', 'opportunity', 'solution'],
      'project': ['goal', 'milestone', 'delivery']
    };
    return associations[keyword] || ['innovation', 'efficiency', 'quality'];
  }

  private generateAnalogy(problem: string, domain: string): string {
    const analogies = {
      'nature': '如同生态系统的平衡机制',
      'technology': '类似于分布式计算架构',
      'sports': '像团队运动中的战术配�?,
      'art': '如同艺术创作的灵感迸�?,
      'history': '借鉴历史变革的成功模�?,
      'science': '运用科学实验的系统方�?
    };
    return analogies[domain] || '跨领域的创新思维';
  }

  private generatePerspectiveViewpoint(problem: string, perspective: string): string {
    const viewpoints: Record<string, string> = {
      'user': '关注用户体验和实际需�?,
      'competitor': '寻找差异化竞争优�?,
      'investor': '评估投资回报和风�?,
      'regulator': '确保合规性和社会责任',
      'future-generation': '考虑长期可持续发�?,
      'alien': '完全跳出现有思维框架'
    };
    return viewpoints[perspective] || '多元化的思考角�?;
  }

  private generateUnconstrainedSolution(problem: string): string {
    const solutions = [
      '完全重新定义问题本质',
      '运用未来科技突破限制',
      '建立全新的游戏规�?,
      '创造颠覆性的解决范式',
      '整合跨维度的资源'
    ];
    return solutions[Math.floor(Math.random() * solutions.length)] || '创新性解决方�?;
  }

  /**
   * 分析证据
   */
  private analyzeEvidence(problem: string): string[] {
    return [
      '问题描述中的关键信息',
      '相关领域的最佳实�?,
      '历史案例和经验教�?,
      '当前约束条件分析'
    ];
  }

  /**
   * 计算平均置信�?   */
  private calculateAverageConfidence(steps: DeepThinkingStep[]): number {
    if (steps.length === 0) return 0;
    return steps.reduce((sum, step) => sum + step.confidence, 0) / steps.length;
  }

  /**
   * 计算发散思考置信度
   */
  private calculateDivergentConfidence(ideas: DivergentIdea[]): number {
    if (ideas.length === 0) return 0;
    const topIdea = ideas[0];
    if (!topIdea) return 0;
    return (topIdea.originality + topIdea.feasibility + topIdea.impact) / 3;
  }

  /**
   * 计算混合推理置信�?   */
  private calculateHybridConfidence(steps: DeepThinkingStep[], ideas: DivergentIdea[]): number {
    const deepConfidence = this.calculateAverageConfidence(steps);
    const divergentConfidence = this.calculateDivergentConfidence(ideas);
    return (deepConfidence + divergentConfidence) / 2;
  }

  /**
   * 提取替代方案
   */
  private extractAlternatives(steps: DeepThinkingStep[]): string[] {
    const alternatives: string[] = [];
    for (const step of steps) {
      alternatives.push(...step.alternatives);
    }
    return [...new Set(alternatives)]; // 去重
  }

  /**
   * 整合证据
   */
  private consolidateEvidence(steps: DeepThinkingStep[]): string[] {
    const evidence: string[] = [];
    for (const step of steps) {
      evidence.push(...step.evidence);
    }
    return [...new Set(evidence)]; // 去重
  }

  /**
   * 综合深度思考解决方�?   */
  private synthesizeDeepThinkingSolution(steps: DeepThinkingStep[]): string {
    const keyInsights = steps.map(step => step.reasoning);
    return `基于系统性分析的解决方案�?{keyInsights.join(' �?')}。综合考虑所有证据和替代方案，推荐采用渐进式实施策略。`;
  }

  /**
   * 综合发散思考解决方�?   */
  private synthesizeDivergentSolution(ideas: DivergentIdea[]): string {
    const bestIdea = ideas[0];
    const supportingIdeas = ideas.slice(1, 3).map(idea => idea.description).join('; ');
    return `创新解决方案�?{bestIdea.description}。支持性想法：${supportingIdeas}。建议结合多个创意形成综合方案。`;
  }

  /**
   * 优化推理结果
   */
  private async optimizeResult(result: ReasoningResult, context: ReasoningContext): Promise<ReasoningResult> {
    // 基于上下文要求优化结�?    let optimizedResult = { ...result };

    // 如果质量要求高，增加详细分析
    if (context.qualityRequirement > 0.8) {
      optimizedResult.reasoning += ' [高质量要求：已进行额外验证和风险评估]';
      optimizedResult.confidence *= 0.95; // 略微降低置信度以反映更严格的标准
    }

    // 如果时间紧迫，简化输�?    if (context.timeConstraint < this.TIME_PRESSURE_THRESHOLD) {
      optimizedResult.alternatives = optimizedResult.alternatives.slice(0, 3);
      optimizedResult.evidence = optimizedResult.evidence.slice(0, 5);
    }

    // 根据利益相关者调整表达方�?    if (context.stakeholders.includes('technical')) {
      optimizedResult.reasoning += ' [技术实现细节已考虑]';
    }
    if (context.stakeholders.includes('business')) {
      optimizedResult.reasoning += ' [商业价值和ROI已评估]';
    }

    return optimizedResult;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `reasoning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 识别领域指标
   */
  private identifyDomainIndicators(problem: string): string[] {
    const domains = {
      'technical': ['code', 'system', 'algorithm', 'implementation'],
      'business': ['market', 'revenue', 'customer', 'strategy'],
      'design': ['user', 'interface', 'experience', 'visual'],
      'management': ['team', 'project', 'process', 'workflow']
    };

    const indicators: string[] = [];
    const lowerProblem = problem.toLowerCase();

    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => lowerProblem.includes(keyword))) {
        indicators.push(domain);
      }
    }

    return indicators;
  }

  /**
   * 分析问题结构
   */
  private analyzeStructure(problem: string): string {
    if (problem.includes('?')) return 'question';
    if (problem.includes('how to')) return 'procedural';
    if (problem.includes('why')) return 'causal';
    if (problem.includes('what if')) return 'hypothetical';
    return 'descriptive';
  }

  /**
   * 评估模糊性水�?   */
  private assessAmbiguity(problem: string): number {
    let ambiguityScore = 0;

    // 检查模糊词�?    const ambiguousWords = ['maybe', 'possibly', 'might', 'could', 'unclear', 'uncertain'];
    const ambiguousCount = ambiguousWords.filter(word =>
      problem.toLowerCase().includes(word)
    ).length;

    ambiguityScore += ambiguousCount * 0.2;

    // 检查问号数�?    const questionMarks = (problem.match(/\?/g) || []).length;
    ambiguityScore += questionMarks * 0.1;

    // 检查长度（过长可能表示复杂性和模糊性）
    if (problem.length > 500) ambiguityScore += 0.2;

    return Math.min(ambiguityScore, 1.0);
  }

  /**
   * 评估创意需�?   */
  private assessCreativityRequirement(problem: string, context: ReasoningContext): number {
    let creativityScore = 0;

    // 基于问题类型
    const creativityByType = {
      [ProblemType.CREATIVE]: 0.9,
      [ProblemType.STRATEGIC]: 0.7,
      [ProblemType.COLLABORATIVE]: 0.6,
      [ProblemType.ANALYTICAL]: 0.3,
      [ProblemType.TECHNICAL]: 0.4,
      [ProblemType.DIAGNOSTIC]: 0.2
    };

    creativityScore += creativityByType[context.problemType] * 0.6;

    // 检查创意关键词
    const creativeWords = ['innovative', 'creative', 'novel', 'breakthrough', 'disruptive'];
    const creativeCount = creativeWords.filter(word =>
      problem.toLowerCase().includes(word)
    ).length;

    creativityScore += creativeCount * 0.1;

    // 检查约束条件（约束越少，创意需求越高）
    creativityScore += (1 - context.constraints.length / 10) * 0.3;

    return Math.min(creativityScore, 1.0);
  }

  /**
   * 评估逻辑深度
   */
  private assessLogicalDepth(problem: string): number {
    let depthScore = 0;

    // 检查逻辑关键�?    const logicalWords = ['because', 'therefore', 'consequently', 'implies', 'leads to'];
    const logicalCount = logicalWords.filter(word =>
      problem.toLowerCase().includes(word)
    ).length;

    depthScore += logicalCount * 0.2;

    // 检查条件语�?    const conditionalWords = ['if', 'when', 'unless', 'provided that'];
    const conditionalCount = conditionalWords.filter(word =>
      problem.toLowerCase().includes(word)
    ).length;

    depthScore += conditionalCount * 0.15;

    // 检查分析词�?    const analyticalWords = ['analyze', 'evaluate', 'compare', 'assess', 'examine'];
    const analyticalCount = analyticalWords.filter(word =>
      problem.toLowerCase().includes(word)
    ).length;

    depthScore += analyticalCount * 0.25;

    return Math.min(depthScore, 1.0);
  }

  /**
   * 获取推理统计
   */
  public getReasoningStatistics(): {
    totalSessions: number;
    modeDistribution: Record<ReasoningMode, number>;
    averageConfidence: number;
    averageDuration: number;
    successRate: number;
  } {
    const totalSessions = this.reasoningHistory.length;
    const modeDistribution = {
      [ReasoningMode.DEEP_THINKING]: 0,
      [ReasoningMode.DIVERGENT_THINKING]: 0,
      [ReasoningMode.HYBRID]: 0
    };

    let totalConfidence = 0;
    let totalDuration = 0;
    let successCount = 0;

    for (const result of this.reasoningHistory) {
      modeDistribution[result.mode]++;
      totalConfidence += result.confidence;
      totalDuration += result.metadata.duration;
      if (result.confidence > 0.7) successCount++;
    }

    return {
      totalSessions,
      modeDistribution,
      averageConfidence: totalSessions > 0 ? totalConfidence / totalSessions : 0,
      averageDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      successRate: totalSessions > 0 ? successCount / totalSessions : 0
    };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    super.destroy();

    this.reasoningHistory = [];
    this.activeReasoningSessions.clear();

    this.logger.info('Dual Mode Reasoning Engine destroyed');
  }
}

// 辅助接口
interface ProblemAnalysis {
  problemType: ProblemType;
  complexity: ProblemComplexity;
  keyWords: string[];
  domainIndicators: string[];
  structureType: string;
  ambiguityLevel: number;
  creativityRequired: number;
  logicalDepth: number;
  timeConstraints: number;
  qualityRequirements: number;
}

interface ReasoningSession {
  id: string;
  problem: string;
  context: ReasoningContext;
  strategy: ReasoningStrategy;
  startTime: number;
  steps: DeepThinkingStep[];
  ideas: DivergentIdea[];
  currentPhase: string;
  progress: number;
}
