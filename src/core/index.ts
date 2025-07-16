/**
 * MJOS Core Module
 * 魔剑工作室操作系统核心模块
 */

export class EventBus {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

export class Logger {
  constructor(private name: string) {}

  debug(message: string, ...args: any[]): void {
    console.log(`[DEBUG] ${this.name}: ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${this.name}: ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${this.name}: ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${this.name}: ${message}`, ...args);
  }
}

export class MJOSEngine {
  private logger: Logger;
  private eventBus: EventBus;
  private isRunning = false;

  constructor() {
    this.logger = new Logger('MJOSEngine');
    this.eventBus = new EventBus();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Engine is already running');
      return;
    }

    this.logger.info('Starting MJOS Engine...');
    this.isRunning = true;
    this.eventBus.emit('engine:started');
    this.logger.info('MJOS Engine started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Engine is not running');
      return;
    }

    this.logger.info('Stopping MJOS Engine...');
    this.isRunning = false;
    this.eventBus.emit('engine:stopped');
    this.logger.info('MJOS Engine stopped successfully');
  }

  getStatus(): { running: boolean } {
    return { running: this.isRunning };
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }
}

export class ContextManager {
  private context: Map<string, any> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ContextManager');
  }

  set(key: string, value: any): void {
    this.context.set(key, value);
    this.logger.debug(`Context set: ${key}`);
  }

  get(key: string): any {
    return this.context.get(key);
  }

  has(key: string): boolean {
    return this.context.has(key);
  }

  delete(key: string): boolean {
    const result = this.context.delete(key);
    if (result) {
      this.logger.debug(`Context deleted: ${key}`);
    }
    return result;
  }

  clear(): void {
    this.context.clear();
    this.logger.debug('Context cleared');
  }

  getAll(): Record<string, any> {
    return Object.fromEntries(this.context);
  }
}
