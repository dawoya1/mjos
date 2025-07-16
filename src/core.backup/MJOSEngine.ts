/**
 * MJOS Core Engine
 * 魔剑工作室操作系统核心引�? */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { 
  MJOSConfig, 
  MJOSEvent, 
  MJOSError, 
  MJOSResponse,
  TeamState,
  StateContext,
  DeepPartial
} from './types/index';
import { ConfigManager } from './ConfigManager';
import { EventBus } from './EventBus';
import { LoggerFactory } from './LoggerFactory';
import { ErrorHandler } from './ErrorHandler';

/**
 * MJOS核心引擎�? * 负责系统初始化、组件生命周期管理、事件协�? */
export class MJOSEngine extends EventEmitter {
  private static instance: MJOSEngine;
  private readonly logger: Logger;
  private readonly configManager: ConfigManager;
  private readonly eventBus: EventBus;
  private readonly errorHandler: ErrorHandler;
  
  private isInitialized = false;
  private isRunning = false;
  private components = new Map<string, any>();
  private startTime?: Date;

  private constructor(config?: DeepPartial<MJOSConfig>) {
    super();
    
    // 初始化配置管理器
    this.configManager = new ConfigManager(config);
    
    // 初始化日志系�?    this.logger = LoggerFactory.createLogger(this.configManager.getLoggingConfig());
    
    // 初始化事件总线
    this.eventBus = new EventBus(this.logger);
    
    // 初始化错误处理器
    this.errorHandler = new ErrorHandler(this.logger, this.eventBus);
    
    this.logger.info('MJOS Engine created', { 
      version: this.configManager.getVersion(),
      environment: this.configManager.getEnvironment()
    });
  }

  /**
   * 获取MJOS引擎单例实例
   */
  public static getInstance(config?: DeepPartial<MJOSConfig>): MJOSEngine {
    if (!MJOSEngine.instance) {
      MJOSEngine.instance = new MJOSEngine(config);
    }
    return MJOSEngine.instance;
  }

  /**
   * 初始化MJOS引擎
   */
  public async initialize(): Promise<MJOSResponse<void>> {
    if (this.isInitialized) {
      return this.createSuccessResponse(undefined, 'Engine already initialized');
    }

    try {
      this.logger.info('Initializing MJOS Engine...');
      
      // 验证配置
      await this.validateConfiguration();
      
      // 初始化核心组�?      await this.initializeComponents();
      
      // 设置事件监听�?      this.setupEventListeners();
      
      // 注册错误恢复策略
      this.registerErrorRecoveryStrategies();
      
      this.isInitialized = true;
      this.logger.info('MJOS Engine initialized successfully');
      
      // 发送初始化完成事件
      this.eventBus.emit('engine.initialized', {
        timestamp: new Date(),
        version: this.configManager.getVersion()
      });
      
      return this.createSuccessResponse(undefined, 'Engine initialized successfully');
      
    } catch (error) {
      const mjosError = this.errorHandler.handleError(error, 'MJOSEngine.initialize');
      this.logger.error('Failed to initialize MJOS Engine', { error: mjosError });
      return this.createErrorResponse(mjosError);
    }
  }

  /**
   * 启动MJOS引擎
   */
  public async start(): Promise<MJOSResponse<void>> {
    if (!this.isInitialized) {
      throw new Error('Engine must be initialized before starting');
    }

    if (this.isRunning) {
      return this.createSuccessResponse(undefined, 'Engine already running');
    }

    try {
      this.logger.info('Starting MJOS Engine...');
      
      // 启动所有组�?      await this.startComponents();
      
      this.isRunning = true;
      this.startTime = new Date();
      
      this.logger.info('MJOS Engine started successfully');
      
      // 发送启动完成事�?      this.eventBus.emit('engine.started', {
        timestamp: this.startTime,
        components: Array.from(this.components.keys())
      });
      
