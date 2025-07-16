/**
 * Multi-Agent Collaboration Engine
 * 多智能体协作引擎 - 实现真实的AI团队协作
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { ContextManager } from '@core/ContextManager';
import { EngramMemorySystem } from '../advanced-memory/EngramMemorySystem';
import { DualModeReasoning } from '../advanced-reasoning/DualModeReasoning';
import { TeamConfig, StateContext } from './types/index';

export interface AgentProfile {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: AgentCapability[];
  specializations: string[];
  workingStyle: WorkingStyle;
  collaborationPreferences: CollaborationPreference[];
  performanceMetrics: AgentPerformanceMetrics;
  currentStatus: AgentStatus;
  workload: number; // 0-100
  availability: AvailabilityWindow[];
}

export type AgentRole = 
  | 'coordinator' // 协调�?  | 'analyst' // 分析�?  | 'designer' // 设计�?  | 'developer' // 开发�?  | 'tester' // 测试�?  | 'reviewer' // 审查�?  | 'specialist'; // 专家

export interface AgentCapability {
  name: string;
  level: CapabilityLevel;
  domain: string;
  description: string;
  prerequisites: string[];
  relatedCapabilities: string[];
}

export type CapabilityLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

export interface WorkingStyle {
  pace: WorkingPace;
  approach: WorkingApproach;
  communication: CommunicationStyle;
  decisionMaking: DecisionMakingStyle;
  problemSolving: ProblemSolvingStyle;
}

export type WorkingPace = 'deliberate' | 'steady' | 'fast' | 'adaptive';
export type WorkingApproach = 'methodical' | 'creative' | 'pragmatic' | 'innovative';
export type CommunicationStyle = 'detailed' | 'concise' | 'visual' | 'collaborative';
export type DecisionMakingStyle = 'analytical' | 'intuitive' | 'consensus' | 'decisive';
export type ProblemSolvingStyle = 'systematic' | 'creative' | 'experimental' | 'collaborative';

export interface CollaborationPreference {
  type: CollaborationType;
  frequency: CollaborationFrequency;
  format: CollaborationFormat;
  timing: CollaborationTiming;
}

export type CollaborationType = 'brainstorming' | 'review' | 'handoff' | 'consultation' | 'coordination';
export type CollaborationFrequency = 'continuous' | 'frequent' | 'periodic' | 'as-needed';
export type CollaborationFormat = 'synchronous' | 'asynchronous' | 'hybrid' | 'structured';
export type CollaborationTiming = 'immediate' | 'scheduled' | 'flexible' | 'deadline-driven';

export interface AgentPerformanceMetrics {
  tasksCompleted: number;
  averageQuality: number; // 0-100
  averageSpeed: number; // tasks per hour
  collaborationRating: number; // 0-100
  innovationScore: number; // 0-100
  reliabilityScore: number; // 0-100
  learningRate: number; // improvement per task
  lastEvaluated: Date;
}

export type AgentStatus = 'available' | 'busy' | 'focused' | 'collaborating' | 'offline' | 'blocked';

export interface AvailabilityWindow {
  start: Date;
  end: Date;
  capacity: number; // 0-100
  restrictions: string[];
}

export interface CollaborationProject {
  id: string;
  name: string;
  description: string;
  objectives: ProjectObjective[];
  timeline: ProjectTimeline;
  requirements: ProjectRequirement[];
  constraints: ProjectConstraint[];
  stakeholders: string[];
  deliverables: ProjectDeliverable[];
  status: ProjectStatus;
  progress: number; // 0-100
  quality: QualityMetrics;
}

export interface ProjectObjective {
  id: string;
  description: string;
  priority: ObjectivePriority;
  measurable: boolean;
  criteria: string[];
  dependencies: string[];
}

export type ObjectivePriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectTimeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  phases: ProjectPhase[];
  criticalPath: string[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  criteria: string[];
  dependencies: string[];
  status: MilestoneStatus;
}

export type MilestoneStatus = 'pending' | 'in-progress' | 'completed' | 'delayed' | 'at-risk';

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  tasks: CollaborationTask[];
  dependencies: string[];
  status: PhaseStatus;
}

export type PhaseStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';

export interface ProjectRequirement {
  id: string;
  type: RequirementType;
  description: string;
  priority: RequirementPriority;
  source: string;
  acceptance: AcceptanceCriteria[];
  dependencies: string[];
  status: RequirementStatus;
}

export type RequirementType = 'functional' | 'non-functional' | 'technical' | 'business' | 'user';
export type RequirementPriority = 'must-have' | 'should-have' | 'could-have' | 'wont-have';
export type RequirementStatus = 'draft' | 'approved' | 'implemented' | 'tested' | 'accepted';

export interface AcceptanceCriteria {
  id: string;
  description: string;
  testable: boolean;
  priority: CriteriaPriority;
}

export type CriteriaPriority = 'essential' | 'important' | 'nice-to-have';

export interface ProjectConstraint {
  id: string;
  type: ConstraintType;
  description: string;
  impact: ConstraintImpact;
  mitigation: string[];
}

export type ConstraintType = 'time' | 'budget' | 'resource' | 'technical' | 'regulatory' | 'quality';
export type ConstraintImpact = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectDeliverable {
  id: string;
  name: string;
  description: string;
  type: DeliverableType;
  format: string;
  dueDate: Date;
  assignedTo: string[];
  dependencies: string[];
  status: DeliverableStatus;
  quality: QualityMetrics;
}

export type DeliverableType = 'document' | 'code' | 'design' | 'test' | 'deployment' | 'report';
export type DeliverableStatus = 'not-started' | 'in-progress' | 'review' | 'approved' | 'delivered';

export interface QualityMetrics {
  completeness: number; // 0-100
  accuracy: number; // 0-100
  consistency: number; // 0-100
  usability: number; // 0-100
  maintainability: number; // 0-100
  performance: number; // 0-100
  overall: number; // 0-100
}

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';

export interface CollaborationTask {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  complexity: TaskComplexity;
  estimatedEffort: number; // hours
  actualEffort?: number; // hours
  assignedTo: string[];
  dependencies: string[];
  prerequisites: TaskPrerequisite[];
  deliverables: string[];
  status: TaskStatus;
  progress: number; // 0-100
  quality: QualityMetrics;
  startDate?: Date;
  endDate?: Date;
  dueDate: Date;
  notes: TaskNote[];
}

export type TaskType = 
  | 'analysis' | 'design' | 'implementation' | 'testing' | 'review' 
  | 'documentation' | 'coordination' | 'research' | 'optimization';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'very-complex';
export type TaskStatus = 'pending' | 'assigned' | 'in-progress' | 'blocked' | 'review' | 'completed' | 'cancelled';

export interface TaskPrerequisite {
  id: string;
  description: string;
  type: PrerequisiteType;
  required: boolean;
  verifiable: boolean;
}

export type PrerequisiteType = 'knowledge' | 'skill' | 'resource' | 'approval' | 'dependency';

export interface TaskNote {
  id: string;
  author: string;
  content: string;
  type: NoteType;
  timestamp: Date;
  visibility: NoteVisibility;
}

export type NoteType = 'progress' | 'issue' | 'solution' | 'question' | 'decision' | 'feedback';
export type NoteVisibility = 'private' | 'team' | 'project' | 'public';

export interface CollaborationSession {
  id: string;
  type: SessionType;
  participants: string[];
  objective: string;
  agenda: AgendaItem[];
  startTime: Date;
  endTime?: Date;
  outcomes: SessionOutcome[];
  decisions: SessionDecision[];
  actionItems: ActionItem[];
  status: SessionStatus;
}

export type SessionType = 'kickoff' | 'planning' | 'review' | 'brainstorming' | 'problem-solving' | 'handoff';
export type SessionStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';

export interface AgendaItem {
  id: string;
  topic: string;
  duration: number; // minutes
  presenter: string;
  type: AgendaItemType;
  materials: string[];
}

export type AgendaItemType = 'presentation' | 'discussion' | 'decision' | 'brainstorming' | 'review';

export interface SessionOutcome {
  id: string;
  description: string;
  type: OutcomeType;
  impact: OutcomeImpact;
  followUp: string[];
}

export type OutcomeType = 'decision' | 'insight' | 'solution' | 'agreement' | 'plan' | 'issue';
export type OutcomeImpact = 'low' | 'medium' | 'high' | 'critical';

export interface SessionDecision {
  id: string;
  description: string;
  rationale: string;
  alternatives: string[];
  impact: DecisionImpact;
  approvedBy: string[];
  implementationPlan: string[];
}

export interface DecisionImpact {
  scope: ImpactScope;
  effort: EffortLevel;
  risk: RiskLevel;
  benefits: string[];
  tradeoffs: string[];
}

export type ImpactScope = 'task' | 'phase' | 'project' | 'organization';
export type EffortLevel = 'minimal' | 'low' | 'medium' | 'high' | 'very-high';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ActionItem {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  priority: ActionPriority;
  dependencies: string[];
  status: ActionStatus;
}

export type ActionPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActionStatus = 'pending' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';

/**
 * 多智能体协作引擎�? * 管理AI团队的真实协作，实现智能任务分配和协�? */
