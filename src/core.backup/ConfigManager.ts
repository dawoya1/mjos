/**
 * MJOS Configuration Manager
 * 魔剑工作室操作系统配置管理器
 */

import { merge } from 'lodash';
import { MJOSConfig, LoggingConfig, MemoryConfig, TeamConfig, MCPConfig, DeepPartial } from './types/index';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: MJOSConfig = {
  version: '0.1.0',
  environment: 'development',
  logging: {
    level: 'info',
    format: 'simple',
    outputs: ['console'],
    file: {
      path: './logs/mjos.log',
      maxSize: '10MB',
      maxFiles: 5
    }
  },
  memory: {
    persistent: true,
    storage: 'file',
    maxSize: 100 * 1024 * 1024, // 100MB
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  },
  team: {
    name: '魔剑工作�?,
    description: 'Magic Sword Studio AI Team',
    roles: [
      {
        id: 'moxiaozhi',
        name: '莫小�?,
        type: 'architect',
        capabilities: ['role-creation', 'system-architecture', 'team-collaboration'],
        priority: 1,
        initialState: 'READY',
        memoryAccess: 'global'
      },
      {
        id: 'moxiaomei',
        name: '莫小�?,
        type: 'designer',
        capabilities: ['ui-design', 'ux-optimization', 'visual-design'],
        priority: 2,
        initialState: 'READY',
        memoryAccess: 'shared'
      },
      {
        id: 'moxiaoma',
        name: '莫小�?,
        type: 'developer',
        capabilities: ['frontend-development', 'backend-development', 'system-integration'],
        priority: 2,
        initialState: 'READY',
        memoryAccess: 'shared'
      },
      {
        id: 'moxiaocang',
        name: '莫小�?,
        type: 'specialist',
        capabilities: ['cangjie-language', 'multi-platform-development', 'performance-optimization'],
        priority: 2,
        initialState: 'READY',
        memoryAccess: 'shared'
      },
      {
        id: 'moxiaoceshi',
        name: '莫小�?,
        type: 'tester',
        capabilities: ['functional-testing', 'automation-testing', 'quality-assurance'],
        priority: 3,
        initialState: 'READY',
        memoryAccess: 'shared'
      },
      {
        id: 'moxiaopin',
        name: '莫小�?,
        type: 'product-manager',
        capabilities: ['product-planning', 'requirement-analysis', 'project-management'],
        priority: 2,
        initialState: 'READY',
        memoryAccess: 'shared'
      },
      {
        id: 'moxiaogou',
        name: '莫小�?,
        type: 'devops',
        capabilities: ['build-system', 'ci-cd', 'automation-deployment'],
        priority: 3,
        initialState: 'READY',
        memoryAccess: 'shared'
      },
      {
        id: 'moxiaoyun',
        name: '莫小�?,
        type: 'devops',
        capabilities: ['system-operations', 'monitoring-alerting', 'performance-optimization'],
        priority: 3,
        initialState: 'READY',
        memoryAccess: 'shared'
      }
    ],
    collaborationRules: [
      {
        type: 'handoff',
        from: 'moxiaopin',
        to: 'moxiaomei',
        condition: 'requirements_complete'
      },
      {
        type: 'handoff',
        from: 'moxiaomei',
        to: ['moxiaoma', 'moxiaocang'],
        condition: 'design_complete'
      },
      {
        type: 'parallel',
        from: ['moxiaoma', 'moxiaocang'],
        to: 'moxiaoceshi',
        condition: 'development_complete'
      },
      {
        type: 'review',
        from: ['moxiaoceshi'],
        to: 'moxiaozhi',
        condition: 'testing_complete'
      }
    ],
    workflows: [
      {
        name: 'product_development',
        description: '产品开发标准流�?,
        phases: [
          {
            name: 'planning',
            owner: 'moxiaopin',
            collaborators: ['moxiaozhi', 'moxiaomei'],
            deliverables: ['需求文�?, '技术评�?, '设计要求'],
            duration: 2
          },
          {
            name: 'design',
            owner: 'moxiaomei',
            collaborators: ['moxiaopin', 'moxiaoma'],
            deliverables: ['UI设计', '交互原型', '设计规范'],
            duration: 3
          },
          {
            name: 'development',
            owner: 'moxiaoma',
            collaborators: ['moxiaocang', 'moxiaomei'],
            deliverables: ['功能实现', '代码审查', '构建集成'],
            duration: 5
          },
          {
            name: 'testing',
            owner: 'moxiaoceshi',
            collaborators: ['moxiaoma', 'moxiaoyun'],
            deliverables: ['测试报告', '缺陷修复', '部署验证'],
            duration: 2
          }
        ],
        triggers: [
          {
            event: 'project_start',
            condition: 'has_requirements',
            action: 'start_planning_phase'
          },
          {
            event: 'phase_complete',
            condition: 'deliverables_approved',
            action: 'start_next_phase'
          }
        ]
      }
    ]
  },
  mcp: {
    enabled: true,
    serverName: 'mjos-server',
    version: '1.0.0',
    capabilities: {
      tools: true,
      resources: true,
      prompts: true,
      logging: true
    },
    tools: [],
    resources: []
  }
};

