/**
 * Error Recovery System
 * 错误恢复系统 - 自动故障检测和恢复机制
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';

// 错误类型枚举
export enum ErrorType {
  SYSTEM_ERROR = 'system_error',
  NETWORK_ERROR = 'network_error',
  MEMORY_ERROR = 'memory_error',
  TIMEOUT_ERROR = 'timeout_error',
  VALIDATION_ERROR = 'validation_error',
  RESOURCE_ERROR = 'resource_error',
  DEPENDENCY_ERROR = 'dependency_error'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'low',           // 轻微错误，不影响核心功能
  MEDIUM = 'medium',     // 中等错误，影响部分功�?  HIGH = 'high',         // 严重错误，影响核心功�?  CRITICAL = 'critical'  // 致命错误，系统无法正常运�?}

// 恢复策略
export enum RecoveryStrategy {
  RETRY = 'retry',                    // 重试
  FALLBACK = 'fallback',             // 降级
  RESTART = 'restart',               // 重启
  ISOLATE = 'isolate',               // 隔离
  GRACEFUL_DEGRADATION = 'graceful_degradation', // 优雅降级
  CIRCUIT_BREAKER = 'circuit_breaker' // 熔断
}

// 错误信息接口
export interface ErrorInfo {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: Record<string, any>;
  timestamp: Date;
  component: string;
  recoveryAttempts: number;
  maxRetries: number;
}

// 恢复动作接口
export interface RecoveryAction {
  strategy: RecoveryStrategy;
  action: () => Promise<boolean>;
  timeout: number;
  priority: number;
  description: string;
}

// 系统健康状�?export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical' | 'failed';
  components: Map<string, ComponentHealth>;
  lastCheck: Date;
  issues: ErrorInfo[];
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  lastError?: ErrorInfo;
  uptime: number;
  errorCount: number;
  recoveryCount: number;
}

// 熔断器状�?export enum CircuitBreakerState {
  CLOSED = 'closed',     // 正常状�?  OPEN = 'open',         // 熔断状�?  HALF_OPEN = 'half_open' // 半开状�?}

export interface CircuitBreaker {
  name: string;
  state: CircuitBreakerState;
  failureCount: number;
  failureThreshold: number;
  timeout: number;
  lastFailureTime: Date;
  successCount: number;
  halfOpenMaxCalls: number;
}

/**
 * 错误恢复系统�? */
export class ErrorRecoverySystem {
  private errorHistory: ErrorInfo[] = [];
  private recoveryActions = new Map<string, RecoveryAction[]>();
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private componentHealth = new Map<string, ComponentHealth>();
  private isRecovering = false;
  private recoveryQueue: ErrorInfo[] = [];
  
  // 配置参数
  private readonly MAX_ERROR_HISTORY = 1000;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30�?  private readonly RECOVERY_TIMEOUT = 60000; // 1分钟
  private readonly DEFAULT_RETRY_COUNT = 3;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1分钟

  constructor(private logger: Logger, private eventBus: EventBus) {
    this.startHealthMonitoring();
    this.setupEventListeners();
    
    this.logger.info('Error Recovery System initialized');
  }

  /**
   * 注册组件
   */
  public registerComponent(name: string): void {
    this.componentHealth.set(name, {
      name,
      status: 'healthy',
      uptime: Date.now(),
      errorCount: 0,
      recoveryCount: 0
    });

    // 为组件创建熔断器
    this.circuitBreakers.set(name, {
      name,
      state: CircuitBreakerState.CLOSED,
      failureCount: 0,
      failureThreshold: 5,
      timeout: this.CIRCUIT_BREAKER_TIMEOUT,
      lastFailureTime: new Date(0),
      successCount: 0,
      halfOpenMaxCalls: 3
    });

    this.logger.debug('Component registered', { component: name });
  }

  /**
   * 注册恢复动作
   */
  public registerRecoveryAction(
    component: string,
    errorType: ErrorType,
    action: RecoveryAction
  ): void {
    const key = `${component}:${errorType}`;
    if (!this.recoveryActions.has(key)) {
      this.recoveryActions.set(key, []);
    }
    
    const actions = this.recoveryActions.get(key)!;
    actions.push(action);
    actions.sort((a, b) => b.priority - a.priority); // 按优先级排序

    this.logger.debug('Recovery action registered', {
      component,
      errorType,
      strategy: action.strategy,
      priority: action.priority
    });
  }

  /**
   * 处理错误
   */
  public async handleError(
    component: string,
    error: Error,
    context: Record<string, any> = {}
  ): Promise<boolean> {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      type: this.classifyError(error),
      severity: this.assessSeverity(error, context),
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
      component,
      recoveryAttempts: 0,
      maxRetries: this.DEFAULT_RETRY_COUNT
    };

