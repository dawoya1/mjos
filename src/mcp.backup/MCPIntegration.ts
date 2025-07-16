/**
 * MCP Integration
 * Model Context Protocol 集成管理�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, TeamConfig, MJOSError } from './types/index';
import { MCPAdapter } from './MCPAdapter';
import { CrossPlatformBridge } from './CrossPlatformBridge';
import { MemorySynchronizer } from './MemorySynchronizer';
import { IntegrationTester } from './IntegrationTester';

export interface MCPIntegrationOptions {
  enableMCPAdapter?: boolean;
  enableCrossPlatformBridge?: boolean;
  enableMemorySync?: boolean;
  enableIntegrationTesting?: boolean;
  autoRegisterPlatforms?: boolean;
  syncConfiguration?: any;
}

/**
 * MCP集成管理器类
 * 整合所有MCP相关组件，提供统一的集成管�? */
export class MCPIntegration {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly options: MCPIntegrationOptions;
  
  private mcpAdapter?: MCPAdapter;
  private bridge?: CrossPlatformBridge;
  private synchronizer?: MemorySynchronizer;
  private tester?: IntegrationTester;
  
  private isInitialized = false;

  constructor(
    logger: Logger,
    eventBus: EventBus,
    options: MCPIntegrationOptions = {}
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.options = {
      enableMCPAdapter: true,
      enableCrossPlatformBridge: true,
      enableMemorySync: true,
      enableIntegrationTesting: true,
      autoRegisterPlatforms: false,
      ...options
    };
    
    this.logger.info('MCP Integration created', { options: this.options });
  }

  /**
   * 初始化集�?   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug('MCP Integration already initialized');
      return;
    }

    try {
      this.logger.info('Initializing MCP Integration');

      // 初始化MCP适配�?      if (this.options.enableMCPAdapter) {
        this.mcpAdapter = new MCPAdapter(this.logger, this.eventBus);
        await this.mcpAdapter.initialize();
      }

      // 初始化跨平台桥接�?      if (this.options.enableCrossPlatformBridge) {
        this.bridge = new CrossPlatformBridge(this.logger, this.eventBus);
      }

      // 初始化记忆同步器
      if (this.options.enableMemorySync) {
        this.synchronizer = new MemorySynchronizer(
          this.logger,
          this.eventBus,
          this.options.syncConfiguration
        );
      }

      // 初始化集成测试器
      if (this.options.enableIntegrationTesting) {
        this.tester = new IntegrationTester(this.logger, this.eventBus);
        
        if (this.mcpAdapter && this.bridge && this.synchronizer) {
          await this.tester.initialize(this.mcpAdapter, this.bridge, this.synchronizer);
        }
      }

      // 自动注册平台
      if (this.options.autoRegisterPlatforms && this.bridge) {
        await this.registerDefaultPlatforms();
      }

      this.isInitialized = true;
      
      this.logger.info('MCP Integration initialized successfully');

      // 发布初始化完成事�?      this.eventBus.publishEvent('mcp_integration.initialized', {
        components: this.getEnabledComponents()
      }, 'MCPIntegration');

    } catch (error) {
      const integrationError = this.createIntegrationError(error, 'initialize', {});
      this.logger.error('MCP Integration initialization failed', { error: integrationError });
      throw integrationError;
    }
  }

  /**
   * 获取MCP适配�?   */
  public getMCPAdapter(): MCPAdapter | undefined {
    return this.mcpAdapter;
  }

  /**
   * 获取跨平台桥接器
   */
  public getCrossPlatformBridge(): CrossPlatformBridge | undefined {
    return this.bridge;
  }

  /**
   * 获取记忆同步�?   */
  public getMemorySynchronizer(): MemorySynchronizer | undefined {
    return this.synchronizer;
  }

  /**
   * 获取集成测试�?   */
  public getIntegrationTester(): IntegrationTester | undefined {
    return this.tester;
  }

  /**
   * 注册平台
   */
  public async registerPlatform(config: any): Promise<string | null> {
    if (!this.bridge) {
      throw new Error('Cross platform bridge not enabled');
    }

    return await this.bridge.registerPlatform(config);
  }

