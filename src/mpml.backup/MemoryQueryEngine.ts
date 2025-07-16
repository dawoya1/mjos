/**
 * MPML Memory Query Engine
 * Magic Persistent Memory Language 记忆查询引擎
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { 
  MemoryEntry, 
  MemoryType, 
  MemoryAccessLevel,
  MJOSError 
} from './types/index';

export interface QueryExpression {
  type: QueryType;
  field: string;
  operator: QueryOperator;
  value: any;
  children?: QueryExpression[];
}

export type QueryType = 'condition' | 'logical' | 'function';

export type QueryOperator = 
  | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith'
  | 'regex' | 'exists' | 'and' | 'or' | 'not'
  | 'near' | 'similar' | 'related';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string[];
  sortOrder?: 'asc' | 'desc';
  includeMetadata?: boolean;
  includeContent?: boolean;
  fuzzyMatch?: boolean;
  semanticSearch?: boolean;
  relevanceThreshold?: number;
}

export interface QueryResult {
  entries: MemoryEntry[];
  totalCount: number;
  executionTime: number;
  queryPlan?: QueryPlan;
  relevanceScores?: Map<string, number>;
}

export interface QueryPlan {
  steps: QueryStep[];
  estimatedCost: number;
  optimizations: string[];
}

export interface QueryStep {
  operation: string;
  description: string;
  estimatedRows: number;
  cost: number;
}

export interface IndexDefinition {
  name: string;
  fields: string[];
  type: IndexType;
  options?: IndexOptions;
}

export type IndexType = 'btree' | 'hash' | 'text' | 'vector' | 'composite';

export interface IndexOptions {
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
  weights?: Map<string, number>;
}

export interface SemanticSearchConfig {
  enabled: boolean;
  model: string;
  threshold: number;
  maxResults: number;
}

/**
 * 记忆查询引擎�? * 提供高级查询、索引和语义搜索功能
 */
export class MemoryQueryEngine {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private indexes = new Map<string, IndexDefinition>();
  private queryCache = new Map<string, QueryResult>();
  private queryHistory: Array<{
    query: QueryExpression;
    options: QueryOptions;
    result: QueryResult;
    timestamp: Date;
  }> = [];
  
  private semanticSearchConfig: SemanticSearchConfig = {
    enabled: false,
    model: 'default',
    threshold: 0.7,
    maxResults: 100
  };

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.initializeDefaultIndexes();
    this.setupEventListeners();
    
