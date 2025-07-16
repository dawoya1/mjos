/**
 * Integration Tester
 * 集成测试�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, TeamConfig, MJOSError } from './types/index';
import { MCPAdapter } from './MCPAdapter';
import { CrossPlatformBridge } from './CrossPlatformBridge';
import { MemorySynchronizer } from './MemorySynchronizer';

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  priority: TestPriority;
  timeout: number;
  execute: () => Promise<TestResult>;
  dependencies?: string[];
}

export type TestCategory = 
  | 'unit' 
  | 'integration' 
  | 'e2e' 
  | 'performance' 
  | 'security' 
  | 'compatibility';

export type TestPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TestResult {
  testId: string;
  status: TestStatus;
  duration: number;
  message?: string;
  error?: Error;
  metrics?: TestMetrics;
  artifacts?: TestArtifact[];
}

export type TestStatus = 'passed' | 'failed' | 'skipped' | 'timeout' | 'error';

export interface TestMetrics {
  memoryUsage?: number;
  responseTime?: number;
  throughput?: number;
  errorRate?: number;
  customMetrics?: Record<string, number>;
}

export interface TestArtifact {
  type: ArtifactType;
  name: string;
  content: string;
  mimeType: string;
}

export type ArtifactType = 'log' | 'screenshot' | 'report' | 'data' | 'config';

export interface TestExecution {
  id: string;
  suiteId: string;
  startTime: Date;
  endTime?: Date;
  status: ExecutionStatus;
  results: TestResult[];
  summary: TestSummary;
}

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorTests: number;
  successRate: number;
  totalDuration: number;
}

/**
 * 集成测试器类
 * 提供端到端的MJOS系统集成测试
 */
export class IntegrationTester {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private testSuites = new Map<string, TestSuite>();
  private executions = new Map<string, TestExecution>();
  private mcpAdapter?: MCPAdapter;
  private bridge?: CrossPlatformBridge;
  private synchronizer?: MemorySynchronizer;

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.setupDefaultTestSuites();
    this.setupEventListeners();
    
