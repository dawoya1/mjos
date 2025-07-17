/**
 * MJOS Core Module
 * 魔剑工作室操作系统核心模块
 */

import { EventEmitter } from 'events';
import * as winston from 'winston';
const chalk = require('chalk');

export interface EventBusOptions {
  maxListeners?: number;
  captureRejections?: boolean;
}

export class EventBus extends EventEmitter {
  private eventHistory: Map<string, any[]> = new Map();
  private maxHistorySize: number = 100;

  constructor(options: EventBusOptions = {}) {
    super({
      captureRejections: options.captureRejections || true
    });

    if (options.maxListeners) {
      this.setMaxListeners(options.maxListeners);
    }
  }

  // Enhanced emit with history tracking
  emit(event: string, ...args: any[]): boolean {
    // Store event in history
    if (!this.eventHistory.has(event)) {
      this.eventHistory.set(event, []);
    }

    const history = this.eventHistory.get(event)!;
    history.push({ timestamp: new Date(), args });

    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    return super.emit(event, ...args);
  }

  // Async emit support
  async emitAsync(event: string, ...args: any[]): Promise<any[]> {
    const listeners = this.listeners(event);
    const results = await Promise.allSettled(
      listeners.map(listener =>
        typeof listener === 'function' ? listener(...args) : Promise.resolve()
      )
    );

    this.emit(event, ...args);
    return results;
  }

  // Get event history
  getEventHistory(event: string): any[] {
    return this.eventHistory.get(event) || [];
  }

  // Clear event history
  clearHistory(event?: string): void {
    if (event) {
      this.eventHistory.delete(event);
    } else {
      this.eventHistory.clear();
    }
  }

  // Once with timeout
  onceWithTimeout(event: string, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, handler);
        reject(new Error(`Event '${event}' timeout after ${timeout}ms`));
      }, timeout);

      const handler = (...args: any[]) => {
        clearTimeout(timer);
        resolve(args);
      };

      this.once(event, handler);
    });
  }
}

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LoggerOptions {
  level?: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  filename?: string;
  maxFiles?: number;
  maxSize?: string;
}

export class Logger {
  private winston: winston.Logger;
  private name: string;
  private level: LogLevel;