    this.logger.info('Memory Query Engine initialized');
  }

  /**
   * 执行查询
   */
  public async executeQuery(
    query: QueryExpression,
    options: QueryOptions = {},
    memoryProvider: (query: any) => Promise<MemoryEntry[]>
  ): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Executing memory query', {
        queryType: query.type,
        field: query.field,
        operator: query.operator
      });

      // 检查查询缓�?      const cacheKey = this.generateCacheKey(query, options);
      if (this.queryCache.has(cacheKey)) {
        const cachedResult = this.queryCache.get(cacheKey)!;
        this.logger.debug('Query result retrieved from cache', { cacheKey });
        return cachedResult;
      }

      // 生成查询计划
      const queryPlan = this.generateQueryPlan(query, options);

      // 转换为存储查�?      const storageQuery = this.translateQuery(query, options);

      // 执行查询
      let entries = await memoryProvider(storageQuery);

      // 应用后处理过�?      entries = this.applyPostProcessing(entries, query, options);

      // 计算相关性分�?      const relevanceScores = options.semanticSearch ? 
        await this.calculateRelevanceScores(entries, query) : undefined;

      // 排序结果
      entries = this.sortResults(entries, options, relevanceScores);

      // 应用分页
      const totalCount = entries.length;
      if (options.offset || options.limit) {
        const offset = options.offset || 0;
        const limit = options.limit || entries.length;
        entries = entries.slice(offset, offset + limit);
      }

      const executionTime = Date.now() - startTime;

      const result: QueryResult = {
        entries,
        totalCount,
        executionTime,
        queryPlan,
        relevanceScores
      };

      // 缓存结果
      this.cacheQueryResult(cacheKey, result);

      // 记录查询历史
      this.recordQueryHistory(query, options, result);

      this.logger.info('Query executed successfully', {
        resultCount: entries.length,
        totalCount,
        executionTime
      });

      this.eventBus.publishEvent('memory_query.executed', {
        query,
        options,
        result
      }, 'MemoryQueryEngine');

      return result;

    } catch (error) {
      const queryError = this.createQueryError(error, 'executeQuery', { query, options });
      this.logger.error('Query execution failed', { error: queryError });
      throw queryError;
    }
  }

  /**
   * 构建查询表达�?   */
  public buildQuery(): QueryBuilder {
    return new QueryBuilder();
  }

  /**
   * 创建索引
   */
  public async createIndex(definition: IndexDefinition): Promise<boolean> {
    try {
      this.validateIndexDefinition(definition);
      
      this.indexes.set(definition.name, definition);
      
      this.logger.info('Index created', {
        indexName: definition.name,
        fields: definition.fields,
        type: definition.type
      });

      this.eventBus.publishEvent('memory_index.created', {
        definition
      }, 'MemoryQueryEngine');

      return true;

    } catch (error) {
      this.logger.error('Failed to create index', {
        indexName: definition.name,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 删除索引
   */
  public async dropIndex(indexName: string): Promise<boolean> {
    try {
      const deleted = this.indexes.delete(indexName);
      
      if (deleted) {
        this.logger.info('Index dropped', { indexName });
        
        this.eventBus.publishEvent('memory_index.dropped', {
          indexName
        }, 'MemoryQueryEngine');
      }
      
      return deleted;

    } catch (error) {
      this.logger.error('Failed to drop index', {
        indexName,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 配置语义搜索
   */
  public configureSemanticSearch(config: Partial<SemanticSearchConfig>): void {
    this.semanticSearchConfig = {
      ...this.semanticSearchConfig,
      ...config
    };
    
    this.logger.info('Semantic search configured', {
      enabled: this.semanticSearchConfig.enabled,
      model: this.semanticSearchConfig.model,
      threshold: this.semanticSearchConfig.threshold
    });
  }

  /**
   * 获取查询统计
   */
  public getQueryStatistics(): {
    totalQueries: number;
    cacheHitRate: number;
    averageExecutionTime: number;
    mostUsedFields: Array<{ field: string; count: number }>;
    slowQueries: Array<{ query: QueryExpression; executionTime: number }>;
  } {
    const totalQueries = this.queryHistory.length;
    const cacheHits = this.queryHistory.filter(h => h.result.executionTime < 10).length;
    const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;
    
    const totalExecutionTime = this.queryHistory.reduce((sum, h) => sum + h.result.executionTime, 0);
    const averageExecutionTime = totalQueries > 0 ? totalExecutionTime / totalQueries : 0;
    
    // 统计最常用字段
    const fieldUsage = new Map<string, number>();
    for (const history of this.queryHistory) {
      this.extractFieldsFromQuery(history.query).forEach(field => {
        fieldUsage.set(field, (fieldUsage.get(field) || 0) + 1);
      });
    }
    
    const mostUsedFields = Array.from(fieldUsage.entries())
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // 识别慢查�?    const slowQueries = this.queryHistory
      .filter(h => h.result.executionTime > 1000)
      .map(h => ({ query: h.query, executionTime: h.result.executionTime }))
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);
    
    return {
      totalQueries,
      cacheHitRate,
      averageExecutionTime,
      mostUsedFields,
      slowQueries
    };
  }

  /**
   * 清空查询缓存
   */
  public clearQueryCache(): void {
    this.queryCache.clear();
    this.logger.debug('Query cache cleared');
  }

  /**
   * 生成查询计划
   */
  private generateQueryPlan(query: QueryExpression, options: QueryOptions): QueryPlan {
    const steps: QueryStep[] = [];
    let estimatedCost = 0;
    const optimizations: string[] = [];

    // 分析查询结构
    if (query.type === 'condition') {
      const indexUsed = this.findBestIndex(query.field);
      if (indexUsed) {
        steps.push({
          operation: 'index_scan',
          description: `Use index ${indexUsed.name} on field ${query.field}`,
          estimatedRows: 100,
          cost: 10
        });
        optimizations.push(`Using index ${indexUsed.name}`);
        estimatedCost += 10;
      } else {
        steps.push({
          operation: 'full_scan',
          description: `Full scan on field ${query.field}`,
          estimatedRows: 1000,
          cost: 100
        });
        estimatedCost += 100;
      }
    }

    // 添加排序步骤
    if (options.sortBy && options.sortBy.length > 0) {
      steps.push({
        operation: 'sort',
        description: `Sort by ${options.sortBy.join(', ')}`,
        estimatedRows: 100,
        cost: 20
      });
      estimatedCost += 20;
    }

    // 添加限制步骤
    if (options.limit) {
      steps.push({
        operation: 'limit',
        description: `Limit to ${options.limit} rows`,
        estimatedRows: options.limit,
        cost: 1
      });
      estimatedCost += 1;
    }

    return {
      steps,
      estimatedCost,
      optimizations
    };
  }

  /**
   * 转换查询
   */
  private translateQuery(query: QueryExpression, options: QueryOptions): any {
    // 将内部查询表达式转换为存储层查询格式
    const storageQuery: any = {};

    if (query.type === 'condition') {
      switch (query.operator) {
        case 'eq':
          storageQuery[query.field] = query.value;
          break;
        case 'contains':
          if (query.field === 'content') {
            storageQuery.contentPattern = query.value;
          }
          break;
        case 'in':
          if (query.field === 'type') {
            storageQuery.types = query.value;
          }
          break;
      }
    }

    // 添加选项
    if (options.limit) storageQuery.limit = options.limit;
    if (options.offset) storageQuery.offset = options.offset;
    if (options.sortBy) {
      storageQuery.sortBy = options.sortBy[0];
      storageQuery.sortOrder = options.sortOrder || 'asc';
    }

    return storageQuery;
  }

  /**
   * 应用后处�?   */
  private applyPostProcessing(
    entries: MemoryEntry[],
    query: QueryExpression,
    options: QueryOptions
  ): MemoryEntry[] {
    let results = entries;

    // 应用复杂过滤
    if (query.type === 'logical') {
      results = this.applyLogicalFilter(results, query);
    }

    // 应用模糊匹配
    if (options.fuzzyMatch) {
      results = this.applyFuzzyMatching(results, query);
    }

    return results;
  }

  /**
   * 应用逻辑过滤
   */
  private applyLogicalFilter(entries: MemoryEntry[], query: QueryExpression): MemoryEntry[] {
    if (!query.children) return entries;

    switch (query.operator) {
      case 'and':
        return entries.filter(entry => 
          query.children!.every(child => this.evaluateCondition(entry, child))
        );
      case 'or':
        return entries.filter(entry => 
          query.children!.some(child => this.evaluateCondition(entry, child))
        );
      case 'not':
        return entries.filter(entry => 
          !this.evaluateCondition(entry, query.children![0])
        );
      default:
        return entries;
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(entry: MemoryEntry, condition: QueryExpression): boolean {
    const fieldValue = this.getFieldValue(entry, condition.field);
    
    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      case 'startsWith':
        return typeof fieldValue === 'string' && fieldValue.startsWith(condition.value);
      case 'endsWith':
        return typeof fieldValue === 'string' && fieldValue.endsWith(condition.value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  /**
   * 获取字段�?   */
  private getFieldValue(entry: MemoryEntry, field: string): any {
    const parts = field.split('.');
    let value: any = entry;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * 应用模糊匹配
   */
  private applyFuzzyMatching(entries: MemoryEntry[], query: QueryExpression): MemoryEntry[] {
    // 简化的模糊匹配实现
    if (query.operator === 'contains' && typeof query.value === 'string') {
      const searchTerm = query.value.toLowerCase();
      return entries.filter(entry => {
        const content = JSON.stringify(entry.content).toLowerCase();
        return content.includes(searchTerm);
      });
    }
    
    return entries;
  }

  /**
   * 计算相关性分�?   */
  private async calculateRelevanceScores(
    entries: MemoryEntry[],
    query: QueryExpression
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    
    // 简化的相关性计�?    for (const entry of entries) {
      let score = 50; // 基础分数
      
      // 基于内容匹配度计算分�?      if (query.operator === 'contains' && typeof query.value === 'string') {
        const content = JSON.stringify(entry.content).toLowerCase();
        const searchTerm = query.value.toLowerCase();
        const matches = (content.match(new RegExp(searchTerm, 'g')) || []).length;
        score += matches * 10;
      }
      
      // 基于重要性调整分�?      score += entry.metadata.importance * 2;
      
      // 基于时间新鲜度调整分�?      const daysSinceCreation = (Date.now() - entry.createdAt.getTime()) / (24 * 60 * 60 * 1000);
      score += Math.max(0, 20 - daysSinceCreation);
      
      scores.set(entry.id, Math.min(score, 100));
    }
    
    return scores;
  }

  /**
   * 排序结果
   */
  private sortResults(
    entries: MemoryEntry[],
    options: QueryOptions,
    relevanceScores?: Map<string, number>
  ): MemoryEntry[] {
    if (!options.sortBy || options.sortBy.length === 0) {
      // 默认按相关性排�?      if (relevanceScores) {
        return entries.sort((a, b) => {
          const scoreA = relevanceScores.get(a.id) || 0;
          const scoreB = relevanceScores.get(b.id) || 0;
          return scoreB - scoreA;
        });
      }
      return entries;
    }

    return entries.sort((a, b) => {
      for (const sortField of options.sortBy!) {
        const valueA = this.getFieldValue(a, sortField);
        const valueB = this.getFieldValue(b, sortField);
        
        let comparison = 0;
        if (valueA < valueB) comparison = -1;
        else if (valueA > valueB) comparison = 1;
        
        if (options.sortOrder === 'desc') {
          comparison = -comparison;
        }
        
        if (comparison !== 0) return comparison;
      }
      return 0;
    });
  }

  /**
   * 查找最佳索�?   */
  private findBestIndex(field: string): IndexDefinition | undefined {
    for (const index of this.indexes.values()) {
      if (index.fields.includes(field)) {
        return index;
      }
    }
    return undefined;
  }

  /**
   * 生成缓存�?   */
  private generateCacheKey(query: QueryExpression, options: QueryOptions): string {
    return JSON.stringify({ query, options });
  }

  /**
   * 缓存查询结果
   */
  private cacheQueryResult(cacheKey: string, result: QueryResult): void {
    this.queryCache.set(cacheKey, result);
    
    // 限制缓存大小
    if (this.queryCache.size > 1000) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }
  }

  /**
   * 记录查询历史
   */
  private recordQueryHistory(
    query: QueryExpression,
    options: QueryOptions,
    result: QueryResult
  ): void {
    this.queryHistory.push({
      query,
      options,
      result,
      timestamp: new Date()
    });
    
    // 限制历史记录大小
    if (this.queryHistory.length > 10000) {
      this.queryHistory.splice(0, 1000);
    }
  }

  /**
   * 从查询中提取字段
   */
  private extractFieldsFromQuery(query: QueryExpression): string[] {
    const fields: string[] = [];
    
    if (query.field) {
      fields.push(query.field);
    }
    
    if (query.children) {
      for (const child of query.children) {
        fields.push(...this.extractFieldsFromQuery(child));
      }
    }
    
    return [...new Set(fields)];
  }

  /**
   * 验证索引定义
   */
  private validateIndexDefinition(definition: IndexDefinition): void {
    if (!definition.name) {
      throw new Error('Index name is required');
    }
    
    if (!definition.fields || definition.fields.length === 0) {
      throw new Error('Index fields are required');
    }
    
    if (this.indexes.has(definition.name)) {
      throw new Error(`Index ${definition.name} already exists`);
    }
  }

  /**
   * 初始化默认索�?   */
  private initializeDefaultIndexes(): void {
    const defaultIndexes: IndexDefinition[] = [
      {
        name: 'type_index',
        fields: ['type'],
        type: 'btree'
      },
      {
        name: 'created_at_index',
        fields: ['createdAt'],
        type: 'btree'
      },
      {
        name: 'importance_index',
        fields: ['metadata.importance'],
        type: 'btree'
      },
      {
        name: 'tags_index',
        fields: ['metadata.tags'],
        type: 'hash'
      }
    ];

    for (const index of defaultIndexes) {
      this.indexes.set(index.name, index);
    }

    this.logger.debug('Default indexes initialized', {
      indexCount: defaultIndexes.length
    });
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('memory.stored', (event) => {
      // 清除相关的查询缓�?      this.clearQueryCache();
    });

    this.eventBus.subscribeEvent('memory.updated', (event) => {
      // 清除相关的查询缓�?      this.clearQueryCache();
    });

    this.eventBus.subscribeEvent('memory.deleted', (event) => {
      // 清除相关的查询缓�?      this.clearQueryCache();
    });
  }

  /**
   * 创建查询错误
   */
  private createQueryError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const queryError = new Error(`Memory query ${operation} failed: ${message}`) as MJOSError;
    
    queryError.code = 'QueryError';
    queryError.component = 'MemoryQueryEngine';
    queryError.context = context;
    queryError.recoverable = true;
    queryError.timestamp = new Date();
    
    return queryError;
  }
}

/**
 * 查询构建器类
 * 提供流畅的查询构建API
 */
export class QueryBuilder {
  private expression: QueryExpression | null = null;

  /**
   * 等于条件
   */
  public eq(field: string, value: any): QueryBuilder {
    this.expression = {
      type: 'condition',
      field,
      operator: 'eq',
      value
    };
    return this;
  }

  /**
   * 包含条件
   */
  public contains(field: string, value: string): QueryBuilder {
    this.expression = {
      type: 'condition',
      field,
      operator: 'contains',
      value
    };
    return this;
  }

  /**
   * 在范围内条件
   */
  public in(field: string, values: any[]): QueryBuilder {
    this.expression = {
      type: 'condition',
      field,
      operator: 'in',
      value: values
    };
    return this;
  }

  /**
   * 大于条件
   */
  public gt(field: string, value: any): QueryBuilder {
    this.expression = {
      type: 'condition',
      field,
      operator: 'gt',
      value
    };
    return this;
  }

  /**
   * 逻辑�?   */
  public and(other: QueryBuilder): QueryBuilder {
    if (!this.expression || !other.expression) {
      throw new Error('Both expressions must be defined for AND operation');
    }
    
    this.expression = {
      type: 'logical',
      field: '',
      operator: 'and',
      value: null,
      children: [this.expression, other.expression]
    };
    return this;
  }

  /**
   * 逻辑�?   */
  public or(other: QueryBuilder): QueryBuilder {
    if (!this.expression || !other.expression) {
      throw new Error('Both expressions must be defined for OR operation');
    }
    
    this.expression = {
      type: 'logical',
      field: '',
      operator: 'or',
      value: null,
      children: [this.expression, other.expression]
    };
    return this;
  }

  /**
   * 构建查询表达�?   */
  public build(): QueryExpression {
    if (!this.expression) {
      throw new Error('No query expression defined');
    }
    return this.expression;
  }
}
