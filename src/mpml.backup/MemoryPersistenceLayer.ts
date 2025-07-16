/**
 * MPML Memory Persistence Layer
 * Magic Persistent Memory Language 记忆持久化层
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { 
  MemoryEntry, 
  MemoryType, 
  MemoryAccessLevel, 
  MemoryMetadata,
  MJOSError 
} from './types/index';

export interface PersistenceConfig {
  storageType: StorageType;
  connectionString?: string;
  encryptionKey?: string;
  compressionEnabled?: boolean;
  backupEnabled?: boolean;
  retentionPolicy?: RetentionPolicy;
}

export type StorageType = 'memory' | 'file' | 'database' | 'cloud' | 'hybrid';

export interface RetentionPolicy {
  maxAge?: number; // milliseconds
  maxSize?: number; // bytes
  maxEntries?: number;
  archiveAfter?: number; // milliseconds
  deleteAfter?: number; // milliseconds
}

export interface MemorySnapshot {
  id: string;
  timestamp: Date;
  entries: MemoryEntry[];
  metadata: {
    totalEntries: number;
    totalSize: number;
    checksum: string;
    version: string;
  };
}

export interface MemoryQuery {
  types?: MemoryType[];
  accessLevels?: MemoryAccessLevel[];
  tags?: string[];
  sources?: string[];
  timeRange?: {
    from: Date;
    to: Date;
  };
  contentPattern?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'importance';
  sortOrder?: 'asc' | 'desc';
}

export interface PersistenceMetrics {
  totalEntries: number;
  totalSize: number;
  storageUtilization: number;
  averageAccessTime: number;
  cacheHitRate: number;
  compressionRatio: number;
  lastBackup?: Date;
  lastCleanup?: Date;
}

export interface StorageAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  store(entry: MemoryEntry): Promise<boolean>;
  retrieve(id: string): Promise<MemoryEntry | null>;
  query(query: MemoryQuery): Promise<MemoryEntry[]>;
  update(id: string, updates: Partial<MemoryEntry>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  createSnapshot(): Promise<MemorySnapshot>;
  restoreSnapshot(snapshot: MemorySnapshot): Promise<boolean>;
  cleanup(policy: RetentionPolicy): Promise<number>;
  getMetrics(): Promise<PersistenceMetrics>;
}

/**
 * 记忆持久化层�? * 管理记忆的存储、检索和生命周期
 */
export class MemoryPersistenceLayer {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly config: PersistenceConfig;
  
  private storageAdapter: StorageAdapter;
  private memoryCache = new Map<string, MemoryEntry>();
  private accessLog: Array<{
    entryId: string;
    operation: 'read' | 'write' | 'update' | 'delete';
    timestamp: Date;
    duration: number;
  }> = [];
  
  private cleanupTimer?: NodeJS.Timeout;
  private backupTimer?: NodeJS.Timeout;

  constructor(
    logger: Logger,
    eventBus: EventBus,
    config: PersistenceConfig
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.config = config;
    
    this.storageAdapter = this.createStorageAdapter(config);
    this.setupEventListeners();
    
    this.logger.info('Memory Persistence Layer initialized', {
      storageType: config.storageType,
      compressionEnabled: config.compressionEnabled,
      backupEnabled: config.backupEnabled
    });
  }

  /**
   * 初始化持久化�?   */
  public async initialize(): Promise<void> {
    try {
      await this.storageAdapter.connect();
      
      // 启动定期任务
      this.startPeriodicTasks();
      
      this.logger.info('Memory persistence layer initialized successfully');
      
      this.eventBus.publishEvent('memory_persistence.initialized', {
        config: this.config
      }, 'MemoryPersistenceLayer');

    } catch (error) {
      const persistenceError = this.createPersistenceError(error, 'initialize', {});
      this.logger.error('Failed to initialize memory persistence layer', { error: persistenceError });
      throw persistenceError;
    }
  }

  /**
   * 存储记忆条目
   */
  public async storeMemory(entry: MemoryEntry): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // 验证记忆条目
      this.validateMemoryEntry(entry);
      
      // 应用压缩（如果启用）
      const processedEntry = this.config.compressionEnabled ? 
        this.compressEntry(entry) : entry;
      
      // 存储到适配�?      const success = await this.storageAdapter.store(processedEntry);
      
      if (success) {
        // 更新缓存
        this.memoryCache.set(entry.id, entry);
        
        // 记录访问日志
        this.logAccess(entry.id, 'write', Date.now() - startTime);
        
        this.logger.debug('Memory stored successfully', {
          entryId: entry.id,
          type: entry.type,
          size: this.calculateEntrySize(entry)
        });
        
        this.eventBus.publishEvent('memory.stored', {
          entry
        }, 'MemoryPersistenceLayer');
      }
      
