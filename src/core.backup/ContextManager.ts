/**
 * Context Manager
 * 上下文管理器 - 系统性的上下文总结、存储和检索机�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, MJOSError } from './types/index';
import { EngramMemorySystem } from '../advanced-memory/EngramMemorySystem';

export interface ContextSnapshot {
  id: string;
  timestamp: Date;
  sessionId: string;
  workPhase: WorkPhase;
  summary: ContextSummary;
  keyMemories: ContextMemory[];
  activeComponents: string[];
  userRequirements: UserRequirement[];
  projectState: ProjectState;
  nextActions: NextAction[];
}

export type WorkPhase = 
  | 'initialization' // 初始化阶�?  | 'analysis' // 分析阶段
  | 'design' // 设计阶段
  | 'implementation' // 实现阶段
  | 'testing' // 测试阶段
  | 'optimization' // 优化阶段
  | 'deployment'; // 部署阶段

export interface ContextSummary {
  currentTask: string;
  completedTasks: string[];
  pendingTasks: string[];
  keyDecisions: KeyDecision[];
  challenges: Challenge[];
  achievements: Achievement[];
}

export interface ContextMemory {
  id: string;
  type: MemoryType;
  content: string;
  importance: number; // 1-10
  relevance: number; // 0-1
  lastAccessed: Date;
  tags: string[];
}

export type MemoryType = 
  | 'requirement' // 需求记�?  | 'decision' // 决策记忆
  | 'pattern' // 模式记忆
  | 'error' // 错误记忆
  | 'success' // 成功记忆
  | 'feedback'; // 反馈记忆

export interface UserRequirement {
  id: string;
  description: string;
  priority: RequirementPriority;
  status: RequirementStatus;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RequirementPriority = 'low' | 'medium' | 'high' | 'critical';
export type RequirementStatus = 'new' | 'analyzed' | 'in-progress' | 'completed' | 'blocked';

export interface ProjectState {
  architecture: ArchitectureState;
  components: ComponentState[];
  integrations: IntegrationState[];
  quality: QualityMetrics;
  performance: PerformanceMetrics;
}

export interface ArchitectureState {
  coreComponents: string[];
  dependencies: Dependency[];
  designPatterns: string[];
  technicalDebt: TechnicalDebt[];
}

export interface ComponentState {
  name: string;
  status: ComponentStatus;
  completeness: number; // 0-100
  quality: number; // 0-100
  lastUpdated: Date;
  dependencies: string[];
}

export type ComponentStatus = 'planned' | 'in-development' | 'completed' | 'needs-refactor' | 'deprecated';

export interface IntegrationState {
  components: string[];
  status: IntegrationStatus;
  testCoverage: number;
  issues: IntegrationIssue[];
}

export type IntegrationStatus = 'not-started' | 'in-progress' | 'completed' | 'failed';

export interface IntegrationIssue {
  description: string;
  severity: IssueSeverity;
  component: string;
  resolution?: string;
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface KeyDecision {
  id: string;
  description: string;
  rationale: string;
  alternatives: string[];
  impact: DecisionImpact;
  madeAt: Date;
  madeBy: string;
}

export interface DecisionImpact {
  scope: ImpactScope;
  effort: EffortLevel;
  risk: RiskLevel;
  benefits: string[];
  tradeoffs: string[];
}

export type ImpactScope = 'local' | 'component' | 'system' | 'project';
export type EffortLevel = 'low' | 'medium' | 'high' | 'very-high';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Challenge {
  id: string;
  description: string;
  category: ChallengeCategory;
  severity: ChallengeSeverity;
  status: ChallengeStatus;
  solutions: Solution[];
  createdAt: Date;
}

export type ChallengeCategory = 'technical' | 'design' | 'integration' | 'performance' | 'usability';
export type ChallengeSeverity = 'minor' | 'moderate' | 'major' | 'critical';
export type ChallengeStatus = 'identified' | 'analyzing' | 'solving' | 'resolved' | 'deferred';

export interface Solution {
  description: string;
  effort: EffortLevel;
  effectiveness: number; // 0-100
  implemented: boolean;
}

export interface Achievement {
  id: string;
  description: string;
  category: AchievementCategory;
  impact: string;
  metrics: AchievementMetrics;
  achievedAt: Date;
}

export type AchievementCategory = 'milestone' | 'optimization' | 'innovation' | 'quality' | 'integration';

export interface AchievementMetrics {
  quantitative?: Record<string, number>;
  qualitative?: string[];
}

export interface NextAction {
  id: string;
  description: string;
  priority: ActionPriority;
  estimatedEffort: EffortLevel;
  dependencies: string[];
  assignedTo?: string;
  dueDate?: Date;
}

export type ActionPriority = 'immediate' | 'high' | 'medium' | 'low' | 'backlog';

export interface Dependency {
  from: string;
  to: string;
  type: DependencyType;
  strength: DependencyStrength;
}

export type DependencyType = 'requires' | 'uses' | 'extends' | 'configures' | 'tests';
export type DependencyStrength = 'weak' | 'medium' | 'strong' | 'critical';

export interface TechnicalDebt {
  id: string;
  description: string;
  component: string;
  severity: DebtSeverity;
  effort: EffortLevel;
  impact: string;
  createdAt: Date;
}

export type DebtSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface QualityMetrics {
  codeQuality: number; // 0-100
  testCoverage: number; // 0-100
  documentation: number; // 0-100
  maintainability: number; // 0-100
  reliability: number; // 0-100
}

export interface PerformanceMetrics {
  responseTime: number; // ms
  throughput: number; // ops/sec
  memoryUsage: number; // MB
  cpuUsage: number; // %
  errorRate: number; // %
}

/**
 * 上下文管理器�? * 提供系统性的上下文总结、存储和检索机�? */
