/**
 * MJOS Storage System
 * 魔剑工作室操作系统存储系统
 */
import { EventEmitter } from 'events';
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
    ttl?: number;
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
export declare class MemoryStorageProvider extends EventEmitter implements StorageProvider {
    name: string;
    type: 'memory';
    private data;
    private logger;
    constructor();
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
export declare class FileStorageProvider extends EventEmitter implements StorageProvider {
    name: string;
    type: 'file';
    private basePath;
    private logger;
    constructor(basePath?: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private getFilePath;
    get(key: string): Promise<any>;
    set(key: string, value: any, options?: StorageOptions): Promise<void>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    list(prefix?: string): Promise<string[]>;
    clear(): Promise<void>;
    getStats(): Promise<StorageStats>;
}
export declare class StorageManager extends EventEmitter {
    private providers;
    private defaultProvider;
    private cache?;
    private logger;
    private options;
    private backupTimer?;
    constructor(options?: StorageManagerOptions);
    private initializeDefaultProviders;
    addProvider(provider: StorageProvider): void;
    getProvider(name?: string): StorageProvider;
    connect(providerName?: string): Promise<void>;
    disconnect(providerName?: string): Promise<void>;
    get(key: string, providerName?: string): Promise<any>;
    set(key: string, value: any, options?: StorageOptions, providerName?: string): Promise<void>;
    delete(key: string, providerName?: string): Promise<boolean>;
    exists(key: string, providerName?: string): Promise<boolean>;
    list(prefix?: string, providerName?: string): Promise<string[]>;
    clear(providerName?: string): Promise<void>;
    multiGet(keys: string[], providerName?: string): Promise<Record<string, any>>;
    multiSet(data: Record<string, any>, options?: StorageOptions, providerName?: string): Promise<void>;
    multiDelete(keys: string[], providerName?: string): Promise<Record<string, boolean>>;
    backup(providerName?: string): Promise<string>;
    restore(backupId: string, providerName?: string): Promise<void>;
    private startBackupTimer;
    getStats(providerName?: string): Promise<StorageStats & {
        cacheStats?: any;
    }>;
    getAllProviders(): string[];
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map