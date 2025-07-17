"use strict";
/**
 * MJOS Storage System
 * 魔剑工作室操作系统存储系统
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageManager = exports.FileStorageProvider = exports.MemoryStorageProvider = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const path_1 = require("path");
const index_1 = require("../core/index");
// Memory Storage Provider
class MemoryStorageProvider extends events_1.EventEmitter {
    constructor() {
        super();
        this.name = 'memory';
        this.type = 'memory';
        this.data = new Map();
        this.logger = new index_1.Logger('MemoryStorage');
    }
    async connect() {
        this.logger.info('Memory storage connected');
    }
    async disconnect() {
        this.data.clear();
        this.logger.info('Memory storage disconnected');
    }
    async get(key) {
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
    async set(key, value, options) {
        this.data.set(key, {
            value,
            ...(options ? { options } : {}),
            createdAt: new Date()
        });
        this.emit('set', { key, size: JSON.stringify(value).length });
    }
    async delete(key) {
        const deleted = this.data.delete(key);
        if (deleted) {
            this.emit('delete', { key });
        }
        return deleted;
    }
    async exists(key) {
        return this.data.has(key);
    }
    async list(prefix) {
        const keys = Array.from(this.data.keys());
        return prefix ? keys.filter(key => key.startsWith(prefix)) : keys;
    }
    async clear() {
        this.data.clear();
        this.emit('clear');
    }
    async getStats() {
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
exports.MemoryStorageProvider = MemoryStorageProvider;
// File Storage Provider
class FileStorageProvider extends events_1.EventEmitter {
    constructor(basePath = './storage') {
        super();
        this.name = 'file';
        this.type = 'file';
        this.basePath = basePath;
        this.logger = new index_1.Logger('FileStorage');
    }
    async connect() {
        try {
            await fs_1.promises.mkdir(this.basePath, { recursive: true });
            this.logger.info(`File storage connected at ${this.basePath}`);
        }
        catch (error) {
            this.logger.error('Failed to connect file storage', error);
            throw error;
        }
    }
    async disconnect() {
        this.logger.info('File storage disconnected');
    }
    getFilePath(key) {
        // Sanitize key for filesystem
        const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
        return (0, path_1.join)(this.basePath, `${sanitizedKey}.json`);
    }
    async get(key) {
        try {
            const filePath = this.getFilePath(key);
            const data = await fs_1.promises.readFile(filePath, 'utf8');
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
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.emit('get', { key, found: false });
                return undefined;
            }
            throw error;
        }
    }
    async set(key, value, options) {
        const filePath = this.getFilePath(key);
        const dir = (0, path_1.dirname)(filePath);
        await fs_1.promises.mkdir(dir, { recursive: true });
        const data = {
            value,
            options,
            createdAt: new Date()
        };
        await fs_1.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        this.emit('set', { key, size: JSON.stringify(data).length });
    }
    async delete(key) {
        try {
            const filePath = this.getFilePath(key);
            await fs_1.promises.unlink(filePath);
            this.emit('delete', { key });
            return true;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }
    async exists(key) {
        try {
            const filePath = this.getFilePath(key);
            await fs_1.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async list(prefix) {
        try {
            const files = await fs_1.promises.readdir(this.basePath);
            let keys = files
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''));
            if (prefix) {
                keys = keys.filter(key => key.startsWith(prefix));
            }
            return keys;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    async clear() {
        try {
            const files = await fs_1.promises.readdir(this.basePath);
            await Promise.all(files.map(file => fs_1.promises.unlink((0, path_1.join)(this.basePath, file))));
            this.emit('clear');
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    async getStats() {
        try {
            const files = await fs_1.promises.readdir(this.basePath);
            const stats = await Promise.all(files.map(async (file) => {
                const filePath = (0, path_1.join)(this.basePath, file);
                const stat = await fs_1.promises.stat(filePath);
                return stat.size;
            }));
            return {
                totalKeys: files.length,
                totalSize: stats.reduce((sum, size) => sum + size, 0),
                lastAccess: new Date()
            };
        }
        catch (error) {
            return {
                totalKeys: 0,
                totalSize: 0,
                lastAccess: new Date()
            };
        }
    }
}
exports.FileStorageProvider = FileStorageProvider;
// Storage Manager
class StorageManager extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.providers = new Map();
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
        this.defaultProvider = this.options.defaultProvider;
        this.logger = new index_1.Logger('StorageManager');
        if (this.options.enableCaching) {
            this.cache = new Map();
        }
        this.initializeDefaultProviders();
        this.startBackupTimer();
    }
    initializeDefaultProviders() {
        // Add memory provider
        this.addProvider(new MemoryStorageProvider());
        // Add file provider
        this.addProvider(new FileStorageProvider('./storage/files'));
        this.logger.info('Default storage providers initialized');
    }
    addProvider(provider) {
        this.providers.set(provider.name, provider);
        // Forward provider events
        provider.on('get', (data) => this.emit('provider:get', { provider: provider.name, ...data }));
        provider.on('set', (data) => this.emit('provider:set', { provider: provider.name, ...data }));
        provider.on('delete', (data) => this.emit('provider:delete', { provider: provider.name, ...data }));
        this.logger.debug(`Storage provider added: ${provider.name}`);
    }
    getProvider(name) {
        const providerName = name || this.defaultProvider;
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Storage provider not found: ${providerName}`);
        }
        return provider;
    }
    async connect(providerName) {
        if (providerName) {
            const provider = this.getProvider(providerName);
            await provider.connect();
        }
        else {
            // Connect all providers
            await Promise.all(Array.from(this.providers.values()).map(provider => provider.connect()));
        }
    }
    async disconnect(providerName) {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
        }
        if (providerName) {
            const provider = this.getProvider(providerName);
            await provider.disconnect();
        }
        else {
            // Disconnect all providers
            await Promise.all(Array.from(this.providers.values()).map(provider => provider.disconnect()));
        }
    }
    async get(key, providerName) {
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
            if (this.cache.size >= this.options.cacheSize) {
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
    async set(key, value, options, providerName) {
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
    async delete(key, providerName) {
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
    async exists(key, providerName) {
        // Check cache first
        if (this.cache && this.cache.has(key)) {
            return true;
        }
        const provider = this.getProvider(providerName);
        return provider.exists(key);
    }
    async list(prefix, providerName) {
        const provider = this.getProvider(providerName);
        return provider.list(prefix);
    }
    async clear(providerName) {
        const provider = this.getProvider(providerName);
        await provider.clear();
        // Clear cache
        if (this.cache) {
            this.cache.clear();
        }
        this.emit('clear', { provider: provider.name });
    }
    // Multi-provider operations
    async multiGet(keys, providerName) {
        const results = {};
        await Promise.all(keys.map(async (key) => {
            try {
                results[key] = await this.get(key, providerName);
            }
            catch (error) {
                this.logger.warn(`Failed to get key ${key}`, error);
                results[key] = undefined;
            }
        }));
        return results;
    }
    async multiSet(data, options, providerName) {
        await Promise.all(Object.entries(data).map(([key, value]) => this.set(key, value, options, providerName)));
    }
    async multiDelete(keys, providerName) {
        const results = {};
        await Promise.all(keys.map(async (key) => {
            try {
                results[key] = await this.delete(key, providerName);
            }
            catch (error) {
                this.logger.warn(`Failed to delete key ${key}`, error);
                results[key] = false;
            }
        }));
        return results;
    }
    // Backup and restore
    async backup(providerName) {
        const provider = this.getProvider(providerName);
        const keys = await provider.list();
        const data = {};
        for (const key of keys) {
            try {
                data[key] = await provider.get(key);
            }
            catch (error) {
                this.logger.warn(`Failed to backup key ${key}`, error);
            }
        }
        const backupData = {
            provider: provider.name,
            timestamp: new Date().toISOString(),
            data
        };
        const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const backupPath = (0, path_1.join)(this.options.backupPath, `${backupId}.json`);
        await fs_1.promises.mkdir((0, path_1.dirname)(backupPath), { recursive: true });
        await fs_1.promises.writeFile(backupPath, JSON.stringify(backupData, null, 2));
        this.logger.info(`Backup created: ${backupId}`);
        this.emit('backup:created', { backupId, path: backupPath });
        return backupId;
    }
    async restore(backupId, providerName) {
        const backupPath = (0, path_1.join)(this.options.backupPath, `${backupId}.json`);
        try {
            const backupData = JSON.parse(await fs_1.promises.readFile(backupPath, 'utf8'));
            const provider = this.getProvider(providerName || backupData.provider);
            // Clear existing data
            await provider.clear();
            // Restore data
            for (const [key, value] of Object.entries(backupData.data)) {
                await provider.set(key, value);
            }
            this.logger.info(`Backup restored: ${backupId}`);
            this.emit('backup:restored', { backupId, provider: provider.name });
        }
        catch (error) {
            this.logger.error(`Failed to restore backup ${backupId}`, error);
            throw error;
        }
    }
    startBackupTimer() {
        if (this.options.backupInterval && this.options.backupInterval > 0) {
            this.backupTimer = setInterval(async () => {
                try {
                    await this.backup();
                }
                catch (error) {
                    this.logger.error('Automatic backup failed', error);
                }
            }, this.options.backupInterval);
        }
    }
    // Statistics
    async getStats(providerName) {
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
    getAllProviders() {
        return Array.from(this.providers.keys());
    }
    // Cleanup
    destroy() {
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
exports.StorageManager = StorageManager;
//# sourceMappingURL=index.js.map