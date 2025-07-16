/**
 * MJOS Memory System
 * 魔剑工作室操作系统记忆系统
 */

export interface MemoryItem {
  id: string;
  content: any;
  timestamp: Date;
  tags: string[];
  importance: number; // 0-1
}

export interface MemoryQuery {
  tags?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  importance?: {
    min: number;
    max: number;
  };
  limit?: number;
}

export class MemorySystem {
  private memories: Map<string, MemoryItem> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  constructor() {}

  store(content: any, tags: string[] = [], importance: number = 0.5): string {
    const id = this.generateId();
    const memory: MemoryItem = {
      id,
      content,
      timestamp: new Date(),
      tags,
      importance: Math.max(0, Math.min(1, importance))
    };

    this.memories.set(id, memory);
    
    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(id);
    });

    return id;
  }

  retrieve(id: string): MemoryItem | undefined {
    return this.memories.get(id);
  }

  query(query: MemoryQuery): MemoryItem[] {
    let results: MemoryItem[] = [];

    if (query.tags && query.tags.length > 0) {
      // Find memories with matching tags
      const candidateIds = new Set<string>();
      query.tags.forEach(tag => {
        const taggedIds = this.tagIndex.get(tag);
        if (taggedIds) {
          taggedIds.forEach(id => candidateIds.add(id));
        }
      });

      results = Array.from(candidateIds)
        .map(id => this.memories.get(id))
        .filter(memory => memory !== undefined) as MemoryItem[];
    } else {
      // Get all memories
      results = Array.from(this.memories.values());
    }

    // Apply filters
    if (query.timeRange) {
      results = results.filter(memory => 
        memory.timestamp >= query.timeRange!.start &&
        memory.timestamp <= query.timeRange!.end
      );
    }

    if (query.importance) {
      results = results.filter(memory =>
        memory.importance >= query.importance!.min &&
        memory.importance <= query.importance!.max
      );
    }

    // Sort by importance and timestamp
    results.sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Apply limit
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  delete(id: string): boolean {
    const memory = this.memories.get(id);
    if (!memory) {
      return false;
    }

    // Remove from tag index
    memory.tags.forEach(tag => {
      const taggedIds = this.tagIndex.get(tag);
      if (taggedIds) {
        taggedIds.delete(id);
        if (taggedIds.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    return this.memories.delete(id);
  }

  clear(): void {
    this.memories.clear();
    this.tagIndex.clear();
  }

  getStats(): {
    totalMemories: number;
    totalTags: number;
    averageImportance: number;
  } {
    const memories = Array.from(this.memories.values());
    const totalMemories = memories.length;
    const totalTags = this.tagIndex.size;
    const averageImportance = totalMemories > 0 
      ? memories.reduce((sum, m) => sum + m.importance, 0) / totalMemories
      : 0;

    return {
      totalMemories,
      totalTags,
      averageImportance
    };
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