  /**
   * 执行集成测试
   */
  public async runIntegrationTests(suiteId?: string): Promise<string | null> {
    if (!this.tester) {
      throw new Error('Integration tester not enabled');
    }

    if (suiteId) {
      return await this.tester.executeTestSuite(suiteId);
    } else {
      // 运行所有测试套�?      const testSuites = this.tester.getTestSuites();
      let lastExecutionId: string | null = null;
      
      for (const suite of testSuites) {
        lastExecutionId = await this.tester.executeTestSuite(suite.id);
      }
      
      return lastExecutionId;
    }
  }

  /**
   * 同步记忆数据
   */
  public async syncMemoryData(endpointId: string, type: any = 'bidirectional'): Promise<string | null> {
    if (!this.synchronizer) {
      throw new Error('Memory synchronizer not enabled');
    }

    return await this.synchronizer.synchronize(endpointId, type);
  }

  /**
   * 获取集成状�?   */
  public getStatus(): {
    initialized: boolean;
    components: string[];
    mcpAdapter?: any;
    bridge?: any;
    synchronizer?: any;
    tester?: any;
  } {
    const status = {
      initialized: this.isInitialized,
      components: this.getEnabledComponents()
    };

    if (this.mcpAdapter) {
      (status as any).mcpAdapter = this.mcpAdapter.getServerInfo();
    }

    if (this.bridge) {
      (status as any).bridge = {
        connections: this.bridge.getAllConnections().length
      };
    }

    if (this.synchronizer) {
      (status as any).synchronizer = this.synchronizer.getStatistics();
    }

    if (this.tester) {
      (status as any).tester = {
        testSuites: this.tester.getTestSuites().length
      };
    }

    return status;
  }

  /**
   * 注册默认平台
   */
  private async registerDefaultPlatforms(): Promise<void> {
    if (!this.bridge) return;

    const defaultPlatforms = [
      {
        name: 'Cursor',
        type: 'cursor' as any,
        capabilities: ['mcp', 'tools', 'prompts', 'resources'],
        metadata: { autoRegistered: true }
      },
      {
        name: 'VSCode',
        type: 'vscode' as any,
        capabilities: ['mcp', 'tools'],
        metadata: { autoRegistered: true }
      },
      {
        name: 'Claude Desktop',
        type: 'claude-desktop' as any,
        capabilities: ['mcp', 'prompts', 'resources'],
        metadata: { autoRegistered: true }
      }
    ];

    for (const platform of defaultPlatforms) {
      try {
        const connectionId = await this.bridge.registerPlatform(platform);
        if (connectionId) {
          this.logger.info('Default platform registered', {
            platformName: platform.name,
            connectionId
          });
        }
      } catch (error) {
        this.logger.warn('Failed to register default platform', {
          platformName: platform.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * 获取已启用的组件
   */
  private getEnabledComponents(): string[] {
    const components: string[] = [];
    
    if (this.mcpAdapter) components.push('MCPAdapter');
    if (this.bridge) components.push('CrossPlatformBridge');
    if (this.synchronizer) components.push('MemorySynchronizer');
    if (this.tester) components.push('IntegrationTester');
    
    return components;
  }

  /**
   * 创建集成错误
   */
  private createIntegrationError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const integrationError = new Error(`MCP Integration ${operation} failed: ${message}`) as MJOSError;
    
    integrationError.code = 'MCPIntegrationError';
    integrationError.component = 'MCPIntegration';
    integrationError.context = context;
    integrationError.recoverable = true;
    integrationError.timestamp = new Date();
    
    return integrationError;
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    if (this.bridge) {
      this.bridge.destroy();
    }

    if (this.synchronizer) {
      this.synchronizer.destroy();
    }

    this.logger.info('MCP Integration destroyed');
  }
}

/**
 * 创建MCP集成的便捷函�? */
export function createMCPIntegration(
  logger: Logger,
  eventBus: EventBus,
  options?: MCPIntegrationOptions
): MCPIntegration {
  return new MCPIntegration(logger, eventBus, options);
}
