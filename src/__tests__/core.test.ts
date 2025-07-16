/**
 * Core Module Tests
 * 核心模块测试
 */

import { EventBus, Logger, MJOSEngine, ContextManager } from '../core/index';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  test('should register and emit events', () => {
    const mockListener = jest.fn();
    eventBus.on('test-event', mockListener);
    
    eventBus.emit('test-event', 'test-data');
    
    expect(mockListener).toHaveBeenCalledWith('test-data');
  });

  test('should handle multiple listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    
    eventBus.on('test-event', listener1);
    eventBus.on('test-event', listener2);
    
    eventBus.emit('test-event', 'data');
    
    expect(listener1).toHaveBeenCalledWith('data');
    expect(listener2).toHaveBeenCalledWith('data');
  });

  test('should remove listeners', () => {
    const mockListener = jest.fn();
    eventBus.on('test-event', mockListener);
    eventBus.off('test-event', mockListener);
    
    eventBus.emit('test-event', 'data');
    
    expect(mockListener).not.toHaveBeenCalled();
  });
});

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger('TestLogger');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('should log debug messages', () => {
    logger.debug('debug message');
    expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] TestLogger: debug message');
  });

  test('should log info messages', () => {
    logger.info('info message');
    expect(consoleSpy).toHaveBeenCalledWith('[INFO] TestLogger: info message');
  });

  test('should log with additional arguments', () => {
    logger.info('message with args', { key: 'value' });
    expect(consoleSpy).toHaveBeenCalledWith('[INFO] TestLogger: message with args', { key: 'value' });
  });
});

describe('MJOSEngine', () => {
  let engine: MJOSEngine;

  beforeEach(() => {
    engine = new MJOSEngine();
  });

  test('should start and stop correctly', async () => {
    expect(engine.getStatus().running).toBe(false);
    
    await engine.start();
    expect(engine.getStatus().running).toBe(true);
    
    await engine.stop();
    expect(engine.getStatus().running).toBe(false);
  });

  test('should not start if already running', async () => {
    await engine.start();
    
    // Should not throw error when starting again
    await expect(engine.start()).resolves.toBeUndefined();
    expect(engine.getStatus().running).toBe(true);
  });

  test('should not stop if not running', async () => {
    // Should not throw error when stopping while not running
    await expect(engine.stop()).resolves.toBeUndefined();
    expect(engine.getStatus().running).toBe(false);
  });

  test('should provide event bus access', () => {
    const eventBus = engine.getEventBus();
    expect(eventBus).toBeInstanceOf(EventBus);
  });
});

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager();
  });

  test('should set and get context values', () => {
    contextManager.set('key1', 'value1');
    expect(contextManager.get('key1')).toBe('value1');
  });

  test('should check if key exists', () => {
    contextManager.set('key1', 'value1');
    expect(contextManager.has('key1')).toBe(true);
    expect(contextManager.has('nonexistent')).toBe(false);
  });

  test('should delete context values', () => {
    contextManager.set('key1', 'value1');
    expect(contextManager.delete('key1')).toBe(true);
    expect(contextManager.has('key1')).toBe(false);
    expect(contextManager.delete('nonexistent')).toBe(false);
  });

  test('should clear all context', () => {
    contextManager.set('key1', 'value1');
    contextManager.set('key2', 'value2');
    
    contextManager.clear();
    
    expect(contextManager.has('key1')).toBe(false);
    expect(contextManager.has('key2')).toBe(false);
  });

  test('should get all context as object', () => {
    contextManager.set('key1', 'value1');
    contextManager.set('key2', 'value2');
    
    const all = contextManager.getAll();
    
    expect(all).toEqual({
      key1: 'value1',
      key2: 'value2'
    });
  });
});
