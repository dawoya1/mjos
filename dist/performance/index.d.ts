/**
 * MJOS Performance Monitor - Enhanced Performance Monitoring System
 * MJOS性能监控模块 - 增强型性能监控系统
 */
import { EventEmitter } from 'events';
export interface PerformanceMetrics {
    memoryUsage: {
        used: number;
        total: number;
        percentage: number;
        rss: number;
        external: number;
    };
    cpuUsage: {
        user: number;
        system: number;
        total: number;
    };
    operationCounts: {
        memoryOperations: number;
        taskOperations: number;
        contextOperations: number;
        networkOperations: number;
        fileOperations: number;
    };
    responseTimes: {
        averageMemoryQuery: number;
        averageTaskCreation: number;
        averageContextAccess: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
    };
    throughput: {
        operationsPerSecond: number;
        requestsPerMinute: number;
        peakThroughput: number;
    };
    systemUptime: number;
    errorCounts: {
        total: number;
        byType: Record<string, number>;
        errorRate: number;
    };
    resourceUtilization: {
        activeConnections: number;
        queueSize: number;
        cacheHitRate: number;
        gcPressure: number;
    };
}
export interface PerformanceThresholds {
    maxMemoryUsage: number;
    maxResponseTime: number;
    maxErrorRate: number;
    maxCpuUsage: number;
    minThroughput: number;
    maxQueueSize: number;
    minCacheHitRate: number;
}
export interface PerformanceAlert {
    id: string;
    type: 'warning' | 'critical';
    metric: string;
    value: number;
    threshold: number;
    message: string;
    timestamp: Date;
    resolved?: boolean;
}
export interface PerformanceOptimization {
    type: 'memory' | 'cpu' | 'io' | 'cache' | 'queue';
    action: string;
    impact: 'low' | 'medium' | 'high';
    description: string;
    autoApply: boolean;
}
export interface PerformanceMonitorOptions {
    thresholds?: Partial<PerformanceThresholds>;
    enableAutoOptimization?: boolean;
    alertingEnabled?: boolean;
    metricsRetention?: number;
    samplingInterval?: number;
}
export declare class PerformanceMonitor extends EventEmitter {
    private logger;
    private metrics;
    private thresholds;
    private options;
    private startTime;
    private operationTimings;
    private responseTimeHistory;
    private throughputHistory;
    private activeAlerts;
    private optimizations;
    private isMonitoring;
    private monitoringInterval?;
    private gcMonitoringInterval?;
    private metricsHistory;
    private lastGcTime;
    constructor(options?: PerformanceMonitorOptions);
    private initializeMetrics;
    private setupGCMonitoring;
    start(): void;
    stop(): void;
    recordOperation(type: 'memory' | 'task' | 'context' | 'knowledge' | 'reasoning' | 'network' | 'file', duration: number): void;
    recordError(type: string): void;
    getMetrics(): PerformanceMetrics;
    getSummary(): {
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
        metrics: PerformanceMetrics;
    };
    createTimer<T extends (...args: any[]) => any>(fn: T, operationType: 'memory' | 'task' | 'context' | 'knowledge' | 'reasoning' | 'network' | 'file'): T;
    private updateMetrics;
    private updateResponseTimes;
    private calculatePercentile;
    private calculateAverage;
    private checkThresholds;
    reset(): void;
    private calculateThroughput;
    private cleanupOldMetrics;
    /**
     * Force memory cleanup and garbage collection
     */
    private forceMemoryCleanup;
    private applyOptimizations;
    private generateOptimizations;
    /**
     * Destroy the performance monitor and clean up resources
     */
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map