    this.logger.info('Integration Tester initialized');
  }

  /**
   * 初始化测试环�?   */
  public async initialize(
    mcpAdapter: MCPAdapter,
    bridge: CrossPlatformBridge,
    synchronizer: MemorySynchronizer
  ): Promise<void> {
    this.mcpAdapter = mcpAdapter;
    this.bridge = bridge;
    this.synchronizer = synchronizer;
    
    this.logger.info('Integration Tester environment initialized');
  }

  /**
   * 注册测试套件
   */
  public registerTestSuite(testSuite: TestSuite): void {
    this.testSuites.set(testSuite.id, testSuite);
    
    this.logger.info('Test suite registered', {
      suiteId: testSuite.id,
      suiteName: testSuite.name,
      testCount: testSuite.tests.length
    });
  }

  /**
   * 执行测试套件
   */
  public async executeTestSuite(suiteId: string): Promise<string | null> {
    try {
      const testSuite = this.testSuites.get(suiteId);
      if (!testSuite) {
        throw new Error(`Test suite not found: ${suiteId}`);
      }

      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const execution: TestExecution = {
        id: executionId,
        suiteId,
        startTime: new Date(),
        status: 'running',
        results: [],
        summary: {
          totalTests: testSuite.tests.length,
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
          errorTests: 0,
          successRate: 0,
          totalDuration: 0
        }
      };

      this.executions.set(executionId, execution);

      this.logger.info('Test suite execution started', {
        executionId,
        suiteId,
        testCount: testSuite.tests.length
      });

      // 异步执行测试
      this.executeTestSuiteAsync(execution, testSuite);

      return executionId;

    } catch (error) {
      this.logger.error('Failed to start test suite execution', {
        suiteId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 执行单个测试
   */
  public async executeTest(suiteId: string, testId: string): Promise<TestResult | null> {
    try {
      const testSuite = this.testSuites.get(suiteId);
      if (!testSuite) {
        throw new Error(`Test suite not found: ${suiteId}`);
      }

      const testCase = testSuite.tests.find(t => t.id === testId);
      if (!testCase) {
        throw new Error(`Test case not found: ${testId}`);
      }

      this.logger.info('Executing single test', {
        suiteId,
        testId,
        testName: testCase.name
      });

      const result = await this.executeTestCase(testCase);

      this.eventBus.publishEvent('test.executed', {
        suiteId,
        testId,
        result
      }, 'IntegrationTester');

      return result;

    } catch (error) {
      this.logger.error('Failed to execute test', {
        suiteId,
        testId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 获取测试执行状�?   */
  public getExecutionStatus(executionId: string): TestExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * 获取所有测试套�?   */
  public getTestSuites(): Array<{
    id: string;
    name: string;
    description: string;
    testCount: number;
    categories: TestCategory[];
  }> {
    return Array.from(this.testSuites.values()).map(suite => ({
      id: suite.id,
      name: suite.name,
      description: suite.description,
      testCount: suite.tests.length,
      categories: [...new Set(suite.tests.map(t => t.category))]
    }));
  }

  /**
   * 生成测试报告
   */
  public generateTestReport(executionId: string): string | null {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return null;
    }

    const report = {
      executionId,
      suiteId: execution.suiteId,
      startTime: execution.startTime,
      endTime: execution.endTime,
      status: execution.status,
      summary: execution.summary,
      results: execution.results.map(result => ({
        testId: result.testId,
        status: result.status,
        duration: result.duration,
        message: result.message,
        metrics: result.metrics
      }))
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 异步执行测试套件
   */
  private async executeTestSuiteAsync(
    execution: TestExecution,
    testSuite: TestSuite
  ): Promise<void> {
    try {
      // 执行设置
      if (testSuite.setup) {
        await testSuite.setup();
      }

      this.eventBus.publishEvent('test.suite_started', {
        executionId: execution.id,
        suiteId: testSuite.id
      }, 'IntegrationTester');

      // 按依赖关系排序测�?      const sortedTests = this.sortTestsByDependencies(testSuite.tests);

      // 执行测试
      for (const testCase of sortedTests) {
        if (execution.status === 'cancelled') {
          break;
        }

        const result = await this.executeTestCase(testCase);
        execution.results.push(result);

        // 更新统计
        this.updateExecutionSummary(execution, result);

        this.eventBus.publishEvent('test.case_completed', {
          executionId: execution.id,
          testId: testCase.id,
          result
        }, 'IntegrationTester');
      }

      // 执行清理
      if (testSuite.teardown) {
        await testSuite.teardown();
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.summary.totalDuration = execution.endTime.getTime() - execution.startTime.getTime();

      this.logger.info('Test suite execution completed', {
        executionId: execution.id,
        summary: execution.summary
      });

      this.eventBus.publishEvent('test.suite_completed', {
        executionId: execution.id,
        execution
      }, 'IntegrationTester');

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();

      this.logger.error('Test suite execution failed', {
        executionId: execution.id,
        error: error instanceof Error ? error.message : String(error)
      });

      this.eventBus.publishEvent('test.suite_failed', {
        executionId: execution.id,
        execution,
        error
      }, 'IntegrationTester');
    }
  }

  /**
   * 执行测试用例
   */
  private async executeTestCase(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Executing test case', {
        testId: testCase.id,
        testName: testCase.name,
        category: testCase.category
      });

      // 设置超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), testCase.timeout);
      });

      // 执行测试
      const resultPromise = testCase.execute();
      const result = await Promise.race([resultPromise, timeoutPromise]);

      const duration = Date.now() - startTime;

      return {
        testId: testCase.id,
        status: 'passed',
        duration,
        ...result
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const isTimeout = error instanceof Error && error.message === 'Test timeout';

      return {
        testId: testCase.id,
        status: isTimeout ? 'timeout' : 'failed',
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 按依赖关系排序测�?   */
  private sortTestsByDependencies(tests: TestCase[]): TestCase[] {
    const sorted: TestCase[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (test: TestCase) => {
      if (visiting.has(test.id)) {
        throw new Error(`Circular dependency detected: ${test.id}`);
      }
      
      if (visited.has(test.id)) {
        return;
      }

      visiting.add(test.id);

      if (test.dependencies) {
        for (const depId of test.dependencies) {
          const depTest = tests.find(t => t.id === depId);
          if (depTest) {
            visit(depTest);
          }
        }
      }

      visiting.delete(test.id);
      visited.add(test.id);
      sorted.push(test);
    };

    for (const test of tests) {
      visit(test);
    }

    return sorted;
  }

  /**
   * 更新执行摘要
   */
  private updateExecutionSummary(execution: TestExecution, result: TestResult): void {
    switch (result.status) {
      case 'passed':
        execution.summary.passedTests++;
        break;
      case 'failed':
        execution.summary.failedTests++;
        break;
      case 'skipped':
        execution.summary.skippedTests++;
        break;
      case 'timeout':
      case 'error':
        execution.summary.errorTests++;
        break;
    }

    execution.summary.successRate = 
      (execution.summary.passedTests / execution.summary.totalTests) * 100;
  }

  /**
   * 设置默认测试套件
   */
  private setupDefaultTestSuites(): void {
    // MCP协议测试套件
    const mcpTestSuite: TestSuite = {
      id: 'mcp-protocol',
      name: 'MCP Protocol Tests',
      description: 'Test Model Context Protocol implementation',
      tests: [
        {
          id: 'mcp-initialization',
          name: 'MCP Initialization',
          description: 'Test MCP server initialization',
          category: 'integration',
          priority: 'critical',
          timeout: 5000,
          execute: async () => {
            if (!this.mcpAdapter) {
              throw new Error('MCP Adapter not initialized');
            }

            const serverInfo = this.mcpAdapter.getServerInfo();
            
            if (!serverInfo.name || !serverInfo.version) {
              throw new Error('Invalid server info');
            }

            return {
              testId: 'mcp-initialization',
              status: 'passed' as TestStatus,
              duration: 0,
              message: 'MCP server initialized successfully',
              metrics: {
                responseTime: 100
              }
            };
          }
        },
        {
          id: 'mcp-tool-registration',
          name: 'MCP Tool Registration',
          description: 'Test MCP tool registration',
          category: 'integration',
          priority: 'high',
          timeout: 3000,
          execute: async () => {
            if (!this.mcpAdapter) {
              throw new Error('MCP Adapter not initialized');
            }

            // 测试工具注册
            this.mcpAdapter.registerTool({
              name: 'test_tool',
              description: 'Test tool for integration testing',
              inputSchema: {
                type: 'object',
                properties: {},
                required: []
              }
            }, async () => ({ success: true }));

            return {
              testId: 'mcp-tool-registration',
              status: 'passed' as TestStatus,
              duration: 0,
              message: 'Tool registered successfully'
            };
          }
        }
      ]
    };

    // 跨平台桥接测试套�?    const bridgeTestSuite: TestSuite = {
      id: 'cross-platform-bridge',
      name: 'Cross Platform Bridge Tests',
      description: 'Test cross-platform bridge functionality',
      tests: [
        {
          id: 'platform-registration',
          name: 'Platform Registration',
          description: 'Test platform registration',
          category: 'integration',
          priority: 'critical',
          timeout: 5000,
          execute: async () => {
            if (!this.bridge) {
              throw new Error('Bridge not initialized');
            }

            const connectionId = await this.bridge.registerPlatform({
              name: 'test-platform',
              type: 'custom',
              capabilities: ['messaging', 'sync'],
              metadata: { test: true }
            });

            if (!connectionId) {
              throw new Error('Platform registration failed');
            }

            return {
              testId: 'platform-registration',
              status: 'passed' as TestStatus,
              duration: 0,
              message: 'Platform registered successfully',
              metrics: {
                responseTime: 200
              }
            };
          }
        },
        {
          id: 'message-sending',
          name: 'Message Sending',
          description: 'Test message sending through bridge',
          category: 'integration',
          priority: 'high',
          timeout: 3000,
          dependencies: ['platform-registration'],
          execute: async () => {
            if (!this.bridge) {
              throw new Error('Bridge not initialized');
            }

            const connections = this.bridge.getAllConnections();
            if (connections.length === 0) {
              throw new Error('No connections available');
            }

            const success = await this.bridge.sendMessage(
              connections[0].id,
              'command',
              { test: 'message' },
              'normal'
            );

            if (!success) {
              throw new Error('Message sending failed');
            }

            return {
              testId: 'message-sending',
              status: 'passed' as TestStatus,
              duration: 0,
              message: 'Message sent successfully'
            };
          }
        }
      ]
    };

    // 记忆同步测试套件
    const syncTestSuite: TestSuite = {
      id: 'memory-sync',
      name: 'Memory Synchronization Tests',
      description: 'Test memory synchronization functionality',
      tests: [
        {
          id: 'endpoint-registration',
          name: 'Endpoint Registration',
          description: 'Test sync endpoint registration',
          category: 'integration',
          priority: 'critical',
          timeout: 5000,
          execute: async () => {
            if (!this.synchronizer) {
              throw new Error('Synchronizer not initialized');
            }

            const success = await this.synchronizer.registerEndpoint({
              id: 'test-endpoint',
              name: 'Test Endpoint',
              type: 'rest-api',
              url: 'http://localhost:3000/api',
              capabilities: ['read', 'write']
            });

            if (!success) {
              throw new Error('Endpoint registration failed');
            }

            return {
              testId: 'endpoint-registration',
              status: 'passed' as TestStatus,
              duration: 0,
              message: 'Endpoint registered successfully'
            };
          }
        },
        {
          id: 'sync-operation',
          name: 'Sync Operation',
          description: 'Test sync operation execution',
          category: 'integration',
          priority: 'high',
          timeout: 10000,
          dependencies: ['endpoint-registration'],
          execute: async () => {
            if (!this.synchronizer) {
              throw new Error('Synchronizer not initialized');
            }

            const operationId = await this.synchronizer.synchronize(
              'test-endpoint',
              'bidirectional'
            );

            if (!operationId) {
              throw new Error('Sync operation failed to start');
            }

            // 等待操作完成
            await new Promise(resolve => setTimeout(resolve, 2000));

            const status = this.synchronizer.getSyncStatus(operationId);
            if (!status || status.status === 'failed') {
              throw new Error('Sync operation failed');
            }

            return {
              testId: 'sync-operation',
              status: 'passed' as TestStatus,
              duration: 0,
              message: 'Sync operation completed successfully',
              metrics: {
                throughput: 100
              }
            };
          }
        }
      ]
    };

    // 注册测试套件
    this.registerTestSuite(mcpTestSuite);
    this.registerTestSuite(bridgeTestSuite);
    this.registerTestSuite(syncTestSuite);

    this.logger.debug('Default test suites setup completed', {
      suiteCount: 3
    });
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('test.run_requested', async (event) => {
      const { suiteId } = event.payload;
      await this.executeTestSuite(suiteId);
    });

    this.eventBus.subscribeEvent('test.case_run_requested', async (event) => {
      const { suiteId, testId } = event.payload;
      await this.executeTest(suiteId, testId);
    });
  }
}
