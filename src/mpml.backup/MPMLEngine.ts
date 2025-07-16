/**
 * MPML Engine
 * Magic Persistent Memory Language 引擎
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { MemoryEntry, StateContext, MJOSError } from './types/index';
import { MemoryPersistenceLayer, PersistenceConfig } from './MemoryPersistenceLayer';
import { MemoryQueryEngine, QueryExpression, QueryOptions } from './MemoryQueryEngine';
import { MemoryVersionControl } from './MemoryVersionControl';

export interface MPMLEngineOptions {
  enablePersistence?: boolean;
  enableQueryEngine?: boolean;
  enableVersionControl?: boolean;
  persistenceConfig?: PersistenceConfig;
  autoVersioning?: boolean;
  enableSemanticSearch?: boolean;
}

/**
 * MPML引擎�? * 整合所有MPML组件，提供统一的持久化记忆管理
 */
export class MPMLEngine {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly options: MPMLEngineOptions;
  
  private persistenceLayer?: MemoryPersistenceLayer;
  private queryEngine?: MemoryQueryEngine;
  private versionControl?: MemoryVersionControl;
  
  private isInitialized = false;

  constructor(
    logger: Logger,
    eventBus: EventBus,
    options: MPMLEngineOptions = {}
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.options = {
      enablePersistence: true,
      enableQueryEngine: true,
      enableVersionControl: true,
      autoVersioning: true,
      enableSemanticSearch: false,
      ...options
    };
    
    this.logger.info('MPML Engine created', { options: this.options });
  }

  /**
   * 初始化引�?   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug('MPML Engine already initialized');
      return;
    }

    try {
      this.logger.info('Initializing MPML Engine');

      // 初始化持久化�?      if (this.options.enablePersistence) {
        const persistenceConfig = this.options.persistenceConfig || {
          storageType: 'memory',
          compressionEnabled: true,
          backupEnabled: false
        };
        
        this.persistenceLayer = new MemoryPersistenceLayer(
          this.logger,
          this.eventBus,
          persistenceConfig
        );
        
        await this.persistenceLayer.initialize();
      }

      // 初始化查询引�?      if (this.options.enableQueryEngine) {
        this.queryEngine = new MemoryQueryEngine(this.logger, this.eventBus);
        
        if (this.options.enableSemanticSearch) {
          this.queryEngine.configureSemanticSearch({
            enabled: true,
            model: 'default',
            threshold: 0.7,
            maxResults: 100
          });
        }
      }

      // 初始化版本控�?      if (this.options.enableVersionControl) {
        this.versionControl = new MemoryVersionControl(this.logger, this.eventBus);
      }

      this.isInitialized = true;
      
      this.logger.info('MPML Engine initialized successfully');

      // 发布初始化完成事�?      this.eventBus.publishEvent('mpml.initialized', {
        components: this.getEnabledComponents()
      }, 'MPMLEngine');

    } catch (error) {
      const engineError = this.createEngineError(error, 'initialize', {});
      this.logger.error('MPML Engine initialization failed', { error: engineError });
      throw engineError;
    }
  }

  /**
   * 存储记忆
   */
  public async storeMemory(entry: MemoryEntry): Promise<boolean> {
    if (!this.persistenceLayer) {
      throw new Error('Persistence layer not enabled');
    }

    const success = await this.persistenceLayer.storeMemory(entry);
    
    if (success && this.options.autoVersioning && this.versionControl) {
      await this.versionControl.createVersion(
        entry.id,
        entry.content,
        'create',
        'Initial version',
        entry.metadata.source
      );
    }

    return success;
  }

  /**
   * 检索记�?   */
  public async retrieveMemory(id: string): Promise<MemoryEntry | null> {
    if (!this.persistenceLayer) {
      throw new Error('Persistence layer not enabled');
    }

    return await this.persistenceLayer.retrieveMemory(id);
  }

