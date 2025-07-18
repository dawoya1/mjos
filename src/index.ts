/**
 * MJOS Main Entry Point - Performance Enhanced
 * 魔剑工作室操作系统主入口 - 性能增强版本
 */

import { MJOSEngine, Logger, ContextManager as CoreContextManager, ConfigManager } from './core/index';
import { MemorySystem, IntelligentMemoryManager, IntelligentMemoryType, ThinkingMethod } from './memory/index';
import { getVersion, getVersionInfo } from './utils/version';
import { TeamManager } from './team/index';
import { KnowledgeGraph } from './knowledge/index';
import { ContextManager } from './context/index';
import { ReasoningEngine } from './reasoning/index';
import { AgentManager } from './agents/index';
import { RoleManager } from './roles/index';
import { CommunicationManager } from './communication/index';
import { MCPManager } from './mcp/index';
import { WorkflowEngine } from './workflow/index';
import { APIServer } from './api/index';
import { StorageManager } from './storage/index';
import { SecurityManager } from './security/index';

// 简化的性能监控接口
interface SimplePerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  systemUptime: number;
}

// 简化的性能监控类
class SimplePerformanceMonitor {
  private startTime: number = Date.now();

  getMetrics(): SimplePerformanceMetrics {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();

    return {
      memoryUsage: {
        used: memUsage.heapUsed,
        total: totalMemory,
        percentage: (memUsage.heapUsed / totalMemory) * 100
      },
      systemUptime: Date.now() - this.startTime
    };
  }

  getSummary() {
    const metrics = this.getMetrics();
    return {
      status: metrics.memoryUsage.percentage > 85 ? 'warning' : 'healthy',
      metrics
    };
  }

  reset() {
    this.startTime = Date.now();
  }

  start() {
    // 简化版：不做任何操作
  }

  stop() {
    // 简化版：不做任何操作
  }

  destroy() {
    // 简化版：不做任何操作
  }

  createTimer<T extends (...args: any[]) => any>(fn: T, category: string): T {
    // 简化版：直接返回原函数，不做性能计时
    return fn;
  }
}

// 导出核心类型和模块
export * from './types/index';
export * from './core/index';
export * from './memory/index';
export * from './team/index';
export * from './knowledge/index';
export { ContextManager as SessionContextManager } from './context/index';
export * from './reasoning/index';
export * from './agents/index';
export * from './roles/index';
export * from './communication/index';
export { MCPManager, MCPSession } from './mcp/index';
export { WorkflowEngine, WorkflowDefinition, WorkflowExecution } from './workflow/index';
export * from './api/index';
export * from './storage/index';
export * from './security/index';

// 主MJOS类
export class MJOS {
  private version = getVersion();
  private _running = false;
  private engine: MJOSEngine;
  private logger: Logger;
  private config: ConfigManager;
  private coreContextManager: CoreContextManager;
  private memorySystem: MemorySystem;
  private intelligentMemoryManager: IntelligentMemoryManager;
  private teamManager: TeamManager;
  private performanceMonitor: SimplePerformanceMonitor;
  private knowledgeGraph: KnowledgeGraph;
  private contextManager: ContextManager;
  private reasoningEngine: ReasoningEngine;
  private agentManager: AgentManager;
  private roleManager: RoleManager;
  private communicationManager: CommunicationManager;
  private mcpManager: MCPManager;
  private workflowEngine: WorkflowEngine;
  private apiServer?: APIServer;
  private storageManager: StorageManager;
  private securityManager: SecurityManager;
  
