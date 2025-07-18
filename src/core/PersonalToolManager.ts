/**
 * MJOS个人工具管理器 - 每个成员的专业工具库
 * Personal Tool Manager - Professional Tool Library for Each Member
 */

export interface Tool {
  id: string;
  name: string;
  category: 'mcp' | 'local' | 'api' | 'script';
  description: string;
  version: string;
  author: string;
  tags: string[];
  
  // 工具配置
  config: ToolConfig;
  
  // 依赖信息
  dependencies: Dependency[];
  
  // 使用统计
  usage: ToolUsage;
  
  // 状态信息
  status: ToolStatus;
}

export interface ToolConfig {
  // MCP工具配置
  mcpEndpoint?: string;
  mcpProtocol?: string;
  
  // 本地工具配置
  executablePath?: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  
  // API工具配置
  apiEndpoint?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  
  // 脚本工具配置
  scriptPath?: string;
  interpreter?: string;
  arguments?: string[];
  
  // 通用配置
  timeout?: number;
  retryCount?: number;
  customSettings?: Record<string, any>;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'npm' | 'pip' | 'system' | 'binary';
  required: boolean;
  installCommand?: string;
  checkCommand?: string;
}

export interface ToolUsage {
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  averageExecutionTime: number;
  lastUsed: Date;
  usageHistory: Array<{
    timestamp: Date;
    duration: number;
    success: boolean;
    context: string;
    result?: any;
    error?: string;
  }>;
}

export interface ToolStatus {
  installed: boolean;
  enabled: boolean;
  healthy: boolean;
  lastHealthCheck: Date;
  issues: string[];
  performance: {
    reliability: number; // 0-1
    speed: number; // 0-1
    resourceUsage: number; // 0-1
  };
}

export interface ToolInvocation {
  toolId: string;
  parameters: Record<string, any>;
  context: string;
  timeout?: number;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

export class PersonalToolManager {
  private memberId: string;
  private tools: Map<string, Tool> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  constructor(memberId: string) {
    this.memberId = memberId;
    this.loadPersonalTools();
    this.startHealthMonitoring();
  }

  /**
   * 安装工具
   */
  async installTool(toolDefinition: Omit<Tool, 'id' | 'usage' | 'status'>): Promise<boolean> {
    try {
      const toolId = this.generateToolId(toolDefinition.name);
      
      // 检查依赖
      const dependencyCheck = await this.checkDependencies(toolDefinition.dependencies);
      if (!dependencyCheck.satisfied) {
        console.error(`工具${toolDefinition.name}依赖检查失败:`, dependencyCheck.missing);
        return false;
      }

      // 创建工具实例
      const tool: Tool = {
        id: toolId,
        ...toolDefinition,
        usage: {
          totalInvocations: 0,
          successfulInvocations: 0,
          failedInvocations: 0,
          averageExecutionTime: 0,
          lastUsed: new Date(),
          usageHistory: []
        },
        status: {
          installed: false,
          enabled: false,
          healthy: false,
          lastHealthCheck: new Date(),
          issues: [],
          performance: {
            reliability: 1.0,
            speed: 1.0,
            resourceUsage: 0.0
          }
        }
      };

      // 执行安装
      const installResult = await this.performInstallation(tool);
      if (!installResult) {
        return false;
      }

      // 更新状态
      tool.status.installed = true;
      tool.status.enabled = true;

      // 健康检查
      const healthCheck = await this.performHealthCheck(tool);
      tool.status.healthy = healthCheck;

      // 保存工具
      this.tools.set(toolId, tool);
      this.updateIndexes(tool);

      console.log(`✅ 工具 ${toolDefinition.name} 安装成功`);
      return true;

    } catch (error) {
      console.error(`❌ 工具安装失败:`, error);
      return false;
    }
  }

