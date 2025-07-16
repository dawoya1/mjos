/**
 * Performance Optimizer
 * 性能优化�?- 智能缓存、负载均衡和资源管理
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';

// 缓存策略枚举
export enum CacheStrategy {
  LRU = 'lru',           // 最近最少使�?  LFU = 'lfu',           // 最少使用频�?  TTL = 'ttl',           // 生存时间
  ADAPTIVE = 'adaptive'   // 自适应
}

// 负载均衡策略
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  LEAST_RESPONSE_TIME = 'least_response_time',
  ADAPTIVE = 'adaptive'
}

// 缓存项接�?export interface CacheItem<T> {
  key: string;
  value: T;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
  ttl?: number;
  size: number;
  priority: number;
}

// 性能指标接口
export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  cacheHitRate: number;
  activeConnections: number;
  queueLength: number;
}

// 负载均衡节点
export interface LoadBalancerNode {
  id: string;
  endpoint: string;
  weight: number;
  currentConnections: number;
  averageResponseTime: number;
  errorCount: number;
  isHealthy: boolean;
  lastHealthCheck: Date;
}

// 资源池接�?export interface ResourcePool<T> {
  name: string;
  maxSize: number;
  currentSize: number;
  available: T[];
  inUse: Set<T>;
  createResource: () => Promise<T>;
  validateResource: (resource: T) => boolean;
  destroyResource: (resource: T) => Promise<void>;
}

/**
 * 智能缓存系统
 */
