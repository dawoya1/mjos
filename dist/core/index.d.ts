/**
 * MJOS Core Module
 * 魔剑工作室操作系统核心模块
 */
import { EventEmitter } from 'events';
export interface EventBusOptions {
    maxListeners?: number;
    captureRejections?: boolean;
}
export declare class EventBus extends EventEmitter {
    private eventHistory;
    private maxHistorySize;
    constructor(options?: EventBusOptions);
    emit(event: string, ...args: any[]): boolean;
    emitAsync(event: string, ...args: any[]): Promise<any[]>;
    getEventHistory(event: string): any[];
    clearHistory(event?: string): void;
    onceWithTimeout(event: string, timeout: number): Promise<any>;
}
export declare enum LogLevel {
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
export declare class Logger {
    private winston;
    private name;
    private level;
    constructor(name: string, options?: LoggerOptions);
    private getLevelString;
    trace(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error | any): void;
    setLevel(level: LogLevel): void;
    child(name: string): Logger;
}
export interface ConfigSchema {
    [key: string]: any;
}
export interface ConfigOptions {
    defaultConfig?: ConfigSchema;
    configFile?: string;
    envPrefix?: string;
    validateSchema?: boolean;
}
export declare class ConfigManager {
    private config;
    private schema;
    private watchers;
    private logger;
    constructor(options?: ConfigOptions);
    private loadFromEnv;
    private loadFromFile;
    get<T = any>(key: string, defaultValue?: T): T;
    set(key: string, value: any): void;
    has(key: string): boolean;
    watch(key: string, callback: (newValue: any, oldValue: any) => void): void;
    unwatch(key: string, callback: Function): void;
    private notifyWatchers;
    getAll(): ConfigSchema;
    reset(): void;
    validate(): boolean;
}
export interface MJOSEngineOptions {
    config?: ConfigManager;
    logger?: Logger;
    eventBus?: EventBus;
}
export declare class MJOSEngine {
    private logger;
    private eventBus;
    private config;
    private isRunning;
    private startTime?;
    private modules;
    constructor(options?: MJOSEngineOptions);
    private setupEventHandlers;
    start(): Promise<void>;
    stop(): Promise<void>;
    registerModule(name: string, _module: any): void;
    unregisterModule(name: string): boolean;
    getModule<T = any>(name: string): T | undefined;
    getStatus(): {
        running: boolean;
        uptime?: number;
        modules: string[];
        eventHistory: number;
    };
    getEventBus(): EventBus;
    getConfig(): ConfigManager;
    getLogger(): Logger;
}
export interface ContextItem {
    value: any;
    timestamp: Date;
    ttl?: number;
    metadata?: Record<string, any>;
}
export interface ContextManagerOptions {
    defaultTTL?: number;
    maxSize?: number;
    enablePersistence?: boolean;
    persistenceFile?: string;
}
export declare class ContextManager {
    private context;
    private logger;
    private options;
    private cleanupInterval?;
    constructor(options?: ContextManagerOptions);
    set(key: string, value: any, ttl?: number, metadata?: Record<string, any>): void;
    get(key: string): any;
    getWithMetadata(key: string): ContextItem | undefined;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    keys(): string[];
    size(): number;
    getAll(): Record<string, any>;
    private isExpired;
    private cleanup;
    private evictOldest;
    private loadFromPersistence;
    private saveToPersistence;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map