"use strict";
/**
 * MJOS Knowledge Management System
 * 魔剑工作室操作系统知识管理系统
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeGraph = void 0;
const events_1 = require("events");
const index_1 = require("../core/index");
class KnowledgeGraph extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.knowledge = new Map();
        this.typeIndex = new Map();
        this.tagIndex = new Map();
        this.domainIndex = new Map();
        this.relationshipIndex = new Map();
        this.options = {
            maxNodes: options.maxNodes || 10000,
            enableSemanticSearch: options.enableSemanticSearch || false,
            persistencePath: options.persistencePath || 'knowledge.json',
            autoSave: options.autoSave || true,
            compressionEnabled: options.compressionEnabled || false,
            ...options
        };
        this.logger = new index_1.Logger('KnowledgeGraph');
        this.initializeIndices();
    }
    initializeIndices() {
        // Initialize type index
        const knowledgeTypes = ['concept', 'fact', 'rule', 'pattern', 'procedure', 'experience'];
        knowledgeTypes.forEach(type => {
            this.typeIndex.set(type, new Set());
        });
    }
    // Add knowledge item
    add(item) {
        const id = this.generateId();
        const knowledgeItem = {
            ...item,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
            relationships: item.relationships || []
        };
        // Check capacity
        if (this.knowledge.size >= this.options.maxNodes) {
            this.evictLeastImportant();
        }
        this.knowledge.set(id, knowledgeItem);
        this.updateIndices(knowledgeItem);
        this.emit('knowledge-added', knowledgeItem);
        this.logger.debug(`Knowledge added: ${id} (${item.type})`);
        if (this.options.autoSave) {
            this.save();
        }
        return id;
    }
    // Update knowledge item
    update(id, updates) {
        const item = this.knowledge.get(id);
        if (!item) {
            return false;
        }
        // Remove from old indices
        this.removeFromIndices(item);
        // Apply updates
        const updatedItem = {
            ...item,
            ...updates,
            id, // Preserve ID
            updatedAt: new Date()
        };
        this.knowledge.set(id, updatedItem);
        this.updateIndices(updatedItem);
        this.emit('knowledge-updated', updatedItem);
        this.logger.debug(`Knowledge updated: ${id}`);
        if (this.options.autoSave) {
            this.save();
        }
        return true;
    }
    // Get knowledge item
    get(id) {
        return this.knowledge.get(id);
    }
    // Delete knowledge item
    delete(id) {
        const item = this.knowledge.get(id);
        if (!item) {
            return false;
        }
        // Remove relationships pointing to this item
        this.removeRelationshipsTo(id);
        // Remove from indices
        this.removeFromIndices(item);
        // Delete the item
        this.knowledge.delete(id);
        this.emit('knowledge-deleted', id);
        this.logger.debug(`Knowledge deleted: ${id}`);
        if (this.options.autoSave) {
            this.save();
        }
        return true;
    }
    // Query knowledge
    query(query) {
        let candidates = new Set();
        // Filter by type
        if (query.type && query.type.length > 0) {
            const typeMatches = new Set();
            query.type.forEach(type => {
                const typeIds = this.typeIndex.get(type);
                if (typeIds) {
                    typeIds.forEach(id => typeMatches.add(id));
                }
            });
            candidates = typeMatches;
        }
        else {
            // Start with all items
            candidates = new Set(this.knowledge.keys());
        }
        // Filter by tags
        if (query.tags && query.tags.length > 0) {
            const tagMatches = new Set();
            query.tags.forEach(tag => {
                const tagIds = this.tagIndex.get(tag);
                if (tagIds) {
                    tagIds.forEach(id => {
                        if (candidates.has(id)) {
                            tagMatches.add(id);
                        }
                    });
                }
            });
            candidates = tagMatches;
        }
        // Filter by domain
        if (query.domain) {
            const domainIds = this.domainIndex.get(query.domain);
            if (domainIds) {
                candidates = new Set([...candidates].filter(id => domainIds.has(id)));
            }
            else {
                candidates = new Set();
            }
        }
        // Convert to items and apply additional filters
        let results = Array.from(candidates)
            .map(id => this.knowledge.get(id))
            .filter(item => item !== undefined);
        // Filter by confidence
        if (query.minConfidence !== undefined) {
            results = results.filter(item => item.metadata.confidence >= query.minConfidence);
        }
        // Filter by importance
        if (query.minImportance !== undefined) {
            results = results.filter(item => item.metadata.importance >= query.minImportance);
        }
        // Content search (simple text matching)
        if (query.content) {
            const searchTerm = query.content.toLowerCase();
            results = results.filter(item => JSON.stringify(item.content).toLowerCase().includes(searchTerm) ||
                item.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        }
        // Sort by importance and confidence
        results.sort((a, b) => {
            const scoreA = a.metadata.importance * a.metadata.confidence;
            const scoreB = b.metadata.importance * b.metadata.confidence;
            return scoreB - scoreA;
        });
        // Apply limit
        if (query.limit && query.limit > 0) {
            results = results.slice(0, query.limit);
        }
        // Include related items if requested
        if (query.includeRelated) {
            const relatedItems = new Set();
            results.forEach(item => {
                item.relationships.forEach(rel => {
                    const relatedItem = this.knowledge.get(rel.targetId);
                    if (relatedItem) {
                        relatedItems.add(relatedItem);
                    }
                });
            });
            results = [...results, ...Array.from(relatedItems)];
        }
        return results;
    }
    // Add relationship between knowledge items
    addRelationship(fromId, toId, type, strength = 1.0) {
        const fromItem = this.knowledge.get(fromId);
        const toItem = this.knowledge.get(toId);
        if (!fromItem || !toItem) {
            return false;
        }
        // Check if relationship already exists
        const existingRel = fromItem.relationships.find(rel => rel.targetId === toId && rel.type === type);
        if (existingRel) {
            // Update strength
            existingRel.strength = Math.max(0, Math.min(1, strength));
        }
        else {
            // Add new relationship
            const relationship = {
                type,
                targetId: toId,
                strength: Math.max(0, Math.min(1, strength))
            };
            fromItem.relationships.push(relationship);
        }
        // Update relationship index
        if (!this.relationshipIndex.has(fromId)) {
            this.relationshipIndex.set(fromId, new Set());
        }
        this.relationshipIndex.get(fromId).add(toId);
        fromItem.updatedAt = new Date();
        this.emit('relationship-added', { fromId, toId, type, strength });
        this.logger.debug(`Relationship added: ${fromId} -> ${toId} (${type})`);
        if (this.options.autoSave) {
            this.save();
        }
        return true;
    }
    // Get related knowledge items
    getRelated(id, maxDepth = 1) {
        const visited = new Set();
        const results = [];
        const traverse = (currentId, depth) => {
            if (depth > maxDepth || visited.has(currentId)) {
                return;
            }
            visited.add(currentId);
            const item = this.knowledge.get(currentId);
            if (!item) {
                return;
            }
            if (depth > 0) {
                results.push(item);
            }
            item.relationships.forEach(rel => {
                traverse(rel.targetId, depth + 1);
            });
        };
        traverse(id, 0);
        return results;
    }
    updateIndices(item) {
        // Update type index
        if (!this.typeIndex.has(item.type)) {
            this.typeIndex.set(item.type, new Set());
        }
        this.typeIndex.get(item.type).add(item.id);
        // Update tag index
        item.metadata.tags.forEach(tag => {
            if (!this.tagIndex.has(tag)) {
                this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag).add(item.id);
        });
        // Update domain index
        if (!this.domainIndex.has(item.metadata.domain)) {
            this.domainIndex.set(item.metadata.domain, new Set());
        }
        this.domainIndex.get(item.metadata.domain).add(item.id);
    }
    removeFromIndices(item) {
        // Remove from type index
        const typeIds = this.typeIndex.get(item.type);
        if (typeIds) {
            typeIds.delete(item.id);
        }
        // Remove from tag index
        item.metadata.tags.forEach(tag => {
            const tagIds = this.tagIndex.get(tag);
            if (tagIds) {
                tagIds.delete(item.id);
                if (tagIds.size === 0) {
                    this.tagIndex.delete(tag);
                }
            }
        });
        // Remove from domain index
        const domainIds = this.domainIndex.get(item.metadata.domain);
        if (domainIds) {
            domainIds.delete(item.id);
            if (domainIds.size === 0) {
                this.domainIndex.delete(item.metadata.domain);
            }
        }
    }
    removeRelationshipsTo(targetId) {
        for (const [id, item] of this.knowledge) {
            item.relationships = item.relationships.filter(rel => rel.targetId !== targetId);
            if (item.relationships.length === 0) {
                this.relationshipIndex.delete(id);
            }
        }
    }
    evictLeastImportant() {
        let leastImportant;
        let leastImportantId;
        for (const [id, item] of this.knowledge) {
            const score = item.metadata.importance * item.metadata.confidence;
            if (!leastImportant || score < (leastImportant.metadata.importance * leastImportant.metadata.confidence)) {
                leastImportant = item;
                leastImportantId = id;
            }
        }
        if (leastImportantId) {
            this.delete(leastImportantId);
            this.logger.debug(`Evicted least important knowledge: ${leastImportantId}`);
        }
    }
    generateId() {
        return `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Save to persistence
    save() {
        if (!this.options.persistencePath)
            return;
        try {
            const fs = require('fs');
            const data = {
                knowledge: Object.fromEntries(this.knowledge),
                metadata: {
                    version: '1.0.0',
                    timestamp: new Date().toISOString(),
                    count: this.knowledge.size
                }
            };
            fs.writeFileSync(this.options.persistencePath, JSON.stringify(data, null, 2));
            this.logger.debug(`Knowledge saved to ${this.options.persistencePath}`);
        }
        catch (error) {
            this.logger.error('Failed to save knowledge', error);
        }
    }
    // Load from persistence
    load() {
        if (!this.options.persistencePath)
            return;
        try {
            const fs = require('fs');
            if (fs.existsSync(this.options.persistencePath)) {
                const data = JSON.parse(fs.readFileSync(this.options.persistencePath, 'utf8'));
                if (data.knowledge) {
                    this.knowledge.clear();
                    this.initializeIndices();
                    for (const [id, item] of Object.entries(data.knowledge)) {
                        const knowledgeItem = item;
                        knowledgeItem.createdAt = new Date(knowledgeItem.createdAt);
                        knowledgeItem.updatedAt = new Date(knowledgeItem.updatedAt);
                        this.knowledge.set(id, knowledgeItem);
                        this.updateIndices(knowledgeItem);
                    }
                    this.logger.info(`Knowledge loaded: ${this.knowledge.size} items`);
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to load knowledge', error);
        }
    }
    // Get statistics
    getStats() {
        const items = Array.from(this.knowledge.values());
        const byType = {
            concept: 0, fact: 0, rule: 0, pattern: 0, procedure: 0, experience: 0
        };
        const byDomain = {};
        let totalRelationships = 0;
        let totalConfidence = 0;
        let totalImportance = 0;
        items.forEach(item => {
            byType[item.type]++;
            byDomain[item.metadata.domain] = (byDomain[item.metadata.domain] || 0) + 1;
            totalRelationships += item.relationships.length;
            totalConfidence += item.metadata.confidence;
            totalImportance += item.metadata.importance;
        });
        return {
            totalItems: items.length,
            byType,
            byDomain,
            totalRelationships,
            averageConfidence: items.length > 0 ? totalConfidence / items.length : 0,
            averageImportance: items.length > 0 ? totalImportance / items.length : 0
        };
    }
    // Clear all knowledge
    clear() {
        this.knowledge.clear();
        this.initializeIndices();
        this.tagIndex.clear();
        this.domainIndex.clear();
        this.relationshipIndex.clear();
        this.emit('knowledge-cleared');
        this.logger.info('All knowledge cleared');
        if (this.options.autoSave) {
            this.save();
        }
    }
    // Destroy and cleanup all resources
    destroy() {
        this.knowledge.clear();
        this.tagIndex.clear();
        this.domainIndex.clear();
        this.relationshipIndex.clear();
        this.removeAllListeners();
        this.logger.info('Knowledge graph destroyed');
    }
}
exports.KnowledgeGraph = KnowledgeGraph;
//# sourceMappingURL=index.js.map