  constructor(name: string, options: LoggerOptions = {}) {
    this.name = name;
    this.level = options.level || LogLevel.INFO;

    const transports: winston.transport[] = [];

    // Console transport with colors - 输出到stderr以避免干扰MCP通信
    if (options.enableConsole !== false) {
      transports.push(new winston.transports.Console({
        stderrLevels: ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const prefix = chalk.blue(`[${this.name}]`);
            const time = chalk.gray(timestamp);
            return `${time} ${prefix} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
          })
        )
      }));
    }

    // File transport
    if (options.enableFile) {
      transports.push(new winston.transports.File({
        filename: options.filename || `logs/${name}.log`,
        maxFiles: options.maxFiles || 5,
        maxsize: (options.maxSize as any) || '10m',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));
    }

    this.winston = winston.createLogger({
      level: this.getLevelString(this.level),
      transports,
      exitOnError: false
    });
  }

  private getLevelString(level: LogLevel): string {
    switch (level) {
    case LogLevel.ERROR: return 'error';
    case LogLevel.WARN: return 'warn';
    case LogLevel.INFO: return 'info';
    case LogLevel.DEBUG: return 'debug';
    case LogLevel.TRACE: return 'silly';
    default: return 'info';
    }
  }

  trace(message: string, meta?: any): void {
    if (this.level >= LogLevel.TRACE) {
      this.winston.silly(message, meta);
    }
  }

  debug(message: string, meta?: any): void {
    if (this.level >= LogLevel.DEBUG) {
      this.winston.debug(message, meta);
    }
  }

  info(message: string, meta?: any): void {
    if (this.level >= LogLevel.INFO) {
      this.winston.info(message, meta);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.level >= LogLevel.WARN) {
      this.winston.warn(message, meta);
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.level >= LogLevel.ERROR) {
      this.winston.error(message, error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
    this.winston.level = this.getLevelString(level);
  }

  child(name: string): Logger {
    return new Logger(`${this.name}:${name}`, {
      level: this.level,
      enableConsole: true,
      enableFile: false
    });
  }
}

// Configuration Management
export interface ConfigSchema {
  [key: string]: any;
}

export interface ConfigOptions {
  defaultConfig?: ConfigSchema;
  configFile?: string;
  envPrefix?: string;
  validateSchema?: boolean;
}

export class ConfigManager {
  private config: ConfigSchema = {};
  private schema: ConfigSchema = {};
  private watchers: Map<string, Function[]> = new Map();
  private logger: Logger;

  constructor(options: ConfigOptions = {}) {
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

  private loadFromEnv(prefix: string): void {
    Object.keys(process.env).forEach(key => {
      if (key.startsWith(prefix)) {
        const configKey = key.substring(prefix.length).toLowerCase();
        const value = process.env[key];

        // Try to parse as JSON, fallback to string
        try {
          this.config[configKey] = JSON.parse(value!);
        } catch {
          this.config[configKey] = value;
        }
      }
    });
  }

  private loadFromFile(filename: string): void {
    try {
      const fs = require('fs');
      // const path = require('path'); // Unused import

      if (fs.existsSync(filename)) {
        const content = fs.readFileSync(filename, 'utf8');
        const fileConfig = JSON.parse(content);
        this.config = { ...this.config, ...fileConfig };
        this.logger.info(`Configuration loaded from ${filename}`);
      }
    } catch (error) {
      this.logger.error(`Failed to load config from ${filename}`, error);
    }
  }

  get<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  set(key: string, value: any): void {
    const keys = key.split('.');
    let target = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]!;
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }

    const lastKey = keys[keys.length - 1]!;
    const oldValue = target[lastKey];
    target[lastKey] = value;

    // Notify watchers
    this.notifyWatchers(key, value, oldValue);

    this.logger.debug(`Configuration updated: ${key} = ${JSON.stringify(value)}`);
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  watch(key: string, callback: (newValue: any, oldValue: any) => void): void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, []);
    }
    this.watchers.get(key)!.push(callback);
  }

  unwatch(key: string, callback: Function): void {
    const callbacks = this.watchers.get(key);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyWatchers(key: string, newValue: any, oldValue: any): void {
    const callbacks = this.watchers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          this.logger.error(`Error in config watcher for ${key}`, error);
        }
      });
    }
  }

  getAll(): ConfigSchema {
    return { ...this.config };
  }

  reset(): void {
    this.config = { ...this.schema };
    this.logger.info('Configuration reset to defaults');
  }

  validate(): boolean {
    // Basic validation - can be extended
    return true;
  }
}

export interface MJOSEngineOptions {
  config?: ConfigManager;
  logger?: Logger;
  eventBus?: EventBus;
}

export class MJOSEngine {
  private logger: Logger;
  private eventBus: EventBus;
  private config: ConfigManager;
  private isRunning = false;
  private startTime?: Date;
  private modules: Map<string, any> = new Map();

  constructor(options: MJOSEngineOptions = {}) {
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

  private setupEventHandlers(): void {
    this.eventBus.on('module:registered', (name: string, module: any) => {
      this.logger.info(`Module registered: ${name}`);
    });

    this.eventBus.on('module:unregistered', (name: string) => {
      this.logger.info(`Module unregistered: ${name}`);
    });

    // Handle uncaught errors
    this.eventBus.on('error', (error: Error) => {
      this.logger.error('Uncaught error in event bus', error);
    });
  }

  async start(): Promise<void> {
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

    } catch (error) {
      this.logger.error('Failed to start MJOS Engine', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
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

    } catch (error) {
      this.logger.error('Error during engine shutdown', error);
      throw error;
    }
  }

  registerModule(name: string, _module: any): void {
    if (this.modules.has(name)) {
      throw new Error(`Module ${name} is already registered`);
    }

    this.modules.set(name, module);
    this.eventBus.emit('module:registered', name, module);
  }

  unregisterModule(name: string): boolean {
    const result = this.modules.delete(name);
    if (result) {
      this.eventBus.emit('module:unregistered', name);
    }
    return result;
  }

  getModule<T = any>(name: string): T | undefined {
    return this.modules.get(name);
  }

  getStatus(): {
    running: boolean;
    uptime?: number;
    modules: string[];
    eventHistory: number;
    } {
    const status: any = {
      running: this.isRunning,
      modules: Array.from(this.modules.keys()),
      eventHistory: this.eventBus.getEventHistory('engine:started').length
    };

    if (this.startTime) {
      status.uptime = Date.now() - this.startTime.getTime();
    }

    return status;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getConfig(): ConfigManager {
    return this.config;
  }

  getLogger(): Logger {
    return this.logger;
  }
}

export interface ContextItem {
  value: any;
  timestamp: Date;
  ttl?: number; // Time to live in milliseconds
  metadata?: Record<string, any>;
}

export interface ContextManagerOptions {
  defaultTTL?: number;
  maxSize?: number;
  enablePersistence?: boolean;
  persistenceFile?: string;
}

export class ContextManager {
  private context: Map<string, ContextItem> = new Map();
  private logger: Logger;
  private options: ContextManagerOptions;
  private cleanupInterval?: ReturnType<typeof setTimeout>;

  constructor(options: ContextManagerOptions = {}) {
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
      }, Math.min(this.options.defaultTTL! / 10, 60000)); // Check every minute or 1/10 of TTL
    }

    // Load from persistence if enabled
    if (this.options.enablePersistence) {
      this.loadFromPersistence();
    }
  }

  set(key: string, value: any, ttl?: number, metadata?: Record<string, any>): void {
    // Check size limit
    if (this.context.size >= this.options.maxSize! && !this.context.has(key)) {
      this.evictOldest();
    }

    const item: ContextItem = {
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

  get(key: string): any {
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

  getWithMetadata(key: string): ContextItem | undefined {
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

  has(key: string): boolean {
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

  delete(key: string): boolean {
    const result = this.context.delete(key);
    if (result) {
      this.logger.debug(`Context deleted: ${key}`);

      if (this.options.enablePersistence) {
        this.saveToPersistence();
      }
    }
    return result;
  }

  clear(): void {
    this.context.clear();
    this.logger.debug('Context cleared');

    if (this.options.enablePersistence) {
      this.saveToPersistence();
    }
  }

  keys(): string[] {
    this.cleanup(); // Clean expired items first
    return Array.from(this.context.keys());
  }

  size(): number {
    this.cleanup(); // Clean expired items first
    return this.context.size;
  }

  getAll(): Record<string, any> {
    this.cleanup(); // Clean expired items first
    const result: Record<string, any> = {};

    for (const [key, item] of this.context) {
      result[key] = item.value;
    }

    return result;
  }

  private isExpired(item: ContextItem): boolean {
    if (!item.ttl || item.ttl <= 0) {
      return false;
    }

    return Date.now() - item.timestamp.getTime() > item.ttl;
  }

  private cleanup(): void {
    const expiredKeys: string[] = [];

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

  private evictOldest(): void {
    let oldestKey: string | undefined;
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

  private loadFromPersistence(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.options.persistenceFile!)) {
        const data = fs.readFileSync(this.options.persistenceFile!, 'utf8');
        const parsed = JSON.parse(data);

        for (const [key, item] of Object.entries(parsed)) {
          const contextItem = item as any;
          contextItem.timestamp = new Date(contextItem.timestamp);
          this.context.set(key, contextItem);
        }

        this.logger.info(`Context loaded from ${this.options.persistenceFile}`);
      }
    } catch (error) {
      this.logger.error('Failed to load context from persistence', error);
    }
  }

  private saveToPersistence(): void {
    if (!this.options.enablePersistence) return;

    try {
      const fs = require('fs');
      const data = Object.fromEntries(this.context);
      fs.writeFileSync(this.options.persistenceFile!, JSON.stringify(data, null, 2));
    } catch (error) {
      this.logger.error('Failed to save context to persistence', error);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.options.enablePersistence) {
      this.saveToPersistence();
    }

    this.context.clear();
  }
}
