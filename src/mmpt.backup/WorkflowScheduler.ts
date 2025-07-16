/**
 * MMPT Workflow Scheduler
 * Magic Multi-role Prompt Toolkit 工作流调度器
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { WorkflowPhase, StateContext, MJOSError } from './types/index';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  phases: WorkflowPhase[];
  triggers: WorkflowTrigger[];
  constraints: WorkflowConstraints;
  metadata: WorkflowMetadata;
}

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  condition: string;
  action: string;
  priority: number;
}

export type TriggerType = 
  | 'time-based' 
  | 'event-based' 
  | 'condition-based' 
  | 'manual';

export interface WorkflowConstraints {
  maxDuration?: number;
  maxConcurrentPhases?: number;
  resourceLimits?: Map<string, number>;
  dependencies?: Map<string, string[]>;
}

export interface WorkflowMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  tags: string[];
  usageCount: number;
  successRate: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  currentPhase?: string;
  startTime: Date;
  endTime?: Date;
  context: StateContext;
  results: Map<string, any>;
  errors: ExecutionError[];
}

export type ExecutionStatus = 
  | 'pending' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface ExecutionError {
  phase: string;
  timestamp: Date;
  error: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

export interface ScheduleEntry {
  id: string;
  workflowId: string;
  scheduledTime: Date;
  recurrence?: RecurrencePattern;
  context: StateContext;
  status: 'scheduled' | 'executing' | 'completed' | 'failed';
}

export interface RecurrencePattern {
  type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
  endDate?: Date;
  customPattern?: string;
}

/**
 * 工作流调度器�? * 管理工作流的定义、调度和执行
 */
export class WorkflowScheduler {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private workflows = new Map<string, WorkflowDefinition>();
  private executions = new Map<string, WorkflowExecution>();
  private schedule = new Map<string, ScheduleEntry>();
  private activeExecutions = new Set<string>();
  private schedulerTimer?: NodeJS.Timeout;

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.initializeDefaultWorkflows();
    this.setupEventListeners();
    this.startScheduler();
    
