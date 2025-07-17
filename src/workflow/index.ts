/**
 * MJOS Collaborative Workflow Engine
 * 魔剑工作室操作系统协作工作流引擎
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/index';
import { AgentManager } from '../agents/index';
import { RoleManager } from '../roles/index';
import { TeamManager } from '../team/index';
import { CommunicationManager } from '../communication/index';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  description?: string;
  config: WorkflowStepConfig;
  dependencies: string[]; // step IDs
  conditions?: WorkflowCondition[];
  timeout?: number;
  retryPolicy?: RetryPolicy;
  onSuccess?: WorkflowAction[];
  onFailure?: WorkflowAction[];
}

export type WorkflowStepType = 
  | 'task' 
  | 'decision' 
  | 'parallel' 
  | 'loop' 
  | 'wait' 
  | 'notification' 
  | 'integration' 
  | 'human_approval';

export interface WorkflowStepConfig {
  [key: string]: any;
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'scheduled' | 'event' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

export interface WorkflowCondition {
  expression: string;
  variables: string[];
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  baseDelay: number;
  maxDelay?: number;
}

export interface WorkflowAction {
  type: 'set_variable' | 'send_notification' | 'call_webhook' | 'assign_task';
  config: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  currentStep?: string;
  variables: Record<string, any>;
  stepExecutions: Map<string, StepExecution>;
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string;
  metadata: Record<string, any>;
}

export type WorkflowExecutionStatus = 
  | 'pending' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface StepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  retryCount: number;
  assignedTo?: string;
}

export interface WorkflowEngineOptions {
  maxConcurrentExecutions?: number;
  defaultTimeout?: number;
  enablePersistence?: boolean;
  persistencePath?: string;
  enableMetrics?: boolean;
}

export class WorkflowEngine extends EventEmitter {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private activeExecutions: Set<string> = new Set();
  private logger: Logger;
  private options: WorkflowEngineOptions;
  private agentManager: AgentManager | undefined;
  private roleManager: RoleManager | undefined;
  private teamManager: TeamManager | undefined;
  private communicationManager: CommunicationManager | undefined;

  constructor(
    options: WorkflowEngineOptions = {},
    agentManager?: AgentManager,
    roleManager?: RoleManager,
    teamManager?: TeamManager,
    communicationManager?: CommunicationManager
  ) {
    super();
    
    this.options = {
      maxConcurrentExecutions: options.maxConcurrentExecutions || 10,
      defaultTimeout: options.defaultTimeout || 300000, // 5 minutes
      enablePersistence: options.enablePersistence || false,
      persistencePath: options.persistencePath || 'workflows.json',
      enableMetrics: options.enableMetrics || true,
      ...options
    };

    this.logger = new Logger('WorkflowEngine');
    this.agentManager = agentManager;
    this.roleManager = roleManager;
    this.teamManager = teamManager;
    this.communicationManager = communicationManager;

    this.initializeDefaultWorkflows();
  }

  private initializeDefaultWorkflows(): void {
    // Simple task assignment workflow
    const taskAssignmentWorkflow: WorkflowDefinition = {
      id: 'task_assignment',
      name: 'Intelligent Task Assignment',
      description: 'Automatically assign tasks to the best available team members',
      version: '1.0.0',
      steps: [
        {
          id: 'analyze_task',
          name: 'Analyze Task Requirements',
          type: 'task',
          config: {
            action: 'analyze_requirements',
            input: '${task}'
          },
          dependencies: [],
          timeout: 30000
        },
        {
          id: 'find_candidates',
          name: 'Find Suitable Candidates',
          type: 'task',
          config: {
            action: 'find_agents',
            capabilities: '${required_capabilities}'
          },
          dependencies: ['analyze_task'],
          timeout: 15000
        },
        {
          id: 'select_assignee',
          name: 'Select Best Assignee',
          type: 'decision',
          config: {
            strategy: 'best_match',
            criteria: ['availability', 'expertise', 'workload']
          },
          dependencies: ['find_candidates']
        },
        {
          id: 'assign_task',
          name: 'Assign Task',
          type: 'task',
          config: {
            action: 'assign_to_agent',
            agentId: '${selected_agent}',
            taskId: '${task.id}'
          },
          dependencies: ['select_assignee'],
          onSuccess: [
            {
              type: 'send_notification',
              config: {
                recipient: '${selected_agent}',
                message: 'New task assigned: ${task.title}'
              }
            }
          ]
        }
      ],
      triggers: [
        {
          id: 'task_created',
          type: 'event',
          config: {
            eventType: 'task:created',
            condition: 'task.assignedTo === null'
          },
          enabled: true
        }
      ],
      variables: {},
      metadata: { category: 'task_management' },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(taskAssignmentWorkflow.id, taskAssignmentWorkflow);
    this.logger.info('Default workflows initialized');
  }

  // Workflow Management
  createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateWorkflowId();
    const workflow: WorkflowDefinition = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...definition
    };

    this.workflows.set(id, workflow);
    this.emit('workflow-created', workflow);
    this.logger.info(`Workflow created: ${definition.name}`);

    return id;
  }

  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): boolean {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      return false;
    }

    const updatedWorkflow: WorkflowDefinition = {
      ...workflow,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date()
    };

    this.workflows.set(id, updatedWorkflow);
    this.emit('workflow-updated', updatedWorkflow);
    this.logger.debug(`Workflow updated: ${id}`);

    return true;
  }

  deleteWorkflow(id: string): boolean {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      return false;
    }

    // Cancel any active executions
    this.cancelWorkflowExecutions(id);

    this.workflows.delete(id);
    this.emit('workflow-deleted', id);
    this.logger.info(`Workflow deleted: ${id}`);

    return true;
  }

  // Workflow Execution
  async executeWorkflow(workflowId: string, variables: Record<string, any> = {}, triggeredBy: string = 'manual'): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (this.activeExecutions.size >= this.options.maxConcurrentExecutions!) {
      throw new Error('Maximum concurrent executions reached');
    }

    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'pending',
      variables: { ...workflow.variables, ...variables },
      stepExecutions: new Map(),
      startedAt: new Date(),
      triggeredBy,
      metadata: {}
    };

    this.executions.set(executionId, execution);
    this.activeExecutions.add(executionId);

    this.emit('execution-started', execution);
    this.logger.info(`Workflow execution started: ${executionId} (${workflow.name})`);

    // Start execution asynchronously
    this.runExecution(execution).catch(error => {
      this.logger.error(`Workflow execution failed: ${executionId}`, error);
      this.failExecution(executionId, error.message);
    });

    return executionId;
  }

  private async runExecution(execution: WorkflowExecution): Promise<void> {
    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${execution.workflowId}`);
    }

    execution.status = 'running';
    this.emit('execution-status-changed', execution);

    try {
      // Execute steps in dependency order
      const executionOrder = this.calculateExecutionOrder(workflow.steps);
      
      for (const stepId of executionOrder) {
        const step = workflow.steps.find(s => s.id === stepId);
        if (!step) continue;

        // Check if step should be executed
        if (!await this.shouldExecuteStep(step, execution)) {
          this.skipStep(execution, stepId);
          continue;
        }

        // Execute step
        await this.executeStep(execution, step);

        // Check if execution was cancelled or failed
        if (execution.status !== 'running') {
          return;
        }
      }

      // Mark execution as completed
      execution.status = 'completed';
      execution.completedAt = new Date();
      this.activeExecutions.delete(execution.id);

      this.emit('execution-completed', execution);
      this.logger.info(`Workflow execution completed: ${execution.id}`);

    } catch (error) {
      this.failExecution(execution.id, error instanceof Error ? error.message : String(error));
    }
  }

  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    const stepExecution: StepExecution = {
      stepId: step.id,
      status: 'running',
      startedAt: new Date(),
      retryCount: 0
    };

    execution.stepExecutions.set(step.id, stepExecution);
    execution.currentStep = step.id;

    this.emit('step-started', { execution, step, stepExecution });
    this.logger.debug(`Step started: ${step.name} (${execution.id})`);

    try {
      // Replace variables in step config before execution
      const resolvedStep = this.resolveStepVariables(step, execution);

      let result: any;

      switch (resolvedStep.type) {
      case 'task':
        result = await this.executeTaskStep(resolvedStep, execution);
        break;
      case 'decision':
        result = await this.executeDecisionStep(resolvedStep, execution);
        break;
      case 'parallel':
        result = await this.executeParallelStep(resolvedStep, execution);
        break;
      case 'wait':
        result = await this.executeWaitStep(resolvedStep, execution);
        break;
      case 'notification':
        result = await this.executeNotificationStep(resolvedStep, execution);
        break;
      case 'human_approval':
        result = await this.executeHumanApprovalStep(resolvedStep, execution);
        break;
      default:
        throw new Error(`Unsupported step type: ${resolvedStep.type}`);
      }

      stepExecution.status = 'completed';
      stepExecution.completedAt = new Date();
      stepExecution.result = result;

      // Store result variables back to execution context
      if (result && typeof result === 'object') {
        Object.assign(execution.variables, result);
      }

      // Execute success actions
      if (step.onSuccess) {
        await this.executeActions(step.onSuccess, execution);
      }

      this.emit('step-completed', { execution, step, stepExecution, result });
      this.logger.debug(`Step completed: ${step.name} (${execution.id})`);

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.completedAt = new Date();
      stepExecution.error = error instanceof Error ? error.message : String(error);

      // Execute failure actions
      if (step.onFailure) {
        await this.executeActions(step.onFailure, execution);
      }

      this.emit('step-failed', { execution, step, stepExecution, error });
      this.logger.error(`Step failed: ${step.name} (${execution.id})`, error);

      throw error;
    }
  }

  private async executeTaskStep(step: WorkflowStep, _execution: WorkflowExecution): Promise<any> {
    const config = step.config;
    const action = config.action;

    switch (action) {
    case 'assign_to_agent':
      if (this.agentManager) {
        return await this.agentManager.assignTask(
          config.agentId,
          config.taskId,
          config.priority || 1
        );
      }
      break;
    case 'create_task':
      if (this.teamManager) {
        return this.teamManager.createTask({
          title: config.title,
          description: config.description,
          status: 'pending',
          priority: config.priority || 'medium'
        });
      }
      break;
    case 'analyze_requirements':
      // Simulate task analysis
      return {
        complexity: 'medium',
        estimatedTime: 30,
        requiredSkills: ['analysis'],
        dependencies: []
      };
    case 'find_agents':
      // Simulate finding suitable agents
      return {
        agents: [
          { id: 'agent_1', name: 'Agent 1', skills: ['analysis', 'development'] },
          { id: 'agent_2', name: 'Agent 2', skills: ['testing', 'documentation'] }
        ],
        totalFound: 2
      };
    default:
      throw new Error(`Unknown task action: ${action}`);
    }

    return null;
  }

  private async executeDecisionStep(step: WorkflowStep, _execution: WorkflowExecution): Promise<any> {
    const config = step.config;
    const strategy = config.strategy;

    switch (strategy) {
    case 'best_match':
      // Get available agents from agent manager
      if (this.agentManager) {
        const agents = this.agentManager.getAllAgents();
        if (agents.length > 0) {
          // Select the first available agent (could be enhanced with better logic)
          const selectedAgent = agents[0];
          if (selectedAgent && selectedAgent.id) {
            return { selected_agent: selectedAgent.id, confidence: 0.8 };
          }
        }
      }
      // Fallback if no agent manager or no agents
      return { selected_agent: 'default_agent', confidence: 0.5 };
    default:
      throw new Error(`Unknown decision strategy: ${strategy}`);
    }
  }

  private async executeParallelStep(step: WorkflowStep, _execution: WorkflowExecution): Promise<any> {
    // Execute multiple sub-steps in parallel
    const subSteps = step.config.steps || [];
    const results = await Promise.allSettled(
      subSteps.map((subStep: any) => this.executeStep(_execution, subStep))
    );
    
    return results;
  }

  private async executeWaitStep(step: WorkflowStep, _execution: WorkflowExecution): Promise<any> {
    const delay = step.config.delay || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return { waited: delay };
  }

  private async executeNotificationStep(step: WorkflowStep, _execution: WorkflowExecution): Promise<any> {
    if (this.communicationManager) {
      return await this.communicationManager.sendMessage(
        'system',
        step.config.recipient,
        'notification',
        step.config.message
      );
    }
    return null;
  }

  private async executeHumanApprovalStep(_step: WorkflowStep, _execution: WorkflowExecution): Promise<any> {
    // This would typically wait for human input
    // For now, we'll simulate approval
    return { approved: true, approver: 'human', timestamp: new Date() };
  }

  private async executeActions(actions: WorkflowAction[], execution: WorkflowExecution): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
        case 'set_variable':
          execution.variables[action.config.name] = action.config.value;
          break;
        case 'send_notification':
          if (this.communicationManager) {
            await this.communicationManager.sendMessage(
              'system',
              action.config.recipient,
              'notification',
              action.config.message
            );
          }
          break;
        default:
          this.logger.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        this.logger.error(`Action execution failed: ${action.type}`, error);
      }
    }
  }

  private calculateExecutionOrder(steps: WorkflowStep[]): string[] {
    // Simple topological sort for dependency resolution
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (stepId: string) => {
      if (visited.has(stepId)) return;
      
      const step = steps.find(s => s.id === stepId);
      if (!step) return;

      visited.add(stepId);
      
      // Visit dependencies first
      step.dependencies.forEach(depId => visit(depId));
      
      result.push(stepId);
    };

    steps.forEach(step => visit(step.id));
    return result;
  }

  private async shouldExecuteStep(step: WorkflowStep, execution: WorkflowExecution): Promise<boolean> {
    if (!step.conditions) return true;

    for (const condition of step.conditions) {
      // Simple condition evaluation - could be enhanced
      try {
        const result = this.evaluateCondition(condition.expression, execution.variables);
        if (!result) return false;
      } catch (error) {
        this.logger.warn(`Condition evaluation failed: ${condition.expression}`, error);
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(expression: string, variables: Record<string, any>): boolean {
    // Simple expression evaluation - in practice, would use a proper expression evaluator
    try {
      // Replace variable references
      let evaluableExpression = expression;
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        evaluableExpression = evaluableExpression.replace(regex, JSON.stringify(value));
      }
      
      return eval(evaluableExpression);
    } catch (error) {
      return false;
    }
  }

  private skipStep(execution: WorkflowExecution, stepId: string): void {
    const stepExecution: StepExecution = {
      stepId,
      status: 'skipped',
      startedAt: new Date(),
      completedAt: new Date(),
      retryCount: 0
    };

    execution.stepExecutions.set(stepId, stepExecution);
    this.emit('step-skipped', { execution, stepId });
  }

  private failExecution(executionId: string, error: string): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'failed';
    execution.completedAt = new Date();
    execution.metadata.error = error;
    
    this.activeExecutions.delete(executionId);
    this.emit('execution-failed', { execution, error });
  }

  private cancelWorkflowExecutions(workflowId: string): void {
    for (const execution of this.executions.values()) {
      if (execution.workflowId === workflowId && this.activeExecutions.has(execution.id)) {
        execution.status = 'cancelled';
        execution.completedAt = new Date();
        this.activeExecutions.delete(execution.id);
        this.emit('execution-cancelled', execution);
      }
    }
  }

  // Utility methods
  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions)
      .map(id => this.executions.get(id))
      .filter(exec => exec !== undefined) as WorkflowExecution[];
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Statistics
  getStats(): {
    totalWorkflows: number;
    totalExecutions: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    } {
    const executions = Array.from(this.executions.values());
    
    return {
      totalWorkflows: this.workflows.size,
      totalExecutions: executions.length,
      activeExecutions: this.activeExecutions.size,
      completedExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length
    };
  }

  // Cleanup
  clear(): void {
    // Cancel all active executions
    for (const executionId of this.activeExecutions) {
      const execution = this.executions.get(executionId);
      if (execution) {
        execution.status = 'cancelled';
        execution.completedAt = new Date();
      }
    }

    this.workflows.clear();
    this.executions.clear();
    this.activeExecutions.clear();

    // Reinitialize defaults
    this.initializeDefaultWorkflows();

    this.emit('cleared');
    this.logger.info('Workflow engine cleared');
  }

  // Destroy and cleanup all resources
  destroy(): void {
    // Cancel all active executions
    for (const executionId of this.activeExecutions) {
      const execution = this.executions.get(executionId);
      if (execution) {
        execution.status = 'cancelled';
        execution.completedAt = new Date();
      }
    }
  }

  /**
   * Resolve variables in step configuration
   */
  private resolveStepVariables(step: WorkflowStep, execution: WorkflowExecution): WorkflowStep {
    const resolvedStep = JSON.parse(JSON.stringify(step)); // Deep clone

    // Replace variables in config
    if (resolvedStep.config) {
      resolvedStep.config = this.replaceVariables(resolvedStep.config, execution.variables);
    }

    return resolvedStep;
  }

  /**
   * Replace variables in an object recursively
   */
  private replaceVariables(obj: any, variables: Record<string, any>): any {
    if (typeof obj === 'string') {
      // Replace ${variable} patterns
      return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        return variables[varName] !== undefined ? variables[varName] : match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.replaceVariables(item, variables));
    } else if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariables(value, variables);
      }
      return result;
    }

    return obj;
  }
}