  /**
   * 查询记忆
   */
  public async queryMemories(
    query: QueryExpression,
    options?: QueryOptions
  ): Promise<MemoryEntry[]> {
    if (!this.queryEngine || !this.persistenceLayer) {
      throw new Error('Query engine or persistence layer not enabled');
    }

    const result = await this.queryEngine.executeQuery(
      query,
      options || {},
      (storageQuery) => this.persistenceLayer!.queryMemories(storageQuery)
    );

    return result.entries;
  }

  /**
   * 更新记忆
   */
  public async updateMemory(
    id: string,
    updates: Partial<MemoryEntry>
  ): Promise<boolean> {
    if (!this.persistenceLayer) {
      throw new Error('Persistence layer not enabled');
    }

    const success = await this.persistenceLayer.updateMemory(id, updates);
    
    if (success && this.options.autoVersioning && this.versionControl) {
      await this.versionControl.createVersion(
        id,
        updates,
        'update',
        'Automatic update version',
        updates.metadata?.source || 'system'
      );
    }

    return success;
  }

  /**
   * 删除记忆
   */
  public async deleteMemory(id: string): Promise<boolean> {
    if (!this.persistenceLayer) {
      throw new Error('Persistence layer not enabled');
    }

    return await this.persistenceLayer.deleteMemory(id);
  }

  /**
   * 创建记忆快照
   */
  public async createSnapshot(): Promise<any> {
    if (!this.persistenceLayer) {
      throw new Error('Persistence layer not enabled');
    }

    return await this.persistenceLayer.createSnapshot();
  }

  /**
   * 获取版本历史
   */
  public getVersionHistory(memoryId: string): any {
    if (!this.versionControl) {
      throw new Error('Version control not enabled');
    }

    return this.versionControl.getVersionHistory(memoryId);
  }

  /**
   * 恢复到指定版�?   */
  public async restoreToVersion(
    memoryId: string,
    versionId: string,
    author: string
  ): Promise<string | null> {
    if (!this.versionControl) {
      throw new Error('Version control not enabled');
    }

    return await this.versionControl.restoreToVersion(memoryId, versionId, author);
  }

  /**
   * 获取引擎状�?   */
  public getStatus(): {
    initialized: boolean;
    components: string[];
    persistence?: any;
    queryEngine?: any;
    versionControl?: any;
  } {
    const status = {
      initialized: this.isInitialized,
      components: this.getEnabledComponents()
    };

    if (this.persistenceLayer) {
      (status as any).persistence = { available: true };
    }

    if (this.queryEngine) {
      (status as any).queryEngine = this.queryEngine.getQueryStatistics();
    }

    if (this.versionControl) {
      (status as any).versionControl = { available: true };
    }

    return status;
  }

  /**
   * 获取已启用的组件
   */
  private getEnabledComponents(): string[] {
    const components: string[] = [];
    
    if (this.persistenceLayer) components.push('PersistenceLayer');
    if (this.queryEngine) components.push('QueryEngine');
    if (this.versionControl) components.push('VersionControl');
    
    return components;
  }

  /**
   * 创建引擎错误
   */
  private createEngineError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const engineError = new Error(`MPML Engine ${operation} failed: ${message}`) as MJOSError;
    
    engineError.code = 'MPMLEngineError';
    engineError.component = 'MPMLEngine';
    engineError.context = context;
    engineError.recoverable = true;
    engineError.timestamp = new Date();
    
    return engineError;
  }

  /**
   * 清理资源
   */
  public async destroy(): Promise<void> {
    if (this.persistenceLayer) {
      await this.persistenceLayer.destroy();
    }

    this.logger.info('MPML Engine destroyed');
  }
}

/**
 * 创建MPML引擎的便捷函�? */
export function createMPMLEngine(
  logger: Logger,
  eventBus: EventBus,
  options?: MPMLEngineOptions
): MPMLEngine {
  return new MPMLEngine(logger, eventBus, options);
}