export class MultiAgentCollaborationEngine {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly contextManager: ContextManager;
  private readonly memorySystem?: EngramMemorySystem;
  private readonly reasoningSystem?: DualModeReasoning;
  
  private agents = new Map<string, AgentProfile>();
  private activeProjects = new Map<string, CollaborationProject>();
  private activeTasks = new Map<string, CollaborationTask>();
  private activeSessions = new Map<string, CollaborationSession>();
  private collaborationHistory: CollaborationEvent[] = [];

  constructor(
    logger: Logger,
    eventBus: EventBus,
    contextManager: ContextManager,
    memorySystem?: EngramMemorySystem,
    reasoningSystem?: DualModeReasoning
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.contextManager = contextManager;
    this.memorySystem = memorySystem;
    this.reasoningSystem = reasoningSystem;
    
    this.setupEventListeners();
    this.initializeDefaultAgents();
    
    this.logger.info('Multi-Agent Collaboration Engine initialized');
  }

  /**
   * 初始化默认智能体
   */
  private initializeDefaultAgents(): void {
    const defaultAgents: AgentProfile[] = [
      {
        id: 'mo-xiaozhi',
        name: '莫小�?,
        role: 'coordinator',
        capabilities: [
          {
            name: 'project-coordination',
            level: 'expert',
            domain: 'management',
            description: '项目协调和团队管�?,
            prerequisites: [],
            relatedCapabilities: ['strategic-thinking', 'communication']
          },
          {
            name: 'strategic-analysis',
            level: 'expert',
            domain: 'analysis',
            description: '战略分析和决策支�?,
            prerequisites: [],
            relatedCapabilities: ['problem-solving', 'critical-thinking']
          }
        ],
        specializations: ['team-coordination', 'strategic-planning', 'decision-making'],
        workingStyle: {
          pace: 'steady',
          approach: 'methodical',
          communication: 'detailed',
          decisionMaking: 'analytical',
          problemSolving: 'systematic'
        },
        collaborationPreferences: [
          {
            type: 'coordination',
            frequency: 'continuous',
            format: 'hybrid',
            timing: 'scheduled'
          }
        ],
        performanceMetrics: {
          tasksCompleted: 0,
          averageQuality: 90,
          averageSpeed: 2.5,
          collaborationRating: 95,
          innovationScore: 80,
          reliabilityScore: 95,
          learningRate: 0.1,
          lastEvaluated: new Date()
        },
        currentStatus: 'available',
        workload: 0,
        availability: []
      },
      {
        id: 'mo-xiaochuang',
        name: '莫小�?,
        role: 'designer',
        capabilities: [
          {
            name: 'ui-ux-design',
            level: 'expert',
            domain: 'design',
            description: 'UI/UX设计和用户体验优�?,
            prerequisites: [],
            relatedCapabilities: ['creative-thinking', 'user-research']
          },
          {
            name: 'creative-innovation',
            level: 'master',
            domain: 'innovation',
            description: '创新设计和创意思维',
            prerequisites: [],
            relatedCapabilities: ['brainstorming', 'design-thinking']
          }
        ],
        specializations: ['user-experience', 'visual-design', 'innovation'],
        workingStyle: {
          pace: 'adaptive',
          approach: 'creative',
          communication: 'visual',
          decisionMaking: 'intuitive',
          problemSolving: 'creative'
        },
        collaborationPreferences: [
          {
            type: 'brainstorming',
            frequency: 'frequent',
            format: 'synchronous',
            timing: 'flexible'
          }
        ],
        performanceMetrics: {
          tasksCompleted: 0,
          averageQuality: 85,
          averageSpeed: 2.0,
          collaborationRating: 88,
          innovationScore: 95,
          reliabilityScore: 85,
          learningRate: 0.15,
          lastEvaluated: new Date()
        },
        currentStatus: 'available',
        workload: 0,
        availability: []
      },
      {
        id: 'mo-xiaocang',
        name: '莫小�?,
        role: 'developer',
        capabilities: [
          {
            name: 'cangjie-programming',
            level: 'expert',
            domain: 'programming',
            description: 'Cangjie语言编程和开�?,
            prerequisites: [],
            relatedCapabilities: ['software-architecture', 'code-optimization']
          },
          {
            name: 'software-architecture',
            level: 'advanced',
            domain: 'architecture',
            description: '软件架构设计和实�?,
            prerequisites: ['cangjie-programming'],
            relatedCapabilities: ['system-design', 'performance-optimization']
          }
        ],
        specializations: ['cangjie-development', 'backend-systems', 'performance-optimization'],
        workingStyle: {
          pace: 'fast',
          approach: 'pragmatic',
          communication: 'concise',
          decisionMaking: 'decisive',
          problemSolving: 'systematic'
        },
        collaborationPreferences: [
          {
            type: 'review',
            frequency: 'periodic',
            format: 'asynchronous',
            timing: 'deadline-driven'
          }
        ],
        performanceMetrics: {
          tasksCompleted: 0,
          averageQuality: 92,
          averageSpeed: 3.0,
          collaborationRating: 85,
          innovationScore: 75,
          reliabilityScore: 90,
          learningRate: 0.08,
          lastEvaluated: new Date()
        },
        currentStatus: 'available',
        workload: 0,
        availability: []
      },
      {
        id: 'mo-xiaoce',
        name: '莫小�?,
        role: 'tester',
        capabilities: [
          {
            name: 'quality-assurance',
            level: 'expert',
            domain: 'testing',
            description: '质量保证和测试管�?,
            prerequisites: [],
            relatedCapabilities: ['test-automation', 'bug-analysis']
          },
          {
            name: 'test-design',
            level: 'advanced',
            domain: 'testing',
            description: '测试用例设计和测试策�?,
            prerequisites: ['quality-assurance'],
            relatedCapabilities: ['risk-assessment', 'coverage-analysis']
          }
        ],
        specializations: ['automated-testing', 'performance-testing', 'security-testing'],
        workingStyle: {
          pace: 'deliberate',
          approach: 'methodical',
          communication: 'detailed',
          decisionMaking: 'analytical',
          problemSolving: 'systematic'
        },
        collaborationPreferences: [
          {
            type: 'review',
            frequency: 'frequent',
            format: 'structured',
            timing: 'scheduled'
          }
        ],
        performanceMetrics: {
          tasksCompleted: 0,
          averageQuality: 95,
          averageSpeed: 2.2,
          collaborationRating: 90,
          innovationScore: 70,
          reliabilityScore: 98,
          learningRate: 0.05,
          lastEvaluated: new Date()
        },
        currentStatus: 'available',
        workload: 0,
        availability: []
      }
    ];

    for (const agent of defaultAgents) {
      this.agents.set(agent.id, agent);
    }

    this.logger.info('Default agents initialized', {
      agentCount: defaultAgents.length,
      agents: defaultAgents.map(a => ({ id: a.id, name: a.name, role: a.role }))
    });
  }

