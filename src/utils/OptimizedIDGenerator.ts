/**
 * 优化的ID生成系统
 * Optimized ID Generation System
 */

export enum IDType {
  MEMORY = 'mem',
  TASK = 'task',
  PROJECT = 'proj',
  KNOWLEDGE = 'know',
  AGENT = 'agent',
  WORKFLOW = 'flow',
  SESSION = 'sess',
  USER = 'user'
}

export interface IDComponents {
  type: IDType;
  projectId?: string;
  timestamp: number;
  random: string;
}

export class OptimizedIDGenerator {
  private static instance: OptimizedIDGenerator;
  private projectRegistry: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): OptimizedIDGenerator {
    if (!OptimizedIDGenerator.instance) {
      OptimizedIDGenerator.instance = new OptimizedIDGenerator();
    }
    return OptimizedIDGenerator.instance;
  }

  /**
   * 生成优化的ID
   * @param type ID类型
   * @param projectId 项目ID（可选）
   * @param customPrefix 自定义前缀（可选）
   */
  public generateID(type: IDType, projectId?: string, customPrefix?: string): string {
    const timestamp = Date.now();
    const random = this.generateRandomString(9);
    
    let id = `${type}_`;
    
    // 添加项目ID
    if (projectId) {
      const sanitizedProjectId = this.sanitizeProjectId(projectId);
      id += `${sanitizedProjectId}_`;
      
      // 注册项目ID
      this.registerProject(sanitizedProjectId);
    }
    
    // 添加自定义前缀
    if (customPrefix) {
      id += `${customPrefix}_`;
    }
    
    // 添加时间戳和随机字符串
    id += `${timestamp}_${random}`;
    
    return id;
  }

  /**
   * 解析ID组件
   */
  public parseID(id: string): IDComponents | null {
    const parts = id.split('_');
    if (parts.length < 3) return null;

    const type = parts[0] as IDType;
    const timestamp = parseInt(parts[parts.length - 2]);
    const random = parts[parts.length - 1];
    
    // 检查是否有项目ID
    let projectId: string | undefined;
    if (parts.length > 3) {
      // 可能包含项目ID，需要进一步解析
      const potentialProjectId = parts[1];
      if (this.isValidProjectId(potentialProjectId)) {
        projectId = potentialProjectId;
      }
    }

    return {
      type,
      projectId,
      timestamp,
      random
    };
  }

  /**
   * 生成项目专用ID
   */
  public generateProjectID(projectName: string): string {
    const sanitized = this.sanitizeProjectId(projectName);
    const timestamp = Date.now();
    const random = this.generateRandomString(6);
    
    const projectId = `${sanitized}_${timestamp}_${random}`;
    this.registerProject(projectId);
    
    return projectId;
  }

  /**
   * 为特定项目生成记忆ID
   */
  public generateMemoryID(projectId: string, category?: string): string {
    let id = this.generateID(IDType.MEMORY, projectId);
    
    if (category) {
      // 在随机字符串前插入分类
      const parts = id.split('_');
      const random = parts.pop();
      const timestamp = parts.pop();
      parts.push(category, timestamp!, random!);
      id = parts.join('_');
    }
    
    return id;
  }

  /**
   * 为特定项目生成任务ID
   */
  public generateTaskID(projectId: string, priority?: 'low' | 'medium' | 'high'): string {
    const priorityPrefix = priority ? priority.charAt(0) : '';
    return this.generateID(IDType.TASK, projectId, priorityPrefix);
  }

  /**
   * 批量生成ID
   */
  public generateBatchIDs(type: IDType, count: number, projectId?: string): string[] {
    const ids: string[] = [];
    const baseTimestamp = Date.now();
    
    for (let i = 0; i < count; i++) {
      const timestamp = baseTimestamp + i; // 确保时间戳唯一
      const random = this.generateRandomString(9);
      
      let id = `${type}_`;
      if (projectId) {
        id += `${this.sanitizeProjectId(projectId)}_`;
      }
      id += `${timestamp}_${random}`;
      
      ids.push(id);
    }
    
    return ids;
  }

  /**
   * 检查ID是否属于特定项目
   */
  public belongsToProject(id: string, projectId: string): boolean {
    const components = this.parseID(id);
    return components?.projectId === projectId;
  }

  /**
   * 从ID中提取项目ID
   */
  public extractProjectId(id: string): string | null {
    const components = this.parseID(id);
    return components?.projectId || null;
  }

  /**
   * 获取ID的创建时间
   */
  public getCreationTime(id: string): Date | null {
    const components = this.parseID(id);
    return components ? new Date(components.timestamp) : null;
  }

  /**
   * 验证ID格式
   */
  public validateID(id: string): boolean {
    const components = this.parseID(id);
    if (!components) return false;
    
    // 检查类型是否有效
    if (!Object.values(IDType).includes(components.type)) return false;
    
    // 检查时间戳是否合理
    const now = Date.now();
    if (components.timestamp > now || components.timestamp < (now - 365 * 24 * 60 * 60 * 1000)) {
      return false; // 时间戳不能是未来时间或超过一年前
    }
    
    // 检查随机字符串格式
    if (!/^[a-z0-9]{9}$/.test(components.random)) return false;
    
    return true;
  }

  /**
   * 生成查询模式
   */
  public generateQueryPattern(type?: IDType, projectId?: string): RegExp {
    let pattern = '';
    
    if (type) {
      pattern += `${type}_`;
    } else {
      pattern += `(${Object.values(IDType).join('|')})_`;
    }
    
    if (projectId) {
      pattern += `${this.sanitizeProjectId(projectId)}_`;
    }
    
    pattern += `\\d+_[a-z0-9]{9}`;
    
    return new RegExp(pattern);
  }

  /**
   * 获取所有注册的项目
   */
  public getRegisteredProjects(): string[] {
    return Array.from(this.projectRegistry.keys());
  }

  /**
   * 生成统计报告
   */
  public generateStats(ids: string[]): {
    totalCount: number;
    byType: Record<string, number>;
    byProject: Record<string, number>;
    timeRange: { earliest: Date; latest: Date } | null;
  } {
    const stats = {
      totalCount: ids.length,
      byType: {} as Record<string, number>,
      byProject: {} as Record<string, number>,
      timeRange: null as { earliest: Date; latest: Date } | null
    };

    let earliestTime = Number.MAX_SAFE_INTEGER;
    let latestTime = 0;

    ids.forEach(id => {
      const components = this.parseID(id);
      if (!components) return;

      // 统计类型
      stats.byType[components.type] = (stats.byType[components.type] || 0) + 1;

      // 统计项目
      if (components.projectId) {
        stats.byProject[components.projectId] = (stats.byProject[components.projectId] || 0) + 1;
      }

      // 统计时间范围
      if (components.timestamp < earliestTime) {
        earliestTime = components.timestamp;
      }
      if (components.timestamp > latestTime) {
        latestTime = components.timestamp;
      }
    });

    if (earliestTime !== Number.MAX_SAFE_INTEGER) {
      stats.timeRange = {
        earliest: new Date(earliestTime),
        latest: new Date(latestTime)
      };
    }

    return stats;
  }

  /**
   * 清理项目ID
   */
  private sanitizeProjectId(projectId: string): string {
    return projectId
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20); // 限制长度
  }

  /**
   * 生成随机字符串
   */
  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 验证项目ID格式
   */
  private isValidProjectId(projectId: string): boolean {
    return /^[a-z0-9-]{1,20}$/.test(projectId);
  }

  /**
   * 注册项目ID
   */
  private registerProject(projectId: string): void {
    if (!this.projectRegistry.has(projectId)) {
      this.projectRegistry.set(projectId, new Date().toISOString());
    }
  }
}

export default OptimizedIDGenerator;