/**
 * 配置管理器类
 */
export class ConfigManager {
  private config: MJOSConfig;

  constructor(userConfig?: DeepPartial<MJOSConfig>) {
    // 合并用户配置和默认配�?    this.config = merge({}, DEFAULT_CONFIG, userConfig || {});
    
    // 从环境变量覆盖配�?    this.loadEnvironmentVariables();
    
    // 验证配置
    this.validateConfig();
  }

  /**
   * 获取完整配置
   */
  public getConfig(): MJOSConfig {
    return { ...this.config };
  }

  /**
   * 获取版本
   */
  public getVersion(): string {
    return this.config.version;
  }

  /**
   * 获取环境
   */
  public getEnvironment(): string {
    return this.config.environment;
  }

  /**
   * 获取日志配置
   */
  public getLoggingConfig(): LoggingConfig {
    return { ...this.config.logging };
  }

  /**
   * 获取内存配置
   */
  public getMemoryConfig(): MemoryConfig {
    return { ...this.config.memory };
  }

  /**
   * 获取团队配置
   */
  public getTeamConfig(): TeamConfig {
    return { ...this.config.team };
  }

  /**
   * 获取MCP配置
   */
  public getMCPConfig(): MCPConfig {
    return { ...this.config.mcp };
  }

  /**
   * 更新配置
   */
  public updateConfig(updates: DeepPartial<MJOSConfig>): void {
    this.config = merge(this.config, updates);
    this.validateConfig();
  }

  /**
   * 获取角色配置
   */
  public getRoleConfig(roleId: string) {
    return this.config.team.roles.find(role => role.id === roleId);
  }

  /**
   * 获取工作流配�?   */
  public getWorkflowConfig(workflowName: string) {
    return this.config.team.workflows.find(workflow => workflow.name === workflowName);
  }

  /**
   * 从环境变量加载配�?   */
  private loadEnvironmentVariables(): void {
    // 环境
    if (process.env.MJOS_ENV) {
      this.config.environment = process.env.MJOS_ENV as any;
    }

    // 日志级别
    if (process.env.MJOS_LOG_LEVEL) {
      this.config.logging.level = process.env.MJOS_LOG_LEVEL as any;
    }

    // 内存存储类型
    if (process.env.MJOS_MEMORY_STORAGE) {
      this.config.memory.storage = process.env.MJOS_MEMORY_STORAGE as any;
    }

    // MCP启用状�?    if (process.env.MJOS_MCP_ENABLED) {
      this.config.mcp.enabled = process.env.MJOS_MCP_ENABLED === 'true';
    }

    // 团队名称
    if (process.env.MJOS_TEAM_NAME) {
      this.config.team.name = process.env.MJOS_TEAM_NAME;
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    // 验证版本
    if (!this.config.version) {
      throw new Error('Version is required');
    }

    // 验证环境
    const validEnvironments = ['development', 'production', 'test'];
    if (!validEnvironments.includes(this.config.environment)) {
      throw new Error(`Invalid environment: ${this.config.environment}`);
    }

    // 验证日志级别
    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(this.config.logging.level)) {
      throw new Error(`Invalid log level: ${this.config.logging.level}`);
    }

    // 验证团队配置
    if (!this.config.team.name) {
      throw new Error('Team name is required');
    }

    if (!this.config.team.roles || this.config.team.roles.length === 0) {
      throw new Error('At least one role is required');
    }

    // 验证角色配置
    for (const role of this.config.team.roles) {
      if (!role.id || !role.name || !role.type) {
        throw new Error(`Invalid role configuration: ${JSON.stringify(role)}`);
      }
    }

    // 验证协作规则
    for (const rule of this.config.team.collaborationRules) {
      if (!rule.type || !rule.from || !rule.to) {
        throw new Error(`Invalid collaboration rule: ${JSON.stringify(rule)}`);
      }
    }
  }
}