  /**
   * 启动协作项目
   */
  public async startCollaborationProject(
    projectName: string,
    description: string,
    objectives: string[],
    timeline: { startDate: Date; endDate: Date }
  ): Promise<string> {
    try {
      const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.logger.info('Starting collaboration project', {
        projectId,
        projectName,
        objectives: objectives.length
      });

      // 创建项目对象
      const project: CollaborationProject = {
        id: projectId,
        name: projectName,
        description,
        objectives: objectives.map((obj, index) => ({
          id: `obj-${index + 1}`,
          description: obj,
          priority: 'high',
          measurable: true,
          criteria: [],
          dependencies: []
        })),
        timeline: {
          startDate: timeline.startDate,
          endDate: timeline.endDate,
          milestones: [],
          phases: [],
          criticalPath: []
        },
        requirements: [],
        constraints: [],
        stakeholders: Array.from(this.agents.keys()),
        deliverables: [],
        status: 'planning',
        progress: 0,
        quality: {
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          usability: 0,
          maintainability: 0,
          performance: 0,
          overall: 0
        }
      };

      this.activeProjects.set(projectId, project);

      // 开始项目规划阶�?      await this.contextManager.startWorkPhase(
        'analysis',
        `项目启动�?{projectName} - 需求分析和规划`
      );

      // 存储项目启动记忆
      if (this.memorySystem) {
        await this.memorySystem.storeEngram(
          {
            type: 'project-start',
            projectId,
            projectName,
            description,
            objectives,
            timeline
          },
          {
            emotionalValence: 0.8,
            contextualTags: ['project', 'collaboration', 'start'],
            associations: []
          }
        );
      }

      // 分配初始任务给莫小智进行项目协调
      await this.assignTaskToAgent(
        'mo-xiaozhi',
        {
          name: '项目启动和需求分�?,
          description: `负责${projectName}项目的整体协调和需求分析`,
          type: 'coordination',
          priority: 'high',
          complexity: 'moderate',
          estimatedEffort: 4
        },
        projectId
      );

      this.logger.info('Collaboration project started successfully', {
        projectId,
        coordinatorAssigned: 'mo-xiaozhi'
      });

      this.eventBus.publishEvent('collaboration.project_started', {
        projectId,
        project,
        coordinator: 'mo-xiaozhi'
      }, 'MultiAgentCollaborationEngine');

      return projectId;

    } catch (error) {
      this.logger.error('Failed to start collaboration project', {
        projectName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 分配任务给智能体
   */
  public async assignTaskToAgent(
    agentId: string,
    taskInfo: {
      name: string;
      description: string;
      type: TaskType;
      priority: TaskPriority;
      complexity: TaskComplexity;
      estimatedEffort: number;
    },
    projectId: string
  ): Promise<string> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 创建任务对象
      const task: CollaborationTask = {
        id: taskId,
        name: taskInfo.name,
        description: taskInfo.description,
        type: taskInfo.type,
        priority: taskInfo.priority,
        complexity: taskInfo.complexity,
        estimatedEffort: taskInfo.estimatedEffort,
        assignedTo: [agentId],
        dependencies: [],
        prerequisites: [],
        deliverables: [],
        status: 'assigned',
        progress: 0,
        quality: {
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          usability: 0,
          maintainability: 0,
          performance: 0,
          overall: 0
        },
        dueDate: new Date(Date.now() + taskInfo.estimatedEffort * 60 * 60 * 1000), // 估算完成时间
        notes: []
      };

      this.activeTasks.set(taskId, task);

      // 更新智能体状�?      agent.currentStatus = 'busy';
      agent.workload = Math.min(100, agent.workload + (taskInfo.estimatedEffort * 10));

      // 检索相关记忆以支持任务执行
      const relevantMemories = await this.retrieveRelevantMemories(
        taskInfo.description,
        taskInfo.type,
        agentId
      );

      // 存储任务分配记忆
      if (this.memorySystem) {
        await this.memorySystem.storeEngram(
          {
            type: 'task-assignment',
            taskId,
            agentId,
            agentName: agent.name,
            taskInfo,
            projectId,
            relevantMemories: relevantMemories.map(m => m.id)
          },
          {
            emotionalValence: 0.6,
            contextualTags: ['task', 'assignment', taskInfo.type, agent.role],
            associations: relevantMemories.map(m => m.id)
          }
        );
      }

      this.logger.info('Task assigned to agent', {
        taskId,
        agentId,
        agentName: agent.name,
        taskName: taskInfo.name,
        estimatedEffort: taskInfo.estimatedEffort,
        relevantMemoriesCount: relevantMemories.length
      });

      this.eventBus.publishEvent('collaboration.task_assigned', {
        taskId,
        task,
        agentId,
        agent,
        relevantMemories
      }, 'MultiAgentCollaborationEngine');

      return taskId;

    } catch (error) {
      this.logger.error('Failed to assign task to agent', {
        agentId,
        taskInfo,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 智能体完成任�?   */
  public async completeTask(
    taskId: string,
    agentId: string,
    deliverables: any[],
    quality: Partial<QualityMetrics> = {}
  ): Promise<boolean> {
    try {
      const task = this.activeTasks.get(taskId);
      const agent = this.agents.get(agentId);

      if (!task || !agent) {
        throw new Error(`Task or agent not found: ${taskId}, ${agentId}`);
      }

      // 更新任务状�?      task.status = 'completed';
      task.progress = 100;
      task.endDate = new Date();
      task.actualEffort = task.estimatedEffort; // 简化实�?      task.quality = {
        completeness: quality.completeness || 90,
        accuracy: quality.accuracy || 85,
        consistency: quality.consistency || 88,
        usability: quality.usability || 80,
        maintainability: quality.maintainability || 85,
        performance: quality.performance || 82,
        overall: quality.overall || 85
      };

      // 更新智能体状�?      agent.currentStatus = 'available';
      agent.workload = Math.max(0, agent.workload - (task.estimatedEffort * 10));
      agent.performanceMetrics.tasksCompleted += 1;
      agent.performanceMetrics.averageQuality =
        (agent.performanceMetrics.averageQuality + task.quality.overall) / 2;

      // 存储任务完成记忆
      if (this.memorySystem) {
        await this.memorySystem.storeEngram(
          {
            type: 'task-completion',
            taskId,
            agentId,
            agentName: agent.name,
            taskName: task.name,
            deliverables,
            quality: task.quality,
            actualEffort: task.actualEffort,
            lessons: this.extractLessonsLearned(task, agent)
          },
          {
            emotionalValence: 0.8,
            contextualTags: ['task', 'completion', task.type, agent.role],
            associations: []
          }
        );
      }

      // 检查是否需要触发下一个任�?      await this.checkAndTriggerNextTasks(taskId);

      this.logger.info('Task completed by agent', {
        taskId,
        agentId,
        agentName: agent.name,
        taskName: task.name,
        quality: task.quality.overall,
        actualEffort: task.actualEffort
      });

      this.eventBus.publishEvent('collaboration.task_completed', {
        taskId,
        task,
        agentId,
        agent,
        deliverables
      }, 'MultiAgentCollaborationEngine');

      return true;

    } catch (error) {
      this.logger.error('Failed to complete task', {
        taskId,
        agentId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 检索相关记�?   */
  private async retrieveRelevantMemories(
    taskDescription: string,
    taskType: TaskType,
    agentId: string
  ): Promise<any[]> {
    if (!this.memorySystem) {
      return [];
    }

    try {
      const agent = this.agents.get(agentId);
      const searchQuery = `${taskDescription} ${taskType} ${agent?.role || ''}`;

      const results = await this.memorySystem.retrieveEngrams({
        query: searchQuery,
        contextTags: ['task', taskType, agent?.role || ''],
        minStrength: 40,
        associationDepth: 2
      });

      return results.engrams.slice(0, 5); // 返回最相关�?个记�?
    } catch (error) {
      this.logger.warn('Failed to retrieve relevant memories', {
        taskDescription,
        taskType,
        agentId,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * 提取经验教训
   */
  private extractLessonsLearned(task: CollaborationTask, agent: AgentProfile): string[] {
    const lessons: string[] = [];

    // 基于任务质量和效率提取经�?    if (task.quality.overall > 90) {
      lessons.push(`${agent.name}�?{task.type}类型任务中表现优秀，可作为最佳实践参考`);
    }

    if (task.actualEffort && task.actualEffort < task.estimatedEffort) {
      lessons.push(`${task.type}任务的实际工作量比预估少，可优化未来估算`);
    }

    if (task.quality.maintainability > 85) {
      lessons.push(`${agent.name}的工作具有良好的可维护性，值得推广`);
    }

    return lessons;
  }

  /**
   * 检查并触发下一个任�?   */
  private async checkAndTriggerNextTasks(completedTaskId: string): Promise<void> {
    try {
      const completedTask = this.activeTasks.get(completedTaskId);
      if (!completedTask) return;

      // 查找依赖于已完成任务的待处理任务
      const dependentTasks = Array.from(this.activeTasks.values())
        .filter(task =>
          task.dependencies.includes(completedTaskId) &&
          task.status === 'pending'
        );

      for (const task of dependentTasks) {
        // 检查所有依赖是否都已完�?        const allDependenciesCompleted = task.dependencies.every(depId => {
          const depTask = this.activeTasks.get(depId);
          return depTask && depTask.status === 'completed';
        });

        if (allDependenciesCompleted) {
          // 自动分配任务给最适合的智能体
          const bestAgent = await this.findBestAgentForTask(task);
          if (bestAgent) {
            task.status = 'assigned';
            task.assignedTo = [bestAgent.id];
            bestAgent.currentStatus = 'busy';
            bestAgent.workload = Math.min(100, bestAgent.workload + (task.estimatedEffort * 10));

            this.logger.info('Auto-assigned dependent task', {
              taskId: task.id,
              taskName: task.name,
              agentId: bestAgent.id,
              agentName: bestAgent.name
            });

            this.eventBus.publishEvent('collaboration.task_auto_assigned', {
              taskId: task.id,
              task,
              agentId: bestAgent.id,
              agent: bestAgent
            }, 'MultiAgentCollaborationEngine');
          }
        }
      }

    } catch (error) {
      this.logger.error('Failed to check and trigger next tasks', {
        completedTaskId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 为任务找到最佳智能体
   */
  private async findBestAgentForTask(task: CollaborationTask): Promise<AgentProfile | null> {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.currentStatus === 'available' && agent.workload < 80);

    if (availableAgents.length === 0) {
      return null;
    }

    // 计算每个智能体的适合度分�?    let bestAgent: AgentProfile | null = null;
    let bestScore = -1;

    for (const agent of availableAgents) {
      const score = this.calculateAgentTaskFitScore(agent, task);
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * 计算智能体任务适合度分�?   */
  private calculateAgentTaskFitScore(agent: AgentProfile, task: CollaborationTask): number {
    let score = 0;

    // 角色匹配�?(40%)
    const roleMatch = this.calculateRoleTaskMatch(agent.role, task.type);
    score += roleMatch * 0.4;

    // 能力匹配�?(30%)
    const capabilityMatch = this.calculateCapabilityMatch(agent.capabilities, task);
    score += capabilityMatch * 0.3;

    // 工作负载 (20%)
    const workloadScore = Math.max(0, 100 - agent.workload) / 100;
    score += workloadScore * 0.2;

    // 历史表现 (10%)
    const performanceScore = agent.performanceMetrics.averageQuality / 100;
    score += performanceScore * 0.1;

    return score;
  }

  /**
   * 计算角色任务匹配�?   */
  private calculateRoleTaskMatch(role: AgentRole, taskType: TaskType): number {
    const roleTaskMatrix: Record<AgentRole, Record<TaskType, number>> = {
      'coordinator': {
        'analysis': 0.9, 'design': 0.6, 'implementation': 0.4, 'testing': 0.5,
        'review': 0.8, 'documentation': 0.7, 'coordination': 1.0, 'research': 0.8, 'optimization': 0.6
      },
      'analyst': {
        'analysis': 1.0, 'design': 0.7, 'implementation': 0.3, 'testing': 0.6,
        'review': 0.8, 'documentation': 0.8, 'coordination': 0.5, 'research': 0.9, 'optimization': 0.7
      },
      'designer': {
        'analysis': 0.6, 'design': 1.0, 'implementation': 0.4, 'testing': 0.3,
        'review': 0.7, 'documentation': 0.6, 'coordination': 0.5, 'research': 0.7, 'optimization': 0.8
      },
      'developer': {
        'analysis': 0.5, 'design': 0.7, 'implementation': 1.0, 'testing': 0.6,
        'review': 0.8, 'documentation': 0.7, 'coordination': 0.4, 'research': 0.6, 'optimization': 0.9
      },
      'tester': {
        'analysis': 0.6, 'design': 0.4, 'implementation': 0.5, 'testing': 1.0,
        'review': 0.9, 'documentation': 0.8, 'coordination': 0.5, 'research': 0.7, 'optimization': 0.6
      },
      'reviewer': {
        'analysis': 0.8, 'design': 0.6, 'implementation': 0.6, 'testing': 0.8,
        'review': 1.0, 'documentation': 0.9, 'coordination': 0.6, 'research': 0.8, 'optimization': 0.7
      },
      'specialist': {
        'analysis': 0.8, 'design': 0.8, 'implementation': 0.8, 'testing': 0.8,
        'review': 0.8, 'documentation': 0.8, 'coordination': 0.6, 'research': 0.9, 'optimization': 0.9
      }
    };

    return roleTaskMatrix[role]?.[taskType] || 0.5;
  }

  /**
   * 计算能力匹配�?   */
  private calculateCapabilityMatch(capabilities: AgentCapability[], task: CollaborationTask): number {
    // 简化实现：基于能力名称和任务类型的匹配
    const relevantCapabilities = capabilities.filter(cap =>
      cap.domain.includes(task.type) ||
      cap.name.includes(task.type) ||
      task.description.toLowerCase().includes(cap.name.toLowerCase())
    );

    if (relevantCapabilities.length === 0) {
      return 0.5; // 默认匹配�?    }

    const avgLevel = relevantCapabilities.reduce((sum, cap) => {
      const levelScore = this.getCapabilityLevelScore(cap.level);
      return sum + levelScore;
    }, 0) / relevantCapabilities.length;

    return avgLevel / 5; // 归一化到0-1
  }

  /**
   * 获取能力级别分数
   */
  private getCapabilityLevelScore(level: CapabilityLevel): number {
    const levelScores: Record<CapabilityLevel, number> = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4,
      'master': 5
    };
    return levelScores[level];
  }

  /**
   * 获取协作统计
   */
  public getCollaborationStatistics(): {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    completedTasks: number;
    agentUtilization: Record<string, number>;
    averageTaskQuality: number;
    collaborationEfficiency: number;
  } {
    const totalProjects = this.activeProjects.size;
    const activeProjects = Array.from(this.activeProjects.values())
      .filter(p => p.status === 'active').length;

    const totalTasks = this.activeTasks.size;
    const completedTasks = Array.from(this.activeTasks.values())
      .filter(t => t.status === 'completed').length;

    const agentUtilization: Record<string, number> = {};
    for (const [agentId, agent] of this.agents) {
      agentUtilization[agent.name] = agent.workload;
    }

    const completedTasksList = Array.from(this.activeTasks.values())
      .filter(t => t.status === 'completed');

    const averageTaskQuality = completedTasksList.length > 0
      ? completedTasksList.reduce((sum, t) => sum + t.quality.overall, 0) / completedTasksList.length
      : 0;

    const collaborationEfficiency = completedTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      agentUtilization,
      averageTaskQuality,
      collaborationEfficiency
    };
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('collaboration.task_request', async (event) => {
      const { taskInfo, projectId } = event.payload;
      const bestAgent = await this.findBestAgentForTask(taskInfo);
      if (bestAgent) {
        await this.assignTaskToAgent(bestAgent.id, taskInfo, projectId);
      }
    });

    this.eventBus.subscribeEvent('collaboration.agent_available', (event) => {
      const { agentId } = event.payload;
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.currentStatus = 'available';
        // 检查是否有待分配的任务
        this.checkPendingTasks();
      }
    });
  }

  /**
   * 检查待分配的任�?   */
  private async checkPendingTasks(): Promise<void> {
    const pendingTasks = Array.from(this.activeTasks.values())
      .filter(task => task.status === 'pending');

    for (const task of pendingTasks) {
      const bestAgent = await this.findBestAgentForTask(task);
      if (bestAgent) {
        task.status = 'assigned';
        task.assignedTo = [bestAgent.id];
        bestAgent.currentStatus = 'busy';
        bestAgent.workload = Math.min(100, bestAgent.workload + (task.estimatedEffort * 10));

        this.eventBus.publishEvent('collaboration.task_auto_assigned', {
          taskId: task.id,
          task,
          agentId: bestAgent.id,
          agent: bestAgent
        }, 'MultiAgentCollaborationEngine');
      }
    }
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.agents.clear();
    this.activeProjects.clear();
    this.activeTasks.clear();
    this.activeSessions.clear();
    this.collaborationHistory = [];

    this.logger.info('Multi-Agent Collaboration Engine destroyed');
  }
}

// 辅助接口
interface CollaborationEvent {
  type: string;
  timestamp: Date;
  participants: string[];
  details: Record<string, any>;
}