      return this.createSuccessResponse(undefined, 'Engine started successfully');
      
    } catch (error) {
      const mjosError = this.errorHandler.handleError(error, 'MJOSEngine.start');
      this.logger.error('Failed to start MJOS Engine', { error: mjosError });
      return this.createErrorResponse(mjosError);
    }
  }

  /**
   * 停止MJOS引擎
   */
  public async stop(): Promise<MJOSResponse<void>> {
    if (!this.isRunning) {
      return this.createSuccessResponse(undefined, 'Engine not running');
    }

    try {
      this.logger.info('Stopping MJOS Engine...');
      
      // 停止所有组�?      await this.stopComponents();
      
      this.isRunning = false;
      
      this.logger.info('MJOS Engine stopped successfully');
      
      // 发送停止完成事�?      this.eventBus.emit('engine.stopped', {
        timestamp: new Date(),
        uptime: this.getUptime()
      });
      
      return this.createSuccessResponse(undefined, 'Engine stopped successfully');
      
    } catch (error) {
      const mjosError = this.errorHandler.handleError(error, 'MJOSEngine.stop');
      this.logger.error('Failed to stop MJOS Engine', { error: mjosError });
      return this.createErrorResponse(mjosError);
    }
  }

  /**
   * 注册组件
   */
  public registerComponent(name: string, component: any): void {
    if (this.components.has(name)) {
      throw new Error(`Component '${name}' already registered`);
    }
    
    this.components.set(name, component);
    this.logger.debug(`Component '${name}' registered`);
    
    // 发送组件注册事�?    this.eventBus.emit('component.registered', {
      name,
      timestamp: new Date()
    });
  }

  /**
   * 获取组件
   */
  public getComponent<T = any>(name: string): T | undefined {
    return this.components.get(name) as T;
  }

  /**
   * 获取配置管理�?   */
  public getConfigManager(): ConfigManager {
    return this.configManager;
  }

  /**
   * 获取事件总线
   */
  public getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * 获取日志�?   */
  public getLogger(): Logger {
    return this.logger;
  }

  /**
   * 获取错误处理�?   */
  public getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  /**
   * 获取引擎状�?   */
  public getStatus() {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      uptime: this.getUptime(),
      components: Array.from(this.components.keys()),
      version: this.configManager.getVersion(),
      environment: this.configManager.getEnvironment()
    };
  }

  /**
   * 获取运行时间
   */
  private getUptime(): number {
    return this.startTime ? Date.now() - this.startTime.getTime() : 0;
  }

  /**
   * 验证配置
   */
  private async validateConfiguration(): Promise<void> {
    const config = this.configManager.getConfig();
    
    if (!config.version) {
      throw new Error('Version is required in configuration');
    }
    
    if (!config.team?.name) {
      throw new Error('Team name is required in configuration');
    }
    
    this.logger.debug('Configuration validated successfully');
  }

  /**
   * 初始化组�?   */
  private async initializeComponents(): Promise<void> {
    // 这里将在后续阶段添加具体组件的初始化
    this.logger.debug('Core components initialized');
  }

  /**
   * 启动组件
   */
  private async startComponents(): Promise<void> {
    for (const [name, component] of this.components) {
      if (typeof component.start === 'function') {
        try {
          await component.start();
          this.logger.debug(`Component '${name}' started`);
        } catch (error) {
          this.logger.error(`Failed to start component '${name}'`, { error });
          throw error;
        }
      }
    }
  }

  /**
   * 停止组件
   */
  private async stopComponents(): Promise<void> {
    for (const [name, component] of this.components) {
      if (typeof component.stop === 'function') {
        try {
          await component.stop();
          this.logger.debug(`Component '${name}' stopped`);
        } catch (error) {
          this.logger.error(`Failed to stop component '${name}'`, { error });
        }
      }
    }
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听未处理的错误
    this.eventBus.on('error.unhandled', (event: MJOSEvent) => {
      this.logger.error('Unhandled error occurred', { event });
    });
    
    // 监听组件错误
    this.eventBus.on('component.error', (event: MJOSEvent) => {
      this.logger.warn('Component error occurred', { event });
    });
  }

  /**
   * 注册错误恢复策略
   */
  private registerErrorRecoveryStrategies(): void {
    // 这里将在后续添加具体的错误恢复策�?    this.logger.debug('Error recovery strategies registered');
  }

  /**
   * 创建成功响应
   */
  private createSuccessResponse<T>(data: T, message?: string): MJOSResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date(),
        duration: 0,
        component: 'MJOSEngine',
        version: this.configManager.getVersion()
      }
    };
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(error: MJOSError): MJOSResponse<never> {
    return {
      success: false,
      error,
      metadata: {
        timestamp: new Date(),
        duration: 0,
        component: 'MJOSEngine',
        version: this.configManager.getVersion()
      }
    };
  }
}
