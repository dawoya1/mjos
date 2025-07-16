/**
 * MJOS Engine Tests
 * 魔剑工作室操作系统核心引擎测试
 */

import { MJOSEngine } from '../../src/core/MJOSEngine';
import { MJOSConfig } from '../../src/types';

describe('MJOSEngine', () => {
  let engine: MJOSEngine;

  beforeEach(() => {
    // 重置单例实例
    (MJOSEngine as any).instance = undefined;
    
    engine = MJOSEngine.getInstance({
      environment: 'test',
      logging: {
        level: 'error',
        format: 'simple',
        outputs: ['console']
      }
    });
  });

  afterEach(async () => {
    if (engine && engine.getStatus().running) {
      await engine.stop();
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const engine1 = MJOSEngine.getInstance();
      const engine2 = MJOSEngine.getInstance();
      expect(engine1).toBe(engine2);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const result = await engine.initialize();
      expect(result.success).toBe(true);
      expect(engine.getStatus().initialized).toBe(true);
    });

    it('should not initialize twice', async () => {
      await engine.initialize();
      const result = await engine.initialize();
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should handle initialization errors', async () => {
      // 模拟配置错误
      const badEngine = MJOSEngine.getInstance({
        team: {
          name: '', // 空名称应该导致验证失败
          description: '',
          roles: [],
          collaborationRules: [],
          workflows: []
        }
      } as any);

      const result = await badEngine.initialize();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Lifecycle Management', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should start successfully after initialization', async () => {
      const result = await engine.start();
      expect(result.success).toBe(true);
      expect(engine.getStatus().running).toBe(true);
    });

    it('should not start without initialization', async () => {
      const uninitializedEngine = MJOSEngine.getInstance();
      await expect(uninitializedEngine.start()).rejects.toThrow('Engine must be initialized before starting');
    });

    it('should not start twice', async () => {
      await engine.start();
      const result = await engine.start();
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should stop successfully', async () => {
      await engine.start();
      const result = await engine.stop();
      expect(result.success).toBe(true);
      expect(engine.getStatus().running).toBe(false);
    });

    it('should handle stop when not running', async () => {
      const result = await engine.stop();
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });

  describe('Component Management', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should register components', () => {
      const mockComponent = { name: 'TestComponent' };
      engine.registerComponent('test', mockComponent);
      
      const retrieved = engine.getComponent('test');
      expect(retrieved).toBe(mockComponent);
    });

    it('should not register duplicate components', () => {
      const mockComponent = { name: 'TestComponent' };
      engine.registerComponent('test', mockComponent);
      
      expect(() => {
        engine.registerComponent('test', mockComponent);
      }).toThrow("Component 'test' already registered");
    });

    it('should return undefined for non-existent components', () => {
      const retrieved = engine.getComponent('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Status Reporting', () => {
    it('should report correct initial status', () => {
      const status = engine.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.running).toBe(false);
      expect(status.uptime).toBe(0);
      expect(status.components).toEqual([]);
      expect(status.version).toBeDefined();
      expect(status.environment).toBe('test');
    });

    it('should report correct status after initialization', async () => {
      await engine.initialize();
      const status = engine.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.running).toBe(false);
    });

    it('should report correct status after starting', async () => {
      await engine.initialize();
      await engine.start();
      const status = engine.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.running).toBe(true);
      expect(status.uptime).toBeGreaterThan(0);
    });
  });

  describe('Configuration Access', () => {
    it('should provide access to configuration manager', () => {
      const configManager = engine.getConfigManager();
      expect(configManager).toBeDefined();
      expect(configManager.getEnvironment()).toBe('test');
    });

    it('should provide access to event bus', () => {
      const eventBus = engine.getEventBus();
      expect(eventBus).toBeDefined();
      expect(typeof eventBus.publishEvent).toBe('function');
    });

    it('should provide access to logger', () => {
      const logger = engine.getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('should provide access to error handler', () => {
      const errorHandler = engine.getErrorHandler();
      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler.handleError).toBe('function');
    });
  });

  describe('Event Integration', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should emit initialization event', async () => {
      const eventBus = engine.getEventBus();
      let eventReceived = false;

      eventBus.subscribeEvent('engine.initialized', () => {
        eventReceived = true;
      });

      // 重新初始化以触发事件
      (MJOSEngine as any).instance = undefined;
      const newEngine = MJOSEngine.getInstance({
        environment: 'test',
        logging: { level: 'error', format: 'simple', outputs: ['console'] }
      });
      
      await newEngine.initialize();
      
      // 给事件处理一些时间
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(eventReceived).toBe(true);
    });

    it('should emit start event', async () => {
      const eventBus = engine.getEventBus();
      let eventReceived = false;

      eventBus.subscribeEvent('engine.started', () => {
        eventReceived = true;
      });

      await engine.start();
      
      // 给事件处理一些时间
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(eventReceived).toBe(true);
    });

    it('should emit stop event', async () => {
      const eventBus = engine.getEventBus();
      let eventReceived = false;

      eventBus.subscribeEvent('engine.stopped', () => {
        eventReceived = true;
      });

      await engine.start();
      await engine.stop();
      
      // 给事件处理一些时间
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(eventReceived).toBe(true);
    });
  });
});
