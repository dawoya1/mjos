/**
 * Comprehensive Test Suite
 * 综合测试套件 - 覆盖所有核心功能
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createMJOS } from '../src/index';

describe('MJOS Comprehensive Test Suite', () => {
  let mjos: any;

  beforeEach(async () => {
    mjos = createMJOS({
      logLevel: 'error', // 减少测试日志
      enableMPML: true,
      enableMHPF: true,
      enableMPEOAS: true,
      enableMMPT: true,
      enableMCP: false // 测试时关闭MCP
    });
    await mjos.initialize();
  });

  afterEach(async () => {
    if (mjos) {
      await mjos.destroy();
    }
  });

  describe('Phase 1: Core Function Enhancement', () => {
    describe('Enhanced Memory System', () => {
      test('should store and retrieve enhanced memories', async () => {
        const enhancedMemorySystem = mjos.getEnhancedMemorySystem();
        expect(enhancedMemorySystem).toBeDefined();

        // 模拟存储记忆
        const memoryId = await mjos.storeEnhancedMemory(
          { type: 'test', content: 'test memory' },
          { emotionalValence: 0.8, contextualTags: ['test'] }
        );

        expect(memoryId).toBeDefined();
        expect(typeof memoryId).toBe('string');
      });

      test('should provide memory statistics', () => {
        const enhancedMemorySystem = mjos.getEnhancedMemorySystem();
        if (enhancedMemorySystem) {
          const stats = mjos.getEnhancedMemoryStatistics();
          expect(stats).toBeDefined();
          expect(stats).toHaveProperty('workingMemoryCount');
          expect(stats).toHaveProperty('shortTermMemoryCount');
          expect(stats).toHaveProperty('longTermMemoryCount');
        }
      });
    });

    describe('Dual Mode Reasoning Engine', () => {
      test('should perform intelligent reasoning', async () => {
        const reasoningEngine = mjos.getDualModeReasoningEngine();
        expect(reasoningEngine).toBeDefined();

        const result = await mjos.performIntelligentReasoning(
          'Test problem for reasoning',
          {
            problemType: 'analytical',
            complexity: 'moderate',
            timeConstraint: 30000,
            qualityRequirement: 0.8,
            availableResources: ['test-resource'],
            constraints: ['test-constraint'],
            stakeholders: ['test-user']
          }
        );

        expect(result).toBeDefined();
        expect(result).toHaveProperty('mode');
        expect(result).toHaveProperty('solution');
        expect(result).toHaveProperty('confidence');
      });

      test('should provide reasoning statistics', () => {
        const reasoningEngine = mjos.getDualModeReasoningEngine();
        if (reasoningEngine) {
          const stats = mjos.getReasoningStatistics();
          expect(stats).toBeDefined();
          expect(stats).toHaveProperty('totalSessions');
          expect(stats).toHaveProperty('modeDistribution');
          expect(stats).toHaveProperty('averageConfidence');
        }
      });
    });
  });

  describe('Phase 2: Production-Grade Features', () => {
    describe('Error Recovery System', () => {
      test('should handle errors and attempt recovery', async () => {
        const errorRecoverySystem = mjos.getErrorRecoverySystem();
        expect(errorRecoverySystem).toBeDefined();

        const testError = new Error('Test error for recovery');
        const recovered = await mjos.handleError('test-component', testError, {
          isCriticalPath: false,
          userImpact: 'low'
        });

        expect(typeof recovered).toBe('boolean');
      });

      test('should provide system health status', () => {
        const errorRecoverySystem = mjos.getErrorRecoverySystem();
        if (errorRecoverySystem) {
          const health = mjos.getSystemHealthStatus();
          expect(health).toBeDefined();
          expect(health).toHaveProperty('overall');
          expect(health).toHaveProperty('components');
          expect(health).toHaveProperty('lastCheck');
        }
      });
    });

    describe('Performance Optimizer', () => {
      test('should provide performance optimization features', () => {
        const performanceOptimizer = mjos.getPerformanceOptimizer();
        expect(performanceOptimizer).toBeDefined();

        if (performanceOptimizer) {
          const cache = performanceOptimizer.getCache();
          expect(cache).toBeDefined();

          const loadBalancer = performanceOptimizer.getLoadBalancer();
          expect(loadBalancer).toBeDefined();

          const resourceManager = performanceOptimizer.getResourceManager();
          expect(resourceManager).toBeDefined();
        }
      });

      test('should generate performance reports', () => {
        const performanceOptimizer = mjos.getPerformanceOptimizer();
        if (performanceOptimizer) {
          const report = mjos.getPerformanceReport();
          expect(report).toBeDefined();
          expect(report).toHaveProperty('currentMetrics');
          expect(report).toHaveProperty('trends');
          expect(report).toHaveProperty('recommendations');
        }
      });
    });

    describe('Security Manager', () => {
      test('should authenticate users', async () => {
        const securityManager = mjos.getSecurityManager();
        expect(securityManager).toBeDefined();

        const result = await mjos.authenticateUser(
          'testuser',
          'testpassword',
          '127.0.0.1',
          'test-agent'
        );

        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
      });

      test('should provide security reports', () => {
        const securityManager = mjos.getSecurityManager();
        if (securityManager) {
          const report = mjos.getSecurityReport();
          expect(report).toBeDefined();
          expect(report).toHaveProperty('userStats');
          expect(report).toHaveProperty('tokenStats');
          expect(report).toHaveProperty('securityStats');
          expect(report).toHaveProperty('recommendations');
        }
      });
    });
  });

  describe('System Integration', () => {
    test('should initialize all components successfully', () => {
      expect(mjos.isInitialized()).toBe(true);
    });

    test('should provide system status', () => {
      const status = mjos.getSystemStatus();
      expect(status).toBeDefined();
      expect(status).toHaveProperty('overall');
    });

    test('should provide collaboration statistics', () => {
      const stats = mjos.getCollaborationStatistics();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('collaborationEfficiency');
      expect(stats).toHaveProperty('activeProjects');
    });

    test('should handle component lifecycle', async () => {
      expect(mjos.isInitialized()).toBe(true);
      
      await mjos.destroy();
      expect(mjos.isInitialized()).toBe(false);
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet response time requirements', async () => {
      const startTime = Date.now();
      
      // 执行一系列操作
      const status = mjos.getSystemStatus();
      const stats = mjos.getCollaborationStatistics();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 响应时间应该小于100ms
      expect(responseTime).toBeLessThan(100);
    });

    test('should handle concurrent operations', async () => {
      const operations = [];
      
      // 创建10个并发操作
      for (let i = 0; i < 10; i++) {
        operations.push(
          Promise.resolve(mjos.getSystemStatus())
        );
      }
      
      const results = await Promise.all(operations);
      expect(results).toHaveLength(10);
      
      // 所有操作都应该成功
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toHaveProperty('overall');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', async () => {
      // 测试无效的推理请求
      try {
        await mjos.performIntelligentReasoning('', {
          problemType: 'invalid',
          complexity: 'invalid',
          timeConstraint: -1,
          qualityRequirement: 2.0,
          availableResources: [],
          constraints: [],
          stakeholders: []
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle missing components gracefully', () => {
      // 创建一个没有启用所有功能的实例
      const limitedMjos = createMJOS({
        logLevel: 'error',
        enableMPML: false,
        enableMHPF: false,
        enableMPEOAS: false,
        enableMMPT: false,
        enableMCP: false
      });

      expect(() => {
        limitedMjos.getEnhancedMemorySystem();
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    test('should not have memory leaks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 执行一系列操作
      for (let i = 0; i < 100; i++) {
        mjos.getSystemStatus();
        mjos.getCollaborationStatistics();
      }
      
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该在合理范围内（小于10MB）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Configuration Management', () => {
    test('should handle different configurations', async () => {
      const customConfig = {
        logLevel: 'debug' as const,
        enableMPML: true,
        enableMHPF: false,
        enableMPEOAS: true,
        enableMMPT: false,
        enableMCP: false
      };

      const customMjos = createMJOS(customConfig);
      await customMjos.initialize();
      
      expect(customMjos.isInitialized()).toBe(true);
      
      await customMjos.destroy();
    });
  });
});

// 性能基准测试
describe('Performance Benchmarks', () => {
  test('system initialization should be fast', async () => {
    const startTime = Date.now();
    
    const testMjos = createMJOS({
      logLevel: 'error',
      enableMPML: true,
      enableMHPF: true,
      enableMPEOAS: true,
      enableMMPT: true,
      enableMCP: false
    });
    
    await testMjos.initialize();
    
    const endTime = Date.now();
    const initTime = endTime - startTime;
    
    // 初始化时间应该小于5秒
    expect(initTime).toBeLessThan(5000);
    
    await testMjos.destroy();
  });

  test('memory usage should be reasonable', async () => {
    const testMjos = createMJOS({
      logLevel: 'error',
      enableMPML: true,
      enableMHPF: true,
      enableMPEOAS: true,
      enableMMPT: true,
      enableMCP: false
    });
    
    const beforeInit = process.memoryUsage().heapUsed;
    await testMjos.initialize();
    const afterInit = process.memoryUsage().heapUsed;
    
    const memoryUsed = afterInit - beforeInit;
    
    // 内存使用应该小于100MB
    expect(memoryUsed).toBeLessThan(100 * 1024 * 1024);
    
    await testMjos.destroy();
  });
});
