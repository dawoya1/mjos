"use strict";
/**
 * MJOS Agent Management System
 * 魔剑工作室操作系统智能体管理系统
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentManager = void 0;
const events_1 = require("events");
const index_1 = require("../core/index");
class AgentManager extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.agents = new Map();
        this.taskAssignments = new Map();
        this.capabilityIndex = new Map();
        this.options = {
            maxAgents: options.maxAgents || 50,
            defaultTimeout: options.defaultTimeout || 30000,
            enableLearning: options.enableLearning || false,
            enableCollaboration: options.enableCollaboration || true,
            performanceTracking: options.performanceTracking || true,
            ...options
        };
        this.logger = new index_1.Logger('AgentManager');
        this.initializeCapabilityIndex();
    }
    initializeCapabilityIndex() {
        const capabilityTypes = ['perception', 'reasoning', 'planning', 'execution', 'communication', 'learning'];
        capabilityTypes.forEach(type => {
            this.capabilityIndex.set(type, new Set());
        });
    }
    // Create and register a new agent
    createAgent(definition) {
        if (this.agents.size >= this.options.maxAgents) {
            throw new Error('Maximum number of agents reached');
        }
        const id = this.generateAgentId();
        const agent = {
            id,
            ...definition,
            state: {
                status: 'idle',
                currentTasks: [],
                performance: {
                    tasksCompleted: 0,
                    successRate: 1.0,
                    averageResponseTime: 0,
                    qualityScore: 1.0,
                    collaborationScore: 1.0
                },
                lastActivity: new Date(),
                metadata: {}
            }
        };
        this.agents.set(id, agent);
        this.updateCapabilityIndex(agent);
        this.emit('agent-created', agent);
        this.logger.info(`Agent created: ${id} (${definition.name})`);
        return id;
    }
    // Get agent by ID
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    // Get all agents
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    // Update agent configuration
    updateAgent(agentId, updates) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }
        // Remove from old capability index
        this.removeFromCapabilityIndex(agent);
        // Apply updates
        const updatedAgent = {
            ...agent,
            ...updates,
            id: agentId, // Preserve ID
            state: {
                ...agent.state,
                ...updates.state
            }
        };
        this.agents.set(agentId, updatedAgent);
        this.updateCapabilityIndex(updatedAgent);
        this.emit('agent-updated', updatedAgent);
        this.logger.debug(`Agent updated: ${agentId}`);
        return true;
    }
    // Delete agent
    deleteAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }
        // Cancel all active tasks
        this.cancelAgentTasks(agentId);
        // Remove from indices
        this.removeFromCapabilityIndex(agent);
        // Delete agent
        this.agents.delete(agentId);
        this.emit('agent-deleted', agentId);
        this.logger.info(`Agent deleted: ${agentId}`);
        return true;
    }
    // Find agents by capability
    findAgentsByCapability(capability) {
        const agentIds = this.capabilityIndex.get(capability) || new Set();
        return Array.from(agentIds)
            .map(id => this.agents.get(id))
            .filter(agent => agent !== undefined);
    }
    // Find best agent for a task
    findBestAgent(requiredCapabilities, _taskPriority = 1) {
        const candidates = [];
        for (const agent of this.agents.values()) {
            if (agent.state.status === 'offline' || agent.state.status === 'error') {
                continue;
            }
            // Check if agent has required capabilities
            const hasAllCapabilities = requiredCapabilities.every(reqCap => agent.capabilities.some(cap => cap.type === reqCap));
            if (!hasAllCapabilities) {
                continue;
            }
            // Calculate suitability score
            const score = this.calculateAgentScore(agent, requiredCapabilities, _taskPriority);
            candidates.push({ agent, score });
        }
        if (candidates.length === 0) {
            return null;
        }
        // Sort by score and return best candidate
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0]?.agent || null;
    }
    // Assign task to agent
    assignTask(agentId, taskId, priority = 1, deadline) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        if (agent.state.status === 'offline' || agent.state.status === 'error') {
            throw new Error(`Agent is not available: ${agent.state.status}`);
        }
        // Check if agent can handle more tasks
        if (agent.state.currentTasks.length >= agent.configuration.maxConcurrentTasks) {
            throw new Error('Agent is at maximum task capacity');
        }
        const assignmentId = this.generateAssignmentId();
        const assignment = {
            id: assignmentId,
            agentId,
            taskId,
            priority,
            status: 'pending',
            assignedAt: new Date(),
            ...(deadline ? { deadline } : {})
        };
        this.taskAssignments.set(assignmentId, assignment);
        agent.state.currentTasks.push(taskId);
        agent.state.lastActivity = new Date();
        // Update agent status
        if (agent.state.status === 'idle') {
            agent.state.status = 'active';
        }
        this.emit('task-assigned', { assignment, agent });
        this.logger.info(`Task assigned: ${taskId} -> ${agentId}`);
        return assignmentId;
    }
    // Complete task assignment
    completeTask(assignmentId, result) {
        const assignment = this.taskAssignments.get(assignmentId);
        if (!assignment) {
            return false;
        }
        const agent = this.agents.get(assignment.agentId);
        if (!agent) {
            return false;
        }
        // Update assignment
        assignment.status = 'completed';
        assignment.completedAt = new Date();
        assignment.result = result;
        // Update agent state
        const taskIndex = agent.state.currentTasks.indexOf(assignment.taskId);
        if (taskIndex > -1) {
            agent.state.currentTasks.splice(taskIndex, 1);
        }
        // Update performance metrics
        if (this.options.performanceTracking) {
            this.updateAgentPerformance(agent, assignment, true);
        }
        // Update status if no more tasks
        if (agent.state.currentTasks.length === 0) {
            agent.state.status = 'idle';
        }
        agent.state.lastActivity = new Date();
        this.emit('task-completed', { assignment, agent, result });
        this.logger.info(`Task completed: ${assignment.taskId} by ${assignment.agentId}`);
        return true;
    }
    // Fail task assignment
    failTask(assignmentId, error) {
        const assignment = this.taskAssignments.get(assignmentId);
        if (!assignment) {
            return false;
        }
        const agent = this.agents.get(assignment.agentId);
        if (!agent) {
            return false;
        }
        // Update assignment
        assignment.status = 'failed';
        assignment.completedAt = new Date();
        assignment.error = error;
        // Update agent state
        const taskIndex = agent.state.currentTasks.indexOf(assignment.taskId);
        if (taskIndex > -1) {
            agent.state.currentTasks.splice(taskIndex, 1);
        }
        // Update performance metrics
        if (this.options.performanceTracking) {
            this.updateAgentPerformance(agent, assignment, false);
        }
        // Update status if no more tasks
        if (agent.state.currentTasks.length === 0) {
            agent.state.status = 'idle';
        }
        agent.state.lastActivity = new Date();
        this.emit('task-failed', { assignment, agent, error });
        this.logger.warn(`Task failed: ${assignment.taskId} by ${assignment.agentId} - ${error}`);
        return true;
    }
    // Get agent performance metrics
    getAgentPerformance(agentId) {
        const agent = this.agents.get(agentId);
        return agent?.state.performance;
    }
    // Get all active assignments
    getActiveAssignments() {
        return Array.from(this.taskAssignments.values())
            .filter(assignment => assignment.status === 'active' || assignment.status === 'pending');
    }
    // Get assignments for specific agent
    getAgentAssignments(agentId) {
        return Array.from(this.taskAssignments.values())
            .filter(assignment => assignment.agentId === agentId);
    }
    calculateAgentScore(agent, requiredCapabilities, taskPriority) {
        let score = 0;
        // Base score from performance
        const perf = agent.state.performance;
        score += perf.successRate * 40; // 40% weight
        score += (1 - (perf.averageResponseTime / 10000)) * 20; // 20% weight (faster is better)
        score += perf.qualityScore * 20; // 20% weight
        score += perf.collaborationScore * 10; // 10% weight
        // Capability match bonus
        const capabilityBonus = requiredCapabilities.reduce((bonus, reqCap) => {
            const capability = agent.capabilities.find(cap => cap.type === reqCap);
            return capability ? bonus + 5 : bonus;
        }, 0);
        score += capabilityBonus;
        // Workload penalty
        const workloadPenalty = agent.state.currentTasks.length * 5;
        score -= workloadPenalty;
        // Status bonus/penalty
        switch (agent.state.status) {
            case 'idle':
                score += 10;
                break;
            case 'active':
                score += 5;
                break;
            case 'busy':
                score -= 10;
                break;
            default:
                score -= 50;
        }
        return Math.max(0, score);
    }
    updateAgentPerformance(agent, assignment, success) {
        const perf = agent.state.performance;
        const responseTime = assignment.completedAt.getTime() - assignment.assignedAt.getTime();
        // Update task count
        perf.tasksCompleted++;
        // Update success rate (exponential moving average)
        const alpha = 0.1; // Learning rate
        perf.successRate = (1 - alpha) * perf.successRate + alpha * (success ? 1 : 0);
        // Update average response time (exponential moving average)
        perf.averageResponseTime = (1 - alpha) * perf.averageResponseTime + alpha * responseTime;
        // Update quality score (simplified - would be more complex in practice)
        if (success) {
            perf.qualityScore = Math.min(1.0, perf.qualityScore + 0.01);
        }
        else {
            perf.qualityScore = Math.max(0.0, perf.qualityScore - 0.05);
        }
    }
    updateCapabilityIndex(agent) {
        agent.capabilities.forEach(capability => {
            if (!this.capabilityIndex.has(capability.type)) {
                this.capabilityIndex.set(capability.type, new Set());
            }
            this.capabilityIndex.get(capability.type).add(agent.id);
        });
    }
    removeFromCapabilityIndex(agent) {
        agent.capabilities.forEach(capability => {
            const agentIds = this.capabilityIndex.get(capability.type);
            if (agentIds) {
                agentIds.delete(agent.id);
            }
        });
    }
    cancelAgentTasks(agentId) {
        const assignments = this.getAgentAssignments(agentId);
        assignments.forEach(assignment => {
            if (assignment.status === 'active' || assignment.status === 'pending') {
                this.failTask(assignment.id, 'Agent deleted');
            }
        });
    }
    generateAgentId() {
        return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAssignmentId() {
        return `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Get statistics
    getStats() {
        const agents = Array.from(this.agents.values());
        const assignments = Array.from(this.taskAssignments.values());
        const activeAgents = agents.filter(a => a.state.status === 'active').length;
        const idleAgents = agents.filter(a => a.state.status === 'idle').length;
        const activeAssignments = assignments.filter(a => a.status === 'active' || a.status === 'pending').length;
        const completedAssignments = assignments.filter(a => a.status === 'completed').length;
        const failedAssignments = assignments.filter(a => a.status === 'failed').length;
        const averageSuccessRate = agents.length > 0
            ? agents.reduce((sum, agent) => sum + agent.state.performance.successRate, 0) / agents.length
            : 0;
        return {
            totalAgents: agents.length,
            activeAgents,
            idleAgents,
            totalAssignments: assignments.length,
            activeAssignments,
            completedAssignments,
            failedAssignments,
            averageSuccessRate
        };
    }
    // Clear all agents and assignments
    clear() {
        this.agents.clear();
        this.taskAssignments.clear();
        this.initializeCapabilityIndex();
        this.emit('cleared');
        this.logger.info('All agents and assignments cleared');
    }
    // Destroy and cleanup all resources
    destroy() {
        this.agents.clear();
        this.taskAssignments.clear();
        this.capabilityIndex.clear();
        this.removeAllListeners();
        this.logger.info('Agent manager destroyed');
    }
}
exports.AgentManager = AgentManager;
//# sourceMappingURL=index.js.map