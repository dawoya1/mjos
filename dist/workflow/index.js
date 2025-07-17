"use strict";
/**
 * MJOS Collaborative Workflow Engine
 * 魔剑工作室操作系统协作工作流引擎
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEngine = void 0;
const events_1 = require("events");
const index_1 = require("../core/index");
class WorkflowEngine extends events_1.EventEmitter {
    constructor(options = {}, agentManager, roleManager, teamManager, communicationManager) {
        super();
        this.workflows = new Map();
        this.executions = new Map();
        this.activeExecutions = new Set();
        this.options = {
            maxConcurrentExecutions: options.maxConcurrentExecutions || 10,
            defaultTimeout: options.defaultTimeout || 300000, // 5 minutes
            enablePersistence: options.enablePersistence || false,
            persistencePath: options.persistencePath || 'workflows.json',
            enableMetrics: options.enableMetrics || true,
            ...options
        };
        this.logger = new index_1.Logger('WorkflowEngine');
        this.agentManager = agentManager;
        this.roleManager = roleManager;
        this.teamManager = teamManager;
        this.communicationManager = communicationManager;
        this.initializeDefaultWorkflows();
    }
    initializeDefaultWorkflows() {
        // Simple task assignment workflow
        const taskAssignmentWorkflow = {
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
    createWorkflow(definition) {
        const id = this.generateWorkflowId();
        const workflow = {
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
    getWorkflow(id) {
        return this.workflows.get(id);
    }
    updateWorkflow(id, updates) {
        const workflow = this.workflows.get(id);
        if (!workflow) {
            return false;
        }
        const updatedWorkflow = {
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
    deleteWorkflow(id) {
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
    async executeWorkflow(workflowId, variables = {}, triggeredBy = 'manual') {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        if (this.activeExecutions.size >= this.options.maxConcurrentExecutions) {
            throw new Error('Maximum concurrent executions reached');
        }
        const executionId = this.generateExecutionId();
        const execution = {
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
    async runExecution(execution) {
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
                if (!step)
                    continue;
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
        }
        catch (error) {
            this.failExecution(execution.id, error instanceof Error ? error.message : String(error));
        }
    }
    async executeStep(execution, step) {
        const stepExecution = {
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
            let result;
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
        }
        catch (error) {
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
    async executeTaskStep(step, _execution) {
        const config = step.config;
        const action = config.action;
        switch (action) {
            case 'assign_to_agent':
                if (this.agentManager) {
                    return await this.agentManager.assignTask(config.agentId, config.taskId, config.priority || 1);
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
    async executeDecisionStep(step, _execution) {
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
    async executeParallelStep(step, _execution) {
        // Execute multiple sub-steps in parallel
        const subSteps = step.config.steps || [];
        const results = await Promise.allSettled(subSteps.map((subStep) => this.executeStep(_execution, subStep)));
        return results;
    }
    async executeWaitStep(step, _execution) {
        const delay = step.config.delay || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return { waited: delay };
    }
    async executeNotificationStep(step, _execution) {
        if (this.communicationManager) {
            return await this.communicationManager.sendMessage('system', step.config.recipient, 'notification', step.config.message);
        }
        return null;
    }
    async executeHumanApprovalStep(_step, _execution) {
        // This would typically wait for human input
        // For now, we'll simulate approval
        return { approved: true, approver: 'human', timestamp: new Date() };
    }
    async executeActions(actions, execution) {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'set_variable':
                        execution.variables[action.config.name] = action.config.value;
                        break;
                    case 'send_notification':
                        if (this.communicationManager) {
                            await this.communicationManager.sendMessage('system', action.config.recipient, 'notification', action.config.message);
                        }
                        break;
                    default:
                        this.logger.warn(`Unknown action type: ${action.type}`);
                }
            }
            catch (error) {
                this.logger.error(`Action execution failed: ${action.type}`, error);
            }
        }
    }
    calculateExecutionOrder(steps) {
        // Simple topological sort for dependency resolution
        const visited = new Set();
        const result = [];
        const visit = (stepId) => {
            if (visited.has(stepId))
                return;
            const step = steps.find(s => s.id === stepId);
            if (!step)
                return;
            visited.add(stepId);
            // Visit dependencies first
            step.dependencies.forEach(depId => visit(depId));
            result.push(stepId);
        };
        steps.forEach(step => visit(step.id));
        return result;
    }
    async shouldExecuteStep(step, execution) {
        if (!step.conditions)
            return true;
        for (const condition of step.conditions) {
            // Simple condition evaluation - could be enhanced
            try {
                const result = this.evaluateCondition(condition.expression, execution.variables);
                if (!result)
                    return false;
            }
            catch (error) {
                this.logger.warn(`Condition evaluation failed: ${condition.expression}`, error);
                return false;
            }
        }
        return true;
    }
    evaluateCondition(expression, variables) {
        // Simple expression evaluation - in practice, would use a proper expression evaluator
        try {
            // Replace variable references
            let evaluableExpression = expression;
            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
                evaluableExpression = evaluableExpression.replace(regex, JSON.stringify(value));
            }
            return eval(evaluableExpression);
        }
        catch (error) {
            return false;
        }
    }
    skipStep(execution, stepId) {
        const stepExecution = {
            stepId,
            status: 'skipped',
            startedAt: new Date(),
            completedAt: new Date(),
            retryCount: 0
        };
        execution.stepExecutions.set(stepId, stepExecution);
        this.emit('step-skipped', { execution, stepId });
    }
    failExecution(executionId, error) {
        const execution = this.executions.get(executionId);
        if (!execution)
            return;
        execution.status = 'failed';
        execution.completedAt = new Date();
        execution.metadata.error = error;
        this.activeExecutions.delete(executionId);
        this.emit('execution-failed', { execution, error });
    }
    cancelWorkflowExecutions(workflowId) {
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
    getExecution(id) {
        return this.executions.get(id);
    }
    getActiveExecutions() {
        return Array.from(this.activeExecutions)
            .map(id => this.executions.get(id))
            .filter(exec => exec !== undefined);
    }
    generateWorkflowId() {
        return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Statistics
    getStats() {
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
    clear() {
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
    destroy() {
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
    resolveStepVariables(step, execution) {
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
    replaceVariables(obj, variables) {
        if (typeof obj === 'string') {
            // Replace ${variable} patterns
            return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
                return variables[varName] !== undefined ? variables[varName] : match;
            });
        }
        else if (Array.isArray(obj)) {
            return obj.map(item => this.replaceVariables(item, variables));
        }
        else if (obj && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.replaceVariables(value, variables);
            }
            return result;
        }
        return obj;
    }
}
exports.WorkflowEngine = WorkflowEngine;
//# sourceMappingURL=index.js.map