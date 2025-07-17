"use strict";
/**
 * MJOS Core Module
 * 魔剑工作室操作系统核心模块
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = exports.MJOSEngine = exports.ConfigManager = exports.Logger = exports.LogLevel = exports.EventBus = void 0;
const events_1 = require("events");
const winston = __importStar(require("winston"));
const chalk = require('chalk');
class EventBus extends events_1.EventEmitter {
    constructor(options = {}) {
        super({
            captureRejections: options.captureRejections || true
        });
        this.eventHistory = new Map();
        this.maxHistorySize = 100;
        if (options.maxListeners) {
            this.setMaxListeners(options.maxListeners);
        }
    }
    // Enhanced emit with history tracking
    emit(event, ...args) {
        // Store event in history
        if (!this.eventHistory.has(event)) {
            this.eventHistory.set(event, []);
        }
        const history = this.eventHistory.get(event);
        history.push({ timestamp: new Date(), args });
        // Limit history size
        if (history.length > this.maxHistorySize) {
            history.shift();
        }
        return super.emit(event, ...args);
    }
    // Async emit support
    async emitAsync(event, ...args) {
        const listeners = this.listeners(event);
        const results = await Promise.allSettled(listeners.map(listener => typeof listener === 'function' ? listener(...args) : Promise.resolve()));
        this.emit(event, ...args);
        return results;
    }
    // Get event history
    getEventHistory(event) {
        return this.eventHistory.get(event) || [];
    }
    // Clear event history
    clearHistory(event) {
        if (event) {
            this.eventHistory.delete(event);
        }
        else {
            this.eventHistory.clear();
        }
    }
    // Once with timeout
    onceWithTimeout(event, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.off(event, handler);
                reject(new Error(`Event '${event}' timeout after ${timeout}ms`));
            }, timeout);
            const handler = (...args) => {
                clearTimeout(timer);
                resolve(args);
            };
            this.once(event, handler);
        });
    }
}
exports.EventBus = EventBus;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 4] = "TRACE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(name, options = {}) {
        this.name = name;
        this.level = options.level || LogLevel.INFO;
        const transports = [];
        // Console transport with colors
        if (options.enableConsole !== false) {
            transports.push(new winston.transports.Console({
                format: winston.format.combine(winston.format.timestamp(), winston.format.colorize(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const prefix = chalk.blue(`[${this.name}]`);
                    const time = chalk.gray(timestamp);
                    return `${time} ${prefix} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                }))
            }));
        }
        // File transport
        if (options.enableFile) {
            transports.push(new winston.transports.File({
                filename: options.filename || `logs/${name}.log`,
                maxFiles: options.maxFiles || 5,
                maxsize: options.maxSize || '10m',
                format: winston.format.combine(winston.format.timestamp(), winston.format.json())
            }));
        }
        this.winston = winston.createLogger({
            level: this.getLevelString(this.level),
            transports,
            exitOnError: false
        });
    }
    getLevelString(level) {
        switch (level) {
            case LogLevel.ERROR: return 'error';
            case LogLevel.WARN: return 'warn';
            case LogLevel.INFO: return 'info';
            case LogLevel.DEBUG: return 'debug';
            case LogLevel.TRACE: return 'silly';
            default: return 'info';
        }
    }
    trace(message, meta) {
        if (this.level >= LogLevel.TRACE) {
            this.winston.silly(message, meta);
        }
    }
    debug(message, meta) {
        if (this.level >= LogLevel.DEBUG) {
            this.winston.debug(message, meta);
        }
    }
    info(message, meta) {
        if (this.level >= LogLevel.INFO) {
            this.winston.info(message, meta);
        }
    }
    warn(message, meta) {
        if (this.level >= LogLevel.WARN) {
            this.winston.warn(message, meta);
        }
    }
    error(message, error) {
        if (this.level >= LogLevel.ERROR) {
            this.winston.error(message, error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : error);
        }
    }
    setLevel(level) {
        this.level = level;
        this.winston.level = this.getLevelString(level);
    }
    child(name) {
        return new Logger(`${this.name}:${name}`, {
            level: this.level,
            enableConsole: true,
            enableFile: false
        });
    }
}
exports.Logger = Logger;
class ConfigManager {
    constructor(options = {}) {
        this.config = {};
        this.schema = {};
        this.watchers = new Map();
        this.logger = new Logger('ConfigManager');
        if (options.defaultConfig) {
            this.config = { ...options.defaultConfig };
            this.schema = { ...options.defaultConfig };
        }
        // Load from environment variables
        if (options.envPrefix) {
            this.loadFromEnv(options.envPrefix);
        }
        // Load from config file
        if (options.configFile) {
            this.loadFromFile(options.configFile);
        }
    }
    loadFromEnv(prefix) {
        Object.keys(process.env).forEach(key => {
            if (key.startsWith(prefix)) {
                const configKey = key.substring(prefix.length).toLowerCase();
                const value = process.env[key];
                // Try to parse as JSON, fallback to string
                try {
                    this.config[configKey] = JSON.parse(value);
                }
                catch {
                    this.config[configKey] = value;
                }
            }
        });
    }
    loadFromFile(filename) {
        try {
            const fs = require('fs');
            // const path = require('path'); // Unused import
            if (fs.existsSync(filename)) {
                const content = fs.readFileSync(filename, 'utf8');
                const fileConfig = JSON.parse(content);
                this.config = { ...this.config, ...fileConfig };
                this.logger.info(`Configuration loaded from ${filename}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to load config from ${filename}`, error);
        }
    }
    get(key, defaultValue) {
        const keys = key.split('.');
        let value = this.config;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            }
            else {
                return defaultValue;
            }
        }
        return value;
    }
    set(key, value) {
        const keys = key.split('.');
        let target = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in target) || typeof target[k] !== 'object') {
                target[k] = {};
            }
            target = target[k];
        }
        const lastKey = keys[keys.length - 1];
        const oldValue = target[lastKey];
        target[lastKey] = value;
        // Notify watchers
        this.notifyWatchers(key, value, oldValue);
        this.logger.debug(`Configuration updated: ${key} = ${JSON.stringify(value)}`);
    }
    has(key) {
        return this.get(key) !== undefined;
    }
    watch(key, callback) {
        if (!this.watchers.has(key)) {
            this.watchers.set(key, []);
        }
        this.watchers.get(key).push(callback);
    }
    unwatch(key, callback) {
        const callbacks = this.watchers.get(key);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    notifyWatchers(key, newValue, oldValue) {
        const callbacks = this.watchers.get(key);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                }
                catch (error) {
                    this.logger.error(`Error in config watcher for ${key}`, error);
                }
            });
        }
    }
    getAll() {
        return { ...this.config };
    }
    reset() {
        this.config = { ...this.schema };
        this.logger.info('Configuration reset to defaults');
    }
    validate() {
        // Basic validation - can be extended
        return true;
    }
}
exports.ConfigManager = ConfigManager;
class MJOSEngine {
    constructor(options = {}) {
        this.isRunning = false;
        this.modules = new Map();
        this.config = options.config || new ConfigManager({
            defaultConfig: {
                engine: {
                    maxListeners: 100,
                    enableMetrics: true,
                    shutdownTimeout: 5000
                }
            }
        });
        this.logger = options.logger || new Logger('MJOSEngine', {
            level: this.config.get('engine.logLevel', LogLevel.INFO)
        });
        this.eventBus = options.eventBus || new EventBus({
            maxListeners: this.config.get('engine.maxListeners', 100)
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.eventBus.on('module:registered', (name, module) => {
            this.logger.info(`Module registered: ${name}`);
        });
        this.eventBus.on('module:unregistered', (name) => {
            this.logger.info(`Module unregistered: ${name}`);
        });
        // Handle uncaught errors
        this.eventBus.on('error', (error) => {
            this.logger.error('Uncaught error in event bus', error);
        });
    }
    async start() {
        if (this.isRunning) {
            this.logger.warn('Engine is already running');
            return;
        }
        this.logger.info('Starting MJOS Engine...');
        this.startTime = new Date();
        try {
            // Start all registered modules
            for (const [name, module] of this.modules) {
                if (module.start && typeof module.start === 'function') {
                    this.logger.debug(`Starting module: ${name}`);
                    await module.start();
                }
            }
            this.isRunning = true;
            await this.eventBus.emitAsync('engine:started', this.getStatus());
            this.logger.info('MJOS Engine started successfully');
        }
        catch (error) {
            this.logger.error('Failed to start MJOS Engine', error);
            throw error;
        }
    }
    async stop() {
        if (!this.isRunning) {
            this.logger.warn('Engine is not running');
            return;
        }
        this.logger.info('Stopping MJOS Engine...');
        try {
            // Stop all registered modules in reverse order
            const moduleEntries = Array.from(this.modules.entries()).reverse();
            for (const [name, module] of moduleEntries) {
                if (module.stop && typeof module.stop === 'function') {
                    this.logger.debug(`Stopping module: ${name}`);
                    await module.stop();
                }
            }
            this.isRunning = false;
            await this.eventBus.emitAsync('engine:stopped', this.getStatus());
            this.logger.info('MJOS Engine stopped successfully');
        }
        catch (error) {
            this.logger.error('Error during engine shutdown', error);
            throw error;
        }
    }
    registerModule(name, _module) {
        if (this.modules.has(name)) {
            throw new Error(`Module ${name} is already registered`);
        }
        this.modules.set(name, module);
        this.eventBus.emit('module:registered', name, module);
    }
    unregisterModule(name) {
        const result = this.modules.delete(name);
        if (result) {
            this.eventBus.emit('module:unregistered', name);
        }
        return result;
    }
    getModule(name) {
        return this.modules.get(name);
    }
    getStatus() {
        const status = {
            running: this.isRunning,
            modules: Array.from(this.modules.keys()),
            eventHistory: this.eventBus.getEventHistory('engine:started').length
        };
        if (this.startTime) {
            status.uptime = Date.now() - this.startTime.getTime();
        }
        return status;
    }
    getEventBus() {
        return this.eventBus;
    }
    getConfig() {
        return this.config;
    }
    getLogger() {
        return this.logger;
    }
}
exports.MJOSEngine = MJOSEngine;
class ContextManager {
    constructor(options = {}) {
        this.context = new Map();
        this.options = {
            defaultTTL: options.defaultTTL || 0, // 0 means no expiration
            maxSize: options.maxSize || 1000,
            enablePersistence: options.enablePersistence || false,
            persistenceFile: options.persistenceFile || 'context.json',
            ...options
        };
        this.logger = new Logger('ContextManager');
        // Start cleanup interval for expired items
        if (this.options.defaultTTL && this.options.defaultTTL > 0) {
            this.cleanupInterval = setInterval(() => {
                this.cleanup();
            }, Math.min(this.options.defaultTTL / 10, 60000)); // Check every minute or 1/10 of TTL
        }
        // Load from persistence if enabled
        if (this.options.enablePersistence) {
            this.loadFromPersistence();
        }
    }
    set(key, value, ttl, metadata) {
        // Check size limit
        if (this.context.size >= this.options.maxSize && !this.context.has(key)) {
            this.evictOldest();
        }
        const item = {
            value,
            timestamp: new Date(),
            ...(ttl || this.options.defaultTTL ? { ttl: ttl || this.options.defaultTTL } : {}),
            ...(metadata ? { metadata } : {})
        };
        this.context.set(key, item);
        this.logger.debug(`Context set: ${key}`, { ttl, metadata });
        // Persist if enabled
        if (this.options.enablePersistence) {
            this.saveToPersistence();
        }
    }
    get(key) {
        const item = this.context.get(key);
        if (!item) {
            return undefined;
        }
        // Check if expired
        if (this.isExpired(item)) {
            this.context.delete(key);
            this.logger.debug(`Context expired and removed: ${key}`);
            return undefined;
        }
        return item.value;
    }
    getWithMetadata(key) {
        const item = this.context.get(key);
        if (!item) {
            return undefined;
        }
        if (this.isExpired(item)) {
            this.context.delete(key);
            return undefined;
        }
        return item;
    }
    has(key) {
        const item = this.context.get(key);
        if (!item) {
            return false;
        }
        if (this.isExpired(item)) {
            this.context.delete(key);
            return false;
        }
        return true;
    }
    delete(key) {
        const result = this.context.delete(key);
        if (result) {
            this.logger.debug(`Context deleted: ${key}`);
            if (this.options.enablePersistence) {
                this.saveToPersistence();
            }
        }
        return result;
    }
    clear() {
        this.context.clear();
        this.logger.debug('Context cleared');
        if (this.options.enablePersistence) {
            this.saveToPersistence();
        }
    }
    keys() {
        this.cleanup(); // Clean expired items first
        return Array.from(this.context.keys());
    }
    size() {
        this.cleanup(); // Clean expired items first
        return this.context.size;
    }
    getAll() {
        this.cleanup(); // Clean expired items first
        const result = {};
        for (const [key, item] of this.context) {
            result[key] = item.value;
        }
        return result;
    }
    isExpired(item) {
        if (!item.ttl || item.ttl <= 0) {
            return false;
        }
        return Date.now() - item.timestamp.getTime() > item.ttl;
    }
    cleanup() {
        const expiredKeys = [];
        for (const [key, item] of this.context) {
            if (this.isExpired(item)) {
                expiredKeys.push(key);
            }
        }
        expiredKeys.forEach(key => {
            this.context.delete(key);
            this.logger.debug(`Context expired and cleaned: ${key}`);
        });
        if (expiredKeys.length > 0 && this.options.enablePersistence) {
            this.saveToPersistence();
        }
    }
    evictOldest() {
        let oldestKey;
        let oldestTime = Date.now();
        for (const [key, item] of this.context) {
            if (item.timestamp.getTime() < oldestTime) {
                oldestTime = item.timestamp.getTime();
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.context.delete(oldestKey);
            this.logger.debug(`Context evicted (oldest): ${oldestKey}`);
        }
    }
    loadFromPersistence() {
        try {
            const fs = require('fs');
            if (fs.existsSync(this.options.persistenceFile)) {
                const data = fs.readFileSync(this.options.persistenceFile, 'utf8');
                const parsed = JSON.parse(data);
                for (const [key, item] of Object.entries(parsed)) {
                    const contextItem = item;
                    contextItem.timestamp = new Date(contextItem.timestamp);
                    this.context.set(key, contextItem);
                }
                this.logger.info(`Context loaded from ${this.options.persistenceFile}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to load context from persistence', error);
        }
    }
    saveToPersistence() {
        if (!this.options.enablePersistence)
            return;
        try {
            const fs = require('fs');
            const data = Object.fromEntries(this.context);
            fs.writeFileSync(this.options.persistenceFile, JSON.stringify(data, null, 2));
        }
        catch (error) {
            this.logger.error('Failed to save context to persistence', error);
        }
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        if (this.options.enablePersistence) {
            this.saveToPersistence();
        }
        this.context.clear();
    }
}
exports.ContextManager = ContextManager;
//# sourceMappingURL=index.js.map