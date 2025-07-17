/**
 * Test Utilities
 * 测试工具函数
 */

import { MJOS } from '../src/index';

export class TestHelper {
  private mjos?: MJOS;

  async createTestMJOS(): Promise<MJOS> {
    this.mjos = new MJOS();
    await this.mjos.start();
    return this.mjos;
  }

  async cleanup(): Promise<void> {
    if (this.mjos) {
      await this.mjos.stop();
      this.mjos = undefined;
    }
  }

  generateTestData(type: 'memory' | 'task' | 'agent') {
    switch (type) {
      case 'memory':
        return {
          content: `Test memory ${Date.now()}`,
          tags: ['test', 'automated'],
          importance: Math.random()
        };
      case 'task':
        return {
          title: `Test task ${Date.now()}`,
          description: 'Automated test task',
          priority: 'medium' as const
        };
      case 'agent':
        return {
          name: `Test agent ${Date.now()}`,
          type: 'reactive' as const,
          capabilities: [
            { name: 'test', type: 'cognitive' as const, parameters: {}, constraints: {} }
          ],
          configuration: {
            maxConcurrentTasks: 1,
            memoryLimit: 100,
            collaborationMode: 'collaboration' as const,
            preferences: {}
          }
        };
      default:
        throw new Error(`Unknown test data type: ${type}`);
    }
  }
}

export const testHelper = new TestHelper();