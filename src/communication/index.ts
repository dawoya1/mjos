/**
 * MJOS Communication System
 * 魔剑工作室操作系统通信系统
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/index';
import { 
  Message, 
  MessageType, 
  MessagePriority,
  CommunicationProtocol,
  ProtocolRule,
  SecuritySettings 
} from '../types/index';

export interface MessageRoute {
  pattern: string;
  handler: MessageHandler;
  priority: number;
  middleware?: MessageMiddleware[];
}

export interface MessageHandler {
  (message: Message, context: MessageContext): Promise<any> | any;
}

export interface MessageMiddleware {
  (message: Message, context: MessageContext, next: () => Promise<void>): Promise<void>;
}

export interface MessageContext {
  route: MessageRoute;
  session?: string;
  metadata: Record<string, any>;
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'direct' | 'broadcast' | 'multicast' | 'queue';
  participants: string[];
  protocol: string;
  status: 'active' | 'paused' | 'closed';
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  metadata: Record<string, any>;
}

export interface CommunicationManagerOptions {
  maxChannels?: number;
  maxMessageHistory?: number;
  enableEncryption?: boolean;
  enableCompression?: boolean;
  defaultTimeout?: number;
  retryAttempts?: number;
}

export class CommunicationManager extends EventEmitter {
  private channels: Map<string, CommunicationChannel> = new Map();
  private routes: Map<string, MessageRoute> = new Map();
  private protocols: Map<string, CommunicationProtocol> = new Map();
  private messageHistory: Map<string, Message[]> = new Map();
  private pendingMessages: Map<string, Message> = new Map();
  private logger: Logger;
  private options: CommunicationManagerOptions;

  constructor(options: CommunicationManagerOptions = {}) {
    super();
    
    this.options = {
      maxChannels: options.maxChannels || 100,
      maxMessageHistory: options.maxMessageHistory || 1000,
      enableEncryption: options.enableEncryption || false,
      enableCompression: options.enableCompression || false,
      defaultTimeout: options.defaultTimeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      ...options
    };

    this.logger = new Logger('CommunicationManager');
    this.initializeDefaultProtocols();
  }

  private initializeDefaultProtocols(): void {
    // Standard MJOS protocol
    const mjosProtocol: CommunicationProtocol = {
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
  createChannel(
    name: string, 
    type: CommunicationChannel['type'], 
    participants: string[], 
    protocol: string = 'MJOS'
  ): string {
    if (this.channels.size >= this.options.maxChannels!) {
      throw new Error('Maximum number of channels reached');
    }

    const id = this.generateChannelId();
    const channel: CommunicationChannel = {
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

  getChannel(channelId: string): CommunicationChannel | undefined {
    return this.channels.get(channelId);
  }

  closeChannel(channelId: string): boolean {
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
  addRoute(pattern: string, handler: MessageHandler, priority: number = 0): void {
    const route: MessageRoute = {
      pattern,
      handler,
      priority,
      middleware: []
    };

    this.routes.set(pattern, route);
    this.logger.debug(`Route added: ${pattern}`);
  }

  addMiddleware(pattern: string, middleware: MessageMiddleware): boolean {
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
  async sendMessage(
    from: string,
    to: string | string[],
    type: MessageType,
    content: any,
    priority: MessagePriority = 'normal',
    channelId?: string
  ): Promise<string> {
    const messageId = this.generateMessageId();
    const message: Message = {
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
    } catch (error) {
      this.logger.error(`Failed to send message ${messageId}`, error);
      throw error;
    }
  }

  // Broadcast message to all participants in a channel
  async broadcastMessage(
    from: string,
    channelId: string,
    content: any,
    priority: MessagePriority = 'normal'
  ): Promise<string> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const recipients = channel.participants.filter(p => p !== from);
    return await this.sendMessage(from, recipients, 'broadcast', content, priority, channelId);
  }

  // Request-Response pattern
  async sendRequest(
    from: string,
    to: string,
    content: any,
    timeout?: number
  ): Promise<any> {
    const messageId = await this.sendMessage(from, to, 'request', content, 'normal');
    
    return new Promise((resolve, reject) => {
      const timeoutMs = timeout || this.options.defaultTimeout!;
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
  async sendResponse(requestMessage: Message, content: any): Promise<string> {
    if (requestMessage.type !== 'request') {
      throw new Error('Can only respond to request messages');
    }

    const responseId = await this.sendMessage(
      requestMessage.to as string,
      requestMessage.from,
      'response',
      content,
      requestMessage.priority
    );

    this.emit(`response:${requestMessage.id}`, {
      id: responseId,
      content,
      originalRequest: requestMessage
    });

    return responseId;
  }

  private async processMessage(message: Message): Promise<void> {
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

  private async routeMessage(message: Message): Promise<void> {
    const matchingRoutes = this.findMatchingRoutes(message);
    
    if (matchingRoutes.length === 0) {
      this.logger.warn(`No routes found for message: ${message.id}`);
      return;
    }

    // Sort by priority
    matchingRoutes.sort((a, b) => b.priority - a.priority);

    for (const route of matchingRoutes) {
      try {
        const context: MessageContext = {
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

      } catch (error) {
        this.logger.error(`Route handler failed: ${route.pattern}`, error);
        this.emit('message-error', { message, error, route });
      }
    }
  }

  private async executeMiddleware(
    message: Message,
    context: MessageContext,
    middleware: MessageMiddleware[]
  ): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index < middleware.length) {
        const currentMiddleware = middleware[index++];
        if (currentMiddleware) {
          await currentMiddleware(message, context, next);
        }
      }
    };

    await next();
  }

  private findMatchingRoutes(message: Message): MessageRoute[] {
    const routes: MessageRoute[] = [];

    for (const [pattern, route] of this.routes) {
      if (this.matchesPattern(pattern, message)) {
        routes.push(route);
      }
    }

    return routes;
  }

  private matchesPattern(pattern: string, message: Message): boolean {
    // Simple pattern matching - could be enhanced with regex or more sophisticated matching
    if (pattern === '*') return true;
    if (pattern === message.type) return true;
    if (pattern.startsWith('from:') && pattern.substring(5) === message.from) return true;
    if (pattern.startsWith('to:') && pattern.substring(3) === message.to) return true;
    if (pattern.startsWith('priority:') && pattern.substring(9) === message.priority) return true;
    
    return false;
  }

  private async applyProtocolRules(message: Message): Promise<void> {
    const channelId = message.metadata?.channelId;
    if (!channelId) return;

    const channel = this.channels.get(channelId);
    if (!channel) return;

    const protocol = this.protocols.get(channel.protocol);
    if (!protocol) return;

    for (const rule of protocol.rules) {
      if (this.evaluateRuleCondition(rule.condition, message)) {
        await this.executeRuleAction(rule.action, message);
      }
    }
  }

  private evaluateRuleCondition(condition: string, message: Message): boolean {
    // Simple condition evaluation - in practice, would use a proper expression evaluator
    try {
      // Replace message references with actual values
      const evaluableCondition = condition
        .replace(/message\.type/g, `"${message.type}"`)
        .replace(/message\.priority/g, `"${message.priority}"`)
        .replace(/message\.from/g, `"${message.from}"`);
      
      return eval(evaluableCondition);
    } catch (error) {
      this.logger.warn(`Failed to evaluate rule condition: ${condition}`, error);
      return false;
    }
  }

  private async executeRuleAction(action: string, message: Message): Promise<void> {
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

  private storeMessage(message: Message): void {
    const channelId = message.metadata?.channelId;
    if (!channelId) return;

    let history = this.messageHistory.get(channelId);
    if (!history) {
      history = [];
      this.messageHistory.set(channelId, history);
    }

    history.push(message);

    // Limit history size
    if (history.length > this.options.maxMessageHistory!) {
      history.shift();
    }
  }

  private updateChannelActivity(message: Message): void {
    const channelId = message.metadata?.channelId;
    if (!channelId) return;

    const channel = this.channels.get(channelId);
    if (channel) {
      channel.lastActivity = new Date();
      channel.messageCount++;
    }
  }

  // Utility methods
  getMessageHistory(channelId: string, limit?: number): Message[] {
    const history = this.messageHistory.get(channelId) || [];
    return limit ? history.slice(-limit) : history;
  }

  getActiveChannels(): CommunicationChannel[] {
    return Array.from(this.channels.values()).filter(c => c.status === 'active');
  }

  private generateChannelId(): string {
    return `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Statistics
  getStats(): {
    totalChannels: number;
    activeChannels: number;
    totalMessages: number;
    totalRoutes: number;
    totalProtocols: number;
    } {
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
  clear(): void {
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
  destroy(): void {
    this.channels.clear();
    this.routes.clear();
    this.messageHistory.clear();
    this.pendingMessages.clear();
    this.protocols.clear();
    this.removeAllListeners();
    this.logger.info('Communication system destroyed');
  }
}
