/**
 * MJOS Main Entry Point - Performance Enhanced
 * 魔剑工作室操作系统主入口 - 性能增强版本
 */

import { MJOSEngine, EventBus, Logger, ContextManager } from './core/index';
import { MemorySystem } from './memory/index';
import { TeamManager } from './team/index';
import { PerformanceMonitor } from './performance/index';

// 导出核心类型和模块
export * from './types/index';
export * from './core/index';
export * from './memory/index';
export * from './team/index';
export * from './performance/index';

// 主MJOS类
export class MJOS {
  private version = '1.0.0';
  private engine: MJOSEngine;
  private logger: Logger;
  private contextManager: ContextManager;
  private memorySystem: MemorySystem;
  private teamManager: TeamManager;
  private performanceMonitor: PerformanceMonitor;
  
  constructor() {
    this.logger = new Logger('MJOS');
    this.engine = new MJOSEngine();
    this.contextManager = new ContextManager();
    this.memorySystem = new MemorySystem();
    this.teamManager = new TeamManager(this.engine.getEventBus());
    this.performanceMonitor = new PerformanceMonitor();
    
    // Wrap methods with performance monitoring
    this.wrapMethodsWithMonitoring();
    
    this.logger.info('MJOS initialized with performance monitoring!');
  }
  
  getVersion(): string {
    return this.version;
  }
  
  async start(): Promise<void> {
    this.logger.info('Starting MJOS with performance monitoring...');
    
    // Start performance monitoring
    this.performanceMonitor.start();
    
    await this.engine.start();
    
    // Store startup event in memory
    this.memorySystem.store(
      { event: 'system_start', timestamp: new Date() },
      ['system', 'startup'],
      0.8
    );
    
    this.logger.info('MJOS started successfully with monitoring!');
  }
  
  async stop(): Promise<void> {
    this.logger.info('Stopping MJOS...');
    
    // Store shutdown event in memory
    this.memorySystem.store(
      { event: 'system_stop', timestamp: new Date() },
      ['system', 'shutdown'],
      0.8
    );
    
    await this.engine.stop();
    
    // Stop performance monitoring
    this.performanceMonitor.stop();
    
    this.logger.info('MJOS stopped successfully!');
  }
  
  getStatus(): { 
    version: string; 
    engine: { running: boolean };
    memory: { totalMemories: number; totalTags: number; averageImportance: number };
    team: { totalMembers: number; activeMembers: number; totalTasks: number; completedTasks: number; activeSessions: number };
    performance: any;
  } {
    return {
      version: this.version,
      engine: this.engine.getStatus(),
      memory: this.memorySystem.getStats(),
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
  
  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }
  
  // Convenience methods with performance monitoring
  remember(content: any, tags: string[] = [], importance: number = 0.5): string {
    return this.memorySystem.store(content, tags, importance);
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
  
  // Performance monitoring methods
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }
  
  getPerformanceSummary() {
    return this.performanceMonitor.getSummary();
  }
  
  resetPerformanceMetrics(): void {
    this.performanceMonitor.reset();
  }
  
  private wrapMethodsWithMonitoring(): void {
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
    
    // Wrap context manager methods
    const originalSet = this.contextManager.set.bind(this.contextManager);
    const originalGet = this.contextManager.get.bind(this.contextManager);
    
    this.contextManager.set = this.performanceMonitor.createTimer(originalSet, 'context');
    this.contextManager.get = this.performanceMonitor.createTimer(originalGet, 'context');
  }
}

// 默认导出
export default MJOS;
