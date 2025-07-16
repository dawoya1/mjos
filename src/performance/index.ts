/**
 * MJOS Performance Monitor
 * MJOS性能监控模块
 */

import { Logger } from '../core/index';

export interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  operationCounts: {
    memoryOperations: number;
    taskOperations: number;
    contextOperations: number;
  };
  responseTimes: {
    averageMemoryQuery: number;
    averageTaskCreation: number;
    averageContextAccess: number;
  };
  systemUptime: number;
  errorCounts: {
    total: number;
    byType: Record<string, number>;
  };
}

export interface PerformanceThresholds {
  maxMemoryUsage: number; // percentage
  maxResponseTime: number; // milliseconds
  maxErrorRate: number; // percentage
}

export class PerformanceMonitor {
  private logger: Logger;
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private startTime: number;
  private operationTimings: Map<string, number[]> = new Map();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout | undefined;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.logger = new Logger('PerformanceMonitor');
    this.startTime = Date.now();
    
    this.thresholds = {
      maxMemoryUsage: 80,
      maxResponseTime: 1000,
      maxErrorRate: 5,
      ...thresholds
    };

    this.metrics = {
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      cpuUsage: 0,
      operationCounts: {
        memoryOperations: 0,
        taskOperations: 0,
        contextOperations: 0
      },
      responseTimes: {
        averageMemoryQuery: 0,
        averageTaskCreation: 0,
        averageContextAccess: 0
      },
      systemUptime: 0,
      errorCounts: {
        total: 0,
        byType: {}
      }
    };
  }

  start(): void {
    if (this.isMonitoring) {
      this.logger.warn('Performance monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.logger.info('Performance monitoring started');

    // Update metrics every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkThresholds();
    }, 5000);
  }

  stop(): void {
    if (!this.isMonitoring) {
      this.logger.warn('Performance monitoring is not running');
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.logger.info('Performance monitoring stopped');
  }

  // Record operation timing
  recordOperation(type: 'memory' | 'task' | 'context', duration: number): void {
    const key = `${type}Operations`;
    this.metrics.operationCounts[key as keyof typeof this.metrics.operationCounts]++;

    // Store timing for average calculation
    if (!this.operationTimings.has(type)) {
      this.operationTimings.set(type, []);
    }
    
    const timings = this.operationTimings.get(type)!;
    timings.push(duration);
    
    // Keep only last 100 timings for rolling average
    if (timings.length > 100) {
      timings.shift();
    }

    // Update average response times
    this.updateResponseTimes();
  }

  // Record error
  recordError(type: string): void {
    this.metrics.errorCounts.total++;
    
    if (!this.metrics.errorCounts.byType[type]) {
      this.metrics.errorCounts.byType[type] = 0;
    }
    this.metrics.errorCounts.byType[type]++;

    this.logger.debug(`Error recorded: ${type}`);
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  // Get performance summary
  getSummary(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: PerformanceMetrics;
  } {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check memory usage
    if (metrics.memoryUsage.percentage > this.thresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${metrics.memoryUsage.percentage.toFixed(1)}%`);
      status = 'warning';
    }

    // Check response times
    const avgResponseTime = Math.max(
      metrics.responseTimes.averageMemoryQuery,
      metrics.responseTimes.averageTaskCreation,
      metrics.responseTimes.averageContextAccess
    );

    if (avgResponseTime > this.thresholds.maxResponseTime) {
      issues.push(`Slow response time: ${avgResponseTime.toFixed(1)}ms`);
      status = 'warning';
    }

    // Check error rate
    const totalOperations = Object.values(metrics.operationCounts).reduce((a, b) => a + b, 0);
    const errorRate = totalOperations > 0 ? (metrics.errorCounts.total / totalOperations) * 100 : 0;

    if (errorRate > this.thresholds.maxErrorRate) {
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
      status = 'critical';
    }

    return { status, issues, metrics };
  }

  // Create timing wrapper for functions
  createTimer<T extends (...args: any[]) => any>(
    fn: T,
    operationType: 'memory' | 'task' | 'context'
  ): T {
    return ((...args: Parameters<T>) => {
      const startTime = Date.now();
      
      try {
        const result = fn(...args);
        
        // Handle both sync and async functions
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            this.recordOperation(operationType, Date.now() - startTime);
          });
        } else {
          this.recordOperation(operationType, Date.now() - startTime);
          return result;
        }
      } catch (error) {
        this.recordOperation(operationType, Date.now() - startTime);
        this.recordError(error instanceof Error ? error.name : 'UnknownError');
        throw error;
      }
    }) as T;
  }

  private updateMetrics(): void {
    // Update memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage = {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      };
    }

    // Update system uptime
    this.metrics.systemUptime = Date.now() - this.startTime;

    // Update response times
    this.updateResponseTimes();
  }

  private updateResponseTimes(): void {
    // Calculate average response times
    const memoryTimings = this.operationTimings.get('memory') || [];
    const taskTimings = this.operationTimings.get('task') || [];
    const contextTimings = this.operationTimings.get('context') || [];

    this.metrics.responseTimes = {
      averageMemoryQuery: this.calculateAverage(memoryTimings),
      averageTaskCreation: this.calculateAverage(taskTimings),
      averageContextAccess: this.calculateAverage(contextTimings)
    };
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private checkThresholds(): void {
    const summary = this.getSummary();
    
    if (summary.status === 'warning') {
      this.logger.warn('Performance warning detected:', summary.issues);
    } else if (summary.status === 'critical') {
      this.logger.error('Critical performance issues detected:', summary.issues);
    }
  }

  // Reset metrics
  reset(): void {
    this.metrics = {
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      cpuUsage: 0,
      operationCounts: {
        memoryOperations: 0,
        taskOperations: 0,
        contextOperations: 0
      },
      responseTimes: {
        averageMemoryQuery: 0,
        averageTaskCreation: 0,
        averageContextAccess: 0
      },
      systemUptime: 0,
      errorCounts: {
        total: 0,
        byType: {}
      }
    };

    this.operationTimings.clear();
    this.startTime = Date.now();
    this.logger.info('Performance metrics reset');
  }
}
