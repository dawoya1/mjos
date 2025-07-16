/**
 * System Monitor
 * 系统监控和健康检查模�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import * as os from 'os';
import * as process from 'process';

export interface SystemMetrics {
  timestamp: Date;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  system: SystemInfo;
  process: ProcessMetrics;
  mjos: MJOSMetrics;
}

export interface CPUMetrics {
  usage: number; // 0-100
  loadAverage: number[];
  cores: number;
  model: string;
}

export interface MemoryMetrics {
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes
  usage: number; // 0-100
  heap: HeapMetrics;
}

export interface HeapMetrics {
  total: number;
  used: number;
  limit: number;
  usage: number; // 0-100
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  uptime: number; // seconds
  hostname: string;
}

export interface ProcessMetrics {
  pid: number;
  uptime: number; // seconds
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

export interface MJOSMetrics {
  activeComponents: string[];
  memorySystemStats: {
    totalMemories: number;
    averageImportance: number;
    recentActivity: number;
  };
  collaborationStats: {
    activeProjects: number;
    totalTasks: number;
    completedTasks: number;
    collaborationEfficiency: number;
  };
  contextStats: {
    totalContextSnapshots: number;
    currentSessionDuration: number;
    memoryUtilization: number;
  };
}

export interface HealthCheck {
  component: string;
  status: HealthStatus;
  message: string;
  timestamp: Date;
  responseTime: number; // ms
  details?: Record<string, any>;
}

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface SystemAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  component: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export type AlertType = 'performance' | 'error' | 'resource' | 'security' | 'availability';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * 系统监控�? * 提供系统性能监控、健康检查和告警功能
 */
export class SystemMonitor {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private monitoringInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  
  private metrics: SystemMetrics[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: Map<string, SystemAlert> = new Map();
  
  private readonly maxMetricsHistory = 1000;
  private readonly monitoringIntervalMs = 5000; // 5 seconds
  private readonly healthCheckIntervalMs = 30000; // 30 seconds

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.setupEventListeners();
    
    this.logger.info('System Monitor initialized');
  }

  /**
   * 开始监�?   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      this.logger.warn('System monitoring is already running');
      return;
    }

    this.isMonitoring = true;

    // 启动性能监控
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.monitoringIntervalMs);

    // 启动健康检�?    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckIntervalMs);

    // 立即执行一�?    this.collectMetrics();
    this.performHealthChecks();

    this.logger.info('System monitoring started', {
      metricsInterval: this.monitoringIntervalMs,
      healthCheckInterval: this.healthCheckIntervalMs
    });

    this.eventBus.publishEvent('monitoring.started', {
      timestamp: new Date()
    }, 'SystemMonitor');
  }

  /**
   * 停止监控
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    this.logger.info('System monitoring stopped');

    this.eventBus.publishEvent('monitoring.stopped', {
      timestamp: new Date()
    }, 'SystemMonitor');
  }

  /**
   * 收集系统指标
   */
  private async collectMetrics(): Promise<void> {
    try {
      const startTime = Date.now();

      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: await this.getCPUMetrics(),
        memory: this.getMemoryMetrics(),
        system: this.getSystemInfo(),
        process: this.getProcessMetrics(),
        mjos: await this.getMJOSMetrics()
      };

      // 添加到历史记�?      this.metrics.push(metrics);
      
      // 保持历史记录大小限制
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics.shift();
      }

      const collectionTime = Date.now() - startTime;

      // 检查性能阈�?      this.checkPerformanceThresholds(metrics);

      this.logger.debug('Metrics collected', {
        collectionTime,
        metricsCount: this.metrics.length
      });

