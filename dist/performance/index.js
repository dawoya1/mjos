"use strict";
/**
 * MJOS Performance Monitor - Enhanced Performance Monitoring System
 * MJOS性能监控模块 - 增强型性能监控系统
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
const events_1 = require("events");
const index_1 = require("../core/index");
class PerformanceMonitor extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.operationTimings = new Map();
        this.responseTimeHistory = [];
        this.throughputHistory = [];
        this.activeAlerts = new Map();
        this.optimizations = [];
        this.isMonitoring = false;
        this.metricsHistory = [];
        this.lastGcTime = 0;
        this.options = {
            enableAutoOptimization: options.enableAutoOptimization || false,
            alertingEnabled: options.alertingEnabled || true,
            metricsRetention: options.metricsRetention || 24, // 24 hours
            samplingInterval: options.samplingInterval || 5000, // 5 seconds
            ...options
        };
        this.logger = new index_1.Logger('PerformanceMonitor');
        this.startTime = Date.now();
        this.thresholds = {
            maxMemoryUsage: 80,
            maxResponseTime: 1000,
            maxErrorRate: 5,
            maxCpuUsage: 70,
            minThroughput: 10,
            maxQueueSize: 100,
            minCacheHitRate: 80,
            ...options.thresholds
        };
        this.initializeMetrics();
        this.setupGCMonitoring();
    }
    initializeMetrics() {
        this.metrics = {
            memoryUsage: { used: 0, total: 0, percentage: 0, rss: 0, external: 0 },
            cpuUsage: { user: 0, system: 0, total: 0 },
            operationCounts: {
                memoryOperations: 0,
                taskOperations: 0,
                contextOperations: 0,
                networkOperations: 0,
                fileOperations: 0
            },
            responseTimes: {
                averageMemoryQuery: 0,
                averageTaskCreation: 0,
                averageContextAccess: 0,
                p95ResponseTime: 0,
                p99ResponseTime: 0
            },
            throughput: {
                operationsPerSecond: 0,
                requestsPerMinute: 0,
                peakThroughput: 0
            },
            systemUptime: 0,
            errorCounts: {
                total: 0,
                byType: {},
                errorRate: 0
            },
            resourceUtilization: {
                activeConnections: 0,
                queueSize: 0,
                cacheHitRate: 0,
                gcPressure: 0
            }
        };
    }
    setupGCMonitoring() {
        if (typeof process !== 'undefined' && process.on !== undefined) {
            // Monitor garbage collection if available
            try {
                const v8 = require('v8');
                if (v8.getHeapStatistics) {
                    this.gcMonitoringInterval = setInterval(() => {
                        const heapStats = v8.getHeapStatistics();
                        this.metrics.resourceUtilization.gcPressure =
                            (heapStats.used_heap_size / heapStats.heap_size_limit) * 100;
                    }, 10000); // Every 10 seconds
                }
            }
            catch (error) {
                this.logger.debug('V8 heap statistics not available');
            }
        }
    }
    start() {
        if (this.isMonitoring) {
            this.logger.warn('Performance monitoring is already running');
            return;
        }
        this.isMonitoring = true;
        this.logger.info('Performance monitoring started');
        // Update metrics at configured interval
        this.monitoringInterval = setInterval(() => {
            this.updateMetrics();
            this.checkThresholds();
            this.calculateThroughput();
            this.cleanupOldMetrics();
            if (this.options.enableAutoOptimization) {
                this.applyOptimizations();
            }
        }, this.options.samplingInterval);
        this.emit('started');
    }
    stop() {
        if (!this.isMonitoring) {
            this.logger.warn('Performance monitoring is not running');
            return;
        }
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        if (this.gcMonitoringInterval) {
            clearInterval(this.gcMonitoringInterval);
            this.gcMonitoringInterval = undefined;
        }
        this.logger.info('Performance monitoring stopped');
        this.emit('stopped');
    }
    // Record operation timing
    recordOperation(type, duration) {
        // Map new operation types to existing metrics
        const operationTypeMap = {
            'memory': 'memoryOperations',
            'task': 'taskOperations',
            'context': 'contextOperations',
            'knowledge': 'memoryOperations', // Group with memory operations
            'reasoning': 'contextOperations', // Group with context operations
            'network': 'networkOperations',
            'file': 'fileOperations'
        };
        const mappedKey = operationTypeMap[type];
        if (mappedKey && mappedKey in this.metrics.operationCounts) {
            this.metrics.operationCounts[mappedKey]++;
        }
        // Store timing for average calculation
        if (!this.operationTimings.has(type)) {
            this.operationTimings.set(type, []);
        }
        const timings = this.operationTimings.get(type);
        timings.push(duration);
        // Keep only last 100 timings for rolling average
        if (timings.length > 100) {
            timings.shift();
        }
        // Update average response times
        this.updateResponseTimes();
    }
    // Record error
    recordError(type) {
        this.metrics.errorCounts.total++;
        if (!this.metrics.errorCounts.byType[type]) {
            this.metrics.errorCounts.byType[type] = 0;
        }
        this.metrics.errorCounts.byType[type]++;
        this.logger.debug(`Error recorded: ${type}`);
    }
    // Get current metrics
    getMetrics() {
        this.updateMetrics();
        return { ...this.metrics };
    }
    // Get performance summary
    getSummary() {
        const metrics = this.getMetrics();
        const issues = [];
        let status = 'healthy';
        // Check memory usage
        if (metrics.memoryUsage.percentage > this.thresholds.maxMemoryUsage) {
            issues.push(`High memory usage: ${metrics.memoryUsage.percentage.toFixed(1)}%`);
            status = 'warning';
        }
        // Check response times
        const avgResponseTime = Math.max(metrics.responseTimes.averageMemoryQuery, metrics.responseTimes.averageTaskCreation, metrics.responseTimes.averageContextAccess);
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
    createTimer(fn, operationType) {
        return ((...args) => {
            const startTime = Date.now();
            try {
                const result = fn(...args);
                // Handle both sync and async functions
                if (result && typeof result.then === 'function') {
                    return result.finally(() => {
                        this.recordOperation(operationType, Date.now() - startTime);
                    });
                }
                else {
                    this.recordOperation(operationType, Date.now() - startTime);
                    return result;
                }
            }
            catch (error) {
                this.recordOperation(operationType, Date.now() - startTime);
                this.recordError(error instanceof Error ? error.name : 'UnknownError');
                throw error;
            }
        });
    }
    updateMetrics() {
        // Update memory usage
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memUsage = process.memoryUsage();
            this.metrics.memoryUsage = {
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
                rss: memUsage.rss,
                external: memUsage.external
            };
        }
        // Update CPU usage (simplified)
        if (typeof process !== 'undefined' && process.cpuUsage) {
            const cpuUsage = process.cpuUsage();
            this.metrics.cpuUsage = {
                user: cpuUsage.user / 1000000, // Convert to seconds
                system: cpuUsage.system / 1000000,
                total: (cpuUsage.user + cpuUsage.system) / 1000000
            };
        }
        // Update system uptime
        this.metrics.systemUptime = Date.now() - this.startTime;
        // Update error rate
        const totalOperations = Object.values(this.metrics.operationCounts).reduce((a, b) => a + b, 0);
        this.metrics.errorCounts.errorRate = totalOperations > 0
            ? (this.metrics.errorCounts.total / totalOperations) * 100
            : 0;
        // Update response times
        this.updateResponseTimes();
        // Store metrics in history
        this.metricsHistory.push({ ...this.metrics });
        if (this.metricsHistory.length > 1000) {
            this.metricsHistory.shift();
        }
    }
    updateResponseTimes() {
        // Calculate average response times
        const memoryTimings = this.operationTimings.get('memory') || [];
        const taskTimings = this.operationTimings.get('task') || [];
        const contextTimings = this.operationTimings.get('context') || [];
        // Combine all timings for percentile calculations
        const allTimings = [...memoryTimings, ...taskTimings, ...contextTimings];
        allTimings.sort((a, b) => a - b);
        this.metrics.responseTimes = {
            averageMemoryQuery: this.calculateAverage(memoryTimings),
            averageTaskCreation: this.calculateAverage(taskTimings),
            averageContextAccess: this.calculateAverage(contextTimings),
            p95ResponseTime: this.calculatePercentile(allTimings, 95),
            p99ResponseTime: this.calculatePercentile(allTimings, 99)
        };
    }
    calculatePercentile(sortedArray, percentile) {
        if (sortedArray.length === 0)
            return 0;
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)] || 0;
    }
    calculateAverage(numbers) {
        if (numbers.length === 0)
            return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
    checkThresholds() {
        const summary = this.getSummary();
        if (summary.status === 'warning') {
            this.logger.warn('Performance warning detected:', summary.issues);
        }
        else if (summary.status === 'critical') {
            this.logger.error('Critical performance issues detected:', summary.issues);
        }
    }
    // Reset metrics
    reset() {
        this.initializeMetrics();
        this.operationTimings.clear();
        this.responseTimeHistory = [];
        this.throughputHistory = [];
        this.activeAlerts.clear();
        this.metricsHistory = [];
        this.startTime = Date.now();
        this.logger.info('Performance metrics reset');
    }
    // Add missing methods
    calculateThroughput() {
        // const now = Date.now(); // Unused variable
        // const timeWindow = 60000; // 1 minute // Unused variable
        // Calculate operations per second
        const recentOperations = this.operationTimings.size;
        this.metrics.throughput.operationsPerSecond = recentOperations / 60;
        // Update peak throughput
        if (this.metrics.throughput.operationsPerSecond > this.metrics.throughput.peakThroughput) {
            this.metrics.throughput.peakThroughput = this.metrics.throughput.operationsPerSecond;
        }
        // Store in history
        this.throughputHistory.push(this.metrics.throughput.operationsPerSecond);
        if (this.throughputHistory.length > 100) {
            this.throughputHistory.shift();
        }
    }
    cleanupOldMetrics() {
        const retentionTime = this.options.metricsRetention * 60 * 60 * 1000; // Convert hours to ms
        const cutoffTime = Date.now() - retentionTime;
        // Clean up metrics history
        this.metricsHistory = this.metricsHistory.filter(metric => metric.systemUptime > cutoffTime);
        // Clean up resolved alerts
        for (const [id, alert] of this.activeAlerts) {
            if (alert.resolved && alert.timestamp.getTime() < cutoffTime) {
                this.activeAlerts.delete(id);
            }
        }
        // Force memory cleanup if usage is high
        if (this.metrics.memoryUsage.percentage > 80) {
            this.forceMemoryCleanup();
        }
    }
    /**
     * Force memory cleanup and garbage collection
     */
    forceMemoryCleanup() {
        try {
            // Limit metrics history to prevent memory buildup
            if (this.metricsHistory.length > 100) {
                this.metricsHistory = this.metricsHistory.slice(-50);
            }
            // Force garbage collection if available
            if (typeof global !== 'undefined' && global.gc) {
                global.gc();
                this.logger.debug('Forced garbage collection');
            }
            this.logger.info('Memory cleanup completed');
        }
        catch (error) {
            this.logger.error('Memory cleanup failed:', error);
        }
    }
    applyOptimizations() {
        const summary = this.getSummary();
        if (summary.status !== 'healthy') {
            const optimizations = this.generateOptimizations(summary);
            for (const optimization of optimizations) {
                if (optimization.autoApply) {
                    this.logger.info(`Applying optimization: ${optimization.description}`);
                    // Implementation would depend on specific optimization type
                    this.emit('optimization-applied', optimization);
                }
            }
        }
    }
    generateOptimizations(_summary) {
        const optimizations = [];
        // Memory optimization
        if (this.metrics.memoryUsage.percentage > this.thresholds.maxMemoryUsage) {
            optimizations.push({
                type: 'memory',
                action: 'garbage-collection',
                impact: 'medium',
                description: 'Force garbage collection to free memory',
                autoApply: true
            });
        }
        // Cache optimization
        if (this.metrics.resourceUtilization.cacheHitRate < this.thresholds.minCacheHitRate) {
            optimizations.push({
                type: 'cache',
                action: 'cache-warming',
                impact: 'high',
                description: 'Pre-warm frequently accessed cache entries',
                autoApply: false
            });
        }
        return optimizations;
    }
    /**
     * Destroy the performance monitor and clean up resources
     */
    destroy() {
        if (this.gcMonitoringInterval) {
            clearInterval(this.gcMonitoringInterval);
            this.gcMonitoringInterval = undefined;
        }
        this.logger.info('Performance monitor destroyed');
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
//# sourceMappingURL=index.js.map