      return success;

    } catch (error) {
      this.logger.error('Failed to store memory', {
        entryId: entry.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 检索记忆条�?   */
  public async retrieveMemory(id: string): Promise<MemoryEntry | null> {
    const startTime = Date.now();
    
    try {
      // 首先检查缓�?      if (this.memoryCache.has(id)) {
        this.logAccess(id, 'read', Date.now() - startTime);
        return this.memoryCache.get(id)!;
      }
      
      // 从存储适配器检�?      const entry = await this.storageAdapter.retrieve(id);
      
      if (entry) {
        // 解压缩（如果需要）
        const processedEntry = this.config.compressionEnabled ? 
          this.decompressEntry(entry) : entry;
        
        // 更新缓存
        this.memoryCache.set(id, processedEntry);
        
        this.logAccess(id, 'read', Date.now() - startTime);
        
        this.logger.debug('Memory retrieved successfully', {
          entryId: id,
          fromCache: false
        });
        
        return processedEntry;
      }
      
      return null;

    } catch (error) {
      this.logger.error('Failed to retrieve memory', {
        entryId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 查询记忆条目
   */
  public async queryMemories(query: MemoryQuery): Promise<MemoryEntry[]> {
    try {
      this.logger.debug('Querying memories', {
        types: query.types,
        limit: query.limit,
        sortBy: query.sortBy
      });

      const results = await this.storageAdapter.query(query);
      
      // 解压缩结果（如果需要）
      const processedResults = this.config.compressionEnabled ? 
        results.map(entry => this.decompressEntry(entry)) : results;
      
      // 更新缓存
      for (const entry of processedResults) {
        this.memoryCache.set(entry.id, entry);
      }
      
      this.logger.info('Memory query completed', {
        resultCount: processedResults.length,
        query
      });
      
      return processedResults;

    } catch (error) {
      this.logger.error('Failed to query memories', {
        query,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * 更新记忆条目
   */
  public async updateMemory(id: string, updates: Partial<MemoryEntry>): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // 更新存储
      const success = await this.storageAdapter.update(id, updates);
      
      if (success) {
        // 更新缓存
        const cachedEntry = this.memoryCache.get(id);
        if (cachedEntry) {
          const updatedEntry = { ...cachedEntry, ...updates, updatedAt: new Date() };
          this.memoryCache.set(id, updatedEntry);
        }
        
        this.logAccess(id, 'update', Date.now() - startTime);
        
        this.logger.debug('Memory updated successfully', {
          entryId: id,
          updates: Object.keys(updates)
        });
        
        this.eventBus.publishEvent('memory.updated', {
          entryId: id,
          updates
        }, 'MemoryPersistenceLayer');
      }
      
      return success;

    } catch (error) {
      this.logger.error('Failed to update memory', {
        entryId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 删除记忆条目
   */
  public async deleteMemory(id: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const success = await this.storageAdapter.delete(id);
      
      if (success) {
        // 从缓存中移除
        this.memoryCache.delete(id);
        
        this.logAccess(id, 'delete', Date.now() - startTime);
        
        this.logger.debug('Memory deleted successfully', { entryId: id });
        
        this.eventBus.publishEvent('memory.deleted', {
          entryId: id
        }, 'MemoryPersistenceLayer');
      }
      
      return success;

    } catch (error) {
      this.logger.error('Failed to delete memory', {
        entryId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 创建快照
   */
  public async createSnapshot(): Promise<MemorySnapshot | null> {
    try {
      this.logger.info('Creating memory snapshot');
      
      const snapshot = await this.storageAdapter.createSnapshot();
      
      this.logger.info('Memory snapshot created', {
        snapshotId: snapshot.id,
        entryCount: snapshot.metadata.totalEntries,
        size: snapshot.metadata.totalSize
      });
      
      this.eventBus.publishEvent('memory.snapshot_created', {
        snapshot
      }, 'MemoryPersistenceLayer');
      
      return snapshot;

    } catch (error) {
      this.logger.error('Failed to create snapshot', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 恢复快照
   */
  public async restoreSnapshot(snapshot: MemorySnapshot): Promise<boolean> {
    try {
      this.logger.info('Restoring memory snapshot', {
        snapshotId: snapshot.id,
        entryCount: snapshot.metadata.totalEntries
      });
      
      const success = await this.storageAdapter.restoreSnapshot(snapshot);
      
      if (success) {
        // 清空缓存
        this.memoryCache.clear();
        
        this.logger.info('Memory snapshot restored successfully', {
          snapshotId: snapshot.id
        });
        
        this.eventBus.publishEvent('memory.snapshot_restored', {
          snapshot
        }, 'MemoryPersistenceLayer');
      }
      
      return success;

    } catch (error) {
      this.logger.error('Failed to restore snapshot', {
        snapshotId: snapshot.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 获取持久化指�?   */
  public async getMetrics(): Promise<PersistenceMetrics> {
    try {
      const storageMetrics = await this.storageAdapter.getMetrics();
      
      // 计算缓存命中�?      const totalAccesses = this.accessLog.length;
      const cacheHits = this.accessLog.filter(log => 
        log.operation === 'read' && log.duration < 10
      ).length;
      const cacheHitRate = totalAccesses > 0 ? (cacheHits / totalAccesses) * 100 : 0;
      
      // 计算平均访问时间
      const averageAccessTime = totalAccesses > 0 ? 
        this.accessLog.reduce((sum, log) => sum + log.duration, 0) / totalAccesses : 0;
      
      return {
        ...storageMetrics,
        cacheHitRate,
        averageAccessTime
      };

    } catch (error) {
      this.logger.error('Failed to get metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        totalEntries: 0,
        totalSize: 0,
        storageUtilization: 0,
        averageAccessTime: 0,
        cacheHitRate: 0,
        compressionRatio: 1
      };
    }
  }

  /**
   * 执行清理
   */
  public async performCleanup(): Promise<number> {
    try {
      if (!this.config.retentionPolicy) {
        return 0;
      }
      
      this.logger.info('Performing memory cleanup', {
        retentionPolicy: this.config.retentionPolicy
      });
      
      const deletedCount = await this.storageAdapter.cleanup(this.config.retentionPolicy);
      
      // 清理缓存中的过期条目
      this.cleanupCache();
      
      this.logger.info('Memory cleanup completed', {
        deletedCount
      });
      
      this.eventBus.publishEvent('memory.cleanup_completed', {
        deletedCount,
        retentionPolicy: this.config.retentionPolicy
      }, 'MemoryPersistenceLayer');
      
      return deletedCount;

    } catch (error) {
      this.logger.error('Failed to perform cleanup', {
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  /**
   * 创建存储适配�?   */
  private createStorageAdapter(config: PersistenceConfig): StorageAdapter {
    switch (config.storageType) {
      case 'memory':
        return new MemoryStorageAdapter();
      case 'file':
        return new FileStorageAdapter(config.connectionString || './memory-data');
      case 'database':
        return new DatabaseStorageAdapter(config.connectionString!);
      case 'cloud':
        return new CloudStorageAdapter(config.connectionString!);
      case 'hybrid':
        return new HybridStorageAdapter(config);
      default:
        throw new Error(`Unsupported storage type: ${config.storageType}`);
    }
  }

  /**
   * 验证记忆条目
   */
  private validateMemoryEntry(entry: MemoryEntry): void {
    if (!entry.id) {
      throw new Error('Memory entry ID is required');
    }
    
    if (!entry.type) {
      throw new Error('Memory entry type is required');
    }
    
    if (!entry.content) {
      throw new Error('Memory entry content is required');
    }
    
    if (!entry.metadata) {
      throw new Error('Memory entry metadata is required');
    }
  }

  /**
   * 压缩条目
   */
  private compressEntry(entry: MemoryEntry): MemoryEntry {
    // 简化的压缩实现
    if (typeof entry.content === 'string' && entry.content.length > 1000) {
      // 这里应该使用真正的压缩算�?      const compressed = entry.content; // 实际应该压缩
      return {
        ...entry,
        content: compressed,
        metadata: {
          ...entry.metadata,
          compressed: true
        }
      };
    }
    
    return entry;
  }

  /**
   * 解压缩条�?   */
  private decompressEntry(entry: MemoryEntry): MemoryEntry {
    // 简化的解压缩实�?    if (entry.metadata.compressed) {
      // 这里应该使用真正的解压缩算法
      const decompressed = entry.content; // 实际应该解压�?      return {
        ...entry,
        content: decompressed,
        metadata: {
          ...entry.metadata,
          compressed: false
        }
      };
    }
    
    return entry;
  }

  /**
   * 计算条目大小
   */
  private calculateEntrySize(entry: MemoryEntry): number {
    return JSON.stringify(entry).length;
  }

  /**
   * 记录访问日志
   */
  private logAccess(
    entryId: string,
    operation: 'read' | 'write' | 'update' | 'delete',
    duration: number
  ): void {
    this.accessLog.push({
      entryId,
      operation,
      timestamp: new Date(),
      duration
    });
    
    // 限制日志大小
    if (this.accessLog.length > 10000) {
      this.accessLog.splice(0, 1000);
    }
  }

  /**
   * 清理缓存
   */
  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = this.config.retentionPolicy?.maxAge || 24 * 60 * 60 * 1000; // 24小时
    
    for (const [id, entry] of this.memoryCache) {
      if (now - entry.createdAt.getTime() > maxAge) {
        this.memoryCache.delete(id);
      }
    }
  }

  /**
   * 启动定期任务
   */
  private startPeriodicTasks(): void {
    // 定期清理
    if (this.config.retentionPolicy) {
      this.cleanupTimer = setInterval(() => {
        this.performCleanup().catch(error => {
          this.logger.error('Periodic cleanup failed', { error });
        });
      }, 60 * 60 * 1000); // 每小时执行一�?    }
    
    // 定期备份
    if (this.config.backupEnabled) {
      this.backupTimer = setInterval(() => {
        this.createSnapshot().catch(error => {
          this.logger.error('Periodic backup failed', { error });
        });
      }, 24 * 60 * 60 * 1000); // 每天执行一�?    }
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('memory.access_requested', async (event) => {
      const { entryId } = event.payload;
      await this.retrieveMemory(entryId);
    });

    this.eventBus.subscribeEvent('memory.cleanup_requested', async (event) => {
      await this.performCleanup();
    });

    this.eventBus.subscribeEvent('memory.backup_requested', async (event) => {
      await this.createSnapshot();
    });
  }

  /**
   * 创建持久化错�?   */
  private createPersistenceError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const persistenceError = new Error(`Memory persistence ${operation} failed: ${message}`) as MJOSError;
    
    persistenceError.code = 'PersistenceError';
    persistenceError.component = 'MemoryPersistenceLayer';
    persistenceError.context = context;
    persistenceError.recoverable = true;
    persistenceError.timestamp = new Date();
    
    return persistenceError;
  }

  /**
   * 清理资源
   */
  public async destroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    await this.storageAdapter.disconnect();
    
    this.logger.info('Memory Persistence Layer destroyed');
  }
}

// 简化的存储适配器实�?class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, MemoryEntry>();

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async store(entry: MemoryEntry): Promise<boolean> {
    this.storage.set(entry.id, entry);
    return true;
  }

  async retrieve(id: string): Promise<MemoryEntry | null> {
    return this.storage.get(id) || null;
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = Array.from(this.storage.values());
    
    if (query.types) {
      results = results.filter(entry => query.types!.includes(entry.type));
    }
    
    if (query.limit) {
      results = results.slice(0, query.limit);
    }
    
    return results;
  }

  async update(id: string, updates: Partial<MemoryEntry>): Promise<boolean> {
    const entry = this.storage.get(id);
    if (entry) {
      this.storage.set(id, { ...entry, ...updates });
      return true;
    }
    return false;
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  async createSnapshot(): Promise<MemorySnapshot> {
    const entries = Array.from(this.storage.values());
    return {
      id: `snapshot-${Date.now()}`,
      timestamp: new Date(),
      entries,
      metadata: {
        totalEntries: entries.length,
        totalSize: JSON.stringify(entries).length,
        checksum: 'mock-checksum',
        version: '1.0.0'
      }
    };
  }

  async restoreSnapshot(snapshot: MemorySnapshot): Promise<boolean> {
    this.storage.clear();
    for (const entry of snapshot.entries) {
      this.storage.set(entry.id, entry);
    }
    return true;
  }

  async cleanup(policy: RetentionPolicy): Promise<number> {
    let deletedCount = 0;
    const now = Date.now();
    
    for (const [id, entry] of this.storage) {
      if (policy.maxAge && now - entry.createdAt.getTime() > policy.maxAge) {
        this.storage.delete(id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  async getMetrics(): Promise<PersistenceMetrics> {
    const entries = Array.from(this.storage.values());
    const totalSize = JSON.stringify(entries).length;
    
    return {
      totalEntries: entries.length,
      totalSize,
      storageUtilization: 0,
      averageAccessTime: 0,
      cacheHitRate: 0,
      compressionRatio: 1
    };
  }
}

// 其他适配器的占位符实�?class FileStorageAdapter extends MemoryStorageAdapter {
  constructor(private path: string) {
    super();
  }
}

class DatabaseStorageAdapter extends MemoryStorageAdapter {
  constructor(private connectionString: string) {
    super();
  }
}

class CloudStorageAdapter extends MemoryStorageAdapter {
  constructor(private connectionString: string) {
    super();
  }
}

class HybridStorageAdapter extends MemoryStorageAdapter {
  constructor(private config: PersistenceConfig) {
    super();
  }
}