export class IntelligentCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private accessOrder: string[] = []; // LRU顺序
  private frequencyMap = new Map<string, number>(); // LFU频率
  
  constructor(
    private maxSize: number = 1000,
    private strategy: CacheStrategy = CacheStrategy.ADAPTIVE,
    private defaultTTL: number = 300000, // 5分钟
    private logger: Logger
  ) {}

  /**
   * 获取缓存�?   */
  public get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // 检查TTL
    if (item.ttl && Date.now() - item.timestamp.getTime() > item.ttl) {
      this.delete(key);
      return null;
    }

    // 更新访问信息
    item.accessCount++;
    item.lastAccessed = new Date();
    this.updateAccessOrder(key);
    this.updateFrequency(key);

    return item.value;
  }

  /**
   * 设置缓存�?   */
  public set(key: string, value: T, ttl?: number, priority: number = 1): void {
    // 检查容�?    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    const item: CacheItem<T> = {
      key,
      value,
      timestamp: new Date(),
      accessCount: 1,
      lastAccessed: new Date(),
      ttl: ttl || this.defaultTTL,
      size: this.calculateSize(value),
      priority
    };

    this.cache.set(key, item);
    this.updateAccessOrder(key);
    this.updateFrequency(key);

    this.logger.debug('Cache item set', { key, size: item.size, ttl: item.ttl });
  }

  /**
   * 删除缓存�?   */
  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
      this.frequencyMap.delete(key);
    }
    return deleted;
  }

  /**
   * 清空缓存
   */
  public clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.frequencyMap.clear();
  }

  /**
   * 缓存驱�?   */
  private evict(): void {
    let keyToEvict: string | null = null;

    switch (this.strategy) {
      case CacheStrategy.LRU:
        keyToEvict = this.evictLRU();
        break;
      case CacheStrategy.LFU:
        keyToEvict = this.evictLFU();
        break;
      case CacheStrategy.TTL:
        keyToEvict = this.evictTTL();
        break;
      case CacheStrategy.ADAPTIVE:
        keyToEvict = this.evictAdaptive();
        break;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
      this.logger.debug('Cache item evicted', { key: keyToEvict, strategy: this.strategy });
    }
  }

  /**
   * LRU驱�?   */
  private evictLRU(): string | null {
    return this.accessOrder.length > 0 ? this.accessOrder[0] : null;
  }

  /**
   * LFU驱�?   */
  private evictLFU(): string | null {
    let minFrequency = Infinity;
    let keyToEvict: string | null = null;

    for (const [key, frequency] of this.frequencyMap) {
      if (frequency < minFrequency) {
        minFrequency = frequency;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  /**
   * TTL驱�?   */
  private evictTTL(): string | null {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (item.ttl && now - item.timestamp.getTime() > item.ttl) {
        return key;
      }
    }
    return this.evictLRU(); // 回退到LRU
  }

  /**
   * 自适应驱�?   */
  private evictAdaptive(): string | null {
    // 综合考虑访问频率、最近访问时间和优先�?    let bestScore = Infinity;
    let keyToEvict: string | null = null;
    const now = Date.now();

    for (const [key, item] of this.cache) {
      const frequency = this.frequencyMap.get(key) || 1;
      const timeSinceAccess = now - item.lastAccessed.getTime();
      
      // 计算综合分数（越低越容易被驱逐）
      const score = (frequency * item.priority) / (timeSinceAccess + 1);
      
      if (score < bestScore) {
        bestScore = score;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  /**
   * 更新访问顺序
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * 从访问顺序中移除
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * 更新频率
   */
  private updateFrequency(key: string): void {
    const current = this.frequencyMap.get(key) || 0;
    this.frequencyMap.set(key, current + 1);
  }

  /**
   * 计算值大�?   */
  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1; // 默认大小
    }
  }

  /**
   * 获取缓存统计
   */
  public getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccesses: number;
    totalHits: number;
  } {
    let totalAccesses = 0;
    let totalHits = 0;

    for (const item of this.cache.values()) {
      totalAccesses += item.accessCount;
      if (item.accessCount > 1) {
        totalHits += item.accessCount - 1;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
      totalAccesses,
      totalHits
    };
  }
}

/**
 * 负载均衡�? */
export class LoadBalancer {
  private nodes: LoadBalancerNode[] = [];
  private currentIndex = 0;
  private strategy: LoadBalancingStrategy = LoadBalancingStrategy.ADAPTIVE;

  constructor(
    private logger: Logger,
    private eventBus: EventBus
  ) {
    this.startHealthChecks();
  }

  /**
   * 添加节点
   */
  public addNode(node: Omit<LoadBalancerNode, 'currentConnections' | 'averageResponseTime' | 'errorCount' | 'isHealthy' | 'lastHealthCheck'>): void {
    const fullNode: LoadBalancerNode = {
      ...node,
      currentConnections: 0,
      averageResponseTime: 0,
      errorCount: 0,
      isHealthy: true,
      lastHealthCheck: new Date()
    };

    this.nodes.push(fullNode);
    this.logger.info('Load balancer node added', { nodeId: node.id, endpoint: node.endpoint });
  }

  /**
   * 移除节点
   */
  public removeNode(nodeId: string): boolean {
    const index = this.nodes.findIndex(node => node.id === nodeId);
    if (index > -1) {
      this.nodes.splice(index, 1);
      this.logger.info('Load balancer node removed', { nodeId });
      return true;
    }
    return false;
  }

  /**
   * 选择节点
   */
  public selectNode(): LoadBalancerNode | null {
    const healthyNodes = this.nodes.filter(node => node.isHealthy);
    if (healthyNodes.length === 0) {
      return null;
    }

    switch (this.strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.selectRoundRobin(healthyNodes);
      case LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
        return this.selectWeightedRoundRobin(healthyNodes);
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.selectLeastConnections(healthyNodes);
      case LoadBalancingStrategy.LEAST_RESPONSE_TIME:
        return this.selectLeastResponseTime(healthyNodes);
      case LoadBalancingStrategy.ADAPTIVE:
        return this.selectAdaptive(healthyNodes);
      default:
        return healthyNodes[0];
    }
  }

  /**
   * 轮询选择
   */
  private selectRoundRobin(nodes: LoadBalancerNode[]): LoadBalancerNode {
    const node = nodes[this.currentIndex % nodes.length];
    this.currentIndex++;
    return node;
  }

  /**
   * 加权轮询选择
   */
  private selectWeightedRoundRobin(nodes: LoadBalancerNode[]): LoadBalancerNode {
    const totalWeight = nodes.reduce((sum, node) => sum + node.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const node of nodes) {
      random -= node.weight;
      if (random <= 0) {
        return node;
      }
    }
    
    return nodes[0];
  }

  /**
   * 最少连接选择
   */
  private selectLeastConnections(nodes: LoadBalancerNode[]): LoadBalancerNode {
    return nodes.reduce((min, node) => 
      node.currentConnections < min.currentConnections ? node : min
    );
  }

  /**
   * 最短响应时间选择
   */
  private selectLeastResponseTime(nodes: LoadBalancerNode[]): LoadBalancerNode {
    return nodes.reduce((min, node) => 
      node.averageResponseTime < min.averageResponseTime ? node : min
    );
  }

  /**
   * 自适应选择
   */
  private selectAdaptive(nodes: LoadBalancerNode[]): LoadBalancerNode {
    // 综合考虑连接数、响应时间和权重
    let bestScore = Infinity;
    let bestNode = nodes[0];

    for (const node of nodes) {
      const connectionScore = node.currentConnections / 10; // 归一�?      const responseTimeScore = node.averageResponseTime / 1000; // 归一化到�?      const weightScore = 1 / node.weight; // 权重越高分数越低
      
      const totalScore = connectionScore + responseTimeScore + weightScore;
      
      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestNode = node;
      }
    }

    return bestNode;
  }

  /**
   * 启动健康检�?   */
  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // 30秒检查一�?  }

  /**
   * 执行健康检�?   */
  private async performHealthChecks(): Promise<void> {
    for (const node of this.nodes) {
      try {
        // 模拟健康检�?        const isHealthy = await this.checkNodeHealth(node);
        
        if (node.isHealthy !== isHealthy) {
          node.isHealthy = isHealthy;
          this.logger.info('Node health status changed', {
            nodeId: node.id,
            isHealthy
          });
          
          this.eventBus.publishEvent('load_balancer.node_health_changed', {
            nodeId: node.id,
            isHealthy
          }, 'LoadBalancer');
        }
        
        node.lastHealthCheck = new Date();
        
      } catch (error) {
        node.isHealthy = false;
        node.errorCount++;
        
        this.logger.warn('Health check failed', {
          nodeId: node.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * 检查节点健康状�?   */
  private async checkNodeHealth(node: LoadBalancerNode): Promise<boolean> {
    // 简化的健康检查实�?    // 实际应用中应该发送HTTP请求或其他协议检�?    return node.errorCount < 5 && node.currentConnections < 100;
  }

  /**
   * 更新节点指标
   */
  public updateNodeMetrics(nodeId: string, metrics: {
    responseTime?: number;
    connectionChange?: number;
    errorOccurred?: boolean;
  }): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (metrics.responseTime !== undefined) {
      // 使用指数移动平均更新响应时间
      node.averageResponseTime = node.averageResponseTime * 0.8 + metrics.responseTime * 0.2;
    }

    if (metrics.connectionChange !== undefined) {
      node.currentConnections = Math.max(0, node.currentConnections + metrics.connectionChange);
    }

    if (metrics.errorOccurred) {
      node.errorCount++;
    }
  }

  /**
   * 获取负载均衡统计
   */
  public getStats(): {
    totalNodes: number;
    healthyNodes: number;
    totalConnections: number;
    averageResponseTime: number;
    strategy: LoadBalancingStrategy;
  } {
    const healthyNodes = this.nodes.filter(node => node.isHealthy);
    const totalConnections = this.nodes.reduce((sum, node) => sum + node.currentConnections, 0);
    const averageResponseTime = healthyNodes.length > 0 
      ? healthyNodes.reduce((sum, node) => sum + node.averageResponseTime, 0) / healthyNodes.length
      : 0;

    return {
      totalNodes: this.nodes.length,
      healthyNodes: healthyNodes.length,
      totalConnections,
      averageResponseTime,
      strategy: this.strategy
    };
  }

  /**
   * 设置负载均衡策略
   */
  public setStrategy(strategy: LoadBalancingStrategy): void {
    this.strategy = strategy;
    this.logger.info('Load balancing strategy changed', { strategy });
  }
}

/**
 * 资源池管理器
 */
export class ResourcePoolManager<T> {
  private pools = new Map<string, ResourcePool<T>>();

  constructor(private logger: Logger) {}

  /**
   * 创建资源�?   */
  public createPool(
    name: string,
    maxSize: number,
    createResource: () => Promise<T>,
    validateResource: (resource: T) => boolean,
    destroyResource: (resource: T) => Promise<void>
  ): void {
    const pool: ResourcePool<T> = {
      name,
      maxSize,
      currentSize: 0,
      available: [],
      inUse: new Set(),
      createResource,
      validateResource,
      destroyResource
    };

    this.pools.set(name, pool);
    this.logger.info('Resource pool created', { name, maxSize });
  }

  /**
   * 获取资源
   */
  public async acquireResource(poolName: string): Promise<T | null> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Resource pool '${poolName}' not found`);
    }

    // 检查可用资�?    while (pool.available.length > 0) {
      const resource = pool.available.pop()!;

      if (pool.validateResource(resource)) {
        pool.inUse.add(resource);
        return resource;
      } else {
        // 资源无效，销毁它
        await pool.destroyResource(resource);
        pool.currentSize--;
      }
    }

    // 如果没有可用资源且未达到最大容量，创建新资�?    if (pool.currentSize < pool.maxSize) {
      try {
        const resource = await pool.createResource();
        pool.currentSize++;
        pool.inUse.add(resource);

        this.logger.debug('New resource created', { poolName, currentSize: pool.currentSize });
        return resource;
      } catch (error) {
        this.logger.error('Failed to create resource', {
          poolName,
          error: error instanceof Error ? error.message : String(error)
        });
        return null;
      }
    }

    // 资源池已�?    return null;
  }

  /**
   * 释放资源
   */
  public async releaseResource(poolName: string, resource: T): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Resource pool '${poolName}' not found`);
    }

    if (!pool.inUse.has(resource)) {
      this.logger.warn('Attempting to release resource not in use', { poolName });
      return;
    }

    pool.inUse.delete(resource);

    if (pool.validateResource(resource)) {
      pool.available.push(resource);
    } else {
      // 资源无效，销毁它
      await pool.destroyResource(resource);
      pool.currentSize--;
    }
  }

  /**
   * 获取资源池统�?   */
  public getPoolStats(poolName: string): {
    name: string;
    maxSize: number;
    currentSize: number;
    available: number;
    inUse: number;
    utilizationRate: number;
  } | null {
    const pool = this.pools.get(poolName);
    if (!pool) return null;

    return {
      name: pool.name,
      maxSize: pool.maxSize,
      currentSize: pool.currentSize,
      available: pool.available.length,
      inUse: pool.inUse.size,
      utilizationRate: pool.currentSize > 0 ? pool.inUse.size / pool.currentSize : 0
    };
  }

  /**
   * 清理资源�?   */
  public async destroyPool(poolName: string): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) return;

    // 销毁所有资�?    for (const resource of pool.available) {
      await pool.destroyResource(resource);
    }

    for (const resource of pool.inUse) {
      await pool.destroyResource(resource);
    }

    this.pools.delete(poolName);
    this.logger.info('Resource pool destroyed', { poolName });
  }
}

