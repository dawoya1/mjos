"use strict";
/**
 * MJOS Model Context Protocol (MCP) Integration
 * 魔剑工作室操作系统模型上下文协议集成
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPManager = void 0;
const events_1 = require("events");
const index_1 = require("../core/index");
class MCPManager extends events_1.EventEmitter {
    constructor(options = {}, contextManager, knowledgeGraph, memorySystem) {
        super();
        this.sessions = new Map();
        this.resources = new Map();
        this.tools = new Map();
        this.prompts = new Map();
        this.options = {
            enableResourceSync: options.enableResourceSync || true,
            enableToolSharing: options.enableToolSharing || true,
            enablePromptSharing: options.enablePromptSharing || true,
            maxSessions: options.maxSessions || 10,
            syncInterval: options.syncInterval || 30000, // 30 seconds
            ...options
        };
        this.logger = new index_1.Logger('MCPManager');
        this.contextManager = contextManager;
        this.knowledgeGraph = knowledgeGraph;
        this.memorySystem = memorySystem;
        this.initializeDefaultResources();
        this.initializeDefaultTools();
        this.initializeDefaultPrompts();
        this.startSyncTimer();
    }
    initializeDefaultResources() {
        // Memory resource
        this.resources.set('memory://system', {
            uri: 'memory://system',
            name: 'System Memory',
            description: 'Access to MJOS memory system',
            mimeType: 'application/json',
            metadata: { type: 'memory', access: 'read-write' }
        });
        // Knowledge resource
        this.resources.set('knowledge://graph', {
            uri: 'knowledge://graph',
            name: 'Knowledge Graph',
            description: 'Access to MJOS knowledge graph',
            mimeType: 'application/json',
            metadata: { type: 'knowledge', access: 'read-write' }
        });
        // Context resource
        this.resources.set('context://sessions', {
            uri: 'context://sessions',
            name: 'Context Sessions',
            description: 'Access to active context sessions',
            mimeType: 'application/json',
            metadata: { type: 'context', access: 'read-write' }
        });
        this.logger.info('Default MCP resources initialized');
    }
    initializeDefaultTools() {
        // Memory query tool
        this.tools.set('query_memory', {
            name: 'query_memory',
            description: 'Query the MJOS memory system',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'object' },
                    limit: { type: 'number', default: 10 }
                },
                required: ['query']
            },
            handler: async (args) => {
                if (!this.memorySystem) {
                    throw new Error('Memory system not available');
                }
                return this.memorySystem.query(args.query);
            }
        });
        // Knowledge search tool
        this.tools.set('search_knowledge', {
            name: 'search_knowledge',
            description: 'Search the MJOS knowledge graph',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'object' },
                    includeRelated: { type: 'boolean', default: false }
                },
                required: ['query']
            },
            handler: async (args) => {
                if (!this.knowledgeGraph) {
                    throw new Error('Knowledge graph not available');
                }
                return this.knowledgeGraph.query(args.query);
            }
        });
        // Context management tool
        this.tools.set('manage_context', {
            name: 'manage_context',
            description: 'Manage context sessions',
            inputSchema: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['create', 'get', 'update', 'delete'] },
                    sessionId: { type: 'string' },
                    data: { type: 'object' }
                },
                required: ['action']
            },
            handler: async (args) => {
                if (!this.contextManager) {
                    throw new Error('Context manager not available');
                }
                switch (args.action) {
                    case 'create':
                        return this.contextManager.createSession(args.data?.userId);
                    case 'get':
                        return this.contextManager.getSession(args.sessionId);
                    case 'update':
                        return this.contextManager.updateSession(args.sessionId, args.data);
                    case 'delete':
                        return this.contextManager.deleteSession(args.sessionId);
                    default:
                        throw new Error(`Unknown action: ${args.action}`);
                }
            }
        });
        this.logger.info('Default MCP tools initialized');
    }
    initializeDefaultPrompts() {
        this.prompts.set('analyze_context', {
            name: 'analyze_context',
            description: 'Analyze current context and provide insights',
            arguments: [
                { name: 'sessionId', description: 'Context session ID', required: true },
                { name: 'depth', description: 'Analysis depth (1-5)', required: false }
            ],
            template: `Analyze the context session {{sessionId}} with depth level {{depth|default:3}}.
      
Please provide:
1. Current context summary
2. Key patterns identified
3. Recommendations for next actions
4. Potential issues or concerns

Use the available memory and knowledge systems to enhance your analysis.`
        });
        this.prompts.set('knowledge_synthesis', {
            name: 'knowledge_synthesis',
            description: 'Synthesize knowledge from multiple sources',
            arguments: [
                { name: 'domain', description: 'Knowledge domain to focus on', required: true },
                { name: 'sources', description: 'Comma-separated list of source types', required: false }
            ],
            template: `Synthesize knowledge in the {{domain}} domain from sources: {{sources|default:"memory,knowledge,context"}}.

Please provide:
1. Key concepts and relationships
2. Patterns and trends identified
3. Knowledge gaps or inconsistencies
4. Actionable insights

Focus on creating a coherent understanding that can guide decision-making.`
        });
        this.logger.info('Default MCP prompts initialized');
    }
    // Session Management
    createSession(clientId, clientCapabilities) {
        if (this.sessions.size >= this.options.maxSessions) {
            throw new Error('Maximum number of MCP sessions reached');
        }
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            clientId,
            serverCapabilities: this.getServerCapabilities(),
            clientCapabilities,
            status: 'connecting',
            createdAt: new Date(),
            lastActivity: new Date(),
            metadata: {}
        };
        this.sessions.set(sessionId, session);
        // Mark as connected after initialization
        session.status = 'connected';
        this.emit('session-created', session);
        this.logger.info(`MCP session created: ${sessionId} for client ${clientId}`);
        return sessionId;
    }
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
        }
        return session;
    }
    closeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        session.status = 'disconnected';
        this.sessions.delete(sessionId);
        this.emit('session-closed', session);
        this.logger.info(`MCP session closed: ${sessionId}`);
        return true;
    }
    // Resource Management
    listResources(_sessionId) {
        // Could filter by session permissions in the future
        return Array.from(this.resources.values());
    }
    getResource(uri) {
        return this.resources.get(uri);
    }
    addResource(resource) {
        this.resources.set(resource.uri, resource);
        this.emit('resource-added', resource);
        this.logger.debug(`MCP resource added: ${resource.uri}`);
    }
    // Tool Management
    listTools(_sessionId) {
        return Array.from(this.tools.values());
    }
    getTool(name) {
        return this.tools.get(name);
    }
    async callTool(name, args, sessionId) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }
        try {
            const result = await tool.handler(args);
            this.emit('tool-called', { name, args, result, sessionId });
            return result;
        }
        catch (error) {
            this.logger.error(`Tool call failed: ${name}`, error);
            this.emit('tool-error', { name, args, error, sessionId });
            throw error;
        }
    }
    addTool(tool) {
        this.tools.set(tool.name, tool);
        this.emit('tool-added', tool);
        this.logger.debug(`MCP tool added: ${tool.name}`);
    }
    // Prompt Management
    listPrompts(_sessionId) {
        return Array.from(this.prompts.values());
    }
    getPrompt(name) {
        return this.prompts.get(name);
    }
    renderPrompt(name, args = {}) {
        const prompt = this.prompts.get(name);
        if (!prompt) {
            throw new Error(`Prompt not found: ${name}`);
        }
        // Simple template rendering - could be enhanced with a proper template engine
        let rendered = prompt.template;
        for (const [key, value] of Object.entries(args)) {
            const regex = new RegExp(`{{${key}(\\|default:([^}]+))?}}`, 'g');
            rendered = rendered.replace(regex, (match, defaultPart, defaultValue) => {
                return value !== undefined ? String(value) : (defaultValue || '');
            });
        }
        return rendered;
    }
    addPrompt(prompt) {
        this.prompts.set(prompt.name, prompt);
        this.emit('prompt-added', prompt);
        this.logger.debug(`MCP prompt added: ${prompt.name}`);
    }
    // Context Synchronization
    async syncContext(sessionId, contextData) {
        if (!this.options.enableResourceSync || !this.contextManager) {
            return;
        }
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        try {
            // Create or update context session
            const mjosSessionId = this.contextManager.createSession(session.clientId);
            // Add context data as messages
            if (contextData.messages) {
                for (const message of contextData.messages) {
                    await this.contextManager.addMessage(mjosSessionId, message);
                }
            }
            // Update working memory
            if (contextData.workingMemory) {
                for (const [key, value] of Object.entries(contextData.workingMemory)) {
                    this.contextManager.setWorkingMemory(mjosSessionId, key, value);
                }
            }
            this.emit('context-synced', { sessionId, mjosSessionId, contextData });
            this.logger.debug(`Context synced for session: ${sessionId}`);
        }
        catch (error) {
            this.logger.error(`Context sync failed for session: ${sessionId}`, error);
            throw error;
        }
    }
    getServerCapabilities() {
        return {
            resources: {
                subscribe: true,
                listChanged: true
            },
            tools: {
                listChanged: true
            },
            prompts: {
                listChanged: true
            },
            logging: {
                level: 'info'
            }
        };
    }
    startSyncTimer() {
        if (this.options.syncInterval && this.options.syncInterval > 0) {
            this.syncTimer = setInterval(() => {
                this.performPeriodicSync();
            }, this.options.syncInterval);
        }
    }
    performPeriodicSync() {
        // Sync active sessions with their respective systems
        for (const session of this.sessions.values()) {
            if (session.status === 'connected') {
                this.emit('periodic-sync', session);
            }
        }
    }
    generateSessionId() {
        return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Statistics
    getStats() {
        const sessions = Array.from(this.sessions.values());
        return {
            totalSessions: sessions.length,
            activeSessions: sessions.filter(s => s.status === 'connected').length,
            totalResources: this.resources.size,
            totalTools: this.tools.size,
            totalPrompts: this.prompts.size
        };
    }
    // Cleanup
    destroy() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        // Close all sessions
        for (const sessionId of this.sessions.keys()) {
            this.closeSession(sessionId);
        }
        this.removeAllListeners();
        this.logger.info('MCP manager destroyed');
    }
}
exports.MCPManager = MCPManager;
//# sourceMappingURL=index.js.map