  constructor() {
    // Initialize configuration first
    this.config = new ConfigManager({
      defaultConfig: {
        mjos: {
          version: '2.0.0',
          environment: 'development',
          enableKnowledgeGraph: true,
          enableReasoning: true
        }
      }
    });

    this.logger = new Logger('MJOS', {
      level: this.config.get('mjos.logLevel', 2), // INFO level
      enableFile: this.config.get('mjos.enableFileLogging', false)
    });

    // Initialize core systems
    this.engine = new MJOSEngine({
      config: this.config,
      logger: this.logger
    });

    this.coreContextManager = new CoreContextManager({
      defaultTTL: this.config.get('mjos.contextTTL', 3600000), // 1 hour
      enablePersistence: this.config.get('mjos.enablePersistence', true)
    });

    this.memorySystem = new MemorySystem({
      shortTermCapacity: this.config.get('mjos.shortTermMemoryCapacity', 100),
      longTermCapacity: this.config.get('mjos.longTermMemoryCapacity', 10000),
      enableSemantic: this.config.get('mjos.enableSemanticSearch', false)
    });

    // Initialize intelligent memory manager with layered strategy
    this.intelligentMemoryManager = new IntelligentMemoryManager();

    this.performanceMonitor = new SimplePerformanceMonitor();

    this.knowledgeGraph = new KnowledgeGraph({
      maxNodes: this.config.get('mjos.maxKnowledgeNodes', 10000),
      enableSemanticSearch: this.config.get('mjos.enableSemanticSearch', false),
      autoSave: this.config.get('mjos.autoSaveKnowledge', true)
    });

    this.contextManager = new ContextManager({
      maxSessions: this.config.get('mjos.maxSessions', 100),
      enableCompression: this.config.get('mjos.enableContextCompression', true),
      enableSharing: this.config.get('mjos.enableContextSharing', true)
    });

    this.reasoningEngine = new ReasoningEngine({
      enableProbabilistic: this.config.get('mjos.enableProbabilisticReasoning', true),
      enableLearning: this.config.get('mjos.enableLearning', false)
    });

    this.agentManager = new AgentManager({
      maxAgents: this.config.get('mjos.maxAgents', 50),
      enableLearning: this.config.get('mjos.enableLearning', false),
      enableCollaboration: this.config.get('mjos.enableCollaboration', true)
    });

    this.roleManager = new RoleManager({
      maxRoles: this.config.get('mjos.maxRoles', 100),
      enableHierarchy: this.config.get('mjos.enableRoleHierarchy', true),
      enableInheritance: this.config.get('mjos.enableRoleInheritance', true)
    });

    this.communicationManager = new CommunicationManager({
      maxChannels: this.config.get('mjos.maxChannels', 100),
      enableEncryption: this.config.get('mjos.enableEncryption', false),
      enableCompression: this.config.get('mjos.enableCompression', false)
    });

    this.mcpManager = new MCPManager(
      {
        enableResourceSync: this.config.get('mjos.enableMCPResourceSync', true),
        enableToolSharing: this.config.get('mjos.enableMCPToolSharing', true),
        maxSessions: this.config.get('mjos.maxMCPSessions', 10)
      },
      this.contextManager,
      this.knowledgeGraph,
      this.memorySystem
    );

    this.workflowEngine = new WorkflowEngine(
      {
        maxConcurrentExecutions: this.config.get('mjos.maxWorkflowExecutions', 10),
        enablePersistence: this.config.get('mjos.enableWorkflowPersistence', false)
      },
      this.agentManager,
      this.roleManager,
      undefined, // teamManager will be initialized next
      this.communicationManager
    );

    this.teamManager = new TeamManager(
      this.engine.getEventBus(),
      this.agentManager,
      this.roleManager
    );

    // Initialize infrastructure modules
    this.storageManager = new StorageManager({
      defaultProvider: this.config.get('mjos.defaultStorageProvider', 'memory'),
      enableCaching: this.config.get('mjos.enableStorageCaching', true),
      enableCompression: this.config.get('mjos.enableStorageCompression', false),
      enableEncryption: this.config.get('mjos.enableStorageEncryption', false)
    });

    this.securityManager = new SecurityManager({
      enableAuditLog: this.config.get('mjos.enableSecurityAuditLog', true),
      enableEncryption: this.config.get('mjos.enableSecurityEncryption', true),
      tokenExpiration: this.config.get('mjos.tokenExpiration', 3600000),
      maxLoginAttempts: this.config.get('mjos.maxLoginAttempts', 5)
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
    this.engine.registerModule('storage', this.storageManager);
    this.engine.registerModule('security', this.securityManager);

    // Setup inter-module communication
    this.setupModuleIntegration();

    this.logger.info(getVersionInfo());
  }
  
  private setupModuleIntegration(): void {
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
      this.memorySystem.store(
        { event: 'session_created', sessionId: session.id },
        ['session', 'system'],
        0.6
      );
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


  }

  getVersion(): string {
    return this.version;
  }

  get running(): boolean {
    return this._running;
  }
  
  async start(): Promise<void> {
    this.logger.info('Starting MJOS with enhanced infrastructure...');

    // Connect storage
    await this.storageManager.connect();

    await this.engine.start();

    // Store startup event in memory
    this.memorySystem.store(
      { event: 'system_start', timestamp: new Date() },
      ['system', 'startup'],
      0.8
    );

    this._running = true;
    this.logger.info('MJOS started successfully with all infrastructure modules!');
  }
  
  async stop(): Promise<void> {
    this.logger.info('Stopping MJOS...');

    // Store shutdown event in memory
    this.memorySystem.store(
      { event: 'system_stop', timestamp: new Date() },
      ['system', 'shutdown'],
      0.8
    );

    // Stop API server if running
    if (this.apiServer) {
      await this.stopAPIServer();
    }

    // Stop infrastructure modules
    this.securityManager.destroy();
    await this.storageManager.disconnect();

    await this.engine.stop();

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

    // Note: Memory system and knowledge graph are not destroyed here
    // to allow tests to access stored events. They will be cleaned up
    // when the process exits or in a separate cleanup method.

    this._running = false;
    this.logger.info('MJOS stopped successfully with all infrastructure modules!');
  }

  // Cleanup method for complete resource cleanup (used in tests)
  async cleanup(): Promise<void> {
    if (this._running) {
      throw new Error('Cannot cleanup while MJOS is running. Call stop() first.');
    }

    // Destroy all modules with timers
    this.memorySystem.destroy();
    await this.intelligentMemoryManager.destroy();
    this.knowledgeGraph.destroy();
    this.coreContextManager.destroy();
    this.contextManager.destroy();
    this.mcpManager.destroy();
    this.storageManager.destroy();

    this.logger.info('MJOS cleanup completed');
  }

  getStatus(): {
    version: string;
    running: boolean;
    engine: any;
    memory: any;
    knowledge: any;
    context: any;
    reasoning: any;
    team: any;
    performance: any;
    } {
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
  getEngine(): MJOSEngine {
    return this.engine;
  }
  
  getContextManager(): ContextManager {
    return this.contextManager;
  }
  
  getMemorySystem(): MemorySystem {
    return this.memorySystem;
  }
  
  getTeamManager(): TeamManager {
    return this.teamManager;
  }
  


  getKnowledgeGraph(): KnowledgeGraph {
    return this.knowledgeGraph;
  }

  getReasoningEngine(): ReasoningEngine {
    return this.reasoningEngine;
  }

  getConfig(): ConfigManager {
    return this.config;
  }

  getAgentManager(): AgentManager {
    return this.agentManager;
  }

  getRoleManager(): RoleManager {
    return this.roleManager;
  }

  getCommunicationManager(): CommunicationManager {
    return this.communicationManager;
  }

  getMCPManager(): MCPManager {
    return this.mcpManager;
  }

  getWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }

  getAPIServer(): APIServer | undefined {
    return this.apiServer;
  }

  getStorageManager(): StorageManager {
    return this.storageManager;
  }

  getSecurityManager(): SecurityManager {
    return this.securityManager;
  }


  
  // Convenience methods with performance monitoring
  remember(content: any, options: { tags?: string[], importance?: number } = {}): string {
    const tags = options.tags || [];
    const importance = options.importance || 0.5;

    // Use traditional memory system for synchronous operation
    return this.memorySystem.store(content, tags, importance);
  }

  // Async intelligent memory storage
  async smartRemember(content: any, options: { tags?: string[], importance?: number } = {}): Promise<string> {
    const tags = options.tags || [];
    const importance = options.importance || 0.5;

    // Use intelligent memory manager for automatic classification and storage
    return await this.intelligentMemoryManager.smartStore(content, { tags, importance });
  }

  // Smart memory retrieval with automatic context awareness
  async smartRecall(query: string, options?: {
    includeWorkingMemory?: boolean;
    maxResults?: number;
    minImportance?: number;
  }) {
    return await this.intelligentMemoryManager.autoRetrieve(query, options);
  }

  // Deep thinking with integrated memory retrieval
  async deepThink(problem: string, method?: ThinkingMethod) {
    return await this.intelligentMemoryManager.deepThink(problem, method);
  }
  
  recall(query: any): any[] {
    return this.memorySystem.query(query);
  }
  
  createTask(title: string, description: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): string {
    return this.teamManager.createTask({
      title,
      description,
      status: 'pending',
      priority
    });
  }
  
  assignTask(taskId: string, memberId: string): boolean {
    return this.teamManager.assignTask(taskId, memberId);
  }

  // Enhanced convenience methods for new capabilities

  // Knowledge management
  addKnowledge(content: any, type: any = 'fact', domain: string = 'general', tags: string[] = []): string {
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

  queryKnowledge(query: any): any[] {
    return this.knowledgeGraph.query(query);
  }

  // Context management
  createSession(userId?: string): string {
    return this.contextManager.createSession(userId);
  }

  addMessage(sessionId: string, role: string, content: any): boolean {
    return this.contextManager.addMessage(sessionId, { role, content });
  }

  getConversationHistory(sessionId: string, limit?: number): any[] {
    return this.contextManager.getConversationHistory(sessionId, limit);
  }

  // Reasoning capabilities
  async reason(type: any, input: any, context: any = {}): Promise<any> {
    const request = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      input,
      context
    };

    return await this.reasoningEngine.reason(request);
  }

  // Advanced memory operations
  rememberWithContext(content: any, sessionId?: string, tags: string[] = [], importance: number = 0.5): string {
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
  async intelligentRecall(query: any, useReasoning: boolean = true): Promise<any> {
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
  createIntelligentTask(title: string, description: string, domain: string = 'general'): string {
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
  async startAPIServer(options?: any): Promise<void> {
    if (this.apiServer) {
      throw new Error('API server is already running');
    }

    this.apiServer = new APIServer(this, options);
    await this.apiServer.start();
    this.logger.info('API server started successfully');
  }

  async stopAPIServer(): Promise<void> {
    if (this.apiServer) {
      await this.apiServer.stop();
      delete this.apiServer;
      this.logger.info('API server stopped');
    }
  }

  // Enhanced workflow management
  async executeWorkflow(workflowId: string, variables?: Record<string, any>): Promise<string> {
    return await this.workflowEngine.executeWorkflow(workflowId, variables, 'api');
  }

  // Enhanced agent management
  createAgent(definition: any): string {
    return this.agentManager.createAgent(definition);
  }

  assignTaskToAgent(taskId: string, agentId?: string): string {
    if (agentId) {
      return this.agentManager.assignTask(agentId, taskId);
    }
    return this.teamManager.assignTask(taskId, 'auto').toString();
  }

  // 简化的性能监控方法
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }

  getPerformanceSummary() {
    return this.performanceMonitor.getSummary();
  }

  resetPerformanceMetrics(): void {
    this.performanceMonitor.reset();
  }

  // Enhanced role management
  createRole(definition: any): string {
    return this.roleManager.createRole(definition);
  }

  assignRoleToAgent(roleId: string, agentId: string): string {
    return this.roleManager.assignRole(roleId, agentId, 'system');
  }

  // Enhanced communication
  async sendMessage(from: string, to: string, content: any, type: any = 'notification'): Promise<string> {
    return await this.communicationManager.sendMessage(from, to, type, content);
  }

  createCommunicationChannel(name: string, participants: string[], type: any = 'multicast'): string {
    return this.communicationManager.createChannel(name, type, participants);
  }
  


}

// 默认导出
export default MJOS;
