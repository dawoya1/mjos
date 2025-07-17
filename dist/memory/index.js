"use strict";
/**
 * MJOS Memory System - Multi-layered Memory Architecture
 * 魔剑工作室操作系统记忆系统 - 多层次记忆架构
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySystem = exports.MemoryType = void 0;
const events_1 = require("events");
const index_1 = require("../core/index");
// Memory Types
var MemoryType;
(function (MemoryType) {
    MemoryType["SHORT_TERM"] = "short_term";
    MemoryType["LONG_TERM"] = "long_term";
    MemoryType["EPISODIC"] = "episodic";
    MemoryType["PROCEDURAL"] = "procedural"; // 程序记忆 - 技能和过程知识
})(MemoryType || (exports.MemoryType = MemoryType = {}));
// Abstract base class for memory layers
class MemoryLayer extends events_1.EventEmitter {
    constructor(capacity, name) {
        super();
        this.memories = new Map();
        this.capacity = capacity;
        this.logger = new index_1.Logger(`MemoryLayer:${name}`);
    }
    size() {
        return this.memories.size;
    }
    has(id) {
        return this.memories.has(id);
    }
    clear() {
        this.memories.clear();
        this.emit('cleared');
    }
    getAll() {
        return Array.from(this.memories.values());
    }
}
// Short-term memory - LRU cache with fast access
class ShortTermMemory extends MemoryLayer {
    constructor(capacity = 100) {
        super(capacity, 'ShortTerm');
        this.accessOrder = [];
    }
    store(item) {
        // If at capacity, evict least recently used
        if (this.memories.size >= this.capacity && !this.memories.has(item.id)) {
            this.evict();
        }
        this.memories.set(item.id, item);
        this.updateAccessOrder(item.id);
        this.emit('stored', item);
        return true;
    }
    retrieve(id) {
        const item = this.memories.get(id);
        if (item) {
            item.lastAccessed = new Date();
            item.accessCount++;
            this.updateAccessOrder(id);
            this.emit('accessed', item);
        }
        return item;
    }
    evict() {
        if (this.accessOrder.length > 0) {
            const lruId = this.accessOrder.shift();
            const evicted = this.memories.get(lruId);
            this.memories.delete(lruId);
            if (evicted) {
                this.emit('evicted', evicted);
                this.logger.debug(`Evicted from short-term memory: ${lruId}`);
            }
        }
    }
    delete(id) {
        const item = this.memories.get(id);
        if (item) {
            this.memories.delete(id);
            const index = this.accessOrder.indexOf(id);
            if (index > -1) {
                this.accessOrder.splice(index, 1);
            }
            this.emit('deleted', item);
            return true;
        }
        return false;
    }
    updateAccessOrder(id) {
        // Remove from current position
        const index = this.accessOrder.indexOf(id);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        // Add to end (most recently used)
        this.accessOrder.push(id);
    }
}
// Long-term memory - Persistent storage with importance-based retention
class LongTermMemory extends MemoryLayer {
    constructor(capacity = 10000) {
        super(capacity, 'LongTerm');
        this.importanceThreshold = 0.3;
    }
    store(item) {
        // Only store items above importance threshold
        if (item.importance < this.importanceThreshold) {
            return false;
        }
        // If at capacity, evict least important items
        if (this.memories.size >= this.capacity && !this.memories.has(item.id)) {
            this.evict();
        }
        this.memories.set(item.id, item);
        this.emit('stored', item);
        return true;
    }
    retrieve(id) {
        const item = this.memories.get(id);
        if (item) {
            item.lastAccessed = new Date();
            item.accessCount++;
            this.emit('accessed', item);
        }
        return item;
    }
    evict() {
        // Find least important item
        let leastImportant;
        let leastImportantId;
        for (const [id, item] of this.memories) {
            if (!leastImportant || item.importance < leastImportant.importance) {
                leastImportant = item;
                leastImportantId = id;
            }
        }
        if (leastImportantId) {
            this.memories.delete(leastImportantId);
            this.emit('evicted', leastImportant);
            this.logger.debug(`Evicted from long-term memory: ${leastImportantId}`);
        }
    }
    delete(id) {
        const item = this.memories.get(id);
        if (item) {
            this.memories.delete(id);
            this.emit('deleted', item);
            return true;
        }
        return false;
    }
    setImportanceThreshold(threshold) {
        this.importanceThreshold = Math.max(0, Math.min(1, threshold));
    }
}
// Main Memory System coordinating all layers
class MemorySystem extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.tagIndex = new Map();
        this.typeIndex = new Map();
        this.options = {
            shortTermCapacity: options.shortTermCapacity || 100,
            longTermCapacity: options.longTermCapacity || 10000,
            decayRate: options.decayRate || 0.1,
            consolidationThreshold: options.consolidationThreshold || 0.7,
            enableSemantic: options.enableSemantic || false,
            persistencePath: options.persistencePath || 'memory.json',
            ...options
        };
        this.logger = new index_1.Logger('MemorySystem');
        this.shortTerm = new ShortTermMemory(this.options.shortTermCapacity);
        this.longTerm = new LongTermMemory(this.options.longTermCapacity);
        this.setupEventHandlers();
        this.startConsolidationProcess();
    }
    setupEventHandlers() {
        // Handle short-term memory evictions - promote to long-term if important
        this.shortTerm.on('evicted', (item) => {
            if (item.importance >= this.options.consolidationThreshold) {
                this.longTerm.store(item);
                this.logger.debug(`Consolidated to long-term: ${item.id}`);
            }
        });
        // Forward events
        this.shortTerm.on('stored', (item) => this.emit('stored', item));
        this.longTerm.on('stored', (item) => this.emit('consolidated', item));
    }
    startConsolidationProcess() {
        // Periodic consolidation of important short-term memories
        this.consolidationTimer = setInterval(() => {
            this.consolidateMemories();
        }, 60000); // Every minute
    }
    consolidateMemories() {
        const shortTermMemories = this.shortTerm.getAll();
        for (const memory of shortTermMemories) {
            // Consolidate frequently accessed or important memories
            if (memory.accessCount > 5 || memory.importance >= this.options.consolidationThreshold) {
                if (this.longTerm.store(memory)) {
                    this.logger.debug(`Auto-consolidated: ${memory.id}`);
                }
            }
        }
    }
    store(content, tags = [], importance = 0.5, type = MemoryType.SHORT_TERM) {
        const id = this.generateId();
        const memory = {
            id,
            content,
            timestamp: new Date(),
            lastAccessed: new Date(),
            accessCount: 0,
            tags,
            importance: Math.max(0, Math.min(1, importance)),
            type,
            decay: 1.0
        };
        // Store in appropriate layer
        let stored = false;
        if (type === MemoryType.LONG_TERM || importance >= this.options.consolidationThreshold) {
            stored = this.longTerm.store(memory);
        }
        if (!stored) {
            this.shortTerm.store(memory);
        }
        // Update indices
        this.updateIndices(memory);
        this.logger.debug(`Memory stored: ${id} (${type}, importance: ${importance})`);
        return id;
    }
    retrieve(id) {
        // Try short-term first (faster)
        let item = this.shortTerm.retrieve(id);
        if (!item) {
            // Try long-term
            item = this.longTerm.retrieve(id);
        }
        if (item) {
            this.emit('retrieved', item);
        }
        return item;
    }
    query(query) {
        let results = [];
        // Collect from both layers
        const shortTermResults = this.queryLayer(this.shortTerm, query);
        const longTermResults = this.queryLayer(this.longTerm, query);
        // Combine and deduplicate
        const allResults = [...shortTermResults, ...longTermResults];
        const uniqueResults = new Map();
        allResults.forEach(item => {
            if (!uniqueResults.has(item.id)) {
                uniqueResults.set(item.id, item);
            }
        });
        results = Array.from(uniqueResults.values());
        // Apply filters
        results = this.applyFilters(results, query);
        // Sort results
        results = this.sortResults(results, query.sortBy || 'importance');
        // Apply limit
        if (query.limit && query.limit > 0) {
            results = results.slice(0, query.limit);
        }
        return results;
    }
    queryLayer(layer, query) {
        let results = layer.getAll();
        // Filter by type
        if (query.types && query.types.length > 0) {
            results = results.filter(item => query.types.includes(item.type));
        }
        // Filter by tags
        if (query.tags && query.tags.length > 0) {
            results = results.filter(item => query.tags.some(tag => item.tags.includes(tag)));
        }
        return results;
    }
    applyFilters(results, query) {
        // Time range filter
        if (query.timeRange) {
            results = results.filter(memory => memory.timestamp >= query.timeRange.start &&
                memory.timestamp <= query.timeRange.end);
        }
        // Importance filter
        if (query.importance) {
            results = results.filter(memory => memory.importance >= query.importance.min &&
                memory.importance <= query.importance.max);
        }
        // Decay filter
        if (!query.includeDecayed) {
            results = results.filter(memory => !memory.decay || memory.decay > 0.1);
        }
        return results;
    }
    sortResults(results, sortBy) {
        return results.sort((a, b) => {
            switch (sortBy) {
                case 'timestamp':
                    return b.timestamp.getTime() - a.timestamp.getTime();
                case 'importance':
                    return b.importance - a.importance;
                case 'access_count':
                    return b.accessCount - a.accessCount;
                case 'relevance':
                    // Could implement semantic relevance here
                    return b.importance - a.importance;
                default:
                    return b.importance - a.importance;
            }
        });
    }
    delete(id) {
        let deleted = false;
        // Try to delete from both layers
        const shortTermItem = this.shortTerm.retrieve(id);
        const longTermItem = this.longTerm.retrieve(id);
        if (shortTermItem) {
            this.shortTerm.delete(id);
            this.removeFromIndices(shortTermItem);
            deleted = true;
        }
        if (longTermItem) {
            this.longTerm.delete(id);
            this.removeFromIndices(longTermItem);
            deleted = true;
        }
        if (deleted) {
            this.emit('deleted', id);
            this.logger.debug(`Memory deleted: ${id}`);
        }
        return deleted;
    }
    clear() {
        this.shortTerm.clear();
        this.longTerm.clear();
        this.tagIndex.clear();
        this.typeIndex.clear();
        this.emit('cleared');
        this.logger.info('All memories cleared');
    }
    // Memory association methods
    associate(id1, id2) {
        const memory1 = this.retrieve(id1);
        const memory2 = this.retrieve(id2);
        if (!memory1 || !memory2) {
            return false;
        }
        if (!memory1.associations)
            memory1.associations = [];
        if (!memory2.associations)
            memory2.associations = [];
        if (!memory1.associations.includes(id2)) {
            memory1.associations.push(id2);
        }
        if (!memory2.associations.includes(id1)) {
            memory2.associations.push(id1);
        }
        this.logger.debug(`Associated memories: ${id1} <-> ${id2}`);
        return true;
    }
    getAssociations(id) {
        const memory = this.retrieve(id);
        if (!memory || !memory.associations) {
            return [];
        }
        return memory.associations
            .map(assocId => this.retrieve(assocId))
            .filter(item => item !== undefined);
    }
    // Memory decay simulation
    applyDecay() {
        const allMemories = [...this.shortTerm.getAll(), ...this.longTerm.getAll()];
        allMemories.forEach(memory => {
            if (memory.decay && memory.decay > 0) {
                // Decay based on time since last access and importance
                const timeSinceAccess = Date.now() - memory.lastAccessed.getTime();
                const decayFactor = Math.exp(-this.options.decayRate * timeSinceAccess / (1000 * 60 * 60 * 24)); // Daily decay
                memory.decay = Math.max(0, memory.decay * decayFactor * (0.5 + memory.importance * 0.5));
                // Remove heavily decayed memories
                if (memory.decay < 0.01) {
                    this.delete(memory.id);
                }
            }
        });
    }
    getStats() {
        const shortTermMemories = this.shortTerm.getAll();
        const longTermMemories = this.longTerm.getAll();
        const allMemories = [...shortTermMemories, ...longTermMemories];
        const totalMemories = allMemories.length;
        const totalTags = this.tagIndex.size;
        const averageImportance = totalMemories > 0
            ? allMemories.reduce((sum, m) => sum + m.importance, 0) / totalMemories
            : 0;
        // Count by memory type
        const memoryTypes = {
            [MemoryType.SHORT_TERM]: 0,
            [MemoryType.LONG_TERM]: 0,
            [MemoryType.EPISODIC]: 0,
            [MemoryType.PROCEDURAL]: 0
        };
        allMemories.forEach(memory => {
            memoryTypes[memory.type]++;
        });
        return {
            totalMemories,
            shortTermCount: shortTermMemories.length,
            longTermCount: longTermMemories.length,
            totalTags,
            averageImportance,
            memoryTypes
        };
    }
    updateIndices(memory) {
        // Update tag index
        memory.tags.forEach(tag => {
            if (!this.tagIndex.has(tag)) {
                this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag).add(memory.id);
        });
        // Update type index
        if (!this.typeIndex.has(memory.type)) {
            this.typeIndex.set(memory.type, new Set());
        }
        this.typeIndex.get(memory.type).add(memory.id);
    }
    removeFromIndices(memory) {
        // Remove from tag index
        memory.tags.forEach(tag => {
            const taggedIds = this.tagIndex.get(tag);
            if (taggedIds) {
                taggedIds.delete(memory.id);
                if (taggedIds.size === 0) {
                    this.tagIndex.delete(tag);
                }
            }
        });
        // Remove from type index
        const typeIds = this.typeIndex.get(memory.type);
        if (typeIds) {
            typeIds.delete(memory.id);
            if (typeIds.size === 0) {
                this.typeIndex.delete(memory.type);
            }
        }
    }
    generateId() {
        return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Cleanup method
    destroy() {
        if (this.consolidationTimer) {
            clearInterval(this.consolidationTimer);
        }
        this.clear();
        this.removeAllListeners();
        this.logger.info('Memory system destroyed');
    }
}
exports.MemorySystem = MemorySystem;
//# sourceMappingURL=index.js.map