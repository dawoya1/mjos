/**
 * MJOS Event Bus
 * 魔剑工作室操作系统事件总线
 */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { MJOSEvent, EventHandler } from './types/index';

/**
 * 事件总线�? * 负责系统内部事件的发布、订阅和路由
 */
export class EventBus extends EventEmitter {
  private readonly logger: Logger;
  private readonly handlers = new Map<string, EventHandler[]>();
  private readonly eventHistory: MJOSEvent[] = [];
  private readonly maxHistorySize = 1000;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    this.setupInternalListeners();
  }

  /**
   * 发布事件
   */
  public publishEvent(
    type: string,
    payload: any,
    source: string,
    target?: string,
    metadata: Record<string, any> = {}
  ): string {
    const event: MJOSEvent = {
      id: uuidv4(),
      type,
      source,
      target,
      payload,
      timestamp: new Date(),
      metadata
    };

    // 记录事件历史
    this.addToHistory(event);

    // 记录日志
    this.logger.debug('Event published', {
      eventId: event.id,
      type: event.type,
      source: event.source,
      target: event.target
    });

    // 发布事件
    this.emit(type, event);

    // 如果有目标，也发布到目标特定的事件类�?    if (target) {
      this.emit(`${type}:${target}`, event);
    }

    return event.id;
  }

  /**
   * 订阅事件
   */
  public subscribeEvent(
    eventType: string,
    handler: (event: MJOSEvent) => void | Promise<void>,
    options: {
      priority?: number;
      once?: boolean;
      id?: string;
    } = {}
  ): string {
    const handlerId = options.id || uuidv4();
    const priority = options.priority || 0;
    const once = options.once || false;

    const eventHandler: EventHandler = {
      id: handlerId,
      eventType,
      handler,
      priority,
      once
    };

    // 添加到处理器映射
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    const handlers = this.handlers.get(eventType)!;
    handlers.push(eventHandler);
    
    // 按优先级排序
    handlers.sort((a, b) => b.priority - a.priority);

    // 包装处理器以支持优先级和一次性执�?    const wrappedHandler = async (event: MJOSEvent) => {
      try {
        await handler(event);
        
        // 如果是一次性处理器，执行后移除
        if (once) {
          this.unsubscribeEvent(eventType, handlerId);
        }
      } catch (error) {
        this.logger.error('Event handler error', {
          handlerId,
          eventType,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // 发布错误事件
        this.publishEvent('handler.error', {
          handlerId,
          eventType,
          originalEvent: event,
          error
        }, 'EventBus');
      }
    };

    // 注册到EventEmitter
    if (once) {
      this.once(eventType, wrappedHandler);
    } else {
      this.on(eventType, wrappedHandler);
    }

    this.logger.debug('Event handler registered', {
      handlerId,
      eventType,
      priority,
      once
    });

    return handlerId;
  }

  /**
   * 取消订阅事件
   */
  public unsubscribeEvent(eventType: string, handlerId: string): boolean {
    const handlers = this.handlers.get(eventType);
    if (!handlers) {
      return false;
    }

    const index = handlers.findIndex(h => h.id === handlerId);
    if (index === -1) {
      return false;
    }

    // 从处理器映射中移�?    handlers.splice(index, 1);
    
    // 如果没有处理器了，移除整个映�?    if (handlers.length === 0) {
      this.handlers.delete(eventType);
    }

    this.logger.debug('Event handler unregistered', {
      handlerId,
      eventType
    });

    return true;
  }

  /**
   * 获取事件历史
   */
  public getEventHistory(filter?: {
    type?: string;
    source?: string;
    target?: string;
    since?: Date;
    limit?: number;
  }): MJOSEvent[] {
    let events = [...this.eventHistory];

    if (filter) {
      if (filter.type) {
        events = events.filter(e => e.type === filter.type);
      }
      if (filter.source) {
        events = events.filter(e => e.source === filter.source);
      }
      if (filter.target) {
        events = events.filter(e => e.target === filter.target);
      }
      if (filter.since) {
        events = events.filter(e => e.timestamp >= filter.since!);
      }
      if (filter.limit) {
        events = events.slice(-filter.limit);
      }
    }

    return events;
  }

  /**
   * 获取活跃的事件处理器
   */
  public getActiveHandlers(): Record<string, EventHandler[]> {
    const result: Record<string, EventHandler[]> = {};
    
    for (const [eventType, handlers] of this.handlers) {
      result[eventType] = [...handlers];
    }
    
    return result;
  }

  /**
   * 清理事件历史
   */
  public clearEventHistory(): void {
    this.eventHistory.length = 0;
    this.logger.debug('Event history cleared');
  }

  /**
   * 等待特定事件
   */
  public waitForEvent(
    eventType: string,
    timeout: number = 5000,
    condition?: (event: MJOSEvent) => boolean
  ): Promise<MJOSEvent> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.unsubscribeEvent(eventType, handlerId);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const handlerId = this.subscribeEvent(
        eventType,
        (event: MJOSEvent) => {
          if (!condition || condition(event)) {
            clearTimeout(timeoutId);
            resolve(event);
          }
        },
        { once: true }
      );
    });
  }

  /**
   * 批量发布事件
   */
  public publishBatch(events: Array<{
    type: string;
    payload: any;
    source: string;
    target?: string;
    metadata?: Record<string, any>;
  }>): string[] {
    const eventIds: string[] = [];
    
    for (const eventData of events) {
      const eventId = this.publishEvent(
        eventData.type,
        eventData.payload,
        eventData.source,
        eventData.target,
        eventData.metadata
      );
      eventIds.push(eventId);
    }
    
    this.logger.debug('Batch events published', {
      count: events.length,
      eventIds
    });
    
    return eventIds;
  }

  /**
   * 添加事件到历史记�?   */
  private addToHistory(event: MJOSEvent): void {
    this.eventHistory.push(event);
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 设置内部监听�?   */
  private setupInternalListeners(): void {
    // 监听所有事件进行统�?    this.on('*', (event: MJOSEvent) => {
      // 这里可以添加事件统计逻辑
    });

    // 监听错误事件
    this.on('error', (error: Error) => {
      this.logger.error('EventBus error', { error: error.message });
    });

    // 监听处理器错�?    this.on('handler.error', (event: MJOSEvent) => {
      this.logger.warn('Event handler error occurred', {
        eventId: event.id,
        payload: event.payload
      });
    });
  }
}