    this.logger.info('Workflow Scheduler initialized');
  }

  /**
   * 注册工作�?   */
  public async registerWorkflow(workflow: WorkflowDefinition): Promise<boolean> {
    try {
      this.validateWorkflow(workflow);
      
      this.workflows.set(workflow.id, workflow);
      
      this.logger.info('Workflow registered', {
        workflowId: workflow.id,
        name: workflow.name,
        phaseCount: workflow.phases.length
      });

      this.eventBus.publishEvent('workflow.registered', {
        workflow
      }, 'WorkflowScheduler');

      return true;

    } catch (error) {
      this.logger.error('Failed to register workflow', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 执行工作�?   */
  public async executeWorkflow(
    workflowId: string,
    context: StateContext
  ): Promise<string | null> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        status: 'pending',
        startTime: new Date(),
        context,
        results: new Map(),
        errors: []
      };

      this.executions.set(executionId, execution);
      this.activeExecutions.add(executionId);

      this.logger.info('Workflow execution started', {
        executionId,
        workflowId,
        sessionId: context.sessionId
      });

      // 异步执行工作�?      this.executeWorkflowAsync(execution, workflow);

      return executionId;

    } catch (error) {
      this.logger.error('Failed to start workflow execution', {
        workflowId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 调度工作�?   */
  public async scheduleWorkflow(
    workflowId: string,
    scheduledTime: Date,
    context: StateContext,
    recurrence?: RecurrencePattern
  ): Promise<string | null> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const scheduleEntry: ScheduleEntry = {
        id: scheduleId,
        workflowId,
        scheduledTime,
        recurrence,
        context,
        status: 'scheduled'
      };

      this.schedule.set(scheduleId, scheduleEntry);

      this.logger.info('Workflow scheduled', {
        scheduleId,
        workflowId,
        scheduledTime,
        recurrence: recurrence?.type
      });

      this.eventBus.publishEvent('workflow.scheduled', {
        scheduleEntry
      }, 'WorkflowScheduler');

      return scheduleId;

    } catch (error) {
      this.logger.error('Failed to schedule workflow', {
        workflowId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 暂停工作流执�?   */
  public async pauseExecution(executionId: string): Promise<boolean> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      if (execution.status !== 'running') {
        throw new Error(`Cannot pause execution in status: ${execution.status}`);
      }

      execution.status = 'paused';

      this.logger.info('Workflow execution paused', { executionId });

      this.eventBus.publishEvent('workflow.paused', {
        executionId,
        execution
      }, 'WorkflowScheduler');

      return true;

    } catch (error) {
      this.logger.error('Failed to pause execution', {
        executionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 恢复工作流执�?   */
  public async resumeExecution(executionId: string): Promise<boolean> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      if (execution.status !== 'paused') {
        throw new Error(`Cannot resume execution in status: ${execution.status}`);
      }

      execution.status = 'running';
      this.activeExecutions.add(executionId);

      this.logger.info('Workflow execution resumed', { executionId });

      this.eventBus.publishEvent('workflow.resumed', {
        executionId,
        execution
      }, 'WorkflowScheduler');

      // 继续执行工作�?      const workflow = this.workflows.get(execution.workflowId);
      if (workflow) {
        this.executeWorkflowAsync(execution, workflow);
      }

      return true;

    } catch (error) {
      this.logger.error('Failed to resume execution', {
        executionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 取消工作流执�?   */
  public async cancelExecution(executionId: string): Promise<boolean> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      execution.status = 'cancelled';
      execution.endTime = new Date();
      this.activeExecutions.delete(executionId);

      this.logger.info('Workflow execution cancelled', { executionId });

      this.eventBus.publishEvent('workflow.cancelled', {
        executionId,
        execution
      }, 'WorkflowScheduler');

      return true;

    } catch (error) {
      this.logger.error('Failed to cancel execution', {
        executionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 获取工作流执行状�?   */
  public getExecutionStatus(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * 获取活跃执行
   */
  public getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions)
      .map(id => this.executions.get(id))
      .filter(exec => exec !== undefined) as WorkflowExecution[];
  }

  /**
   * 获取调度统计
   */
  public getSchedulerStatistics(): {
    totalWorkflows: number;
    activeExecutions: number;
    scheduledTasks: number;
    completedExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  } {
    const allExecutions = Array.from(this.executions.values());
    const completedExecutions = allExecutions.filter(e => e.status === 'completed');
    const failedExecutions = allExecutions.filter(e => e.status === 'failed');
    const scheduledTasks = Array.from(this.schedule.values()).filter(s => s.status === 'scheduled').length;

    const totalExecutionTime = completedExecutions.reduce((sum, exec) => {
      if (exec.endTime) {
        return sum + (exec.endTime.getTime() - exec.startTime.getTime());
      }
      return sum;
    }, 0);

    const averageExecutionTime = completedExecutions.length > 0 ? 
      totalExecutionTime / completedExecutions.length : 0;

    return {
      totalWorkflows: this.workflows.size,
      activeExecutions: this.activeExecutions.size,
      scheduledTasks,
      completedExecutions: completedExecutions.length,
      failedExecutions: failedExecutions.length,
      averageExecutionTime
    };
  }

  /**
   * 异步执行工作�?   */
  private async executeWorkflowAsync(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<void> {
    try {
      execution.status = 'running';

      this.eventBus.publishEvent('workflow.started', {
        executionId: execution.id,
        execution
      }, 'WorkflowScheduler');

      for (let i = 0; i < workflow.phases.length; i++) {
        const phase = workflow.phases[i];
        
        // 检查执行状�?        if (execution.status === 'paused') {
          this.logger.debug('Execution paused, stopping phase execution', {
            executionId: execution.id,
            phase: phase.name
          });
          return;
        }

        if (execution.status === 'cancelled') {
          this.logger.debug('Execution cancelled, stopping phase execution', {
            executionId: execution.id,
            phase: phase.name
          });
          return;
        }

        execution.currentPhase = phase.name;

        this.logger.debug('Executing workflow phase', {
          executionId: execution.id,
          phase: phase.name,
          phaseIndex: i
        });

        try {
          const phaseResult = await this.executePhase(phase, execution.context);
          execution.results.set(phase.name, phaseResult);

          this.eventBus.publishEvent('workflow.phase_completed', {
            executionId: execution.id,
            phase: phase.name,
            result: phaseResult
          }, 'WorkflowScheduler');

        } catch (phaseError) {
          const error: ExecutionError = {
            phase: phase.name,
            timestamp: new Date(),
            error: phaseError instanceof Error ? phaseError.message : String(phaseError),
            severity: 'high',
            recoverable: false
          };

          execution.errors.push(error);

          this.logger.error('Workflow phase failed', {
            executionId: execution.id,
            phase: phase.name,
            error: error.error
          });

          // 根据错误严重程度决定是否继续
          if (error.severity === 'critical') {
            throw phaseError;
          }
        }
      }

      // 工作流完�?      execution.status = 'completed';
      execution.endTime = new Date();
      this.activeExecutions.delete(execution.id);

      // 更新工作流统�?      workflow.metadata.usageCount += 1;
      workflow.metadata.successRate = this.calculateSuccessRate(workflow.id);

      this.logger.info('Workflow execution completed', {
        executionId: execution.id,
        workflowId: workflow.id,
        duration: execution.endTime.getTime() - execution.startTime.getTime()
      });

      this.eventBus.publishEvent('workflow.completed', {
        executionId: execution.id,
        execution
      }, 'WorkflowScheduler');

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      this.activeExecutions.delete(execution.id);

      const executionError: ExecutionError = {
        phase: execution.currentPhase || 'unknown',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        severity: 'critical',
        recoverable: false
      };

      execution.errors.push(executionError);

      this.logger.error('Workflow execution failed', {
        executionId: execution.id,
        workflowId: workflow.id,
        error: executionError.error
      });

      this.eventBus.publishEvent('workflow.failed', {
        executionId: execution.id,
        execution,
        error: executionError
      }, 'WorkflowScheduler');
    }
  }

  /**
   * 执行阶段
   */
  private async executePhase(phase: WorkflowPhase, context: StateContext): Promise<any> {
    // 发布阶段开始事�?    this.eventBus.publishEvent('workflow.phase_started', {
      phase,
      context
    }, 'WorkflowScheduler');

    // 模拟阶段执行
    await new Promise(resolve => setTimeout(resolve, phase.duration || 1000));

    // 返回模拟结果
    return {
      phase: phase.name,
      owner: phase.owner,
      deliverables: phase.deliverables,
      completedAt: new Date()
    };
  }

  /**
   * 计算成功�?   */
  private calculateSuccessRate(workflowId: string): number {
    const workflowExecutions = Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId);

    if (workflowExecutions.length === 0) return 0;

    const successfulExecutions = workflowExecutions.filter(exec => exec.status === 'completed');
    return (successfulExecutions.length / workflowExecutions.length) * 100;
  }

  /**
   * 启动调度�?   */
  private startScheduler(): void {
    this.schedulerTimer = setInterval(() => {
      this.checkScheduledTasks();
    }, 60000); // 每分钟检查一�?
    this.logger.debug('Workflow scheduler started');
  }

  /**
   * 检查调度任�?   */
  private checkScheduledTasks(): void {
    const now = new Date();

    for (const [scheduleId, entry] of this.schedule) {
      if (entry.status === 'scheduled' && entry.scheduledTime <= now) {
        this.logger.debug('Executing scheduled workflow', {
          scheduleId,
          workflowId: entry.workflowId
        });

        entry.status = 'executing';
        
        this.executeWorkflow(entry.workflowId, entry.context)
          .then(executionId => {
            if (executionId) {
              entry.status = 'completed';
              
              // 处理重复执行
              if (entry.recurrence) {
                this.scheduleNextRecurrence(entry);
              }
            } else {
              entry.status = 'failed';
            }
          })
          .catch(error => {
            entry.status = 'failed';
            this.logger.error('Scheduled workflow execution failed', {
              scheduleId,
              error: error instanceof Error ? error.message : String(error)
            });
          });
      }
    }
  }

  /**
   * 调度下次重复执行
   */
  private scheduleNextRecurrence(entry: ScheduleEntry): void {
    if (!entry.recurrence) return;

    let nextTime: Date;
    const currentTime = entry.scheduledTime;

    switch (entry.recurrence.type) {
      case 'daily':
        nextTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextTime = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextTime = new Date(currentTime);
        nextTime.setMonth(nextTime.getMonth() + 1);
        break;
      default:
        return;
    }

    // 检查结束日�?    if (entry.recurrence.endDate && nextTime > entry.recurrence.endDate) {
      return;
    }

    // 创建新的调度条目
    this.scheduleWorkflow(
      entry.workflowId,
      nextTime,
      entry.context,
      entry.recurrence
    );
  }

  /**
   * 验证工作�?   */
  private validateWorkflow(workflow: WorkflowDefinition): void {
    if (!workflow.id) {
      throw new Error('Workflow ID is required');
    }

    if (!workflow.name) {
      throw new Error('Workflow name is required');
    }

    if (!workflow.phases || workflow.phases.length === 0) {
      throw new Error('Workflow must have at least one phase');
    }

    // 验证阶段依赖
    const phaseNames = new Set(workflow.phases.map(p => p.name));
    for (const phase of workflow.phases) {
      if (phase.dependencies) {
        for (const dep of phase.dependencies) {
          if (!phaseNames.has(dep)) {
            throw new Error(`Phase dependency not found: ${dep}`);
          }
        }
      }
    }
  }

  /**
   * 初始化默认工作流
   */
  private initializeDefaultWorkflows(): void {
    const defaultWorkflows: WorkflowDefinition[] = [
      {
        id: 'project-development',
        name: '项目开发工作流',
        description: '标准的项目开发流�?,
        phases: [
          {
            name: '需求分�?,
            owner: 'moxiaozhi',
            deliverables: ['需求文�?, '用户故事'],
            duration: 3600000, // 1小时
            dependencies: []
          },
          {
            name: '系统设计',
            owner: 'moxiaozhi',
            deliverables: ['系统架构�?, '技术方�?],
            duration: 7200000, // 2小时
            dependencies: ['需求分�?]
          },
          {
            name: '功能开�?,
            owner: 'moxiaoma',
            deliverables: ['功能代码', '单元测试'],
            duration: 14400000, // 4小时
            dependencies: ['系统设计']
          }
        ],
        triggers: [
          {
            id: 'project-start',
            type: 'manual',
            condition: 'project_created',
            action: 'start_workflow',
            priority: 10
          }
        ],
        constraints: {
          maxDuration: 86400000, // 24小时
          maxConcurrentPhases: 2
        },
        metadata: {
          author: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          tags: ['development', 'standard'],
          usageCount: 0,
          successRate: 0
        }
      }
    ];

    for (const workflow of defaultWorkflows) {
      this.workflows.set(workflow.id, workflow);
    }

    this.logger.debug('Default workflows initialized', {
      workflowCount: defaultWorkflows.length
    });
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('project.created', async (event) => {
      const { projectId, context } = event.payload;
      
      // 自动启动项目开发工作流
      await this.executeWorkflow('project-development', context);
    });

    this.eventBus.subscribeEvent('workflow.trigger', async (event) => {
      const { workflowId, context } = event.payload;
      
      await this.executeWorkflow(workflowId, context);
    });
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = undefined;
    }

    this.logger.info('Workflow Scheduler destroyed');
  }
}
