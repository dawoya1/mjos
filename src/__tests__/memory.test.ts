/**
 * Memory System Tests
 * 记忆系统测试
 */

import { MemorySystem } from '../memory/index';

describe('MemorySystem', () => {
  let memorySystem: MemorySystem;

  beforeEach(() => {
    memorySystem = new MemorySystem();
  });

  describe('store', () => {
    test('should store memory with default values', () => {
      const id = memorySystem.store('test content');
      
      expect(id).toBeDefined();
      expect(id).toMatch(/^mem_\d+_[a-z0-9]+$/);
      
      const memory = memorySystem.retrieve(id);
      expect(memory).toBeDefined();
      expect(memory!.content).toBe('test content');
      expect(memory!.tags).toEqual([]);
      expect(memory!.importance).toBe(0.5);
    });

    test('should store memory with custom values', () => {
      const id = memorySystem.store('test content', ['tag1', 'tag2'], 0.8);
      
      const memory = memorySystem.retrieve(id);
      expect(memory!.content).toBe('test content');
      expect(memory!.tags).toEqual(['tag1', 'tag2']);
      expect(memory!.importance).toBe(0.8);
    });

    test('should clamp importance values', () => {
      const id1 = memorySystem.store('content', [], -0.5);
      const id2 = memorySystem.store('content', [], 1.5);
      
      expect(memorySystem.retrieve(id1)!.importance).toBe(0);
      expect(memorySystem.retrieve(id2)!.importance).toBe(1);
    });
  });

  describe('retrieve', () => {
    test('should retrieve existing memory', () => {
      const id = memorySystem.store('test content');
      const memory = memorySystem.retrieve(id);
      
      expect(memory).toBeDefined();
      expect(memory!.id).toBe(id);
      expect(memory!.content).toBe('test content');
    });

    test('should return undefined for non-existent memory', () => {
      const memory = memorySystem.retrieve('non-existent-id');
      expect(memory).toBeUndefined();
    });
  });

  describe('query', () => {
    beforeEach(() => {
      memorySystem.store('content1', ['tag1', 'common'], 0.8);
      memorySystem.store('content2', ['tag2', 'common'], 0.6);
      memorySystem.store('content3', ['tag3'], 0.4);
    });

    test('should query by tags', () => {
      const results = memorySystem.query({ tags: ['common'] });
      
      expect(results).toHaveLength(2);
      expect(results[0].content).toBe('content1'); // Higher importance first
      expect(results[1].content).toBe('content2');
    });

    test('should query with limit', () => {
      const results = memorySystem.query({ tags: ['common'], limit: 1 });
      
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('content1');
    });

    test('should query by importance range', () => {
      const results = memorySystem.query({ 
        importance: { min: 0.5, max: 1.0 } 
      });
      
      expect(results).toHaveLength(2);
      expect(results.every(m => m.importance >= 0.5)).toBe(true);
    });

    test('should query by time range', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000);
      const future = new Date(now.getTime() + 1000);
      
      const results = memorySystem.query({
        timeRange: { start: past, end: future }
      });
      
      expect(results).toHaveLength(3); // All memories should be in range
    });

    test('should return all memories when no filters', () => {
      const results = memorySystem.query({});
      expect(results).toHaveLength(3);
    });
  });

  describe('delete', () => {
    test('should delete existing memory', () => {
      const id = memorySystem.store('test content', ['tag1']);
      
      expect(memorySystem.delete(id)).toBe(true);
      expect(memorySystem.retrieve(id)).toBeUndefined();
      
      // Should also remove from tag index
      const results = memorySystem.query({ tags: ['tag1'] });
      expect(results).toHaveLength(0);
    });

    test('should return false for non-existent memory', () => {
      expect(memorySystem.delete('non-existent')).toBe(false);
    });
  });

  describe('clear', () => {
    test('should clear all memories', () => {
      memorySystem.store('content1', ['tag1']);
      memorySystem.store('content2', ['tag2']);
      
      memorySystem.clear();
      
      const stats = memorySystem.getStats();
      expect(stats.totalMemories).toBe(0);
      expect(stats.totalTags).toBe(0);
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', () => {
      memorySystem.store('content1', ['tag1'], 0.8);
      memorySystem.store('content2', ['tag1', 'tag2'], 0.6);
      
      const stats = memorySystem.getStats();
      
      expect(stats.totalMemories).toBe(2);
      expect(stats.totalTags).toBe(2);
      expect(stats.averageImportance).toBe(0.7);
    });

    test('should handle empty memory system', () => {
      const stats = memorySystem.getStats();
      
      expect(stats.totalMemories).toBe(0);
      expect(stats.totalTags).toBe(0);
      expect(stats.averageImportance).toBe(0);
    });
  });
});
