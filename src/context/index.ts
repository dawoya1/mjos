/**
 * MJOS Context Management System
 * 魔剑工作室操作系统上下文管理系统
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/index';
import { 
  ContextSession, 
  ContextState, 
  ContextMessage 
} from '../types/index';

export interface ContextManagerOptions {
  maxSessions?: number;
  sessionTimeout?: number; // milliseconds
  compressionThreshold?: number; // number of messages
  persistencePath?: string;
  enableCompression?: boolean;
  enableSharing?: boolean;
}

export interface ContextCompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  summary: string;
  keyPoints: string[];
}

export class ContextManager extends EventEmitter {
  private sessions: Map<string, ContextSession> = new Map();
  private sharedContexts: Map<string, any> = new Map();
  private logger: Logger;
  private options: ContextManagerOptions;
  private cleanupInterval?: ReturnType<typeof setTimeout>;

  constructor(options: ContextManagerOptions = {}) {
    super();
    
    this.options = {
      maxSessions: options.maxSessions || 100,
      sessionTimeout: options.sessionTimeout || 24 * 60 * 60 * 1000, // 24 hours
      compressionThreshold: options.compressionThreshold || 50,
      persistencePath: options.persistencePath || 'contexts.json',
      enableCompression: options.enableCompression || true,
      enableSharing: options.enableSharing || true,
      ...options
    };

    this.logger = new Logger('ContextManager');
    this.startCleanupTimer();
  }

  // Create new session
  createSession(userIdOrSessionId?: string): string {
    // If the parameter looks like a session ID (e.g., 'default'), use it as sessionId
    // Otherwise, treat it as userId and generate a new sessionId
    let sessionId: string;
    let userId: string | undefined;

    if (userIdOrSessionId === 'default' || (userIdOrSessionId && userIdOrSessionId.length < 20)) {
      sessionId = userIdOrSessionId;
      userId = undefined;
    } else {
      sessionId = this.generateSessionId();
      userId = userIdOrSessionId;
    }

    const session: ContextSession = {
      id: sessionId,
      ...(userId ? { userId } : {}),
      startTime: new Date(),
      lastActivity: new Date(),
      state: {
        activeRoles: [],
        workingMemory: {},
        conversationHistory: [],
        sharedContext: {}
      },
      metadata: {}
    };

    // Check capacity
    if (this.sessions.size >= this.options.maxSessions!) {
      this.evictOldestSession();
    }

    this.sessions.set(sessionId, session);
    this.emit('session-created', session);
    this.logger.debug(`Session created: ${sessionId}`);

    return sessionId;
  }

  // Get session
  getSession(sessionId: string): ContextSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  // Update session state
  updateSession(sessionId: string, updates: Partial<ContextState>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.state = { ...session.state, ...updates };
    session.lastActivity = new Date();

    this.emit('session-updated', session);
    this.logger.debug(`Session updated: ${sessionId}`);

    return true;
  }

  // Add message to conversation history
  addMessage(sessionId: string, message: Omit<ContextMessage, 'id' | 'timestamp'>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const contextMessage: ContextMessage = {
      id: this.generateMessageId(),
      timestamp: new Date(),
      ...message
    };

    session.state.conversationHistory.push(contextMessage);
    session.lastActivity = new Date();

    // Check if compression is needed
    if (this.options.enableCompression && 
        session.state.conversationHistory.length >= this.options.compressionThreshold!) {
      this.compressConversationHistory(sessionId);
    }

    this.emit('message-added', { sessionId, message: contextMessage });
    this.logger.debug(`Message added to session: ${sessionId}`);

    return true;
  }

  // Get conversation history
  getConversationHistory(sessionId: string, limit?: number): ContextMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    const history = session.state.conversationHistory;
    return limit ? history.slice(-limit) : history;
  }

  // Set working memory
  setWorkingMemory(sessionId: string, key: string, value: any): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.state.workingMemory[key] = value;
    session.lastActivity = new Date();

    this.emit('working-memory-updated', { sessionId, key, value });
    this.logger.debug(`Working memory updated: ${sessionId}/${key}`);

    return true;
  }

  // Get working memory
  getWorkingMemory(sessionId: string, key?: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }

    return key ? session.state.workingMemory[key] : session.state.workingMemory;
  }

  // Convenience methods for global context (using default session)
  private defaultSessionId = 'default';

  // Set global context value
  set(key: string, value: any): void {
    // Ensure default session exists
    if (!this.sessions.has(this.defaultSessionId)) {
      this.createSession(this.defaultSessionId);
    }
    this.setWorkingMemory(this.defaultSessionId, key, value);
  }

  // Get global context value
  get(key: string): any {
    // Ensure default session exists
    if (!this.sessions.has(this.defaultSessionId)) {
      this.createSession(this.defaultSessionId);
    }
    return this.getWorkingMemory(this.defaultSessionId, key);
  }

  // Get all global context values
  getAll(): any {
    // Ensure default session exists
    if (!this.sessions.has(this.defaultSessionId)) {
      this.createSession(this.defaultSessionId);
    }
    return this.getWorkingMemory(this.defaultSessionId);
  }

  // Share context between sessions
  shareContext(fromSessionId: string, toSessionId: string, contextKey: string): boolean {
    if (!this.options.enableSharing) {
      return false;
    }

    const fromSession = this.sessions.get(fromSessionId);
    const toSession = this.sessions.get(toSessionId);

    if (!fromSession || !toSession) {
      return false;
    }

    const contextValue = fromSession.state.workingMemory[contextKey];
    if (contextValue !== undefined) {
      toSession.state.sharedContext[contextKey] = {
        value: contextValue,
        source: fromSessionId,
        timestamp: new Date()
      };

      this.emit('context-shared', { fromSessionId, toSessionId, contextKey });
      this.logger.debug(`Context shared: ${fromSessionId} -> ${toSessionId}/${contextKey}`);
      return true;
    }

    return false;
  }

  // Compress conversation history
  private compressConversationHistory(sessionId: string): ContextCompressionResult | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const history = session.state.conversationHistory;
    const originalSize = history.length;

    if (originalSize < this.options.compressionThreshold!) {
      return null;
    }

    // Simple compression: keep first few and last few messages, summarize middle
    const keepStart = 5;
    const keepEnd = 10;
    const toCompress = history.slice(keepStart, -keepEnd);

    if (toCompress.length === 0) {
      return null;
    }

    // Generate summary
    const summary = this.generateSummary(toCompress);
    const keyPoints = this.extractKeyPoints(toCompress);

    // Create compressed history
    const compressedHistory = [
      ...history.slice(0, keepStart),
      {
        id: this.generateMessageId(),
        role: 'system',
        content: {
          type: 'compression-summary',
          summary,
          keyPoints,
          originalMessageCount: toCompress.length
        },
        timestamp: new Date()
      },
      ...history.slice(-keepEnd)
    ];

    session.state.conversationHistory = compressedHistory;

    const result: ContextCompressionResult = {
      originalSize,
      compressedSize: compressedHistory.length,
      compressionRatio: compressedHistory.length / originalSize,
      summary,
      keyPoints
    };

    this.emit('conversation-compressed', { sessionId, result });
    this.logger.info(`Conversation compressed: ${sessionId} (${originalSize} -> ${compressedHistory.length})`);

    return result;
  }

  // Generate summary of messages
  private generateSummary(messages: ContextMessage[]): string {
    // Simple summarization - in practice, this could use AI
    const topics = new Set<string>();
    const participants = new Set<string>();

    messages.forEach(msg => {
      participants.add(msg.role);
      
      // Extract potential topics from content
      if (typeof msg.content === 'string') {
        const words = msg.content.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 4 && !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will'].includes(word)) {
            topics.add(word);
          }
        });
      }
    });

    return `Conversation between ${Array.from(participants).join(', ')} covering topics: ${Array.from(topics).slice(0, 10).join(', ')}`;
  }

  // Extract key points from messages
  private extractKeyPoints(messages: ContextMessage[]): string[] {
    const keyPoints: string[] = [];
    
    messages.forEach(msg => {
      if (typeof msg.content === 'string') {
        // Look for sentences with key indicators
        const sentences = msg.content.split(/[.!?]+/);
        sentences.forEach(sentence => {
          const lower = sentence.toLowerCase().trim();
          if (lower.includes('important') || 
              lower.includes('key') || 
              lower.includes('remember') ||
              lower.includes('decision') ||
              lower.includes('conclusion')) {
            keyPoints.push(sentence.trim());
          }
        });
      }
    });

    return keyPoints.slice(0, 5); // Keep top 5 key points
  }

  // Restore context from compressed state
  restoreContext(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Find compression summaries and expand them if needed
    const history = session.state.conversationHistory;
    let hasCompression = false;

    history.forEach(msg => {
      if (msg.role === 'system' && 
          typeof msg.content === 'object' && 
          msg.content.type === 'compression-summary') {
        hasCompression = true;
      }
    });

    if (hasCompression) {
      this.emit('context-restored', { sessionId });
      this.logger.debug(`Context restoration attempted: ${sessionId}`);
    }

    return hasCompression;
  }

  // Delete session
  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    this.sessions.delete(sessionId);
    this.emit('session-deleted', sessionId);
    this.logger.debug(`Session deleted: ${sessionId}`);

    return true;
  }

  // Cleanup expired sessions
  private cleanup(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      const timeSinceActivity = now - session.lastActivity.getTime();
      if (timeSinceActivity > this.options.sessionTimeout!) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.deleteSession(sessionId);
    });

    if (expiredSessions.length > 0) {
      this.logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  private evictOldestSession(): void {
    let oldestSession: ContextSession | undefined;
    let oldestSessionId: string | undefined;

    for (const [sessionId, session] of this.sessions) {
      if (!oldestSession || session.lastActivity < oldestSession.lastActivity) {
        oldestSession = session;
        oldestSessionId = sessionId;
      }
    }

    if (oldestSessionId) {
      this.deleteSession(oldestSessionId);
      this.logger.debug(`Evicted oldest session: ${oldestSessionId}`);
    }
  }

  private startCleanupTimer(): void {
    // Cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get statistics
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
    compressionEvents: number;
    } {
    const sessions = Array.from(this.sessions.values());
    const now = Date.now();
    const activeThreshold = 60 * 60 * 1000; // 1 hour

    const activeSessions = sessions.filter(session => 
      now - session.lastActivity.getTime() < activeThreshold
    ).length;

    const totalMessages = sessions.reduce((sum, session) => 
      sum + session.state.conversationHistory.length, 0
    );

    const compressionEvents = sessions.reduce((sum, session) => {
      return sum + session.state.conversationHistory.filter(msg => 
        msg.role === 'system' && 
        typeof msg.content === 'object' && 
        msg.content.type === 'compression-summary'
      ).length;
    }, 0);

    return {
      totalSessions: sessions.length,
      activeSessions,
      totalMessages,
      averageMessagesPerSession: sessions.length > 0 ? totalMessages / sessions.length : 0,
      compressionEvents
    };
  }

  // Save contexts to persistence
  save(): void {
    if (!this.options.persistencePath) return;

    try {
      const fs = require('fs');
      const data = {
        sessions: Object.fromEntries(this.sessions),
        sharedContexts: Object.fromEntries(this.sharedContexts),
        metadata: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          sessionCount: this.sessions.size
        }
      };

      fs.writeFileSync(this.options.persistencePath, JSON.stringify(data, null, 2));
      this.logger.debug(`Contexts saved to ${this.options.persistencePath}`);
    } catch (error) {
      this.logger.error('Failed to save contexts', error);
    }
  }

  // Load contexts from persistence
  load(): void {
    if (!this.options.persistencePath) return;

    try {
      const fs = require('fs');
      if (fs.existsSync(this.options.persistencePath)) {
        const data = JSON.parse(fs.readFileSync(this.options.persistencePath, 'utf8'));
        
        if (data.sessions) {
          this.sessions.clear();
          for (const [id, session] of Object.entries(data.sessions)) {
            const contextSession = session as ContextSession;
            contextSession.startTime = new Date(contextSession.startTime);
            contextSession.lastActivity = new Date(contextSession.lastActivity);
            
            // Convert message timestamps
            contextSession.state.conversationHistory.forEach(msg => {
              msg.timestamp = new Date(msg.timestamp);
            });
            
            this.sessions.set(id, contextSession);
          }
        }

        if (data.sharedContexts) {
          this.sharedContexts = new Map(Object.entries(data.sharedContexts));
        }

        this.logger.info(`Contexts loaded: ${this.sessions.size} sessions`);
      }
    } catch (error) {
      this.logger.error('Failed to load contexts', error);
    }
  }

  // Cleanup resources
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.sessions.clear();
    this.sharedContexts.clear();
    this.removeAllListeners();
    
    this.logger.info('Context manager destroyed');
  }
}
