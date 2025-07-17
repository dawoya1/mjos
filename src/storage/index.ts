/**
 * MJOS Storage System
 * 魔剑工作室操作系统存储系统
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { Logger } from '../core/index';

export interface StorageProvider extends EventEmitter {
  name: string;
  type: 'memory' | 'file' | 'database' | 'cloud';
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get(key: string): Promise<any>;
  set(key: string, value: any, options?: StorageOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
  clear(): Promise<void>;
  getStats(): Promise<StorageStats>;
}

export interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
  compress?: boolean;
  encrypt?: boolean;
  metadata?: Record<string, any>;
}

export interface StorageStats {
  totalKeys: number;
  totalSize: number;
  hitRate?: number;
  missRate?: number;
  lastAccess?: Date;
}

export interface StorageManagerOptions {
  defaultProvider?: string;
  enableCaching?: boolean;
  cacheSize?: number;
  enableCompression?: boolean;
  enableEncryption?: boolean;
  encryptionKey?: string;
  backupInterval?: number;
  backupPath?: string;
}

// Memory Storage Provider
export class MemoryStorageProvider extends EventEmitter implements StorageProvider {
  name = 'memory';
  type: 'memory' = 'memory';
  private data: Map<string, { value: any; options?: StorageOptions; createdAt: Date }> = new Map();
  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger('MemoryStorage');
  }

  async connect(): Promise<void> {
    this.logger.info('Memory storage connected');
  }

  async disconnect(): Promise<void> {
    this.data.clear();
    this.logger.info('Memory storage disconnected');
  }

  async get(key: string): Promise<any> {
    const item = this.data.get(key);
    if (!item) {
      return undefined;
    }

    // Check TTL
    if (item.options?.ttl) {
      const now = Date.now();
      const expiry = item.createdAt.getTime() + item.options.ttl;
      if (now > expiry) {
        this.data.delete(key);
        return undefined;
      }
    }

    this.emit('get', { key, found: true });
    return item.value;
  }

  async set(key: string, value: any, options?: StorageOptions): Promise<void> {
    this.data.set(key, {
      value,
      ...(options ? { options } : {}),
      createdAt: new Date()
    });
    this.emit('set', { key, size: JSON.stringify(value).length });
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.data.delete(key);
    if (deleted) {
      this.emit('delete', { key });
    }
    return deleted;
  }

  async exists(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.data.keys());
    return prefix ? keys.filter(key => key.startsWith(prefix)) : keys;
  }

  async clear(): Promise<void> {
    this.data.clear();
    this.emit('clear');
  }

  async getStats(): Promise<StorageStats> {
    const keys = Array.from(this.data.keys());
    const totalSize = keys.reduce((size, key) => {
      const item = this.data.get(key);
      return size + (item ? JSON.stringify(item.value).length : 0);
    }, 0);

    return {
      totalKeys: keys.length,
      totalSize,
      lastAccess: new Date()
    };
  }
}

// File Storage Provider
export class FileStorageProvider extends EventEmitter implements StorageProvider {
  name = 'file';
  type: 'file' = 'file';
  private basePath: string;
  private logger: Logger;

  constructor(basePath: string = './storage') {
    super();
    this.basePath = basePath;
    this.logger = new Logger('FileStorage');
  }

  async connect(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      this.logger.info(`File storage connected at ${this.basePath}`);
    } catch (error) {
      this.logger.error('Failed to connect file storage', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.logger.info('File storage disconnected');
  }

  private getFilePath(key: string): string {
    // Sanitize key for filesystem
    const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    return join(this.basePath, `${sanitizedKey}.json`);
  }

  async get(key: string): Promise<any> {
    try {
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);

      // Check TTL
      if (parsed.options?.ttl) {
        const now = Date.now();
        const expiry = new Date(parsed.createdAt).getTime() + parsed.options.ttl;
        if (now > expiry) {
          await this.delete(key);
          return undefined;
        }
      }

      this.emit('get', { key, found: true });
      return parsed.value;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        this.emit('get', { key, found: false });
        return undefined;
      }
      throw error;
    }
  }

  async set(key: string, value: any, options?: StorageOptions): Promise<void> {
    const filePath = this.getFilePath(key);
    const dir = dirname(filePath);
    
    await fs.mkdir(dir, { recursive: true });
    
    const data = {
      value,
      options,
      createdAt: new Date()
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    this.emit('set', { key, size: JSON.stringify(data).length });
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
      this.emit('delete', { key });
      return true;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix?: string): Promise<string[]> {
    try {
      const files = await fs.readdir(this.basePath);
      let keys = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));

      if (prefix) {
        keys = keys.filter(key => key.startsWith(prefix));
      }

      return keys;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.basePath);
      await Promise.all(
        files.map(file => fs.unlink(join(this.basePath, file)))
      );
      this.emit('clear');
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getStats(): Promise<StorageStats> {
    try {
      const files = await fs.readdir(this.basePath);
      const stats = await Promise.all(
        files.map(async file => {
          const filePath = join(this.basePath, file);
          const stat = await fs.stat(filePath);
          return stat.size;
        })
      );

      return {
        totalKeys: files.length,
        totalSize: stats.reduce((sum, size) => sum + size, 0),
        lastAccess: new Date()
      };
    } catch (error) {
      return {
        totalKeys: 0,
        totalSize: 0,
        lastAccess: new Date()
      };
    }
  }
}

// Storage Manager
export class StorageManager extends EventEmitter {
  private providers: Map<string, StorageProvider> = new Map();
  private defaultProvider: string;
  private cache?: Map<string, { value: any; timestamp: number }>;
  private logger: Logger;
  private options: StorageManagerOptions;
  private backupTimer?: ReturnType<typeof setTimeout>;

  constructor(options: StorageManagerOptions = {}) {
    super();
    
    this.options = {
      defaultProvider: options.defaultProvider || 'memory',
      enableCaching: options.enableCaching !== false,
      cacheSize: options.cacheSize || 1000,
      enableCompression: options.enableCompression || false,
      enableEncryption: options.enableEncryption || false,
      backupInterval: options.backupInterval || 3600000, // 1 hour
      backupPath: options.backupPath || './backups',
      ...options
    };

    this.defaultProvider = this.options.defaultProvider!;
    this.logger = new Logger('StorageManager');

    if (this.options.enableCaching) {
      this.cache = new Map();
    }

    this.initializeDefaultProviders();
    this.startBackupTimer();
  }

  private initializeDefaultProviders(): void {
    // Add memory provider
    this.addProvider(new MemoryStorageProvider());

    // Add file provider
    this.addProvider(new FileStorageProvider('./storage/files'));

    this.logger.info('Default storage providers initialized');
  }

  addProvider(provider: StorageProvider): void {
    this.providers.set(provider.name, provider);
    
    // Forward provider events
    provider.on('get', (data: any) => this.emit('provider:get', { provider: provider.name, ...data }));
    provider.on('set', (data: any) => this.emit('provider:set', { provider: provider.name, ...data }));
    provider.on('delete', (data: any) => this.emit('provider:delete', { provider: provider.name, ...data }));
    
    this.logger.debug(`Storage provider added: ${provider.name}`);
  }

  getProvider(name?: string): StorageProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Storage provider not found: ${providerName}`);
    }
    
    return provider;
  }

  async connect(providerName?: string): Promise<void> {
    if (providerName) {
      const provider = this.getProvider(providerName);
      await provider.connect();
    } else {
      // Connect all providers
      await Promise.all(
        Array.from(this.providers.values()).map(provider => provider.connect())
      );
    }
  }

  async disconnect(providerName?: string): Promise<void> {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    if (providerName) {
      const provider = this.getProvider(providerName);
      await provider.disconnect();
    } else {
      // Disconnect all providers
      await Promise.all(
        Array.from(this.providers.values()).map(provider => provider.disconnect())
      );
    }
  }

  async get(key: string, providerName?: string): Promise<any> {
    // Check cache first
    if (this.cache) {
      const cached = this.cache.get(key);
      if (cached) {
        this.emit('cache:hit', { key });
        return cached.value;
      }
      this.emit('cache:miss', { key });
    }

    const provider = this.getProvider(providerName);
    const value = await provider.get(key);

    // Update cache
    if (this.cache && value !== undefined) {
      // Implement LRU eviction if cache is full
      if (this.cache.size >= this.options.cacheSize!) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }
      
      this.cache.set(key, {
        value,
        timestamp: Date.now()
      });
    }

    return value;
  }

  async set(key: string, value: any, options?: StorageOptions, providerName?: string): Promise<void> {
    const provider = this.getProvider(providerName);
    await provider.set(key, value, options);

    // Update cache
    if (this.cache) {
      this.cache.set(key, {
        value,
        timestamp: Date.now()
      });
    }

    this.emit('set', { key, provider: provider.name });
  }

  async delete(key: string, providerName?: string): Promise<boolean> {
    const provider = this.getProvider(providerName);
    const deleted = await provider.delete(key);

    // Remove from cache
    if (this.cache) {
      this.cache.delete(key);
    }

    if (deleted) {
      this.emit('delete', { key, provider: provider.name });
    }

    return deleted;
  }

  async exists(key: string, providerName?: string): Promise<boolean> {
    // Check cache first
    if (this.cache && this.cache.has(key)) {
      return true;
    }

    const provider = this.getProvider(providerName);
    return provider.exists(key);
  }

  async list(prefix?: string, providerName?: string): Promise<string[]> {
    const provider = this.getProvider(providerName);
    return provider.list(prefix);
  }

  async clear(providerName?: string): Promise<void> {
    const provider = this.getProvider(providerName);
    await provider.clear();

    // Clear cache
    if (this.cache) {
      this.cache.clear();
    }

    this.emit('clear', { provider: provider.name });
  }

  // Multi-provider operations
  async multiGet(keys: string[], providerName?: string): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    await Promise.all(
      keys.map(async (key) => {
        try {
          results[key] = await this.get(key, providerName);
        } catch (error) {
          this.logger.warn(`Failed to get key ${key}`, error);
          results[key] = undefined;
        }
      })
    );

    return results;
  }

  async multiSet(data: Record<string, any>, options?: StorageOptions, providerName?: string): Promise<void> {
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        this.set(key, value, options, providerName)
      )
    );
  }

  async multiDelete(keys: string[], providerName?: string): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    await Promise.all(
      keys.map(async (key) => {
        try {
          results[key] = await this.delete(key, providerName);
        } catch (error) {
          this.logger.warn(`Failed to delete key ${key}`, error);
          results[key] = false;
        }
      })
    );

    return results;
  }

  // Backup and restore
  async backup(providerName?: string): Promise<string> {
    const provider = this.getProvider(providerName);
    const keys = await provider.list();
    const data: Record<string, any> = {};

    for (const key of keys) {
      try {
        data[key] = await provider.get(key);
      } catch (error) {
        this.logger.warn(`Failed to backup key ${key}`, error);
      }
    }

    const backupData = {
      provider: provider.name,
      timestamp: new Date().toISOString(),
      data
    };

    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backupPath = join(this.options.backupPath!, `${backupId}.json`);

    await fs.mkdir(dirname(backupPath), { recursive: true });
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    this.logger.info(`Backup created: ${backupId}`);
    this.emit('backup:created', { backupId, path: backupPath });

    return backupId;
  }

  async restore(backupId: string, providerName?: string): Promise<void> {
    const backupPath = join(this.options.backupPath!, `${backupId}.json`);
    
    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      const provider = this.getProvider(providerName || backupData.provider);

      // Clear existing data
      await provider.clear();

      // Restore data
      for (const [key, value] of Object.entries(backupData.data)) {
        await provider.set(key, value);
      }

      this.logger.info(`Backup restored: ${backupId}`);
      this.emit('backup:restored', { backupId, provider: provider.name });

    } catch (error) {
      this.logger.error(`Failed to restore backup ${backupId}`, error);
      throw error;
    }
  }

  private startBackupTimer(): void {
    if (this.options.backupInterval && this.options.backupInterval > 0) {
      this.backupTimer = setInterval(async () => {
        try {
          await this.backup();
        } catch (error) {
          this.logger.error('Automatic backup failed', error);
        }
      }, this.options.backupInterval);
    }
  }

  // Statistics
  async getStats(providerName?: string): Promise<StorageStats & { cacheStats?: any }> {
    const provider = this.getProvider(providerName);
    const stats = await provider.getStats();

    if (this.cache) {
      const cacheStats = {
        size: this.cache.size,
        maxSize: this.options.cacheSize,
        hitRate: 0, // Would need to track hits/misses
        missRate: 0
      };

      return { ...stats, cacheStats };
    }

    return stats;
  }

  getAllProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // Cleanup
  destroy(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    if (this.cache) {
      this.cache.clear();
    }

    this.removeAllListeners();
    this.logger.info('Storage manager destroyed');
  }
}
