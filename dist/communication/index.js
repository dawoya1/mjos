"use strict";
/**
 * MJOS Communication System
 * 魔剑工作室操作系统通信系统
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationManager = void 0;
const events_1 = require("events");
const index_1 = require("../core/index");
class CommunicationManager extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.channels = new Map();
        this.routes = new Map();
        this.protocols = new Map();
        this.messageHistory = new Map();
        this.pendingMessages = new Map();
        this.options = {
            maxChannels: options.maxChannels || 100,
            maxMessageHistory: options.maxMessageHistory || 1000,
            enableEncryption: options.enableEncryption || false,
            enableCompression: options.enableCompression || false,
            defaultTimeout: options.defaultTimeout || 30000,
            retryAttempts: options.retryAttempts || 3,
            ...options
        };
        this.logger = new index_1.Logger('CommunicationManager');
        this.initializeDefaultProtocols();
    }
    initializeDefaultProtocols() {
        // Standard MJOS protocol
        const mjosProtocol = {
            name: 'MJOS',
            version: '1.0.0',
            messageTypes: ['request', 'response', 'notification', 'broadcast', 'query', 'command'],
            rules: [
                {
                    condition: 'message.type === "request"',
                    action: 'require_response',
                    priority: 10
                },
                {
                    condition: 'message.priority === "urgent"',
                    action: 'immediate_delivery',
                    priority: 20
                }
            ],
            security: {
                encryption: this.options.enableEncryption || false,
                authentication: true,
                authorization: true,
                auditLog: true
            }
        };
        this.protocols.set('MJOS', mjosProtocol);
        this.logger.info('Default communication protocols initialized');
    }
    // Channel Management
    createChannel(name, type, participants, protocol = 'MJOS') {
        if (this.channels.size >= this.options.maxChannels) {
            throw new Error('Maximum number of channels reached');
        }
        const id = this.generateChannelId();
        const channel = {
            id,
            name,
            type,
            participants,
            protocol,
            status: 'active',
            createdAt: new Date(),
            lastActivity: new Date(),
            messageCount: 0,
            metadata: {}
        };
        this.channels.set(id, channel);
        this.messageHistory.set(id, []);
        this.emit('channel-created', channel);
        this.logger.info(`Channel created: ${name} (${type})`);
        return id;
    }
    getChannel(channelId) {
        return this.channels.get(channelId);
    }
    closeChannel(channelId) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            return false;
        }
        channel.status = 'closed';
        channel.lastActivity = new Date();
        this.emit('channel-closed', channel);
        this.logger.info(`Channel closed: ${channel.name}`);
        return true;
    }
    // Message Routing
    addRoute(pattern, handler, priority = 0) {
        const route = {
            pattern,
            handler,
            priority,
            middleware: []
        };
        this.routes.set(pattern, route);
        this.logger.debug(`Route added: ${pattern}`);
    }
    addMiddleware(pattern, middleware) {
        const route = this.routes.get(pattern);
        if (!route) {
            return false;
        }
        route.middleware = route.middleware || [];
        route.middleware.push(middleware);
        this.logger.debug(`Middleware added to route: ${pattern}`);
        return true;
    }
    // Message Sending
    async sendMessage(from, to, type, content, priority = 'normal', channelId) {
        const messageId = this.generateMessageId();
        const message = {
            id: messageId,
            from,
            to,
            type,
            content,
            priority,
            timestamp: new Date(),
            metadata: {
                channelId,
                retryCount: 0
            }
        };
        try {
            await this.processMessage(message);
            return messageId;
        }
        catch (error) {
            this.logger.error(`Failed to send message ${messageId}`, error);
            throw error;
        }
    }
    // Broadcast message to all participants in a channel
    async broadcastMessage(from, channelId, content, priority = 'normal') {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Channel not found: ${channelId}`);
        }
        const recipients = channel.participants.filter(p => p !== from);
        return await this.sendMessage(from, recipients, 'broadcast', content, priority, channelId);
    }
    // Request-Response pattern
    async sendRequest(from, to, content, timeout) {
        const messageId = await this.sendMessage(from, to, 'request', content, 'normal');
        return new Promise((resolve, reject) => {
            const timeoutMs = timeout || this.options.defaultTimeout;
            const timer = setTimeout(() => {
                this.removeAllListeners(`response:${messageId}`);
                reject(new Error(`Request timeout: ${messageId}`));
            }, timeoutMs);
            this.once(`response:${messageId}`, (response) => {
                clearTimeout(timer);
                resolve(response.content);
            });
        });
    }
    // Send response to a request
    async sendResponse(requestMessage, content) {
        if (requestMessage.type !== 'request') {
            throw new Error('Can only respond to request messages');
        }
        const responseId = await this.sendMessage(requestMessage.to, requestMessage.from, 'response', content, requestMessage.priority);
        this.emit(`response:${requestMessage.id}`, {
            id: responseId,
            content,
            originalRequest: requestMessage
        });
        return responseId;
    }
    async processMessage(message) {
        // Store message in history
        this.storeMessage(message);
        // Apply protocol rules
        await this.applyProtocolRules(message);
        // Route message
        await this.routeMessage(message);
        // Update channel activity
        this.updateChannelActivity(message);
        this.emit('message-processed', message);
    }
    async routeMessage(message) {
        const matchingRoutes = this.findMatchingRoutes(message);
        if (matchingRoutes.length === 0) {
            this.logger.warn(`No routes found for message: ${message.id}`);
            return;
        }
        // Sort by priority
        matchingRoutes.sort((a, b) => b.priority - a.priority);
        for (const route of matchingRoutes) {
            try {
                const context = {
                    route,
                    session: message.metadata?.sessionId,
                    metadata: { ...message.metadata }
                };
                // Execute middleware chain
                await this.executeMiddleware(message, context, route.middleware || []);
                // Execute handler
                const result = await route.handler(message, context);
                if (result !== undefined) {
                    this.emit('message-handled', { message, result, route });
                }
            }
            catch (error) {
                this.logger.error(`Route handler failed: ${route.pattern}`, error);
                this.emit('message-error', { message, error, route });
            }
        }
    }
    async executeMiddleware(message, context, middleware) {
        let index = 0;
        const next = async () => {
            if (index < middleware.length) {
                const currentMiddleware = middleware[index++];
                if (currentMiddleware) {
                    await currentMiddleware(message, context, next);
                }
            }
        };
        await next();
    }
    findMatchingRoutes(message) {
        const routes = [];
        for (const [pattern, route] of this.routes) {
            if (this.matchesPattern(pattern, message)) {
                routes.push(route);
            }
        }
        return routes;
    }
    matchesPattern(pattern, message) {
        // Simple pattern matching - could be enhanced with regex or more sophisticated matching
        if (pattern === '*')
            return true;
        if (pattern === message.type)
            return true;
        if (pattern.startsWith('from:') && pattern.substring(5) === message.from)
            return true;
        if (pattern.startsWith('to:') && pattern.substring(3) === message.to)
            return true;
        if (pattern.startsWith('priority:') && pattern.substring(9) === message.priority)
            return true;
        return false;
    }
    async applyProtocolRules(message) {
        const channelId = message.metadata?.channelId;
        if (!channelId)
            return;
        const channel = this.channels.get(channelId);
        if (!channel)
            return;
        const protocol = this.protocols.get(channel.protocol);
        if (!protocol)
            return;
        for (const rule of protocol.rules) {
            if (this.evaluateRuleCondition(rule.condition, message)) {
                await this.executeRuleAction(rule.action, message);
            }
        }
    }
    evaluateRuleCondition(condition, message) {
        // Simple condition evaluation - in practice, would use a proper expression evaluator
        try {
            // Replace message references with actual values
            const evaluableCondition = condition
                .replace(/message\.type/g, `"${message.type}"`)
                .replace(/message\.priority/g, `"${message.priority}"`)
                .replace(/message\.from/g, `"${message.from}"`);
            return eval(evaluableCondition);
        }
        catch (error) {
            this.logger.warn(`Failed to evaluate rule condition: ${condition}`, error);
            return false;
        }
    }
    async executeRuleAction(action, message) {
        switch (action) {
            case 'require_response':
                message.metadata = { ...message.metadata, requiresResponse: true };
                break;
            case 'immediate_delivery':
                message.metadata = { ...message.metadata, immediateDelivery: true };
                break;
            default:
                this.logger.debug(`Unknown rule action: ${action}`);
        }
    }
    storeMessage(message) {
        const channelId = message.metadata?.channelId;
        if (!channelId)
            return;
        let history = this.messageHistory.get(channelId);
        if (!history) {
            history = [];
            this.messageHistory.set(channelId, history);
        }
        history.push(message);
        // Limit history size
        if (history.length > this.options.maxMessageHistory) {
            history.shift();
        }
    }
    updateChannelActivity(message) {
        const channelId = message.metadata?.channelId;
        if (!channelId)
            return;
        const channel = this.channels.get(channelId);
        if (channel) {
            channel.lastActivity = new Date();
            channel.messageCount++;
        }
    }
    // Utility methods
    getMessageHistory(channelId, limit) {
        const history = this.messageHistory.get(channelId) || [];
        return limit ? history.slice(-limit) : history;
    }
    getActiveChannels() {
        return Array.from(this.channels.values()).filter(c => c.status === 'active');
    }
    generateChannelId() {
        return `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Statistics
    getStats() {
        const channels = Array.from(this.channels.values());
        const totalMessages = Array.from(this.messageHistory.values())
            .reduce((sum, history) => sum + history.length, 0);
        return {
            totalChannels: channels.length,
            activeChannels: channels.filter(c => c.status === 'active').length,
            totalMessages,
            totalRoutes: this.routes.size,
            totalProtocols: this.protocols.size
        };
    }
    // Cleanup
    clear() {
        this.channels.clear();
        this.routes.clear();
        this.messageHistory.clear();
        this.pendingMessages.clear();
        // Keep default protocols
        this.initializeDefaultProtocols();
        this.emit('cleared');
        this.logger.info('Communication system cleared');
    }
    // Destroy and cleanup all resources
    destroy() {
        this.channels.clear();
        this.routes.clear();
        this.messageHistory.clear();
        this.pendingMessages.clear();
        this.protocols.clear();
        this.removeAllListeners();
        this.logger.info('Communication system destroyed');
    }
}
exports.CommunicationManager = CommunicationManager;
//# sourceMappingURL=index.js.map