    // 记录错误
    this.recordError(errorInfo);
    
    // 更新组件健康状�?    this.updateComponentHealth(component, errorInfo);
    
    // 检查熔断器
    if (this.shouldTriggerCircuitBreaker(component)) {
      this.triggerCircuitBreaker(component);
      return false;
    }

    // 尝试恢复
    const recovered = await this.attemptRecovery(errorInfo);
    
    if (recovered) {
      this.recordSuccessfulRecovery(component);
    } else {
      this.escalateError(errorInfo);
    }

    return recovered;
  }

  /**
   * 分类错误
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return ErrorType.TIMEOUT_ERROR;
    }
    if (message.includes('network') || message.includes('connection')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (message.includes('memory') || message.includes('out of memory')) {
      return ErrorType.MEMORY_ERROR;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR;
    }
    if (message.includes('resource') || message.includes('not found')) {
      return ErrorType.RESOURCE_ERROR;
    }
    if (message.includes('dependency') || message.includes('module')) {
      return ErrorType.DEPENDENCY_ERROR;
    }
    
    return ErrorType.SYSTEM_ERROR;
  }

  /**
   * 评估错误严重程度
   */
  private assessSeverity(error: Error, context: Record<string, any>): ErrorSeverity {
    // 基于错误类型的基础严重程度
    const baseSeverity = {
      [ErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
      [ErrorType.RESOURCE_ERROR]: ErrorSeverity.MEDIUM,
      [ErrorType.NETWORK_ERROR]: ErrorSeverity.MEDIUM,
      [ErrorType.TIMEOUT_ERROR]: ErrorSeverity.MEDIUM,
      [ErrorType.MEMORY_ERROR]: ErrorSeverity.HIGH,
      [ErrorType.DEPENDENCY_ERROR]: ErrorSeverity.HIGH,
      [ErrorType.SYSTEM_ERROR]: ErrorSeverity.CRITICAL
    };

    let severity = baseSeverity[this.classifyError(error)] || ErrorSeverity.MEDIUM;

    // 基于上下文调整严重程�?    if (context.isCriticalPath) {
      severity = this.escalateSeverity(severity);
    }
    
    if (context.userImpact === 'high') {
      severity = this.escalateSeverity(severity);
    }

    return severity;
  }

  /**
   * 提升严重程度
   */
  private escalateSeverity(current: ErrorSeverity): ErrorSeverity {
    const escalation = {
      [ErrorSeverity.LOW]: ErrorSeverity.MEDIUM,
      [ErrorSeverity.MEDIUM]: ErrorSeverity.HIGH,
      [ErrorSeverity.HIGH]: ErrorSeverity.CRITICAL,
      [ErrorSeverity.CRITICAL]: ErrorSeverity.CRITICAL
    };
    
    return escalation[current];
  }

  /**
   * 记录错误
   */
  private recordError(errorInfo: ErrorInfo): void {
    this.errorHistory.push(errorInfo);
    
    // 限制历史记录大小
    if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
      this.errorHistory.shift();
    }

    this.logger.error('Error recorded', {
      errorId: errorInfo.id,
      type: errorInfo.type,
      severity: errorInfo.severity,
      component: errorInfo.component,
      message: errorInfo.message
    });

    this.eventBus.publishEvent('error.recorded', errorInfo, 'ErrorRecoverySystem');
  }

  /**
   * 更新组件健康状�?   */
  private updateComponentHealth(component: string, errorInfo: ErrorInfo): void {
    const health = this.componentHealth.get(component);
    if (!health) return;

    health.errorCount++;
    health.lastError = errorInfo;
    
    // 根据错误严重程度更新状�?    if (errorInfo.severity === ErrorSeverity.CRITICAL) {
      health.status = 'failed';
    } else if (errorInfo.severity === ErrorSeverity.HIGH) {
      health.status = 'degraded';
    }

    this.componentHealth.set(component, health);
  }

  /**
   * 检查是否应该触发熔断器
   */
  private shouldTriggerCircuitBreaker(component: string): boolean {
    const breaker = this.circuitBreakers.get(component);
    if (!breaker) return false;

    if (breaker.state === CircuitBreakerState.OPEN) {
      // 检查是否可以转为半开状�?      const timeSinceLastFailure = Date.now() - breaker.lastFailureTime.getTime();
      if (timeSinceLastFailure > breaker.timeout) {
        breaker.state = CircuitBreakerState.HALF_OPEN;
        breaker.successCount = 0;
        this.logger.info('Circuit breaker half-opened', { component });
      }
      return true;
    }

    if (breaker.state === CircuitBreakerState.HALF_OPEN) {
      return breaker.successCount >= breaker.halfOpenMaxCalls;
    }

    return false;
  }

  /**
   * 触发熔断�?   */
  private triggerCircuitBreaker(component: string): void {
    const breaker = this.circuitBreakers.get(component);
    if (!breaker) return;

    breaker.failureCount++;
    breaker.lastFailureTime = new Date();

    if (breaker.failureCount >= breaker.failureThreshold) {
      breaker.state = CircuitBreakerState.OPEN;
      
      this.logger.warn('Circuit breaker opened', {
        component,
        failureCount: breaker.failureCount,
        threshold: breaker.failureThreshold
      });

      this.eventBus.publishEvent('circuit_breaker.opened', {
        component,
        breaker
      }, 'ErrorRecoverySystem');
    }
  }

  /**
   * 尝试恢复
   */
  private async attemptRecovery(errorInfo: ErrorInfo): Promise<boolean> {
    const key = `${errorInfo.component}:${errorInfo.type}`;
    const actions = this.recoveryActions.get(key) || [];

    for (const action of actions) {
      if (errorInfo.recoveryAttempts >= errorInfo.maxRetries) {
        break;
      }

      try {
        this.logger.info('Attempting recovery', {
          errorId: errorInfo.id,
          strategy: action.strategy,
          attempt: errorInfo.recoveryAttempts + 1
        });

        const recovered = await Promise.race([
          action.action(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Recovery timeout')), action.timeout)
          )
        ]);

        errorInfo.recoveryAttempts++;

        if (recovered) {
          this.logger.info('Recovery successful', {
            errorId: errorInfo.id,
            strategy: action.strategy,
            attempts: errorInfo.recoveryAttempts
          });

          this.eventBus.publishEvent('error.recovered', {
            errorInfo,
            strategy: action.strategy
          }, 'ErrorRecoverySystem');

          return true;
        }

      } catch (recoveryError) {
        this.logger.warn('Recovery attempt failed', {
          errorId: errorInfo.id,
          strategy: action.strategy,
          recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
        });

        errorInfo.recoveryAttempts++;
      }
    }

    return false;
  }

  /**
   * 记录成功恢复
   */
  private recordSuccessfulRecovery(component: string): void {
    const health = this.componentHealth.get(component);
    if (health) {
      health.recoveryCount++;
      health.status = 'healthy';
      this.componentHealth.set(component, health);
    }

    const breaker = this.circuitBreakers.get(component);
    if (breaker) {
      if (breaker.state === CircuitBreakerState.HALF_OPEN) {
        breaker.successCount++;
        if (breaker.successCount >= breaker.halfOpenMaxCalls) {
          breaker.state = CircuitBreakerState.CLOSED;
          breaker.failureCount = 0;
          this.logger.info('Circuit breaker closed', { component });
        }
      } else if (breaker.state === CircuitBreakerState.CLOSED) {
        breaker.failureCount = Math.max(0, breaker.failureCount - 1);
      }
    }
  }

  /**
   * 升级错误
   */
  private escalateError(errorInfo: ErrorInfo): void {
    this.logger.error('Error escalated - recovery failed', {
      errorId: errorInfo.id,
      component: errorInfo.component,
      attempts: errorInfo.recoveryAttempts
    });

    this.eventBus.publishEvent('error.escalated', errorInfo, 'ErrorRecoverySystem');

    // 如果是关键错误，触发系统级恢�?    if (errorInfo.severity === ErrorSeverity.CRITICAL) {
      this.triggerSystemRecovery();
    }
  }

  /**
   * 触发系统级恢�?   */
  private async triggerSystemRecovery(): Promise<void> {
    if (this.isRecovering) return;

    this.isRecovering = true;
    this.logger.warn('Triggering system-level recovery');

    try {
      // 实施优雅降级
      await this.implementGracefulDegradation();
      
      // 重启关键组件
      await this.restartCriticalComponents();
      
      this.logger.info('System recovery completed');
      
    } catch (error) {
      this.logger.error('System recovery failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * 实施优雅降级
   */
  private async implementGracefulDegradation(): Promise<void> {
    this.logger.info('Implementing graceful degradation');

    // 禁用非关键功�?    this.eventBus.publishEvent('system.graceful_degradation', {
      disableFeatures: ['advanced-analytics', 'real-time-sync', 'background-tasks']
    }, 'ErrorRecoverySystem');

    // 降低资源使用
    this.eventBus.publishEvent('system.reduce_resources', {
      maxMemoryUsage: '50%',
      maxCpuUsage: '70%'
    }, 'ErrorRecoverySystem');
  }

  /**
   * 重启关键组件
   */
  private async restartCriticalComponents(): Promise<void> {
    const criticalComponents = ['core-engine', 'memory-system', 'reasoning-engine'];

    for (const component of criticalComponents) {
      try {
        this.logger.info('Restarting critical component', { component });

        this.eventBus.publishEvent('component.restart', { component }, 'ErrorRecoverySystem');

        // 等待组件重启
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 重置组件健康状�?        const health = this.componentHealth.get(component);
        if (health) {
          health.status = 'healthy';
          health.errorCount = 0;
          health.uptime = Date.now();
          this.componentHealth.set(component, health);
        }

      } catch (error) {
        this.logger.error('Failed to restart component', {
          component,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * 启动健康监控
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * 执行健康检�?   */
  private performHealthCheck(): void {
    const systemHealth: SystemHealth = {
      overall: 'healthy',
      components: new Map(this.componentHealth),
      lastCheck: new Date(),
      issues: []
    };

    let hasFailedComponents = false;
    let hasDegradedComponents = false;

    for (const [name, health] of this.componentHealth) {
      if (health.status === 'failed') {
        hasFailedComponents = true;
        systemHealth.issues.push(...this.getComponentErrors(name));
      } else if (health.status === 'degraded') {
        hasDegradedComponents = true;
      }
    }

    // 确定整体健康状�?    if (hasFailedComponents) {
      systemHealth.overall = 'critical';
    } else if (hasDegradedComponents) {
      systemHealth.overall = 'degraded';
    }

    this.eventBus.publishEvent('system.health_check', systemHealth, 'ErrorRecoverySystem');
  }

  /**
   * 获取组件错误
   */
  private getComponentErrors(component: string): ErrorInfo[] {
    return this.errorHistory.filter(error =>
      error.component === component &&
      Date.now() - error.timestamp.getTime() < 300000 // 5分钟内的错误
    );
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribe('component.error', (data) => {
      this.handleError(data.component, data.error, data.context);
    });

    this.eventBus.subscribe('system.shutdown', () => {
      this.logger.info('Error Recovery System shutting down');
    });
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取系统健康状�?   */
  public getSystemHealth(): SystemHealth {
    const systemHealth: SystemHealth = {
      overall: 'healthy',
      components: new Map(this.componentHealth),
      lastCheck: new Date(),
      issues: []
    };

    let hasFailedComponents = false;
    let hasDegradedComponents = false;

    for (const [name, health] of this.componentHealth) {
      if (health.status === 'failed') {
        hasFailedComponents = true;
        systemHealth.issues.push(...this.getComponentErrors(name));
      } else if (health.status === 'degraded') {
        hasDegradedComponents = true;
      }
    }

    if (hasFailedComponents) {
      systemHealth.overall = 'critical';
    } else if (hasDegradedComponents) {
      systemHealth.overall = 'degraded';
    }

    return systemHealth;
  }

  /**
   * 获取错误统计
   */
  public getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recoveryRate: number;
    componentStats: Array<{
      component: string;
      errorCount: number;
      recoveryCount: number;
      status: string;
    }>;
  } {
    const errorsByType = {} as Record<ErrorType, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;
    let recoveredErrors = 0;

    // 初始化计数器
    Object.values(ErrorType).forEach(type => errorsByType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => errorsBySeverity[severity] = 0);

    // 统计错误
    for (const error of this.errorHistory) {
      errorsByType[error.type]++;
      errorsBySeverity[error.severity]++;
      if (error.recoveryAttempts > 0) {
        recoveredErrors++;
      }
    }

    const componentStats = Array.from(this.componentHealth.values()).map(health => ({
      component: health.name,
      errorCount: health.errorCount,
      recoveryCount: health.recoveryCount,
      status: health.status
    }));

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recoveryRate: this.errorHistory.length > 0 ? recoveredErrors / this.errorHistory.length : 0,
      componentStats
    };
  }

  /**
   * 获取熔断器状�?   */
  public getCircuitBreakerStatus(): Array<{
    component: string;
    state: CircuitBreakerState;
    failureCount: number;
    threshold: number;
  }> {
    return Array.from(this.circuitBreakers.values()).map(breaker => ({
      component: breaker.name,
      state: breaker.state,
      failureCount: breaker.failureCount,
      threshold: breaker.failureThreshold
    }));
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.errorHistory = [];
    this.recoveryActions.clear();
    this.circuitBreakers.clear();
    this.componentHealth.clear();
    this.recoveryQueue = [];

    this.logger.info('Error Recovery System destroyed');
  }
}
