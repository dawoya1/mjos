/**
 * MJOS Error Handler
 * 魔剑工作室操作系统错误处理器
 */

import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { MJOSError, ErrorRecoveryStrategy } from './types/index';
import { EventBus } from './EventBus';

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly recoveryStrategies = new Map<string, ErrorRecoveryStrategy>();
  private readonly errorHistory: MJOSError[] = [];
  private readonly maxHistorySize = 500;

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.setupDefaultRecoveryStrategies();
  }

  /**
   * 处理错误
   */
  public handleError(
    error: unknown,
    component: string,
    context?: any,
    recoverable = true
  ): MJOSError {
    const mjosError = this.convertToMJOSError(error, component, context, recoverable);
    
    // 添加到错误历�?    this.addToHistory(mjosError);
    
    // 记录错误日志
    this.logError(mjosError);
    
    // 发布错误事件
    this.eventBus.publishEvent('error.occurred', {
      error: mjosError,
      context
    }, component);
    
    // 尝试错误恢复
    if (recoverable) {
      this.attemptRecovery(mjosError, context);
    }
    
    return mjosError;
  }

  /**
   * 注册错误恢复策略
   */
  public registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.errorCode, strategy);
    this.logger.debug('Error recovery strategy registered', {
      errorCode: strategy.errorCode,
      maxRetries: strategy.maxRetries
    });
  }

  /**
   * 获取错误历史
   */
  public getErrorHistory(filter?: {
    component?: string;
    code?: string;
    since?: Date;
    limit?: number;
  }): MJOSError[] {
    let errors = [...this.errorHistory];

    if (filter) {
      if (filter.component) {
        errors = errors.filter(e => e.component === filter.component);
      }
      if (filter.code) {
        errors = errors.filter(e => e.code === filter.code);
      }
      if (filter.since) {
        errors = errors.filter(e => e.timestamp >= filter.since!);
      }
      if (filter.limit) {
        errors = errors.slice(-filter.limit);
      }
    }

    return errors;
  }

  /**
   * 获取错误统计
   */
  public getErrorStatistics(): {
    total: number;
    byComponent: Record<string, number>;
    byCode: Record<string, number>;
    recentErrors: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const byComponent: Record<string, number> = {};
    const byCode: Record<string, number> = {};
    let recentErrors = 0;

    for (const error of this.errorHistory) {
      // 按组件统�?      byComponent[error.component] = (byComponent[error.component] || 0) + 1;
      
      // 按错误码统计
      byCode[error.code] = (byCode[error.code] || 0) + 1;
      
      // 最近一小时的错�?      if (error.timestamp >= oneHourAgo) {
        recentErrors++;
      }
    }

    return {
      total: this.errorHistory.length,
      byComponent,
      byCode,
      recentErrors
    };
  }

  /**
   * 清理错误历史
   */
  public clearErrorHistory(): void {
    this.errorHistory.length = 0;
    this.logger.debug('Error history cleared');
  }

  /**
   * 转换为MJOS错误
   */
  private convertToMJOSError(
    error: unknown,
    component: string,
    context?: any,
    recoverable = true
  ): MJOSError {
    let message: string;
    let code: string;
    let originalError: Error | undefined;

    if (error instanceof Error) {
      message = error.message;
      code = error.name || 'UnknownError';
      originalError = error;
    } else if (typeof error === 'string') {
      message = error;
      code = 'StringError';
    } else {
      message = 'Unknown error occurred';
      code = 'UnknownError';
    }

    const mjosError = new Error(message) as MJOSError;
    mjosError.code = code;
    mjosError.component = component;
    mjosError.context = context;
    mjosError.recoverable = recoverable;
    mjosError.timestamp = new Date();
    mjosError.name = 'MJOSError';

    // 保留原始错误的堆栈信�?    if (originalError && originalError.stack) {
      mjosError.stack = originalError.stack;
    }

    return mjosError;
  }

  /**
   * 记录错误日志
   */
  private logError(error: MJOSError): void {
    const logData = {
      code: error.code,
      component: error.component,
      recoverable: error.recoverable,
      context: error.context,
      stack: error.stack
    };

    if (error.recoverable) {
      this.logger.warn(`Recoverable error in ${error.component}: ${error.message}`, logData);
    } else {
      this.logger.error(`Fatal error in ${error.component}: ${error.message}`, logData);
    }
  }

  /**
   * 尝试错误恢复
   */
  private async attemptRecovery(error: MJOSError, context?: any): Promise<void> {
    const strategy = this.recoveryStrategies.get(error.code);
    
    if (!strategy) {
      this.logger.debug('No recovery strategy found', { errorCode: error.code });
      return;
    }

    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts < strategy.maxRetries) {
      try {
        attempts++;
        
        this.logger.debug('Attempting error recovery', {
          errorCode: error.code,
          attempt: attempts,
          maxRetries: strategy.maxRetries
        });

        await strategy.strategy(error, context);
        
        this.logger.info('Error recovery successful', {
          errorCode: error.code,
          attempts
        });

        // 发布恢复成功事件
        this.eventBus.publishEvent('error.recovered', {
          originalError: error,
          attempts,
          context
        }, 'ErrorHandler');

        return;

      } catch (recoveryError) {
        lastError = recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError));
        
        this.logger.warn('Error recovery attempt failed', {
          errorCode: error.code,
          attempt: attempts,
          recoveryError: lastError.message
        });

        // 等待后重�?        if (attempts < strategy.maxRetries) {
          await this.sleep(strategy.backoffMs * attempts);
        }
      }
    }

    // 所有恢复尝试都失败�?    this.logger.error('Error recovery failed after all attempts', {
      errorCode: error.code,
      attempts,
      lastError: lastError?.message
    });

    // 发布恢复失败事件
    this.eventBus.publishEvent('error.recovery_failed', {
      originalError: error,
      attempts,
      lastError,
      context
    }, 'ErrorHandler');
  }

  /**
   * 添加到错误历�?   */
  private addToHistory(error: MJOSError): void {
    this.errorHistory.push(error);
    
    // 限制历史记录大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * 设置默认恢复策略
   */
  private setupDefaultRecoveryStrategies(): void {
    // 网络错误恢复策略
    this.registerRecoveryStrategy({
      errorCode: 'NetworkError',
      strategy: async (error, context) => {
        // 简单的重试策略
        this.logger.debug('Retrying network operation', { context });
        // 这里可以添加具体的网络重试逻辑
      },
      maxRetries: 3,
      backoffMs: 1000
    });

    // 配置错误恢复策略
    this.registerRecoveryStrategy({
      errorCode: 'ConfigurationError',
      strategy: async (error, context) => {
        this.logger.debug('Attempting to reload configuration', { context });
        // 这里可以添加配置重载逻辑
      },
      maxRetries: 1,
      backoffMs: 500
    });

    // 内存错误恢复策略
    this.registerRecoveryStrategy({
      errorCode: 'MemoryError',
      strategy: async (error, context) => {
        this.logger.debug('Attempting memory cleanup', { context });
        // 这里可以添加内存清理逻辑
        if (global.gc) {
          global.gc();
        }
      },
      maxRetries: 2,
      backoffMs: 2000
    });
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