  /**
   * 调用工具
   */
  async invokeTool(invocation: ToolInvocation): Promise<ToolResult> {
    const tool = this.tools.get(invocation.toolId);
    if (!tool) {
      return {
        success: false,
        error: `工具 ${invocation.toolId} 不存在`,
        executionTime: 0
      };
    }

    if (!tool.status.enabled || !tool.status.healthy) {
      return {
        success: false,
        error: `工具 ${tool.name} 不可用`,
        executionTime: 0
      };
    }

    const startTime = Date.now();
    
    try {
      let result: any;
      
      switch (tool.category) {
        case 'mcp':
          result = await this.invokeMCPTool(tool, invocation.parameters);
          break;
        case 'local':
          result = await this.invokeLocalTool(tool, invocation.parameters);
          break;
        case 'api':
          result = await this.invokeAPITool(tool, invocation.parameters);
          break;
        case 'script':
          result = await this.invokeScriptTool(tool, invocation.parameters);
          break;
        default:
          throw new Error(`不支持的工具类型: ${tool.category}`);
      }

      const executionTime = Date.now() - startTime;
      
      // 更新使用统计
      this.updateUsageStats(tool, true, executionTime, invocation.context, result);

      return {
        success: true,
        result,
        executionTime,
        metadata: {
          toolName: tool.name,
          toolVersion: tool.version
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // 更新使用统计
      this.updateUsageStats(tool, false, executionTime, invocation.context, undefined, errorMessage);

      return {
        success: false,
        error: errorMessage,
        executionTime
      };
    }
  }

  /**
   * 获取工具列表
   */
  getTools(filter?: {
    category?: string;
    tags?: string[];
    enabled?: boolean;
    healthy?: boolean;
  }): Tool[] {
    let tools = Array.from(this.tools.values());

    if (filter) {
      if (filter.category) {
        tools = tools.filter(tool => tool.category === filter.category);
      }
      
      if (filter.tags && filter.tags.length > 0) {
        tools = tools.filter(tool => 
          filter.tags!.some(tag => tool.tags.includes(tag))
        );
      }
      
      if (filter.enabled !== undefined) {
        tools = tools.filter(tool => tool.status.enabled === filter.enabled);
      }
      
      if (filter.healthy !== undefined) {
        tools = tools.filter(tool => tool.status.healthy === filter.healthy);
      }
    }

    return tools.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * 推荐工具
   */
  recommendTools(context: {
    task: string;
    domain: string;
    requirements: string[];
  }): Tool[] {
    const recommendations: Array<{ tool: Tool; score: number }> = [];

    this.tools.forEach(tool => {
      let score = 0;

      // 基于标签匹配
      const matchingTags = tool.tags.filter(tag => 
        context.requirements.some(req => 
          req.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(req.toLowerCase())
        )
      );
      score += matchingTags.length * 0.3;

      // 基于使用历史
      if (tool.usage.totalInvocations > 0) {
        const successRate = tool.usage.successfulInvocations / tool.usage.totalInvocations;
        score += successRate * 0.2;
      }

      // 基于性能指标
      score += tool.status.performance.reliability * 0.2;
      score += tool.status.performance.speed * 0.1;

      // 基于健康状态
      if (tool.status.healthy && tool.status.enabled) {
        score += 0.2;
      }

      if (score > 0) {
        recommendations.push({ tool, score });
      }
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(rec => rec.tool);
  }

  /**
   * 生成工具使用报告
   */
  generateUsageReport(): string {
    const tools = Array.from(this.tools.values());
    const totalTools = tools.length;
    const enabledTools = tools.filter(t => t.status.enabled).length;
    const healthyTools = tools.filter(t => t.status.healthy).length;

    const totalInvocations = tools.reduce((sum, t) => sum + t.usage.totalInvocations, 0);
    const avgSuccessRate = tools.length > 0 ? 
      tools.reduce((sum, t) => {
        const rate = t.usage.totalInvocations > 0 ? 
          t.usage.successfulInvocations / t.usage.totalInvocations : 0;
        return sum + rate;
      }, 0) / tools.length : 0;

    const mostUsedTools = tools
      .sort((a, b) => b.usage.totalInvocations - a.usage.totalInvocations)
      .slice(0, 5);

    return `
🛠️ ${this.memberId} 工具使用报告

📊 工具统计:
• 总工具数: ${totalTools}
• 已启用: ${enabledTools}
• 健康状态: ${healthyTools}
• 总调用次数: ${totalInvocations}
• 平均成功率: ${(avgSuccessRate * 100).toFixed(1)}%

🏆 最常用工具:
${mostUsedTools.map((tool, index) => 
  `${index + 1}. ${tool.name} - ${tool.usage.totalInvocations}次调用`
).join('\n')}

📈 分类分布:
${this.getCategoryDistribution().map(([category, count]) => 
  `• ${category}: ${count}个工具`
).join('\n')}

💡 优化建议:
${this.generateOptimizationSuggestions().join('\n')}
    `;
  }

  // 私有方法实现
  private loadPersonalTools(): void {
    // 从配置文件加载个人工具
    // 实际实现中应该从配置文件或数据库加载
  }

  private startHealthMonitoring(): void {
    // 每小时进行一次健康检查
    setInterval(async () => {
      for (const tool of this.tools.values()) {
        if (tool.status.enabled) {
          const healthy = await this.performHealthCheck(tool);
          tool.status.healthy = healthy;
          tool.status.lastHealthCheck = new Date();
        }
      }
    }, 60 * 60 * 1000);
  }

  private generateToolId(name: string): string {
    return `tool_${this.memberId}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
  }

  private async checkDependencies(dependencies: Dependency[]): Promise<{
    satisfied: boolean;
    missing: Dependency[];
  }> {
    const missing: Dependency[] = [];
    
    for (const dep of dependencies) {
      const satisfied = await this.checkSingleDependency(dep);
      if (!satisfied) {
        missing.push(dep);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing
    };
  }

  private async checkSingleDependency(dependency: Dependency): Promise<boolean> {
    // 实际实现中应该检查具体的依赖
    return true; // 简化实现
  }

  private async performInstallation(tool: Tool): Promise<boolean> {
    // 根据工具类型执行不同的安装逻辑
    switch (tool.category) {
      case 'mcp':
        return this.installMCPTool(tool);
      case 'local':
        return this.installLocalTool(tool);
      case 'api':
        return this.installAPITool(tool);
      case 'script':
        return this.installScriptTool(tool);
      default:
        return false;
    }
  }

  private async performHealthCheck(tool: Tool): Promise<boolean> {
    try {
      // 执行简单的健康检查
      switch (tool.category) {
        case 'mcp':
          return this.checkMCPToolHealth(tool);
        case 'local':
          return this.checkLocalToolHealth(tool);
        case 'api':
          return this.checkAPIToolHealth(tool);
        case 'script':
          return this.checkScriptToolHealth(tool);
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  private updateUsageStats(
    tool: Tool, 
    success: boolean, 
    executionTime: number, 
    context: string, 
    result?: any, 
    error?: string
  ): void {
    tool.usage.totalInvocations++;
    if (success) {
      tool.usage.successfulInvocations++;
    } else {
      tool.usage.failedInvocations++;
    }

    // 更新平均执行时间
    const totalTime = tool.usage.averageExecutionTime * (tool.usage.totalInvocations - 1) + executionTime;
    tool.usage.averageExecutionTime = totalTime / tool.usage.totalInvocations;

    tool.usage.lastUsed = new Date();
    
    // 添加到历史记录
    tool.usage.usageHistory.push({
      timestamp: new Date(),
      duration: executionTime,
      success,
      context,
      result,
      ...(error && { error })
    });

    // 保持历史记录在合理范围内
    if (tool.usage.usageHistory.length > 100) {
      tool.usage.usageHistory = tool.usage.usageHistory.slice(-100);
    }

    // 更新性能指标
    this.updatePerformanceMetrics(tool);
  }

  private updateIndexes(tool: Tool): void {
    // 更新分类索引
    if (!this.categoryIndex.has(tool.category)) {
      this.categoryIndex.set(tool.category, new Set());
    }
    this.categoryIndex.get(tool.category)!.add(tool.id);

    // 更新标签索引
    if (tool.tags && Array.isArray(tool.tags)) {
      tool.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(tool.id);
      });
    }
  }

  private updatePerformanceMetrics(tool: Tool): void {
    const recentHistory = tool.usage.usageHistory.slice(-20);
    
    if (recentHistory.length > 0) {
      // 计算可靠性
      const successCount = recentHistory.filter(h => h.success).length;
      tool.status.performance.reliability = successCount / recentHistory.length;

      // 计算速度（基于执行时间）
      const avgTime = recentHistory.reduce((sum, h) => sum + h.duration, 0) / recentHistory.length;
      tool.status.performance.speed = Math.max(0, 1 - (avgTime / 10000)); // 假设10秒为基准
    }
  }

  private getCategoryDistribution(): Array<[string, number]> {
    const distribution = new Map<string, number>();
    
    this.tools.forEach(tool => {
      distribution.set(tool.category, (distribution.get(tool.category) || 0) + 1);
    });

    return Array.from(distribution.entries()).sort((a, b) => b[1] - a[1]);
  }

  private generateOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    const unhealthyTools = Array.from(this.tools.values()).filter(t => !t.status.healthy);
    if (unhealthyTools.length > 0) {
      suggestions.push(`• 修复${unhealthyTools.length}个不健康的工具`);
    }

    const lowReliabilityTools = Array.from(this.tools.values())
      .filter(t => t.status.performance.reliability < 0.8);
    if (lowReliabilityTools.length > 0) {
      suggestions.push(`• 优化${lowReliabilityTools.length}个低可靠性工具`);
    }

    return suggestions;
  }

  // 工具类型特定的方法（简化实现）
  private async installMCPTool(tool: Tool): Promise<boolean> { return true; }
  private async installLocalTool(tool: Tool): Promise<boolean> { return true; }
  private async installAPITool(tool: Tool): Promise<boolean> { return true; }
  private async installScriptTool(tool: Tool): Promise<boolean> { return true; }

  private async invokeMCPTool(tool: Tool, params: any): Promise<any> { return {}; }
  private async invokeLocalTool(tool: Tool, params: any): Promise<any> { return {}; }
  private async invokeAPITool(tool: Tool, params: any): Promise<any> { return {}; }
  private async invokeScriptTool(tool: Tool, params: any): Promise<any> { return {}; }

  private async checkMCPToolHealth(tool: Tool): Promise<boolean> { return true; }
  private async checkLocalToolHealth(tool: Tool): Promise<boolean> { return true; }
  private async checkAPIToolHealth(tool: Tool): Promise<boolean> { return true; }
  private async checkScriptToolHealth(tool: Tool): Promise<boolean> { return true; }
}

export default PersonalToolManager;