      this.eventBus.publishEvent('monitoring.metrics_collected', {
        metrics,
        collectionTime
      }, 'SystemMonitor');

    } catch (error) {
      this.logger.error('Failed to collect metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取CPU指标
   */
  private async getCPUMetrics(): Promise<CPUMetrics> {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();

    // 简化的CPU使用率计�?    const usage = Math.min(100, (loadAverage[0] / cpus.length) * 100);

    return {
      usage,
      loadAverage,
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown'
    };
  }

  /**
   * 获取内存指标
   */
  private getMemoryMetrics(): MemoryMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usage = (usedMem / totalMem) * 100;

    const memUsage = process.memoryUsage();
    const heapUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    return {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usage,
      heap: {
        total: memUsage.heapTotal,
        used: memUsage.heapUsed,
        limit: memUsage.heapTotal,
        usage: heapUsage
      }
    };
  }

  /**
   * 获取系统信息
   */
  private getSystemInfo(): SystemInfo {
    return {
      platform: os.platform(),
      arch: os.arch(),
      version: os.release(),
      uptime: os.uptime(),
      hostname: os.hostname()
    };
  }

  /**
   * 获取进程指标
   */
  private getProcessMetrics(): ProcessMetrics {
    return {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * 获取MJOS指标
   */
  private async getMJOSMetrics(): Promise<MJOSMetrics> {
    // 简化实现，实际中应该从MJOS实例获取
    return {
      activeComponents: ['MJOSEngine', 'ContextManager', 'CollaborationEngine'],
      memorySystemStats: {
        totalMemories: 0,
        averageImportance: 0,
        recentActivity: 0
      },
      collaborationStats: {
        activeProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        collaborationEfficiency: 0
      },
      contextStats: {
        totalContextSnapshots: 0,
        currentSessionDuration: 0,
        memoryUtilization: 0
      }
    };
  }

  /**
   * 执行健康检�?   */
  private async performHealthChecks(): Promise<void> {
    const components = [
      'system',
      'memory',
      'cpu',
      'process',
      'mjos-engine',
      'collaboration-engine',
      'context-manager'
    ];

    for (const component of components) {
      try {
        const startTime = Date.now();
        const healthCheck = await this.checkComponentHealth(component);
        const responseTime = Date.now() - startTime;

        healthCheck.responseTime = responseTime;
        this.healthChecks.set(component, healthCheck);

        // 如果状态不健康，生成告�?        if (healthCheck.status !== 'healthy') {
          this.generateAlert(component, healthCheck);
        }

      } catch (error) {
        const healthCheck: HealthCheck = {
          component,
          status: 'critical',
          message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date(),
          responseTime: 0
        };

        this.healthChecks.set(component, healthCheck);
        this.generateAlert(component, healthCheck);
      }
    }

    this.eventBus.publishEvent('monitoring.health_check_completed', {
      healthChecks: Array.from(this.healthChecks.values()),
      timestamp: new Date()
    }, 'SystemMonitor');
  }

  /**
   * 检查组件健康状�?   */
  private async checkComponentHealth(component: string): Promise<HealthCheck> {
    const timestamp = new Date();

    switch (component) {
      case 'system':
        const latestMetrics = this.getLatestMetrics();
        if (!latestMetrics) {
          return {
            component,
            status: 'unknown',
            message: 'No metrics available',
            timestamp,
            responseTime: 0
          };
        }

        if (latestMetrics.cpu.usage > 90) {
          return {
            component,
            status: 'critical',
            message: `High CPU usage: ${latestMetrics.cpu.usage.toFixed(1)}%`,
            timestamp,
            responseTime: 0
          };
        } else if (latestMetrics.cpu.usage > 70) {
          return {
            component,
            status: 'warning',
            message: `Elevated CPU usage: ${latestMetrics.cpu.usage.toFixed(1)}%`,
            timestamp,
            responseTime: 0
          };
        }

        return {
          component,
          status: 'healthy',
          message: `CPU usage: ${latestMetrics.cpu.usage.toFixed(1)}%`,
          timestamp,
          responseTime: 0
        };

      case 'memory':
        const memMetrics = this.getLatestMetrics()?.memory;
        if (!memMetrics) {
          return {
            component,
            status: 'unknown',
            message: 'No memory metrics available',
            timestamp,
            responseTime: 0
          };
        }

        if (memMetrics.usage > 90) {
          return {
            component,
            status: 'critical',
            message: `High memory usage: ${memMetrics.usage.toFixed(1)}%`,
            timestamp,
            responseTime: 0
          };
        } else if (memMetrics.usage > 80) {
          return {
            component,
            status: 'warning',
            message: `Elevated memory usage: ${memMetrics.usage.toFixed(1)}%`,
            timestamp,
            responseTime: 0
          };
        }

        return {
          component,
          status: 'healthy',
          message: `Memory usage: ${memMetrics.usage.toFixed(1)}%`,
          timestamp,
          responseTime: 0
        };

      default:
        return {
          component,
          status: 'healthy',
          message: 'Component is operational',
          timestamp,
          responseTime: 0
        };
    }
  }

  /**
   * 检查性能阈�?   */
  private checkPerformanceThresholds(metrics: SystemMetrics): void {
    // CPU使用率检�?    if (metrics.cpu.usage > 90) {
      this.generatePerformanceAlert('cpu', 'critical',
        `CPU usage is critically high: ${metrics.cpu.usage.toFixed(1)}%`, metrics);
    } else if (metrics.cpu.usage > 70) {
      this.generatePerformanceAlert('cpu', 'high',
        `CPU usage is elevated: ${metrics.cpu.usage.toFixed(1)}%`, metrics);
    }

    // 内存使用率检�?    if (metrics.memory.usage > 90) {
      this.generatePerformanceAlert('memory', 'critical',
        `Memory usage is critically high: ${metrics.memory.usage.toFixed(1)}%`, metrics);
    } else if (metrics.memory.usage > 80) {
      this.generatePerformanceAlert('memory', 'high',
        `Memory usage is elevated: ${metrics.memory.usage.toFixed(1)}%`, metrics);
    }

    // 堆内存使用率检�?    if (metrics.memory.heap.usage > 90) {
      this.generatePerformanceAlert('heap', 'critical',
        `Heap usage is critically high: ${metrics.memory.heap.usage.toFixed(1)}%`, metrics);
    }
  }

  /**
   * 生成性能告警
   */
  private generatePerformanceAlert(
    component: string,
    severity: AlertSeverity,
    message: string,
    metrics: SystemMetrics
  ): void {
    const alertId = `perf-${component}-${Date.now()}`;

    const alert: SystemAlert = {
      id: alertId,
      type: 'performance',
      severity,
      component,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata: {
        metrics: {
          cpu: metrics.cpu.usage,
          memory: metrics.memory.usage,
          heap: metrics.memory.heap.usage
        }
      }
    };

    this.alerts.set(alertId, alert);

    this.logger.warn('Performance alert generated', {
      alertId,
      component,
      severity,
      message
    });

    this.eventBus.publishEvent('monitoring.alert_generated', {
      alert
    }, 'SystemMonitor');
  }

  /**
   * 生成告警
   */
  private generateAlert(component: string, healthCheck: HealthCheck): void {
    const alertId = `health-${component}-${Date.now()}`;

    const alert: SystemAlert = {
      id: alertId,
      type: 'availability',
      severity: this.mapHealthStatusToSeverity(healthCheck.status),
      component,
      message: healthCheck.message,
      timestamp: new Date(),
      resolved: false,
      metadata: {
        healthCheck: {
          status: healthCheck.status,
          responseTime: healthCheck.responseTime,
          details: healthCheck.details
        }
      }
    };

    this.alerts.set(alertId, alert);

    this.logger.warn('Health alert generated', {
      alertId,
      component,
      status: healthCheck.status,
      message: healthCheck.message
    });

    this.eventBus.publishEvent('monitoring.alert_generated', {
      alert
    }, 'SystemMonitor');
  }

  /**
   * 映射健康状态到告警严重程度
   */
  private mapHealthStatusToSeverity(status: HealthStatus): AlertSeverity {
    switch (status) {
      case 'critical':
        return 'critical';
      case 'warning':
        return 'high';
      case 'unknown':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * 获取最新指�?   */
  public getLatestMetrics(): SystemMetrics | undefined {
    return this.metrics[this.metrics.length - 1];
  }

  /**
   * 获取指标历史
   */
  public getMetricsHistory(limit?: number): SystemMetrics[] {
    if (limit) {
      return this.metrics.slice(-limit);
    }
    return [...this.metrics];
  }

  /**
   * 获取健康检查结�?   */
  public getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * 获取活跃告警
   */
  public getActiveAlerts(): SystemAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * 获取所有告�?   */
  public getAllAlerts(): SystemAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * 解决告警
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.logger.info('Alert resolved', {
      alertId,
      component: alert.component,
      resolvedAt: alert.resolvedAt
    });

    this.eventBus.publishEvent('monitoring.alert_resolved', {
      alert
    }, 'SystemMonitor');

    return true;
  }

  /**
   * 获取系统状态摘�?   */
  public getSystemStatus(): {
    overall: HealthStatus;
    components: Record<string, HealthStatus>;
    activeAlerts: number;
    metrics: SystemMetrics | undefined;
  } {
    const healthChecks = this.getHealthChecks();
    const activeAlerts = this.getActiveAlerts();
    const latestMetrics = this.getLatestMetrics();

    // 计算整体状�?    let overall: HealthStatus = 'healthy';
    const components: Record<string, HealthStatus> = {};

    for (const check of healthChecks) {
      components[check.component] = check.status;

      if (check.status === 'critical') {
        overall = 'critical';
      } else if (check.status === 'warning' && overall !== 'critical') {
        overall = 'warning';
      } else if (check.status === 'unknown' && overall === 'healthy') {
        overall = 'unknown';
      }
    }

    return {
      overall,
      components,
      activeAlerts: activeAlerts.length,
      metrics: latestMetrics
    };
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('system.error', (event) => {
      this.generateAlert('system', {
        component: 'system',
        status: 'critical',
        message: `System error: ${event.payload.error}`,
        timestamp: new Date(),
        responseTime: 0
      });
    });

    this.eventBus.subscribeEvent('mjos.component.error', (event) => {
      this.generateAlert(event.payload.component, {
        component: event.payload.component,
        status: 'critical',
        message: `Component error: ${event.payload.error}`,
        timestamp: new Date(),
        responseTime: 0
      });
    });
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.stopMonitoring();
    this.metrics = [];
    this.healthChecks.clear();
    this.alerts.clear();

    this.logger.info('System Monitor destroyed');
  }
}