/**
 * 性能优化器主�? */
export class PerformanceOptimizer {
  private cache: IntelligentCache<any>;
  private loadBalancer: LoadBalancer;
  private resourceManager: ResourcePoolManager<any>;
  private performanceMetrics: PerformanceMetrics;
  private metricsHistory: PerformanceMetrics[] = [];

  // 性能阈�?  private readonly RESPONSE_TIME_THRESHOLD = 1000; // 1�?  private readonly ERROR_RATE_THRESHOLD = 0.05; // 5%
  private readonly CPU_USAGE_THRESHOLD = 0.8; // 80%
  private readonly MEMORY_USAGE_THRESHOLD = 0.85; // 85%

  constructor(private logger: Logger, private eventBus: EventBus) {
    this.cache = new IntelligentCache(1000, CacheStrategy.ADAPTIVE, 300000, logger);
    this.loadBalancer = new LoadBalancer(logger, eventBus);
    this.resourceManager = new ResourcePoolManager(logger);

    this.performanceMetrics = {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      activeConnections: 0,
      queueLength: 0
    };

    this.startPerformanceMonitoring();
    this.setupOptimizationRules();

    this.logger.info('Performance Optimizer initialized');
  }

  /**
   * 获取缓存
   */
  public getCache(): IntelligentCache<any> {
    return this.cache;
  }

