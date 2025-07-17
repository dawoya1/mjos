/**
 * MJOS Communication System
 * 魔剑工作室操作系统通信系统
 */
import { EventEmitter } from 'events';
import { Message, MessageType, MessagePriority } from '../types/index';
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
export declare class CommunicationManager extends EventEmitter {
    private channels;
    private routes;
    private protocols;
    private messageHistory;
    private pendingMessages;
    private logger;
    private options;
    constructor(options?: CommunicationManagerOptions);
    private initializeDefaultProtocols;
    createChannel(name: string, type: CommunicationChannel['type'], participants: string[], protocol?: string): string;
    getChannel(channelId: string): CommunicationChannel | undefined;
    closeChannel(channelId: string): boolean;
    addRoute(pattern: string, handler: MessageHandler, priority?: number): void;
    addMiddleware(pattern: string, middleware: MessageMiddleware): boolean;
    sendMessage(from: string, to: string | string[], type: MessageType, content: any, priority?: MessagePriority, channelId?: string): Promise<string>;
    broadcastMessage(from: string, channelId: string, content: any, priority?: MessagePriority): Promise<string>;
    sendRequest(from: string, to: string, content: any, timeout?: number): Promise<any>;
    sendResponse(requestMessage: Message, content: any): Promise<string>;
    private processMessage;
    private routeMessage;
    private executeMiddleware;
    private findMatchingRoutes;
    private matchesPattern;
    private applyProtocolRules;
    private evaluateRuleCondition;
    private executeRuleAction;
    private storeMessage;
    private updateChannelActivity;
    getMessageHistory(channelId: string, limit?: number): Message[];
    getActiveChannels(): CommunicationChannel[];
    private generateChannelId;
    private generateMessageId;
    getStats(): {
        totalChannels: number;
        activeChannels: number;
        totalMessages: number;
        totalRoutes: number;
        totalProtocols: number;
    };
    clear(): void;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map