export class ContextManager {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly memorySystem?: EngramMemorySystem;
  
  private contextHistory: ContextSnapshot[] = [];
  private currentContext?: ContextSnapshot;
  private sessionId: string;

  constructor(
    logger: Logger,
    eventBus: EventBus,
    memorySystem?: EngramMemorySystem
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.memorySystem = memorySystem;
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.setupEventListeners();
    
    this.logger.info('Context Manager initialized', {
      sessionId: this.sessionId
    });
  }

  /**
   * 开始新的工作阶�?   */
  public async startWorkPhase(
    phase: WorkPhase,
    taskDescription: string,
    requirements?: UserRequirement[]
  ): Promise<string> {
    try {
      this.logger.info('Starting new work phase', {
        phase,
        taskDescription,
        sessionId: this.sessionId
      });

      // 1. 检索相关记�?      const relevantMemories = await this.retrieveRelevantMemories(taskDescription, phase);
      
      // 2. 分析项目当前状�?      const projectState = await this.analyzeProjectState();
      
      // 3. 生成上下文快�?      const contextSnapshot: ContextSnapshot = {
        id: `context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        sessionId: this.sessionId,
        workPhase: phase,
        summary: {
          currentTask: taskDescription,
          completedTasks: this.getCompletedTasks(),
          pendingTasks: this.getPendingTasks(),
          keyDecisions: this.getRecentDecisions(),
          challenges: this.getActiveChallenges(),
          achievements: this.getRecentAchievements()
        },
        keyMemories: relevantMemories,
        activeComponents: this.getActiveComponents(),
        userRequirements: requirements || [],
        projectState,
        nextActions: await this.generateNextActions(taskDescription, phase)
      };

      this.currentContext = contextSnapshot;
      this.contextHistory.push(contextSnapshot);

      // 4. 存储到记忆系�?      if (this.memorySystem) {
        await this.memorySystem.storeEngram(
          {
            type: 'context-snapshot',
            phase,
            task: taskDescription,
            snapshot: contextSnapshot
          },
          {
            emotionalValence: 0.5,
            contextualTags: ['context', 'work-phase', phase],
            associations: relevantMemories.map(m => m.id)
          }
        );
      }

      this.logger.info('Work phase started successfully', {
        contextId: contextSnapshot.id,
        phase,
        relevantMemoriesCount: relevantMemories.length
      });

      this.eventBus.publishEvent('context.work_phase_started', {
        contextSnapshot,
        phase,
        taskDescription
      }, 'ContextManager');

      return contextSnapshot.id;

    } catch (error) {
      this.logger.error('Failed to start work phase', {
        phase,
        taskDescription,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 更新当前上下�?   */
  public async updateContext(updates: Partial<ContextSummary>): Promise<void> {
    if (!this.currentContext) {
      throw new Error('No active context to update');
    }

    this.currentContext.summary = {
      ...this.currentContext.summary,
      ...updates
    };

    this.currentContext.timestamp = new Date();

    this.logger.debug('Context updated', {
      contextId: this.currentContext.id,
      updates
    });

    this.eventBus.publishEvent('context.updated', {
      contextId: this.currentContext.id,
      updates
    }, 'ContextManager');
  }

  /**
   * 完成工作阶段
   */
  public async completeWorkPhase(
    achievements: Achievement[],
    nextPhase?: WorkPhase
  ): Promise<void> {
    if (!this.currentContext) {
      throw new Error('No active context to complete');
    }

    // 更新成就
    this.currentContext.summary.achievements.push(...achievements);
    
    // 标记任务完成
    this.currentContext.summary.completedTasks.push(this.currentContext.summary.currentTask);

    // 存储完成记录
    if (this.memorySystem) {
      await this.memorySystem.storeEngram(
        {
          type: 'phase-completion',
          phase: this.currentContext.workPhase,
          task: this.currentContext.summary.currentTask,
          achievements,
          duration: Date.now() - this.currentContext.timestamp.getTime()
        },
        {
          emotionalValence: 0.8, // 完成任务是积极的
          contextualTags: ['completion', 'achievement', this.currentContext.workPhase],
          associations: []
        }
      );
    }

    this.logger.info('Work phase completed', {
      contextId: this.currentContext.id,
      phase: this.currentContext.workPhase,
      achievementsCount: achievements.length,
      nextPhase
    });

    this.eventBus.publishEvent('context.work_phase_completed', {
      contextId: this.currentContext.id,
      phase: this.currentContext.workPhase,
      achievements,
      nextPhase
    }, 'ContextManager');

    // 如果有下一个阶段，自动开�?    if (nextPhase) {
      await this.startWorkPhase(nextPhase, `Continue to ${nextPhase} phase`);
    } else {
      this.currentContext = undefined;
    }
  }

  /**
   * 获取当前上下�?   */
  public getCurrentContext(): ContextSnapshot | undefined {
    return this.currentContext;
  }

  /**
   * 检索相关记�?   */
  private async retrieveRelevantMemories(
    taskDescription: string,
    phase: WorkPhase
  ): Promise<ContextMemory[]> {
    if (!this.memorySystem) {
      return [];
    }

    try {
      const results = await this.memorySystem.retrieveEngrams({
        query: `${taskDescription} ${phase}`,
        contextTags: ['context', 'work-phase', phase],
        minStrength: 30,
        associationDepth: 2
      });

      return results.engrams.map(engram => ({
        id: engram.id,
        type: this.classifyMemoryType(engram.content),
        content: typeof engram.content === 'string' ? engram.content : JSON.stringify(engram.content),
        importance: Math.floor(engram.strength / 10),
        relevance: engram.strength / 100,
        lastAccessed: engram.lastAccessed,
        tags: engram.contextualTags
      }));

    } catch (error) {
      this.logger.warn('Failed to retrieve relevant memories', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * 分类记忆类型
   */
  private classifyMemoryType(content: any): MemoryType {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    
    if (contentStr.includes('requirement') || contentStr.includes('需�?)) {
      return 'requirement';
    } else if (contentStr.includes('decision') || contentStr.includes('决策')) {
      return 'decision';
    } else if (contentStr.includes('error') || contentStr.includes('错误')) {
      return 'error';
    } else if (contentStr.includes('success') || contentStr.includes('成功')) {
      return 'success';
    } else if (contentStr.includes('feedback') || contentStr.includes('反馈')) {
      return 'feedback';
    } else {
      return 'pattern';
    }
  }

  /**
   * 分析项目状�?   */
  private async analyzeProjectState(): Promise<ProjectState> {
    // 简化实现，实际中应该分析项目文件和组件状�?    return {
      architecture: {
        coreComponents: ['MPML', 'MHPF', 'MPEOAS', 'MMPT', 'MCP'],
        dependencies: [
          { from: 'MHPF', to: 'MPML', type: 'uses', strength: 'strong' },
          { from: 'MPEOAS', to: 'MHPF', type: 'extends', strength: 'medium' },
          { from: 'MMPT', to: 'MPEOAS', type: 'uses', strength: 'medium' }
        ],
        designPatterns: ['Observer', 'Strategy', 'Factory', 'Singleton'],
        technicalDebt: []
      },
      components: [
        {
          name: 'MPML',
          status: 'completed',
          completeness: 95,
          quality: 90,
          lastUpdated: new Date(),
          dependencies: ['EngramMemorySystem']
        },
        {
          name: 'MHPF',
          status: 'completed',
          completeness: 90,
          quality: 85,
          lastUpdated: new Date(),
          dependencies: ['TeamController', 'CollaborationOrchestrator']
        }
      ],
      integrations: [
        {
          components: ['MPML', 'MHPF'],
          status: 'completed',
          testCoverage: 80,
          issues: []
        }
      ],
      quality: {
        codeQuality: 85,
        testCoverage: 75,
        documentation: 80,
        maintainability: 90,
        reliability: 85
      },
      performance: {
        responseTime: 150,
        throughput: 1000,
        memoryUsage: 256,
        cpuUsage: 15,
        errorRate: 0.1
      }
    };
  }

  /**
   * 生成下一步行�?   */
  private async generateNextActions(
    taskDescription: string,
    phase: WorkPhase
  ): Promise<NextAction[]> {
    const actions: NextAction[] = [];

    switch (phase) {
      case 'analysis':
        actions.push({
          id: 'analyze-requirements',
          description: '深度分析用户需求和技术要�?,
          priority: 'immediate',
          estimatedEffort: 'medium',
          dependencies: []
        });
        break;
      case 'design':
        actions.push({
          id: 'create-architecture',
          description: '设计系统架构和组件接�?,
          priority: 'high',
          estimatedEffort: 'high',
          dependencies: ['analyze-requirements']
        });
        break;
      case 'implementation':
        actions.push({
          id: 'implement-core',
          description: '实现核心功能组件',
          priority: 'high',
          estimatedEffort: 'very-high',
          dependencies: ['create-architecture']
        });
        break;
      case 'testing':
        actions.push({
          id: 'integration-testing',
          description: '执行集成测试和系统验�?,
          priority: 'high',
          estimatedEffort: 'medium',
          dependencies: ['implement-core']
        });
        break;
    }

    return actions;
  }

  /**
   * 获取已完成任�?   */
  private getCompletedTasks(): string[] {
    return this.contextHistory
      .filter(ctx => ctx.summary.completedTasks.length > 0)
      .flatMap(ctx => ctx.summary.completedTasks);
  }

  /**
   * 获取待处理任�?   */
  private getPendingTasks(): string[] {
    return this.currentContext?.summary.pendingTasks || [];
  }

  /**
   * 获取最近决�?   */
  private getRecentDecisions(): KeyDecision[] {
    // 简化实�?    return [];
  }

  /**
   * 获取活跃挑战
   */
  private getActiveChallenges(): Challenge[] {
    // 简化实�?    return [];
  }

  /**
   * 获取最近成�?   */
  private getRecentAchievements(): Achievement[] {
    return this.contextHistory
      .filter(ctx => ctx.summary.achievements.length > 0)
      .flatMap(ctx => ctx.summary.achievements)
      .slice(-5); // 最�?个成�?  }

  /**
   * 获取活跃组件
   */
  private getActiveComponents(): string[] {
    return ['MPML', 'MHPF', 'MPEOAS', 'MMPT', 'MCP'];
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('task.completed', (event) => {
      if (this.currentContext) {
        this.currentContext.summary.completedTasks.push(event.payload.taskId);
      }
    });

    this.eventBus.subscribeEvent('challenge.identified', (event) => {
      if (this.currentContext) {
        this.currentContext.summary.challenges.push(event.payload.challenge);
      }
    });

    this.eventBus.subscribeEvent('decision.made', (event) => {
      if (this.currentContext) {
        this.currentContext.summary.keyDecisions.push(event.payload.decision);
      }
    });
  }

  /**
   * 获取上下文统�?   */
  public getContextStatistics(): {
    totalSessions: number;
    currentSessionDuration: number;
    totalContextSnapshots: number;
    averagePhaseCompletion: number;
    memoryUtilization: number;
  } {
    const currentSessionDuration = this.currentContext 
      ? Date.now() - this.currentContext.timestamp.getTime()
      : 0;

    const completedPhases = this.contextHistory.filter(ctx => 
      ctx.summary.completedTasks.length > 0
    ).length;

    return {
      totalSessions: 1, // 简化实�?      currentSessionDuration,
      totalContextSnapshots: this.contextHistory.length,
      averagePhaseCompletion: this.contextHistory.length > 0 ? completedPhases / this.contextHistory.length : 0,
      memoryUtilization: this.contextHistory.reduce((sum, ctx) => sum + ctx.keyMemories.length, 0)
    };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.contextHistory = [];
    this.currentContext = undefined;
    
    this.logger.info('Context Manager destroyed', {
      sessionId: this.sessionId
    });
  }
}
