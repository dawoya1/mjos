"use strict";
/**
 * MJOS Main Entry Point - Performance Enhanced
 * 魔剑工作室操作系统主入口 - 性能增强版本
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MJOS = exports.WorkflowEngine = exports.MCPManager = exports.SessionContextManager = void 0;
const index_1 = require("./core/index");
const index_2 = require("./memory/index");
const index_3 = require("./team/index");
const index_4 = require("./performance/index");
const index_5 = require("./knowledge/index");
const index_6 = require("./context/index");
const index_7 = require("./reasoning/index");
const index_8 = require("./agents/index");
const index_9 = require("./roles/index");
const index_10 = require("./communication/index");
const index_11 = require("./mcp/index");
const index_12 = require("./workflow/index");
const index_13 = require("./api/index");
const index_14 = require("./storage/index");
const index_15 = require("./security/index");
const index_16 = require("./monitoring/index");
// 导出核心类型和模块
__exportStar(require("./types/index"), exports);
__exportStar(require("./core/index"), exports);
__exportStar(require("./memory/index"), exports);
__exportStar(require("./team/index"), exports);
__exportStar(require("./performance/index"), exports);
__exportStar(require("./knowledge/index"), exports);
var index_17 = require("./context/index");
Object.defineProperty(exports, "SessionContextManager", { enumerable: true, get: function () { return index_17.ContextManager; } });
__exportStar(require("./reasoning/index"), exports);
__exportStar(require("./agents/index"), exports);
__exportStar(require("./roles/index"), exports);
__exportStar(require("./communication/index"), exports);
var index_18 = require("./mcp/index");
Object.defineProperty(exports, "MCPManager", { enumerable: true, get: function () { return index_18.MCPManager; } });
var index_19 = require("./workflow/index");
Object.defineProperty(exports, "WorkflowEngine", { enumerable: true, get: function () { return index_19.WorkflowEngine; } });
__exportStar(require("./api/index"), exports);
__exportStar(require("./storage/index"), exports);
__exportStar(require("./security/index"), exports);
__exportStar(require("./monitoring/index"), exports);
// 主MJOS类
class MJOS {
    constructor() {
        this.version = '2.0.0';
        this._running = false;
        // Initialize configuration first
        this.config = new index_1.ConfigManager({
            defaultConfig: {
                mjos: {
                    version: '2.0.0',
                    environment: 'development',
                    enablePerformanceMonitoring: true,
                    enableKnowledgeGraph: true,
                    enableReasoning: true
                }
            }
        });
        this.logger = new index_1.Logger('MJOS', {
            level: this.config.get('mjos.logLevel', 2), // INFO level
            enableFile: this.config.get('mjos.enableFileLogging', false)
        });
        // Initialize core systems
        this.engine = new index_1.MJOSEngine({
            config: this.config,
            logger: this.logger
        });
        this.coreContextManager = new index_1.ContextManager({
            defaultTTL: this.config.get('mjos.contextTTL', 3600000), // 1 hour
            enablePersistence: this.config.get('mjos.enablePersistence', true)
        });
        this.memorySystem = new index_2.MemorySystem({
            shortTermCapacity: this.config.get('mjos.shortTermMemoryCapacity', 100),
            longTermCapacity: this.config.get('mjos.longTermMemoryCapacity', 10000),
            enableSemantic: this.config.get('mjos.enableSemanticSearch', false)
        });
        this.performanceMonitor = new index_4.PerformanceMonitor({
            enableAutoOptimization: this.config.get('mjos.enableAutoOptimization', false),
            alertingEnabled: this.config.get('mjos.enableAlerting', true)
        });
        this.knowledgeGraph = new index_5.KnowledgeGraph({
            maxNodes: this.config.get('mjos.maxKnowledgeNodes', 10000),
            enableSemanticSearch: this.config.get('mjos.enableSemanticSearch', false),
            autoSave: this.config.get('mjos.autoSaveKnowledge', true)
        });
        this.contextManager = new index_6.ContextManager({
            maxSessions: this.config.get('mjos.maxSessions', 100),
            enableCompression: this.config.get('mjos.enableContextCompression', true),
            enableSharing: this.config.get('mjos.enableContextSharing', true)
        });
        this.reasoningEngine = new index_7.ReasoningEngine({
            enableProbabilistic: this.config.get('mjos.enableProbabilisticReasoning', true),
            enableLearning: this.config.get('mjos.enableLearning', false)
        });
        this.agentManager = new index_8.AgentManager({
            maxAgents: this.config.get('mjos.maxAgents', 50),
            enableLearning: this.config.get('mjos.enableLearning', false),
            enableCollaboration: this.config.get('mjos.enableCollaboration', true)
        });
        this.roleManager = new index_9.RoleManager({
            maxRoles: this.config.get('mjos.maxRoles', 100),
            enableHierarchy: this.config.get('mjos.enableRoleHierarchy', true),
            enableInheritance: this.config.get('mjos.enableRoleInheritance', true)
        });
        this.communicationManager = new index_10.CommunicationManager({
            maxChannels: this.config.get('mjos.maxChannels', 100),
            enableEncryption: this.config.get('mjos.enableEncryption', false),
            enableCompression: this.config.get('mjos.enableCompression', false)
        });
        this.mcpManager = new index_11.MCPManager({
            enableResourceSync: this.config.get('mjos.enableMCPResourceSync', true),
            enableToolSharing: this.config.get('mjos.enableMCPToolSharing', true),
            maxSessions: this.config.get('mjos.maxMCPSessions', 10)
        }, this.contextManager, this.knowledgeGraph, this.memorySystem);
        this.workflowEngine = new index_12.WorkflowEngine({
            maxConcurrentExecutions: this.config.get('mjos.maxWorkflowExecutions', 10),
            enablePersistence: this.config.get('mjos.enableWorkflowPersistence', false)
        }, this.agentManager, this.roleManager, undefined, // teamManager will be initialized next
        this.communicationManager);
        this.teamManager = new index_3.TeamManager(this.engine.getEventBus(), this.agentManager, this.roleManager);
        // Initialize infrastructure modules
        this.storageManager = new index_14.StorageManager({
            defaultProvider: this.config.get('mjos.defaultStorageProvider', 'memory'),
            enableCaching: this.config.get('mjos.enableStorageCaching', true),
            enableCompression: this.config.get('mjos.enableStorageCompression', false),
            enableEncryption: this.config.get('mjos.enableStorageEncryption', false)
        });
        this.securityManager = new index_15.SecurityManager({
            enableAuditLog: this.config.get('mjos.enableSecurityAuditLog', true),
            enableEncryption: this.config.get('mjos.enableSecurityEncryption', true),
            tokenExpiration: this.config.get('mjos.tokenExpiration', 3600000),
            maxLoginAttempts: this.config.get('mjos.maxLoginAttempts', 5)
        });
        this.monitoringSystem = new index_16.MonitoringSystem({
            enableRealTimeMetrics: this.config.get('mjos.enableRealTimeMetrics', true),
            enableHealthChecks: this.config.get('mjos.enableHealthChecks', true),
            enableAlerting: this.config.get('mjos.enableAlerting', true),
            metricsRetention: this.config.get('mjos.metricsRetention', 3600000)
        });
        // Register modules with engine
        this.engine.registerModule('memory', this.memorySystem);
        this.engine.registerModule('knowledge', this.knowledgeGraph);
        this.engine.registerModule('context', this.contextManager);
        this.engine.registerModule('reasoning', this.reasoningEngine);
        this.engine.registerModule('agents', this.agentManager);
        this.engine.registerModule('roles', this.roleManager);
        this.engine.registerModule('communication', this.communicationManager);
        this.engine.registerModule('mcp', this.mcpManager);
        this.engine.registerModule('workflow', this.workflowEngine);
        this.engine.registerModule('team', this.teamManager);
        this.engine.registerModule('performance', this.performanceMonitor);
        this.engine.registerModule('storage', this.storageManager);
        this.engine.registerModule('security', this.securityManager);
        this.engine.registerModule('monitoring', this.monitoringSystem);
        // Setup inter-module communication
        this.setupModuleIntegration();
        // Wrap methods with performance monitoring
        this.wrapMethodsWithMonitoring();
        this.logger.info('MJOS v2.0 initialized with enhanced AI capabilities!');
    }
    setupModuleIntegration() {
        // Memory and Knowledge integration
        this.memorySystem.on('stored', (item) => {
            if (item.importance > 0.7) {
                // Store important memories as knowledge
                this.knowledgeGraph.add({
                    type: 'experience',
                    content: item.content,
                    metadata: {
                        source: 'memory',
                        confidence: item.importance,
                        importance: item.importance,
                        tags: item.tags,
                        domain: 'general',
                        version: 1
                    },
                    relationships: []
                });
            }
        });
        // Context and Memory integration
        this.contextManager.on('session-created', (session) => {
            this.memorySystem.store({ event: 'session_created', sessionId: session.id }, ['session', 'system'], 0.6);
        });
        // Reasoning and Knowledge integration
        this.reasoningEngine.on('reasoning-completed', (result) => {
            if (result.confidence > 0.8) {
                // Store high-confidence reasoning results as knowledge
                this.knowledgeGraph.add({
                    type: 'rule',
                    content: {
                        conclusion: result.conclusion,
                        reasoning: result.reasoning
                    },
                    metadata: {
                        source: 'reasoning',
                        confidence: result.confidence,
                        importance: result.confidence,
                        tags: ['reasoning', 'derived'],
                        domain: 'reasoning',
                        version: 1
                    },
                    relationships: []
                });
            }
        });
        // Performance monitoring integration
        this.performanceMonitor.on('optimization-applied', (optimization) => {
            this.logger.info(`Performance optimization applied: ${optimization.description}`);
        });
    }
    getVersion() {
        return this.version;
    }
    get running() {
        return this._running;
    }
    async start() {
        this.logger.info('Starting MJOS with enhanced infrastructure...');
        // Connect storage
        await this.storageManager.connect();
        // Start performance monitoring
        this.performanceMonitor.start();
        await this.engine.start();
        // Store startup event in memory
        this.memorySystem.store({ event: 'system_start', timestamp: new Date() }, ['system', 'startup'], 0.8);
        this._running = true;
        this.logger.info('MJOS started successfully with all infrastructure modules!');
    }
    async stop() {
        this.logger.info('Stopping MJOS...');
        // Store shutdown event in memory
        this.memorySystem.store({ event: 'system_stop', timestamp: new Date() }, ['system', 'shutdown'], 0.8);
        // Stop API server if running
        if (this.apiServer) {
            await this.stopAPIServer();
        }
        // Stop infrastructure modules
        this.monitoringSystem.destroy();
        this.securityManager.destroy();
        await this.storageManager.disconnect();
        await this.engine.stop();
        // Stop performance monitoring
        this.performanceMonitor.stop();
        // Stop context manager
        this.contextManager.destroy();
        // Stop communication manager
        this.communicationManager.destroy();
        // Stop agent manager
        this.agentManager.destroy();
        // Stop workflow engine
        this.workflowEngine.destroy();
        // Stop team manager
        this.teamManager.destroy();
        // Remove all event listeners to prevent memory leaks
        this.performanceMonitor.removeAllListeners();
        // Note: Memory system and knowledge graph are not destroyed here
        // to allow tests to access stored events. They will be cleaned up
        // when the process exits or in a separate cleanup method.
        this._running = false;
        this.logger.info('MJOS stopped successfully with all infrastructure modules!');
    }
    // Cleanup method for complete resource cleanup (used in tests)
    cleanup() {
        if (this._running) {
            throw new Error('Cannot cleanup while MJOS is running. Call stop() first.');
        }
        // Destroy all modules with timers
        this.memorySystem.destroy();
        this.knowledgeGraph.destroy();
        this.coreContextManager.destroy();
        this.contextManager.destroy();
        this.performanceMonitor.destroy();
        this.mcpManager.destroy();
        this.storageManager.destroy();
        this.monitoringSystem.destroy();
        this.logger.info('MJOS cleanup completed');
    }
    getStatus() {
        return {
            version: this.version,
            running: this._running,
            engine: this.engine.getStatus(),
            memory: this.memorySystem.getStats(),
            knowledge: this.knowledgeGraph.getStats(),
            context: this.contextManager.getStats(),
            reasoning: this.reasoningEngine.getStats(),
            team: this.teamManager.getTeamStats(),
            performance: this.performanceMonitor.getSummary()
        };
    }
    // Core system access
    getEngine() {
        return this.engine;
    }
    getContextManager() {
        return this.contextManager;
    }
    getMemorySystem() {
        return this.memorySystem;
    }
    getTeamManager() {
        return this.teamManager;
    }
    getPerformanceMonitor() {
        return this.performanceMonitor;
    }
    getKnowledgeGraph() {
        return this.knowledgeGraph;
    }
    getReasoningEngine() {
        return this.reasoningEngine;
    }
    getConfig() {
        return this.config;
    }
    getAgentManager() {
        return this.agentManager;
    }
    getRoleManager() {
        return this.roleManager;
    }
    getCommunicationManager() {
        return this.communicationManager;
    }
    getMCPManager() {
        return this.mcpManager;
    }
    getWorkflowEngine() {
        return this.workflowEngine;
    }
    getAPIServer() {
        return this.apiServer;
    }
    getStorageManager() {
        return this.storageManager;
    }
    getSecurityManager() {
        return this.securityManager;
    }
    getMonitoringSystem() {
        return this.monitoringSystem;
    }
    // Convenience methods with performance monitoring
    remember(content, tags = [], importance = 0.5) {
        return this.memorySystem.store(content, tags, importance);
    }
    recall(query) {
        return this.memorySystem.query(query);
    }
    createTask(title, description, priority = 'medium') {
        return this.teamManager.createTask({
            title,
            description,
            status: 'pending',
            priority
        });
    }
    assignTask(taskId, memberId) {
        return this.teamManager.assignTask(taskId, memberId);
    }
    // Enhanced convenience methods for new capabilities
    // Knowledge management
    addKnowledge(content, type = 'fact', domain = 'general', tags = []) {
        return this.knowledgeGraph.add({
            type,
            content,
            metadata: {
                source: 'user',
                confidence: 0.8,
                importance: 0.7,
                tags,
                domain,
                version: 1
            },
            relationships: []
        });
    }
    queryKnowledge(query) {
        return this.knowledgeGraph.query(query);
    }
    // Context management
    createSession(userId) {
        return this.contextManager.createSession(userId);
    }
    addMessage(sessionId, role, content) {
        return this.contextManager.addMessage(sessionId, { role, content });
    }
    getConversationHistory(sessionId, limit) {
        return this.contextManager.getConversationHistory(sessionId, limit);
    }
    // Reasoning capabilities
    async reason(type, input, context = {}) {
        const request = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            input,
            context
        };
        return await this.reasoningEngine.reason(request);
    }
    // Advanced memory operations
    rememberWithContext(content, sessionId, tags = [], importance = 0.5) {
        const enhancedTags = [...tags];
        if (sessionId) {
            enhancedTags.push(`session:${sessionId}`);
            // Add context from session
            const session = this.contextManager.getSession(sessionId);
            if (session) {
                enhancedTags.push(...session.state.activeRoles.map(role => `role:${role}`));
            }
        }
        return this.memorySystem.store(content, enhancedTags, importance);
    }
    // Intelligent recall with reasoning
    async intelligentRecall(query, useReasoning = true) {
        const memories = this.memorySystem.query(query);
        if (useReasoning && memories.length > 0) {
            // Use reasoning to find patterns and connections
            const reasoningResult = await this.reason('inductive', memories, { query });
            return {
                memories,
                patterns: reasoningResult.conclusion,
                confidence: reasoningResult.confidence
            };
        }
        return { memories };
    }
    // Knowledge-enhanced task creation
    createIntelligentTask(title, description, domain = 'general') {
        // Query knowledge for similar tasks
        const relatedKnowledge = this.knowledgeGraph.query({
            domain,
            content: title,
            limit: 5
        });
        // Create task with enhanced context
        const taskId = this.createTask(title, description);
        // Store task creation as knowledge
        this.addKnowledge({
            taskId,
            title,
            description,
            relatedKnowledge: relatedKnowledge.map(k => k.id)
        }, 'procedure', domain, ['task', 'creation']);
        return taskId;
    }
    // API Server management
    async startAPIServer(options) {
        if (this.apiServer) {
            throw new Error('API server is already running');
        }
        this.apiServer = new index_13.APIServer(this, options);
        await this.apiServer.start();
        this.logger.info('API server started successfully');
    }
    async stopAPIServer() {
        if (this.apiServer) {
            await this.apiServer.stop();
            delete this.apiServer;
            this.logger.info('API server stopped');
        }
    }
    // Enhanced workflow management
    async executeWorkflow(workflowId, variables) {
        return await this.workflowEngine.executeWorkflow(workflowId, variables, 'api');
    }
    // Enhanced agent management
    createAgent(definition) {
        return this.agentManager.createAgent(definition);
    }
    assignTaskToAgent(taskId, agentId) {
        if (agentId) {
            return this.agentManager.assignTask(agentId, taskId);
        }
        else {
            // Find best agent automatically
            const bestAgent = this.agentManager.findBestAgent(['execution'], 1);
            if (bestAgent) {
                return this.agentManager.assignTask(bestAgent.id, taskId);
            }
            throw new Error('No suitable agent found for task');
        }
    }
    // Enhanced role management
    createRole(definition) {
        return this.roleManager.createRole(definition);
    }
    assignRoleToAgent(roleId, agentId) {
        return this.roleManager.assignRole(roleId, agentId, 'system');
    }
    // Enhanced communication
    async sendMessage(from, to, content, type = 'notification') {
        return await this.communicationManager.sendMessage(from, to, type, content);
    }
    createCommunicationChannel(name, participants, type = 'multicast') {
        return this.communicationManager.createChannel(name, type, participants);
    }
    // Performance monitoring methods
    getPerformanceMetrics() {
        return this.performanceMonitor.getMetrics();
    }
    getPerformanceSummary() {
        return this.performanceMonitor.getSummary();
    }
    resetPerformanceMetrics() {
        this.performanceMonitor.reset();
    }
    wrapMethodsWithMonitoring() {
        // Wrap memory system methods
        const originalStore = this.memorySystem.store.bind(this.memorySystem);
        const originalQuery = this.memorySystem.query.bind(this.memorySystem);
        this.memorySystem.store = this.performanceMonitor.createTimer(originalStore, 'memory');
        this.memorySystem.query = this.performanceMonitor.createTimer(originalQuery, 'memory');
        // Wrap team manager methods
        const originalCreateTask = this.teamManager.createTask.bind(this.teamManager);
        const originalAssignTask = this.teamManager.assignTask.bind(this.teamManager);
        this.teamManager.createTask = this.performanceMonitor.createTimer(originalCreateTask, 'task');
        this.teamManager.assignTask = this.performanceMonitor.createTimer(originalAssignTask, 'task');
        // Wrap context manager methods (using new ContextManager methods)
        const originalCreateSession = this.contextManager.createSession.bind(this.contextManager);
        const originalAddMessage = this.contextManager.addMessage.bind(this.contextManager);
        this.contextManager.createSession = this.performanceMonitor.createTimer(originalCreateSession, 'context');
        this.contextManager.addMessage = this.performanceMonitor.createTimer(originalAddMessage, 'context');
        // Wrap knowledge operations
        const originalKnowledgeAdd = this.knowledgeGraph.add.bind(this.knowledgeGraph);
        const originalKnowledgeQuery = this.knowledgeGraph.query.bind(this.knowledgeGraph);
        this.knowledgeGraph.add = this.performanceMonitor.createTimer(originalKnowledgeAdd, 'knowledge');
        this.knowledgeGraph.query = this.performanceMonitor.createTimer(originalKnowledgeQuery, 'knowledge');
        // Wrap reasoning operations
        const originalReason = this.reasoningEngine.reason.bind(this.reasoningEngine);
        this.reasoningEngine.reason = this.performanceMonitor.createTimer(originalReason, 'reasoning');
    }
}
exports.MJOS = MJOS;
// 默认导出
exports.default = MJOS;
//# sourceMappingURL=index.js.map