  /**
   * 获取负载均衡�?   */
  public getLoadBalancer(): LoadBalancer {
    return this.loadBalancer;
  }

  /**
   * 获取资源管理�?   */
  public getResourceManager(): ResourcePoolManager<any> {
    return this.resourceManager;
  }

  /**
   * 更新性能指标
   */
  public updateMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };

    // 记录历史数据
    this.metricsHistory.push({ ...this.performanceMetrics });

    // 限制历史记录大小
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift();
    }

    // 触发性能分析
    this.analyzePerformance();
  }

  /**
   * 启动性能监控
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 10000); // �?0秒收集一次指�?  }

  /**
   * 收集系统指标
   */
  private collectSystemMetrics(): void {
    // 模拟系统指标收集
    const cacheStats = this.cache.getStats();
    const loadBalancerStats = this.loadBalancer.getStats();

    this.updateMetrics({
      cacheHitRate: cacheStats.hitRate,
      activeConnections: loadBalancerStats.totalConnections,
      responseTime: loadBalancerStats.averageResponseTime
    });
  }

  /**
   * 分析性能
   */
  private analyzePerformance(): void {
    const metrics = this.performanceMetrics;

    // 检查响应时�?    if (metrics.responseTime > this.RESPONSE_TIME_THRESHOLD) {
      this.handleSlowResponse();
    }

    // 检查错误率
    if (metrics.errorRate > this.ERROR_RATE_THRESHOLD) {
      this.handleHighErrorRate();
    }

    // 检查CPU使用�?    if (metrics.cpuUsage > this.CPU_USAGE_THRESHOLD) {
      this.handleHighCpuUsage();
    }

    // 检查内存使用率
    if (metrics.memoryUsage > this.MEMORY_USAGE_THRESHOLD) {
      this.handleHighMemoryUsage();
    }

    // 检查缓存命中率
    if (metrics.cacheHitRate < 0.7) {
      this.optimizeCache();
    }
  }

  /**
   * 处理慢响�?   */
  private handleSlowResponse(): void {
    this.logger.warn('Slow response detected', {
      responseTime: this.performanceMetrics.responseTime,
      threshold: this.RESPONSE_TIME_THRESHOLD
    });

    // 优化策略
    this.eventBus.publishEvent('performance.slow_response', {
      responseTime: this.performanceMetrics.responseTime,
      optimizations: ['increase_cache_size', 'optimize_queries', 'scale_resources']
    }, 'PerformanceOptimizer');
  }

  /**
   * 处理高错误率
   */
  private handleHighErrorRate(): void {
    this.logger.warn('High error rate detected', {
      errorRate: this.performanceMetrics.errorRate,
      threshold: this.ERROR_RATE_THRESHOLD
    });

    // 触发熔断�?    this.eventBus.publishEvent('performance.high_error_rate', {
      errorRate: this.performanceMetrics.errorRate,
      actions: ['enable_circuit_breaker', 'fallback_mode', 'health_check']
    }, 'PerformanceOptimizer');
  }

  /**
   * 处理高CPU使用�?   */
  private handleHighCpuUsage(): void {
    this.logger.warn('High CPU usage detected', {
      cpuUsage: this.performanceMetrics.cpuUsage,
      threshold: this.CPU_USAGE_THRESHOLD
    });

    // CPU优化策略
    this.eventBus.publishEvent('performance.high_cpu', {
      cpuUsage: this.performanceMetrics.cpuUsage,
      optimizations: ['reduce_background_tasks', 'optimize_algorithms', 'scale_horizontally']
    }, 'PerformanceOptimizer');
  }

  /**
   * 处理高内存使用率
   */
  private handleHighMemoryUsage(): void {
    this.logger.warn('High memory usage detected', {
      memoryUsage: this.performanceMetrics.memoryUsage,
      threshold: this.MEMORY_USAGE_THRESHOLD
    });

    // 内存优化策略
    this.cache.clear(); // 清理缓存

    this.eventBus.publishEvent('performance.high_memory', {
      memoryUsage: this.performanceMetrics.memoryUsage,
      optimizations: ['clear_cache', 'garbage_collection', 'memory_leak_check']
    }, 'PerformanceOptimizer');
  }

  /**
   * 优化缓存
   */
  private optimizeCache(): void {
    this.logger.info('Optimizing cache performance', {
      hitRate: this.performanceMetrics.cacheHitRate
    });

    // 动态调整缓存策�?    if (this.performanceMetrics.cacheHitRate < 0.5) {
      // 命中率很低，可能需要调整缓存策�?      this.eventBus.publishEvent('performance.cache_optimization', {
        currentHitRate: this.performanceMetrics.cacheHitRate,
        suggestion: 'adjust_cache_strategy'
      }, 'PerformanceOptimizer');
    }
  }

  /**
   * 设置优化规则
   */
  private setupOptimizationRules(): void {
    // 监听系统事件并应用优�?    this.eventBus.subscribe('system.high_load', () => {
      this.applyLoadOptimizations();
    });

    this.eventBus.subscribe('system.low_resources', () => {
      this.applyResourceOptimizations();
    });
  }

  /**
   * 应用负载优化
   */
  private applyLoadOptimizations(): void {
    this.logger.info('Applying load optimizations');

    // 启用更激进的缓存策略
    this.cache = new IntelligentCache(2000, CacheStrategy.ADAPTIVE, 600000, this.logger);

    // 调整负载均衡策略
    this.loadBalancer.setStrategy(LoadBalancingStrategy.LEAST_RESPONSE_TIME);
  }

  /**
   * 应用资源优化
   */
  private applyResourceOptimizations(): void {
    this.logger.info('Applying resource optimizations');

    // 减少缓存大小
    this.cache = new IntelligentCache(500, CacheStrategy.LRU, 180000, this.logger);

    // 清理不必要的资源
    this.eventBus.publishEvent('system.cleanup_resources', {}, 'PerformanceOptimizer');
  }

  /**
   * 获取性能报告
   */
  public getPerformanceReport(): {
    currentMetrics: PerformanceMetrics;
    trends: {
      responseTimeTrend: number;
      throughputTrend: number;
      errorRateTrend: number;
    };
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    // 基于当前指标生成建议
    if (this.performanceMetrics.responseTime > this.RESPONSE_TIME_THRESHOLD) {
      recommendations.push('Consider scaling resources or optimizing queries');
    }

    if (this.performanceMetrics.cacheHitRate < 0.7) {
      recommendations.push('Optimize caching strategy or increase cache size');
    }

    if (this.performanceMetrics.errorRate > this.ERROR_RATE_THRESHOLD) {
      recommendations.push('Investigate error sources and implement circuit breakers');
    }

    // 计算趋势
    const trends = this.calculateTrends();

    return {
      currentMetrics: this.performanceMetrics,
      trends,
      recommendations
    };
  }

  /**
   * 计算性能趋势
   */
  private calculateTrends(): {
    responseTimeTrend: number;
    throughputTrend: number;
    errorRateTrend: number;
  } {
    if (this.metricsHistory.length < 2) {
      return {
        responseTimeTrend: 0,
        throughputTrend: 0,
        errorRateTrend: 0
      };
    }

    const recent = this.metricsHistory.slice(-10); // 最�?0个数据点
    const older = this.metricsHistory.slice(-20, -10); // 之前10个数据点

    const recentAvg = {
      responseTime: recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length,
      throughput: recent.reduce((sum, m) => sum + m.throughput, 0) / recent.length,
      errorRate: recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length
    };

    const olderAvg = {
      responseTime: older.reduce((sum, m) => sum + m.responseTime, 0) / older.length,
      throughput: older.reduce((sum, m) => sum + m.throughput, 0) / older.length,
      errorRate: older.reduce((sum, m) => sum + m.errorRate, 0) / older.length
    };

    return {
      responseTimeTrend: recentAvg.responseTime - olderAvg.responseTime,
      throughputTrend: recentAvg.throughput - olderAvg.throughput,
      errorRateTrend: recentAvg.errorRate - olderAvg.errorRate
    };
  }

  /**
   * 清理资源
   */
  public async destroy(): Promise<void> {
    this.cache.clear();
    this.metricsHistory = [];

    this.logger.info('Performance Optimizer destroyed');
  }
}
